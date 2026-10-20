import { rm } from 'node:fs/promises';

for (const directory of ['dist', 'coverage', 'release', '.tmp/tests']) {
  await rm(directory, { recursive: true, force: true });
}
