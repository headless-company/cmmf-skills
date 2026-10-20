import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const output = path.resolve('release');
const project = JSON.parse(await readFile('package.json', 'utf8'));
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'skills'), { recursive: true });
const dependencies = new Map();
async function dependency(name) {
  if (dependencies.has(name)) return;
  const root = path.resolve('node_modules', name);
  const metadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  dependencies.set(name, { root, version: metadata.version });
  for (const child of Object.keys(metadata.dependencies ?? {})) await dependency(child);
}
await dependency('ajv'); await dependency('yaml');

const names = (await readdir('skills', { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
for (const name of names) {
  const destination = path.join(output, 'skills', name);
  await cp(path.join('skills', name), destination, { recursive: true });
  await cp('references', path.join(destination, 'references'), { recursive: true });
  await cp('LICENSE.md', path.join(destination, 'LICENSE.md'));
  const runtime = path.join(destination, 'scripts', 'cmmf-tools');
  await mkdir(path.join(runtime, 'cmmf'), { recursive: true });
  await mkdir(path.join(runtime, 'utils'), { recursive: true });
  await mkdir(path.join(runtime, 'tools'), { recursive: true });
  for (const file of (await readdir('dist/tools')).filter(file => file.endsWith('.js'))) await cp(path.join('dist/tools', file), path.join(runtime, 'tools', file));
  await cp('dist/cmmf/instructions.js', path.join(runtime, 'cmmf/instructions.js'));
  for (const file of ['fs.js', 'yaml.js']) await cp(path.join('dist/utils', file), path.join(runtime, 'utils', file));
  await writeFile(path.join(runtime, 'package.json'), JSON.stringify({ private: true, type: 'module', engines: { node: '>=22' } }, null, 2) + '\n');
  for (const [dependencyName, metadata] of dependencies) await cp(metadata.root, path.join(runtime, 'node_modules', dependencyName), { recursive: true });
  await writeFile(path.join(runtime, 'dependencies.json'), JSON.stringify(Object.fromEntries([...dependencies].map(([name, metadata]) => [name, metadata.version])), null, 2) + '\n');
}
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat().sort();
}
const hashes = {};
for (const file of await files(path.join(output, 'skills'))) hashes[path.relative(output, file).split(path.sep).join('/')] = createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile(path.join(output, 'manifest.json'), JSON.stringify({ formatVersion: 1, name: project.name, version: project.version, skills: names, sha256: hashes }, null, 2) + '\n');
const archive = spawnSync('tar', ['-czf', path.join(output, 'cmmf-skills.tar.gz'), '-C', output, 'skills', 'manifest.json'], { stdio: 'inherit' });
if (archive.status !== 0) process.exit(archive.status ?? 2);
console.log(`Packaged ${names.length} independent skills in release/skills and release/cmmf-skills.tar.gz.`);
