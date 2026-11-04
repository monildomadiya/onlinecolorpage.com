/**
 * Writes one secret into .env.local without it ever appearing on screen,
 * in your shell history, or in a tool's output.
 *
 *   npm run secret                          # asks which one, then prompts
 *   npm run secret SUPABASE_SERVICE_ROLE_KEY
 *
 * The value is typed straight into this process, validated against the shape
 * the variable is supposed to have, and written to .env.local. Nothing is
 * echoed back beyond a masked prefix.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ask, endPrompts } from './lib/prompt.mjs';

const ENV_FILE = path.join(process.cwd(), '.env.local');

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Each entry says where to find the value and what a real one looks like, so a
 * typo or a half-copied string is caught here rather than at the first request.
 */
const SECRETS = {
  SUPABASE_SERVICE_ROLE_KEY: {
    label: 'Supabase secret key',
    where: 'Supabase -> Project Settings -> API Keys -> Secret keys -> copy',
    valid: (v) => /^sb_secret_[A-Za-z0-9_-]{10,}$/.test(v) || /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(v),
    hint: 'Expected sb_secret_… (or a legacy service_role JWT starting eyJ).',
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    label: 'Supabase publishable key',
    where: 'Supabase -> Project Settings -> API Keys -> Publishable key',
    valid: (v) => /^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(v) || /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(v),
    hint: 'Expected sb_publishable_… (or a legacy anon JWT starting eyJ).',
  },
  R2_SECRET_ACCESS_KEY: {
    label: 'Cloudflare R2 secret access key',
    where: 'Cloudflare -> R2 -> Manage R2 API Tokens -> the token you created',
    valid: (v) => /^[a-f0-9]{64}$/i.test(v),
    hint: 'Expected 64 hex characters.',
  },
};

const mask = (v) => `${v.slice(0, 8)}…${v.slice(-4)} ${C.dim}(${v.length} chars)${C.reset}`;

function usage() {
  console.log(`\n${C.bold}Usage${C.reset}  npm run secret [VARIABLE]\n`);
  console.log('Variables this can set:');
  for (const [name, spec] of Object.entries(SECRETS)) {
    console.log(`  ${C.cyan}${name}${C.reset}`);
    console.log(`    ${C.dim}${spec.label} — ${spec.where}${C.reset}`);
  }
  console.log('');
}

const name = process.argv[2];

if (name === '--help' || name === '-h') {
  usage();
  process.exit(0);
}

if (name && !SECRETS[name]) {
  console.error(`\n${C.red}Unknown variable:${C.reset} ${name}`);
  usage();
  process.exit(1);
}

const target = name ?? 'SUPABASE_SERVICE_ROLE_KEY';
const spec = SECRETS[target];

let env;
try {
  env = await readFile(ENV_FILE, 'utf8');
} catch {
  console.error(`\n${C.red}No .env.local found.${C.reset} Copy .env.example to .env.local first.\n`);
  process.exit(1);
}

console.log(`\n${C.bold}${spec.label}${C.reset} -> ${C.cyan}${target}${C.reset}`);
console.log(`${C.dim}${spec.where}${C.reset}`);
console.log(`${C.dim}Paste it below. It will not be shown.${C.reset}\n`);

const value = await ask('  Value: ', { hidden: true });
endPrompts();

if (!value) {
  console.error(`${C.red}Nothing entered - .env.local is unchanged.${C.reset}\n`);
  process.exit(1);
}

if (!spec.valid(value)) {
  console.error(`${C.red}That does not look like a ${spec.label}.${C.reset}`);
  console.error(`${C.dim}${spec.hint} Got ${value.length} characters.${C.reset}`);
  console.error(`${C.dim}.env.local is unchanged.${C.reset}\n`);
  process.exit(1);
}

const line = `${target}=${value}`;
const pattern = new RegExp(`^${target}=.*$`, 'm');
const next = pattern.test(env) ? env.replace(pattern, line) : `${env.replace(/\n*$/, '')}\n${line}\n`;

await writeFile(ENV_FILE, next);

console.log(`  ${C.green}✓${C.reset} Wrote ${target} ${mask(value)}`);
console.log(`\nNow run ${C.bold}npm run check${C.reset} to verify it.\n`);
