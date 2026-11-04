/**
 * Creates the first admin account, without the password passing through a
 * dashboard, a shell argument or this file's output.
 *
 *   npm run admin                 # uses ADMIN_BOOTSTRAP_EMAIL
 *   npm run admin me@example.com
 *
 * It does what Supabase → Authentication → Users → Add user does, plus the
 * promotion to `admin` that normally waits for the first sign-in:
 *
 *   1. POST /auth/v1/admin/users with email_confirm, so there is no
 *      confirmation mail to chase
 *   2. waits for the on_auth_user_created trigger to write the profile row
 *   3. sets that profile's role to `admin`
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local - run `npm run secret` first.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ask, endPrompts } from './lib/prompt.mjs';

const ENV_FILE = path.join(process.cwd(), '.env.local');
const MIN_PASSWORD = 10;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Thrown instead of calling process.exit(), which on Windows can trip a libuv
 * assertion when a piped stdin is still being torn down.
 */
class SetupError extends Error {
  constructor(message, hint = '') {
    super(message);
    this.hint = hint;
  }
}

const die = (message, hint = '') => {
  throw new SetupError(message, hint);
};

/* ------------------------------------------------------------------ */
/*  env                                                                */
/* ------------------------------------------------------------------ */

async function readEnv() {
  let raw;
  try {
    raw = await readFile(ENV_FILE, 'utf8');
  } catch {
    die('No .env.local found.', 'Copy .env.example to .env.local first.');
  }

  const env = {};
  for (const line of raw.split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

/* ------------------------------------------------------------------ */
/*  the flow                                                           */
/* ------------------------------------------------------------------ */

async function run() {
  const env = await readEnv();

  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const service = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url || /xxxxxxxx/i.test(url)) die('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local.');
  if (!service || service.endsWith('...')) {
    die(
      'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.',
      'Run: npm run secret SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  const api = (pathname, init = {}) =>
    fetch(`${url}${pathname}`, {
      ...init,
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });

  console.log(`\n${C.bold}Create the admin account${C.reset}`);
  console.log(`${C.dim}${url}${C.reset}\n`);

  const suggested = env.ADMIN_BOOTSTRAP_EMAIL ?? '';
  const email =
    process.argv[2] ||
    (await ask(`  Email${suggested ? ` ${C.dim}[${suggested}]${C.reset}` : ''}: `)) ||
    suggested;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) die(`"${email}" is not an email address.`);

  console.log(`${C.dim}  The password is not shown as you type.${C.reset}`);
  const password = await ask('  Password: ', { hidden: true });
  if (password.length < MIN_PASSWORD) {
    die(`Password must be at least ${MIN_PASSWORD} characters.`, 'Nothing was created.');
  }
  const again = await ask('  Repeat:   ', { hidden: true });
  if (password !== again) die('The two passwords do not match.', 'Nothing was created.');

  console.log('');

  /* ---------------------------------------------------------------- */
  /*  create                                                           */
  /* ---------------------------------------------------------------- */

  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (created.status === 401 || created.status === 403) {
    die(
      `Supabase rejected the secret key (${created.status}).`,
      'Re-copy it: npm run secret SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  const body = await created.json().catch(() => ({}));

  if (!created.ok) {
    const message = body.msg ?? body.message ?? body.error_description ?? JSON.stringify(body);
    if (/already|exists|registered/i.test(message)) {
      die(
        `An account for ${email} already exists.`,
        'Delete it in Supabase → Authentication → Users, or sign in with it.',
      );
    }
    die(`Could not create the account (${created.status}).`, String(message).slice(0, 300));
  }

  const userId = body.id;
  console.log(`  ${C.green}✓${C.reset} Auth user created ${C.dim}${email}${C.reset}`);
  console.log(`  ${C.green}✓${C.reset} Email confirmed ${C.dim}no verification mail needed${C.reset}`);

  /* ---------------------------------------------------------------- */
  /*  promote                                                          */
  /* ---------------------------------------------------------------- */

  // handle_new_user() writes the profile from a trigger, so it can land a
  // moment after the insert returns.
  let profile = null;
  for (let attempt = 0; attempt < 10 && !profile; attempt += 1) {
    const response = await api(`/rest/v1/profiles?id=eq.${userId}&select=id,role`);
    const rows = response.ok ? await response.json() : [];
    if (rows.length) profile = rows[0];
    else await new Promise((resolve) => setTimeout(resolve, 400));
  }

  if (!profile) {
    die(
      'The account exists but no profile row appeared.',
      'The on_auth_user_created trigger may be missing. Run this in the SQL editor:\n' +
        `  insert into public.profiles (id, email, role) values ('${userId}', '${email}', 'admin');`,
    );
  }

  if (profile.role === 'admin') {
    console.log(`  ${C.green}✓${C.reset} Profile already has the admin role`);
  } else {
    const promoted = await api(`/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ role: 'admin' }),
    });
    if (!promoted.ok) {
      die(
        `The account exists but could not be promoted (${promoted.status}).`,
        'Run this in the SQL editor:\n' +
          `  update public.profiles set role = 'admin' where id = '${userId}';`,
      );
    }
    console.log(`  ${C.green}✓${C.reset} Promoted to admin ${C.dim}was ${profile.role}${C.reset}`);
  }

  const site = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  console.log(`\n${C.bold}${C.green}Done.${C.reset} Sign in at ${C.cyan}${site}/admin/login${C.reset}\n`);
}

/* ------------------------------------------------------------------ */

try {
  await run();
} catch (error) {
  if (!(error instanceof SetupError)) throw error;
  console.error(`\n${C.red}${error.message}${C.reset}`);
  if (error.hint) console.error(`${C.dim}${error.hint}${C.reset}`);
  console.error('');
  process.exitCode = 1;
} finally {
  endPrompts();
}
