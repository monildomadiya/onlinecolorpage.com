/**
 * Setup doctor.
 *
 *   npm run check
 *
 * Reads .env.local and checks, in order:
 *   1. which variables are filled in
 *   2. that Supabase answers, and that the migrations have been run
 *   3. that the seed data landed
 *   4. that the RPC functions exist
 *   5. that R2 accepts a read, a write and a delete
 *
 * Everything is read-only apart from one tiny temp object in R2, which is
 * deleted again. Secrets are never printed - only a masked prefix.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

/* ------------------------------------------------------------------ */
/*  pretty output                                                      */
/* ------------------------------------------------------------------ */

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

let failures = 0;
let warnings = 0;

const ok = (msg, extra = '') =>
  console.log(`  ${C.green}✓${C.reset} ${msg}${extra ? ` ${C.dim}${extra}${C.reset}` : ''}`);

const bad = (msg, hint = '') => {
  failures++;
  console.log(`  ${C.red}✗${C.reset} ${msg}`);
  if (hint) console.log(`    ${C.dim}→ ${hint}${C.reset}`);
};

const warn = (msg, hint = '') => {
  warnings++;
  console.log(`  ${C.yellow}!${C.reset} ${msg}`);
  if (hint) console.log(`    ${C.dim}→ ${hint}${C.reset}`);
};

const section = (title) => console.log(`\n${C.bold}${C.cyan}${title}${C.reset}`);

