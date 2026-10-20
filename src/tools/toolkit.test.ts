import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createCmmfSourceFixture } from "../test-support/cmmf-source-fixture.js";
import { inspectRepository } from "./repository.js";
import { validateRepository } from "./validate.js";
import { semanticDiff } from "./diff.js";
import { documentRepository } from "./document.js";
import { acquireSource, readSource } from "./source.js";
import { stringifyYaml } from "../utils/yaml.js";

const exec = promisify(execFile);
async function sourceFixture(version = "1.2.0"): Promise<string> {
  const root = await createCmmfSourceFixture({ specFiles: { [`cmmf-v${version}.md`]: `# Content Model Master Format ${version}\n` } });
  const file = path.join(root, "schemas/model.schema.json");
  const schema = JSON.parse(await readFile(file, "utf8"));
  schema.title = `CMMF ${version} Model Schema`;
  schema.definitions.field.properties.richTextConfig = {
    type: "object", properties: { embeds: { type: "array", items: { type: "object", required: ["kind"], properties: { kind: { enum: ["reference", "asset"] }, targets: { type: "array", items: { type: "string" } } } } } },
  };
  await writeFile(file, JSON.stringify(schema));
  await writeFile(path.join(root, "README.md"), `Current specification: ${version}\n`);
  return root;
}
async function repoFixture(models: unknown[], manifest: unknown = { specVersion: "1.2.0", namespace: "test.content", modelsPath: "./models" }): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "cmmf-tool-repo-"));
  await mkdir(path.join(root, "models"));
  await writeFile(path.join(root, "manifest.yaml"), stringifyYaml(manifest));
  for (const [index, model] of models.entries()) await writeFile(path.join(root, "models", `${index}.yaml`), stringifyYaml(model));
  return root;
}
const person = { id: "person", name: "Person", kind: "entry", fields: [] };
const article = { id: "article", name: "Article", kind: "entry", fields: [
  { id: "author", type: "reference", targets: ["person"] },
  { id: "body", type: "richText", richTextConfig: { embeds: [{ kind: "reference", targets: ["person"] }] } },
] };

test("raw loader preserves extensions and aggregates parse/graph failures without overwriting models", async () => {
  const root = await repoFixture([{ ...article, extension: { preserve: "future data" } }, person, { ...person, fields: [{ id: "x", type: "string" }, { id: "x", type: "string" }] }, { id: "bad", name: "Bad", kind: "entry", fields: [{ id: "seo", type: "object", objectType: "person" }, { id: "missing", type: "reference", targets: ["absent"] }] }]);
  const broken = path.join(root, "models/broken.yaml");
  await writeFile(broken, "fields: [unterminated");
  const repo = await inspectRepository(root);
  assert.deepEqual(repo.models.find(model => model.data.id === "article")?.data.extension, { preserve: "future data" });
  const issues = await validateRepository(repo, await readSource(await sourceFixture(), "1.2.0"));
  for (const code of ["YAML_PARSE_ERROR", "MODEL_ID_DUPLICATE", "FIELD_ID_DUPLICATE", "OBJECT_TARGET_KIND", "TARGET_MISSING"]) assert.ok(issues.some(issue => issue.code === code), code);
  assert.equal(await readFile(broken, "utf8"), "fields: [unterminated");
});

test("1.2.0 rich text and valid reference cycles validate and appear in generated diagrams", async () => {
  const root = await repoFixture([article, { ...person, fields: [{ id: "stories", type: "reference", targets: ["article"], list: true }] }]);
  const repo = await inspectRepository(root);
  assert.equal((await validateRepository(repo, await readSource(await sourceFixture(), "1.2.0"))).length, 0);
  assert.equal(repo.edges.filter(edge => edge.kind === "richTextEmbed").length, 1);
  const docs = documentRepository(repo);
  assert.match(docs, /richTextEmbed/);
  assert.match(docs, /stories \/ reference \/ repeatable/);
  assert.match(docs, /article \(entry\)/);
});

