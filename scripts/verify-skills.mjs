import { access, cp, mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from 'yaml';

const release = path.resolve('release');
for (const retired of ['dist/cli.js', 'dist/agent', 'dist/providers', 'dist/types.js']) {
  await assert.rejects(access(retired), error => error.code === 'ENOENT', `Retired output must not survive the build: ${retired}`);
}
const manifest = JSON.parse(await readFile(path.join(release, 'manifest.json'), 'utf8'));
for (const [file, expected] of Object.entries(manifest.sha256)) assert.equal(createHash('sha256').update(await readFile(path.join(release, file))).digest('hex'), expected, `Release hash: ${file}`);
const temporary = await realpath(await mkdtemp(path.join(tmpdir(), 'cmmf-skills-install-')));
try {
  // Minimal raw fixtures intentionally need no canonical checkout to prove standalone runtime execution.
  const repo = path.join(temporary, 'content');
  const source = path.join(temporary, 'source');
  await mkdir(path.join(repo, 'models'), { recursive: true });
  await mkdir(path.join(source, 'schemas'), { recursive: true });
  await mkdir(path.join(source, 'spec'), { recursive: true });
  await writeFile(path.join(repo, 'manifest.yaml'), 'specVersion: "1.2.0"\nnamespace: standalone.test\n');
  await writeFile(path.join(repo, 'models/person.yaml'), 'id: person\nname: Person\nkind: entry\nfields: []\n');
  await writeFile(path.join(source, 'spec/cmmf-v1.2.0.md'), '# Standalone execution fixture\n');
  await writeFile(path.join(source, 'schemas/model.schema.json'), JSON.stringify({ title: 'CMMF 1.2.0 Model Schema', type: 'object', required: ['id', 'name', 'kind', 'fields'] }));
  const env = { ...process.env }; delete env.OPENAI_API_KEY; delete env.ANTHROPIC_API_KEY; delete env.CMMF_AGENT_PROVIDER; delete env.CMMF_AGENT_MODEL; delete env.CMMF_SPEC_REPO_PATH; delete env.NODE_PATH;
  for (const name of manifest.skills) {
    const skill = path.join(temporary, name);
    await cp(path.join(release, 'skills', name), skill, { recursive: true });
    const text = await readFile(path.join(skill, 'SKILL.md'), 'utf8');
    const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
    assert.ok(match, `${name}: frontmatter`);
    const metadata = parse(match[1]);
    assert.equal(metadata.name, name);
    assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64);
    assert.ok(typeof metadata.description === 'string' && metadata.description.length > 20);
    assert.ok(metadata.description.length <= 1024 && !/[<>]/.test(metadata.description));
    assert.ok(!/\bTODO\b|\[INSERT|\.\.\/\.\.\/references/.test(text), `${name}: unfinished or external references`);
    for (const link of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(link[1])) continue;
      const resolved = await realpath(path.join(skill, link[1]));
      assert.ok(resolved.startsWith(`${skill}${path.sep}`), `${name}: self-contained reference`);
    }
    const cli = path.join(skill, 'scripts/cmmf-tools/tools/cli.js');
    for (const command of [
      ['inspect', '--repo', repo, '--format', 'json'],
      ['validate', '--repo', repo, '--cmmf-repo', source, '--format', 'json'],
      ['document', '--repo', repo, '--cmmf-repo', source, '--format', 'json'],
      ['diff', '--before', repo, '--after', repo, '--cmmf-repo', source, '--format', 'json'],
    ]) {
      const result = spawnSync(process.execPath, [cli, ...command], { cwd: temporary, env, encoding: 'utf8' });
      assert.equal(result.status, 0, `${name} ${command[0]}: ${result.stderr}`);
      const data = JSON.parse(result.stdout);
      if (command[0] === 'document') assert.match(data.markdown, /person \(entry\)/);
      if (command[0] === 'diff') assert.deepEqual(data.changes, []);
    }
    console.log(`Verified ${name}: metadata, references and isolated credential-free runtime.`);
  }
} finally { await rm(temporary, { recursive: true, force: true }); }
