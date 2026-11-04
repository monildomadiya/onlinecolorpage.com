/**
 * Prints every migration in order, ready to paste into the Supabase SQL editor.
 *
 *   npm run db:sql                 # read it
 *   npm run db:sql > schema.sql    # save it
 *
 * There is no direct-apply step on purpose: Supabase's REST API cannot run DDL,
 * and adding a Postgres driver just for this would bloat the runtime image. If
 * you have the Supabase CLI, `supabase db push` reads the same folder.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dir = path.join(process.cwd(), 'supabase', 'migrations');
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

if (files.length === 0) {
  console.error('No migrations found in supabase/migrations.');
  process.exit(1);
}

for (const file of files) {
  process.stdout.write(`\n-- ===== ${file} =====\n`);
  process.stdout.write(await readFile(path.join(dir, file), 'utf8'));
  process.stdout.write('\n');
}

console.error(`\n[done] ${files.length} migration(s): ${files.join(', ')}`);