test("source mismatch and future helper semantics cannot be presented as fully validated", async () => {
  const source = await readSource(await sourceFixture());
  await assert.rejects(readSource(source.root, "1"), /historical spec file/);
  const repo = await inspectRepository(await repoFixture([person], { specVersion: 1, namespace: "legacy" }));
  assert.ok((await validateRepository(repo, source)).some(issue => issue.code === "SOURCE_VERSION_MISMATCH"));
  const future = await readSource(await sourceFixture("2.0.0"));
  assert.ok((await validateRepository(repo, future)).some(issue => issue.code === "HELPER_VERSION_UNSUPPORTED"));
});

test("path escape and model directory symlinks do not read outside the selected repository", async () => {
  const outside = await repoFixture([person]);
  const root = await repoFixture([], { specVersion: "1.2.0", namespace: "unsafe", modelsPath: outside });
  const repo = await inspectRepository(root);
  assert.equal(repo.models.length, 0);
  assert.ok(repo.diagnostics.some(issue => issue.code === "PATH_OUTSIDE_REPOSITORY"));
  const linked = await repoFixture([]);
  await rm(path.join(linked, "models"), { recursive: true });
  await symlink(path.join(outside, "models"), path.join(linked, "models"));
  assert.equal((await inspectRepository(linked)).models.length, 0);
});

test("semantic diff recognises additive targets, effective defaults, and transitive dependents", async () => {
  const before = await inspectRepository(await repoFixture([article, person, { id: "home", name: "Home", kind: "entry", fields: [{ id: "story", type: "reference", targets: ["article"] }] }]));
  const after = await inspectRepository(await repoFixture([{ ...article, fields: article.fields.map(field => field.id === "author" ? { ...field, targets: ["another", "person"] } : field) }, person]));
  const diff = semanticDiff(before, after);
  assert.ok(diff.some(change => change.code === "ALLOWED_VALUES_ADDED" && change.classification === "additive"));
  assert.ok(!diff.some(change => change.code === "ALLOWED_VALUES_REMOVED"));
  const required = await inspectRepository(await repoFixture([article, person], { specVersion: "1.2.0", namespace: "test.content", defaults: { required: true } }));
  assert.ok(semanticDiff(before, required).some(change => change.code === "REQUIREDNESS_CHANGED" && change.classification === "breaking"));
  const removed = await inspectRepository(await repoFixture([article]));
  assert.deepEqual(semanticDiff(before, removed).find(change => change.code === "MODEL_REMOVED" && change.model === "person")?.dependents, ["article", "home"]);
});

test("inspection preserves repository conventions through the skills workflow", async () => {
  const root = await repoFixture([person]);
  await mkdir(path.join(root, ".cmmf"));
  await mkdir(path.join(root, ".cmmf-agent"));
  await writeFile(path.join(root, "cmmf.instructions.md"), "Every model must have a required internal_name field.");
  await writeFile(path.join(root, ".cmmf/editorial.yaml"), "prefer: reusable references\n");
  await writeFile(path.join(root, ".cmmf-agent/legacy.txt"), "Preserve established model IDs.");
  const repo = await inspectRepository(root);
  assert.deepEqual(repo.instructions.map(file => file.relativePath), [".cmmf-agent/legacy.txt", ".cmmf/editorial.yaml", "cmmf.instructions.md"]);
  assert.match(repo.instructions.find(file => file.relativePath === "cmmf.instructions.md")?.content ?? "", /required internal_name/);
  assert.equal(repo.diagnostics.length, 0);
});

