/**
 * Pushes the server-side environment variables from .env.local to the Azure
 * Web App.
 *
 *   az login                 # once
 *   npm run azure:settings
 *
 * The values go straight from your file to your subscription through your own
 * `az` session. They are written to a temporary JSON file and handed to the
 * CLI as `@file`, rather than as command arguments, so they never appear in
 * the process list or your shell history, and nothing is printed but a masked
 * prefix.
 *
 * Only run-time settings are sent. The NEXT_PUBLIC_* values are compiled into
 * the browser bundle at build time and belong to the workflow, not here.
 */

import { readFile, writeFile, unlink, mkdtemp } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

/**
 * `az` is a batch file on Windows, which plain execFile cannot launch. Naming
 * az.cmd directly is what lets us avoid `shell: true`, where arguments are
 * concatenated rather than escaped (Node DEP0190).
 */
const AZ = process.platform === 'win32' ? 'az.cmd' : 'az';
const run = (args, options = {}) => execFileAsync(AZ, args, options);

const ENV_FILE = path.join(process.cwd(), '.env.local');
const RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP ?? 'onlinecolorpage-rg';
const WEBAPP = process.env.AZURE_WEBAPP_NAME ?? 'onlinecolorpage';

/** Sent to the Web App. Everything else in .env.local is build-time or local. */
const RUNTIME_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
  'ADMIN_BOOTSTRAP_EMAIL',
];

/** Fixed settings the app needs that do not come from .env.local. */
const FIXED = {
  NODE_ENV: 'production',
  SCM_DO_BUILD_DURING_DEPLOYMENT: 'false',
};

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const die = (message, hint = '') => {
  console.error(`\n${C.red}${message}${C.reset}`);
  if (hint) console.error(`${C.dim}${hint}${C.reset}`);
  console.error('');
  process.exitCode = 1;
  throw new Error('__handled__');
};

/** Placeholders, by shape - the same test the setup doctor uses. */
const isPlaceholder = (value) =>
  !value || /\.\.\.$/.test(value) || /^your_/i.test(value) || /xxxxxxxx/i.test(value);

const mask = (value) =>
  value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)} ${C.dim}(${value.length} chars)${C.reset}`;

/** Values that are not secret are worth showing in full - the rest are not. */
const PUBLIC_KEYS = new Set(['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL', 'ADMIN_BOOTSTRAP_EMAIL']);

async function main() {
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

  // az present and signed in?
  let account;
  try {
    const { stdout } = await run(['account', 'show', '--output', 'json']);
    account = JSON.parse(stdout);
  } catch (error) {
    if (/not recognized|ENOENT|not found/i.test(String(error?.message ?? ''))) {
      die('The Azure CLI is not installed.', 'https://aka.ms/installazurecli');
    }
    die('The Azure CLI is not signed in.', 'Run: az login');
  }

  console.log(`\n${C.bold}Pushing app settings${C.reset}`);
  console.log(`${C.dim}${account.name} → ${RESOURCE_GROUP} / ${WEBAPP}${C.reset}\n`);

  const settings = { ...FIXED };
  const missing = [];

  for (const key of RUNTIME_KEYS) {
    const value = env[key];
    if (isPlaceholder(value)) {
      missing.push(key);
      continue;
    }
    settings[key] = value;
  }

  if (missing.length) {
    console.log(`${C.yellow}Skipping (not set in .env.local):${C.reset}`);
    for (const key of missing) console.log(`  ${C.dim}- ${key}${C.reset}`);
    console.log('');
  }

  for (const [key, value] of Object.entries(settings)) {
    const shown = PUBLIC_KEYS.has(key) || key in FIXED ? value : mask(value);
    console.log(`  ${C.green}•${C.reset} ${key.padEnd(32)} ${C.dim}${shown}${C.reset}`);
  }

  // `--settings @file` keeps the values out of argv, and so out of the process
  // list and the shell history.
  const dir = await mkdtemp(path.join(tmpdir(), 'ocp-settings-'));
  const file = path.join(dir, 'settings.json');
  await writeFile(
    file,
    JSON.stringify(
      Object.entries(settings).map(([name, value]) => ({ name, value, slotSetting: false })),
    ),
    { mode: 0o600 },
  );

  try {
    console.log(`\n${C.dim}Applying - the app restarts, this takes a few seconds.${C.reset}`);
    await run(
      [
        'webapp', 'config', 'appsettings', 'set',
        '--resource-group', RESOURCE_GROUP,
        '--name', WEBAPP,
        '--settings', `@${file}`,
        '--output', 'none',
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
  } catch (error) {
    die('Azure rejected the update.', String(error?.stderr ?? error?.message ?? '').slice(0, 400));
  } finally {
    await unlink(file).catch(() => {});
  }

  console.log(`  ${C.green}✓${C.reset} ${Object.keys(settings).length} setting(s) applied`);

  // Prove it from the outside rather than trusting the exit code.
  let host = `${WEBAPP}.azurewebsites.net`;
  try {
    const { stdout } = await run(
      ['webapp', 'show', '--resource-group', RESOURCE_GROUP, '--name', WEBAPP, '--query', 'defaultHostName', '--output', 'tsv'],
    );
    host = stdout.trim() || host;
  } catch {
    /* fall back to the conventional hostname */
  }

  const url = `https://${host}/api/health`;
  console.log(`\n${C.dim}Waiting for ${url}${C.reset}`);

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) continue;
      const health = await response.json();
      const tick = (ok) => (ok ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`);
      console.log(`  ${tick(health.supabase)} supabase   ${tick(health.r2)} r2`);
      if (health.supabase && health.r2) {
        console.log(`\n${C.bold}${C.green}Live and fully wired.${C.reset} ${C.cyan}https://${host}${C.reset}\n`);
        return;
      }
      console.log(
        `\n${C.yellow}The app is up but not everything is wired.${C.reset}` +
          `\n${C.dim}A false above means that service's settings are still missing or wrong.${C.reset}\n`,
      );
      return;
    } catch {
      /* still restarting */
    }
  }

  console.log(`\n${C.yellow}Settings applied, but the health check did not answer in time.${C.reset}`);
  console.log(`${C.dim}Try ${url} in a minute.${C.reset}\n`);
}

try {
  await main();
} catch (error) {
  if (error?.message !== '__handled__') throw error;
}
