import { rm, chmod } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

// A clean build must also remove retired entrypoints from earlier checkouts.
await rm('dist', { recursive: true, force: true });
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 2);
await chmod('dist/tools/cli.js', 0o755);