/** Shows enough of a value to recognise it, never enough to use it. */
const mask = (value) => {
  if (!value) return '';
  if (value.length <= 12) return `${value.slice(0, 3)}…`;
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`;
};

/* ------------------------------------------------------------------ */
/*  env loading                                                        */
/* ------------------------------------------------------------------ */

async function loadEnv() {
  const file = path.join(root, '.env.local');
  let raw;

  try {
    raw = await readFile(file, 'utf8');
  } catch {
    console.log(
      `${C.red}No .env.local found.${C.reset}\nRun: ${C.bold}cp .env.example .env.local${C.reset}`,
    );
    process.exit(1);
  }

  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    // Strip surrounding quotes if the user pasted them.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

/** A value still at its .env.example placeholder counts as missing. */
const PLACEHOLDERS = [
  'https://xxxxxxxxxxxx.supabase.co',
  'eyJhbGciOi...',
  'your_cloudflare_account_id',
  'you@example.com',
  '',
];

/**
 * Catches the placeholders too, by shape rather than by listing every one -
 * `sb_secret_...`, `your_whatever`, `https://xxxxxxxxxxxx.supabase.co`. A real
 * key is base64url or hex, so none of these can match a genuine value.
 */
const PLACEHOLDER_SHAPES = [/\.\.\.$/, /^your_/i, /xxxxxxxx/i];

const filled = (value) =>
  Boolean(value) &&
  !PLACEHOLDERS.includes(value) &&
  !PLACEHOLDER_SHAPES.some((shape) => shape.test(value));

/* ------------------------------------------------------------------ */
/*  supabase                                                           */
/* ------------------------------------------------------------------ */

const TABLES = ['profiles', 'categories', 'coloring_pages', 'media', 'settings', 'ad_slots', 'page_events'];

async function rest(env, pathname, { key, method = 'GET', body, headers = {} } = {}) {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${pathname}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  return response;
}

async function checkSupabase(env) {
  section('Supabase');

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;

  // Check each credential separately: a half-filled .env.local should still
  // get told what works and what does not.
  if (!filled(url) || !filled(anon)) {
    bad(
      'Project URL or publishable key missing',
      'Supabase dashboard → Project Settings → API Keys. Copy the project URL and the publishable (or anon) key.',
    );
    return false;
  }

  ok('URL', url);
  ok('publishable / anon key', mask(anon));

  const haveService = filled(service);
  if (!haveService) {
    bad(
      'Secret key missing (SUPABASE_SERVICE_ROLE_KEY)',
      'Settings → API Keys → Secret keys → copy, then: npm run secret SUPABASE_SERVICE_ROLE_KEY',
    );
  } else {
    ok('secret / service_role key', mask(service));
    if (anon === service) {
      bad('Both keys are identical', 'You pasted the same value twice - they are different keys.');
      return false;
    }
  }

  // Reachability, using the anon key (which is what the public site uses).
  try {
    const response = await rest(env, 'settings?select=key&limit=1', { key: anon });

    if (response.status === 401) {
      bad('Supabase rejected the anon key (401)', 'Re-copy NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return false;
    }
    if (response.status === 404) {
      bad(
        'Connected, but the `settings` table does not exist',
        'Run supabase/migrations/0001_init.sql then 0002_seed.sql in the Supabase SQL editor.',
      );
      return false;
    }
    if (!response.ok) {
      bad(`Supabase answered ${response.status}`, (await response.text()).slice(0, 200));
      return false;
    }
    ok('Reachable, and the anon role can read `settings`');
  } catch (error) {
    bad('Could not reach Supabase', error.message);
    return false;
  }

  // Schema: a missing table answers 404 to either key, so this works without
  // the secret key too.
  const probeKey = haveService ? service : anon;
  const missing = [];
  for (const table of TABLES) {
    const response = await rest(env, `${table}?select=*&limit=0`, {
      key: probeKey,
      headers: { Prefer: 'count=exact' },
    });
    if (response.status === 404) missing.push(table);
  }

  if (missing.length > 0) {
    bad(
      `Missing table(s): ${missing.join(', ')}`,
      'Run supabase/migrations/0001_init.sql in the SQL editor (npm run db:sql prints it).',
    );
    return false;
  }
  ok(`All ${TABLES.length} tables exist`);

  if (!haveService) {
    warn('Skipped seed, RPC and account checks', 'They need the secret key. Add it and run npm run check again.');
    return false;
  }

  // A rejected secret key answers 401 to everything below, which would read as
  // "seed missing, functions missing" and send you off to re-run migrations
  // that are perfectly fine. Prove the key works before trusting any of it.
  const probe = await rest(env, 'settings?select=key&limit=1', { key: service });
  if (probe.status === 401 || probe.status === 403) {
    bad(
      `Supabase rejected the secret key (${probe.status})`,
      'Settings → API Keys → Secret keys → copy, then: npm run secret SUPABASE_SERVICE_ROLE_KEY',
    );
    warn('Skipped seed, RPC and account checks', 'All of them need a working secret key.');
    return false;
  }
  if (!probe.ok) {
    bad(`Supabase answered ${probe.status} for the secret key`, (await probe.text()).slice(0, 200));
    return false;
  }
  ok('Secret key accepted');

  // Seed data.
  const counts = {};
  for (const table of ['categories', 'settings', 'ad_slots', 'coloring_pages', 'profiles']) {
    const response = await rest(env, `${table}?select=*&limit=0`, {
      key: service,
      headers: { Prefer: 'count=exact' },
    });
    if (!response.ok) {
      bad(`Could not count ${table} (${response.status})`, (await response.text()).slice(0, 160));
      return false;
    }
    // PostgREST reports the total in the Content-Range header as `*/N`.
    counts[table] = Number(response.headers.get('content-range')?.split('/')[1] ?? 0);
  }

  if (counts.settings < 5 || counts.ad_slots < 5 || counts.categories === 0) {
    warn(
      `Seed data looks incomplete (settings ${counts.settings}/5, ad slots ${counts.ad_slots}/5, categories ${counts.categories})`,
      'Run supabase/migrations/0002_seed.sql.',
    );
  } else {
    ok(`Seed data present`, `${counts.categories} categories, ${counts.settings} settings rows`);
  }

  // RPC functions.
  const rpc = await rest(env, 'rpc/admin_stats', { key: service, method: 'POST', body: {} });
  if (rpc.ok) {
    const stats = await rpc.json();
    ok('RPC admin_stats() works', `${stats.pages_total} pages, ${stats.media_total} files`);
  } else {
    bad('RPC admin_stats() is missing', 'Re-run 0001_init.sql - the function block did not apply.');
  }

  // Admin account.
  if (counts.profiles === 0) {
    warn(
      'No user accounts yet',
      'Supabase → Authentication → Users → Add user (tick Auto Confirm User), then sign in at /admin/login.',
    );
  } else {
    const response = await rest(env, 'profiles?select=email,role&order=role.asc', { key: service });
    const profiles = response.ok ? await response.json() : [];
    const admins = profiles.filter((p) => p.role === 'admin');

    if (admins.length === 0) {
      warn(
        `${profiles.length} account(s), but none is an admin`,
        filled(env.ADMIN_BOOTSTRAP_EMAIL)
          ? `Sign in as ${env.ADMIN_BOOTSTRAP_EMAIL} - it is promoted automatically.`
          : "update public.profiles set role = 'admin' where email = '…';",
      );
    } else {
      ok(`${profiles.length} account(s)`, `${admins.length} admin: ${admins.map((a) => a.email).join(', ')}`);
    }
  }

  if (!filled(env.ADMIN_BOOTSTRAP_EMAIL)) {
    warn('ADMIN_BOOTSTRAP_EMAIL not set', 'Optional, but it saves running SQL to promote your first admin.');
  } else {
    ok('Bootstrap admin', env.ADMIN_BOOTSTRAP_EMAIL);
  }

  return true;
}

/* ------------------------------------------------------------------ */
/*  r2                                                                 */
/* ------------------------------------------------------------------ */

async function checkR2(env) {
  section('Cloudflare R2');

  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
  const missing = required.filter((name) => !filled(env[name]));

  if (missing.length > 0) {
    bad(
      `Missing: ${missing.join(', ')}`,
      'Cloudflare → R2 → Manage R2 API Tokens → Create API token with Object Read & Write.',
    );
    return false;
  }

  ok('Account ID', env.R2_ACCOUNT_ID);
  ok('Access key', mask(env.R2_ACCESS_KEY_ID));
  ok('Secret', mask(env.R2_SECRET_ACCESS_KEY));
  ok('Bucket', env.R2_BUCKET);

  const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } =
    await import('@aws-sdk/client-s3');

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  // Read.
  try {
    const listing = await client.send(
      new ListObjectsV2Command({ Bucket: env.R2_BUCKET, MaxKeys: 1 }),
    );
    ok('Read access', `bucket has ${listing.KeyCount ?? 0}+ object(s)`);
  } catch (error) {
    const name = error?.name ?? 'Error';
    if (name === 'NoSuchBucket') {
      bad(`Bucket "${env.R2_BUCKET}" does not exist`, 'Create it in Cloudflare → R2, or fix R2_BUCKET.');
    } else if (name === 'InvalidAccessKeyId' || name === 'SignatureDoesNotMatch') {
      bad('R2 rejected the credentials', 'Re-copy the Access Key ID and Secret from the API token.');
    } else {
      bad(`Could not list the bucket (${name})`, error.message?.slice(0, 160));
    }
    return false;
  }

  // Write + read back + delete.
  const key = `__setup-check/${Date.now()}.txt`;
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: Buffer.from('onlinecolorpage setup check'),
        ContentType: 'text/plain',
      }),
    );

    const got = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    const body = await got.Body.transformToString();

    if (body !== 'onlinecolorpage setup check') throw new Error('Read back the wrong content.');
    ok('Write and read-back');

    await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    ok('Delete', 'temp object cleaned up');
  } catch (error) {
    bad(
      'Write access failed',
      `${error.message?.slice(0, 160)} - the API token needs Object Read & Write, not just Read.`,
    );
    return false;
  }

  // Optional public base.
  if (filled(env.R2_PUBLIC_BASE_URL)) {
    try {
      const base = new URL(env.R2_PUBLIC_BASE_URL);
      if (base.protocol !== 'https:') {
        warn('R2_PUBLIC_BASE_URL is not https', 'Use the https:// form of your custom domain.');
      } else {
        ok('Public CDN base', base.origin);
      }
    } catch {
      bad('R2_PUBLIC_BASE_URL is not a valid URL', 'e.g. https://cdn.onlinecolorpage.com');
    }
  } else {
    warn(
      'R2_PUBLIC_BASE_URL not set',
      'Fine to leave empty - files stream through /api/file instead. Set it later for CDN delivery.',
    );
  }

  return true;
}

