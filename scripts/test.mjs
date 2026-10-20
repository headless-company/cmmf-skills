import { spawnSync } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

await rm('.tmp/tests', { recursive: true, force: true });
const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.test.json'], { stdio: 'inherit' });
if (compile.status !== 0) process.exit(compile.status ?? 2);
async function tests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry => entry.isDirectory() ? tests(path.join(dir, entry.name)) : entry.name.endsWith('.test.js') ? [path.join(dir, entry.name)] : []));
  return results.flat().sort();
}
const result = spawnSync(process.execPath, ['--test', ...await tests('.tmp/tests/src')], { stdio: 'inherit' });
process.exit(result.status ?? 2);