test("the local CLI works without provider configuration and reports actionable failure exit codes", async () => {
  const root = await repoFixture([person]);
  const source = await sourceFixture();
  const cli = fileURLToPath(new URL("./cli.js", import.meta.url));
  const env = { ...process.env };
  for (const key of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "CMMF_AGENT_PROVIDER", "CMMF_AGENT_MODEL", "CMMF_SPEC_REPO_PATH"]) delete env[key];
  const result = await exec(process.execPath, [cli, "validate", "--repo", root, "--cmmf-repo", source, "--format", "json"], { env });
  assert.equal(JSON.parse(result.stdout).valid, true);
  await writeFile(path.join(root, "models/0.yaml"), "fields: [broken");
  await assert.rejects(exec(process.execPath, [cli, "validate", "--repo", root, "--cmmf-repo", source, "--format", "json"], { env }), error => {
    const failure = error as Error & { code: number; stdout: string };
    assert.equal(failure.code, 1);
    assert.ok(JSON.parse(failure.stdout).diagnostics.some((issue: { code: string }) => issue.code === "YAML_PARSE_ERROR"));
    return true;
  });
  await assert.rejects(exec(process.execPath, [cli, "generate", "Create a blog"], { env }), error => {
    const failure = error as Error & { code: number; stderr: string };
    assert.equal(failure.code, 2);
    assert.match(failure.stderr, /Unknown command generate/);
    return true;
  });
});

test("canonical snapshots resolve latest, historical and numeric legacy sources and reuse caches offline", async () => {
  const upstream = await sourceFixture("1");
  async function git(...args: string[]) { await exec("git", ["-C", upstream, ...args]); }
  await git("init"); await git("config", "user.name", "CMMF Test"); await git("config", "user.email", "test@example.invalid");
  await git("add", "."); await git("commit", "-m", "Legacy"); await git("tag", "v1.0.0");
  for (const version of ["1.1.0", "1.2.0"]) {
    const schemaFile = path.join(upstream, "schemas/model.schema.json");
    const schema = JSON.parse(await readFile(schemaFile, "utf8")); schema.title = `CMMF ${version} Model Schema`;
    await writeFile(schemaFile, JSON.stringify(schema));
    await writeFile(path.join(upstream, "spec", `cmmf-v${version}.md`), `# CMMF ${version}`);
    await writeFile(path.join(upstream, "README.md"), `Current specification ${version}`);
    await git("add", "."); await git("commit", "-m", version); await git("tag", `v${version}`);
  }
  const cache = await mkdtemp(path.join(tmpdir(), "cmmf-source-cache-"));
  const latest = await acquireSource({ cache, version: "latest", remote: upstream });
  assert.equal(latest.version, "1.2.0"); assert.match(latest.revision ?? "", /^[a-f0-9]{40}$/);
  assert.equal(await readFile(latest.schemaFile, "utf8"), await readFile(path.join(upstream, "schemas/model.schema.json"), "utf8"));
  const historical = await acquireSource({ cache, version: "1.1.0", remote: upstream });
  assert.equal(historical.version, "1.1.0"); assert.notEqual(historical.revision, latest.revision);
  const legacy = await acquireSource({ cache, version: "1", remote: upstream });
  assert.equal(legacy.version, "1");
  assert.equal((await validateRepository(await inspectRepository(await repoFixture([person], { specVersion: 1, namespace: "legacy" })), legacy)).length, 0);
  assert.equal((await acquireSource({ cache, version: "1.1.0", remote: upstream, offline: true })).freshness, "cached");
  await writeFile(historical.specFile, "# Altered cached specification\n");
  await assert.rejects(acquireSource({ cache, version: "1.1.0", remote: upstream, offline: true }), /differ from recorded hashes/);
  await assert.rejects(acquireSource({ cache, version: "1.1.0", remote: upstream }), /differ from recorded hashes/);
  // Without release tags, the canonical README/schema at remote HEAD provides latest.
  await git("tag", "-d", "v1.0.0", "v1.1.0", "v1.2.0");
  const untaggedCache = await mkdtemp(path.join(tmpdir(), "cmmf-untagged-cache-"));
  assert.equal((await acquireSource({ cache: untaggedCache, version: "latest", remote: upstream })).version, "1.2.0");
  await assert.rejects(acquireSource({ cache, version: "9.9.9", remote: upstream }), /No canonical source revision/);
});
