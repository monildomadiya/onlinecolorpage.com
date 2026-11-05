/**
 * Sets a new password on an existing admin account, without the password
 * passing through a dashboard, a shell argument or this file's output.
 *
 *   npm run admin:password                 # uses ADMIN_BOOTSTRAP_EMAIL
 *   npm run admin:password me@example.com
 *
 * Supabase stores only a bcrypt hash, so a forgotten password can never be
 * read back - it can only be replaced. This is what Supabase ->
 * Authentication -> Users -> ... -> Reset password does, minus the recovery
 * mail: the new password is typed straight into this process and sent to
 * PUT /auth/v1/admin/users/{id}.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local - run `npm run secret` first.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ask, endPrompts } from './lib/prompt.mjs';

const ENV_FILE = path.join(process.cwd(), '.env.local');
const MIN_PASSWORD = 10;
const PAGE_SIZE = 200;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
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
/*  lookup                                                             */
/* ------------------------------------------------------------------ */

/**
 * The profile row carries the same id as the auth user, so one indexed query
 * usually settles it - and it also tells us whether the account can actually
 * reach the dashboard. Paging the auth table is the fallback for when the
 * profile row never got written.
 */
async function findUser(api, email) {
  const profiles = await api(
    `/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,role`,
  );
  if (profiles.ok) {
    const rows = await profiles.json().catch(() => []);
    if (rows.length) return { id: rows[0].id, role: rows[0].role };
  }

  const wanted = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const response = await api(`/auth/v1/admin/users?page=${page}&per_page=${PAGE_SIZE}`);
    if (!response.ok) break;
    const body = await response.json().catch(() => ({}));
    const users = body.users ?? [];
    const match = users.find((user) => (user.email ?? '').toLowerCase() === wanted);
    if (match) return { id: match.id, role: null };
    if (users.length < PAGE_SIZE) break;
  }

  return null;
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

  console.log(`\n${C.bold}Set a new admin password${C.reset}`);
  console.log(`${C.dim}${url}${C.reset}\n`);

  const suggested = env.ADMIN_BOOTSTRAP_EMAIL ?? '';
  const email =
    process.argv[2] ||
    (await ask(`  Email${suggested ? ` ${C.dim}[${suggested}]${C.reset}` : ''}: `)) ||
    suggested;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) die(`"${email}" is not an email address.`);

  const user = await findUser(api, email);
  if (!user) {
    die(`No account found for ${email}.`, `Create it first: npm run admin ${email}`);
  }

  console.log(`  ${C.green}✓${C.reset} Found the account ${C.dim}${email}${C.reset}`);
  console.log(`${C.dim}  The new password is not shown as you type.${C.reset}`);

  const password = await ask('  New password: ', { hidden: true });
  if (password.length < MIN_PASSWORD) {
    die(`Password must be at least ${MIN_PASSWORD} characters.`, 'Nothing was changed.');
  }
  const again = await ask('  Repeat:       ', { hidden: true });
  if (password !== again) die('The two passwords do not match.', 'Nothing was changed.');

  console.log('');

  /* ---------------------------------------------------------------- */
  /*  change                                                           */
  /* ---------------------------------------------------------------- */

  const change = (method) =>
    api(`/auth/v1/admin/users/${user.id}`, { method, body: JSON.stringify({ password }) });

  // GoTrue's admin update is a PUT; some builds route PATCH instead.
  let updated = await change('PUT');
  if (updated.status === 404 || updated.status === 405) updated = await change('PATCH');

  if (updated.status === 401 || updated.status === 403) {
    die(
      `Supabase rejected the secret key (${updated.status}).`,
      'Re-copy it: npm run secret SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  if (!updated.ok) {
    const body = await updated.json().catch(() => ({}));
    const message = body.msg ?? body.message ?? body.error_description ?? JSON.stringify(body);
    die(`Could not change the password (${updated.status}).`, String(message).slice(0, 300));
  }

  console.log(`  ${C.green}✓${C.reset} Password changed ${C.dim}${email}${C.reset}`);

  if (user.role && user.role !== 'admin') {
    console.log(
      `  ${C.yellow}!${C.reset} This profile's role is ${C.bold}${user.role}${C.reset}, not admin,` +
        ' so sign-in lands on /admin/no-access.',
    );
    console.log(`${C.dim}    Fix it in the SQL editor:${C.reset}`);
    console.log(
      `${C.dim}      update public.profiles set role = 'admin' where id = '${user.id}';${C.reset}`,
    );
  }

  const site = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  console.log(
    `\n${C.bold}${C.green}Done.${C.reset} Sign in at ${C.cyan}${site}/admin/login${C.reset}\n`,
  );
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
