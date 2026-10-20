#!/usr/bin/env node
import path from "node:path";
import { inspectRepository, issue } from "./repository.js";
import { acquireSource, readSource } from "./source.js";
import { validateRepository } from "./validate.js";
import { semanticDiff } from "./diff.js";
import { documentRepository } from "./document.js";

const help = `CMMF local tools (no LLM provider credentials)
  inspect  --repo PATH [--format json]
  source   --version latest|1.2.0|1 --cache PATH [--offline] [--remote URL]
  validate --repo PATH --cmmf-repo SOURCE [--format json]
  diff     --before PATH --after PATH --cmmf-repo SOURCE [--after-cmmf-repo SOURCE] [--format json]
  document --repo PATH --cmmf-repo SOURCE [--format json]

source retrieves a version-matched canonical snapshot. inspect never fetches.
validate/document/diff require an explicit source. Document prints Markdown to stdout.
Exit codes: 0 success, 1 invalid data or breaking/uncertain diff, 2 usage/source/tool failure.
`;
async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "help") { process.stdout.write(help); return; }
  const flags: Record<string, string | boolean> = {};
  const allowed: Record<string, string[]> = {
    inspect: ["repo", "format"], source: ["version", "cache", "offline", "remote", "format"],
    validate: ["repo", "cmmf-repo", "format"], diff: ["before", "after", "cmmf-repo", "after-cmmf-repo", "format"],
    document: ["repo", "cmmf-repo", "format"],
  };
  if (!allowed[command]) throw new Error(`Unknown command ${command}. Run --help.`);
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, "");
    if (!args[i].startsWith("--") || !allowed[command].includes(key) || flags[key] !== undefined) throw new Error(`Unexpected or duplicate argument ${args[i]}.`);
    if (key === "offline") flags[key] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}.`);
      flags[key] = value;
    }
  }
  const required = (name: string): string => {
    if (typeof flags[name] !== "string") throw new Error(`--${name} is required.`);
    return flags[name] as string;
  };
  const json = flags.format === "json";
  if (flags.format !== undefined && !json) throw new Error("Only --format json is supported; omit it for readable output.");
  function output(value: unknown): void { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
  if (command === "source") {
    const source = await acquireSource({ version: required("version"), cache: required("cache"), remote: typeof flags.remote === "string" ? flags.remote : undefined, offline: flags.offline === true });
    if (json) output({ source });
    else process.stdout.write(`${source.root}\nCMMF ${source.version} @ ${source.revision} (${source.freshness})\n`);
    return;
  }
  const repo = await inspectRepository(required(command === "diff" ? "before" : "repo"));
  if (command === "inspect") {
    output(repo);
    if (repo.diagnostics.some(d => d.severity === "error")) process.exitCode = 1;
    return;
  }
  const declared = repo.manifest?.specVersion;
  const requested = declared === 1 ? "1" : typeof declared === "string" ? declared : undefined;
  const source = await readSource(required("cmmf-repo"), requested);
  let diagnostics = await validateRepository(repo, source);
  if (source.dirty) diagnostics.push(issue("SOURCE_DIRTY", source.root, "", "Canonical source has uncommitted changes; revision alone does not identify these contents.", "warning"));
  if (command === "diff") {
    const after = await inspectRepository(required("after"));
    const afterVersion = after.manifest?.specVersion === 1 ? "1" : typeof after.manifest?.specVersion === "string" ? after.manifest.specVersion : undefined;
    const afterSource = typeof flags["after-cmmf-repo"] === "string" ? await readSource(flags["after-cmmf-repo"], afterVersion) : source;
    diagnostics = [...diagnostics, ...await validateRepository(after, afterSource)];
    const sources = { before: source, after: afterSource };
    if (diagnostics.some(d => d.severity === "error")) { output({ valid: false, sources, diagnostics, changes: [] }); process.exitCode = 1; return; }
    const changes = semanticDiff(repo, after);
    output({ valid: true, sources, diagnostics, changes });
    if (changes.some(c => c.classification !== "additive")) process.exitCode = 1;
    return;
  }
  const valid = !diagnostics.some(d => d.severity === "error");
  if (command === "document" && valid) {
    const markdown = documentRepository(repo);
    if (json) output({ valid, source, diagnostics, markdown }); else process.stdout.write(markdown);
  } else if (json || command === "document") output({ valid, source, diagnostics });
  else {
    process.stdout.write(`CMMF ${source.version} | ${source.revision ?? source.schemaSha256} | ${path.resolve(source.root)}\n${valid ? "Valid" : "Invalid"}: ${repo.models.length} models, ${repo.edges.length} relationships\n`);
    for (const diagnostic of diagnostics) process.stdout.write(`${diagnostic.severity} ${diagnostic.code} ${diagnostic.file}:${diagnostic.path} ${diagnostic.message}\n`);
  }
  if (!valid) process.exitCode = 1;
}
main().catch(error => {
  process.stderr.write(`${JSON.stringify({ code: "TOOL_ERROR", message: error instanceof Error ? error.message : String(error) })}\n`);
  process.exitCode = 2;
});