/* ------------------------------------------------------------------ */
/*  site + optional                                                    */
/* ------------------------------------------------------------------ */

function checkSite(env) {
  section('Site');

  if (filled(env.NEXT_PUBLIC_SITE_URL)) {
    ok('Site URL', env.NEXT_PUBLIC_SITE_URL);
    if (env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
      warn('Site URL points at localhost', 'Fine for dev. Set the real domain before deploying - it is baked into the build.');
    }
  } else {
    warn('NEXT_PUBLIC_SITE_URL not set', 'Defaults to http://localhost:3000.');
  }

  if (filled(env.NEXT_PUBLIC_ADSENSE_CLIENT)) ok('AdSense client', env.NEXT_PUBLIC_ADSENSE_CLIENT);
  else console.log(`  ${C.dim}- AdSense not configured (optional)${C.reset}`);

  if (filled(env.NEXT_PUBLIC_GA_ID)) ok('Google Analytics', env.NEXT_PUBLIC_GA_ID);
  else console.log(`  ${C.dim}- Google Analytics not configured (optional)${C.reset}`);
}

/* ------------------------------------------------------------------ */

const env = await loadEnv();

console.log(`${C.bold}onlinecolorpage.com - setup check${C.reset}`);

checkSite(env);
const supabaseOk = await checkSupabase(env);
const r2Ok = await checkR2(env);

console.log('');
if (failures === 0 && warnings === 0) {
  console.log(`${C.green}${C.bold}Everything is ready.${C.reset} Run ${C.bold}npm run dev${C.reset} and open /admin.`);
} else if (failures === 0) {
  console.log(
    `${C.yellow}${C.bold}${warnings} warning(s), nothing broken.${C.reset} ` +
      `${supabaseOk && r2Ok ? 'You can start uploading pages.' : ''}`,
  );
} else {
  console.log(
    `${C.red}${C.bold}${failures} problem(s)${C.reset}${warnings ? ` and ${warnings} warning(s)` : ''} - fix the ✗ lines above, then run ${C.bold}npm run check${C.reset} again.`,
  );
  process.exitCode = 1;
}
