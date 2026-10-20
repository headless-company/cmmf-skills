import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, mkdtemp, rename, rm, lstat } from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);
export const canonicalRemote = "https://github.com/headless-company/content-model-master-format.git";
export interface SourceEvidence {
  root: string;
  version: string;
  revision: string | null;
  dirty: boolean;
  schemaSha256: string;
  specSha256: string;
  specFile: string;
  schemaFile: string;
  remote: string | null;
  freshness: "local" | "fetched" | "cached";
}
async function git(root: string, args: string[]): Promise<string> {
  const { stdout } = await exec("git", ["-C", root, ...args], { maxBuffer: 16 * 1024 * 1024, timeout: 60_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
  return args[0] === "show" ? stdout : stdout.trim();
}
export function declaredVersion(schema: unknown): string | null {
  if (!schema || typeof schema !== "object") return null;
  const title = (schema as { title?: unknown }).title;
  if (typeof title !== "string") return null;
  return /\bCMMF\s+v?(\d+(?:\.\d+){0,2})(?:\s|$)/i.exec(title)?.[1] ?? null;
}
function checkVersion(version: string): void {
  if (version !== "latest" && !/^(?:1|\d+\.\d+\.\d+)$/.test(version)) throw new Error("Version must be latest, a semantic version such as 1.2.0, or legacy 1.");
}
export async function readSource(rootDir: string, requestedVersion?: string): Promise<SourceEvidence> {
  const root = path.resolve(rootDir);
  const schemaFile = path.join(root, "schemas/model.schema.json");
  const schemaText = await readFile(schemaFile, "utf8");
  const version = declaredVersion(JSON.parse(schemaText));
  if (!version) throw new Error("Cannot identify CMMF version from schema title; provide a canonical source with explicit version metadata.");
  if (requestedVersion && requestedVersion !== "latest" && requestedVersion !== version) throw new Error(`Source schema is CMMF ${version}, but ${requestedVersion} was requested. A historical spec file beside a newer schema is not a version-matched source.`);
  const specFile = path.join(root, `spec/cmmf-v${version}.md`);
  const specText = await readFile(specFile, "utf8");
  let revision: string | null = null;
  let remote: string | null = null;
  let dirty = false;
  // Only recognise a checkout rooted here, not an unrelated enclosing repository.
  try {
    if (path.resolve(await git(root, ["rev-parse", "--show-toplevel"])) === root) {
      revision = await git(root, ["rev-parse", "HEAD"]);
      dirty = (await git(root, ["status", "--porcelain", "--", "schemas", "spec", "docs", "README.md"])).length > 0;
      try { remote = await git(root, ["remote", "get-url", "origin"]); } catch { /* no remote in local fixture */ }
    }
  } catch { /* plain directory sources use content hashes */ }
  if (!revision) {
    try {
      const evidence = JSON.parse(await readFile(path.join(root, "source.json"), "utf8")) as SourceEvidence;
      revision = evidence.revision;
      remote = evidence.remote;
    } catch { /* not a cached snapshot */ }
  }
  return { root, version, revision, remote, dirty, schemaSha256: createHash("sha256").update(schemaText).digest("hex"), specSha256: createHash("sha256").update(specText).digest("hex"), specFile, schemaFile, freshness: "local" };
}

export interface AcquireOptions { cache: string; version: string; remote?: string; offline?: boolean }
export async function acquireSource(options: AcquireOptions): Promise<SourceEvidence> {
  checkVersion(options.version);
  const remote = options.remote ?? canonicalRemote;
  // Each upstream has its own cache namespace; local fixture remotes are also supported.
  const cache = path.join(path.resolve(options.cache), createHash("sha256").update(remote).digest("hex").slice(0, 16));
  const pointer = path.join(cache, `${options.version}.json`);
  async function cached(): Promise<SourceEvidence> {
    const entry = JSON.parse(await readFile(pointer, "utf8")) as { revision: string };
    if (!/^[a-f0-9]{40,64}$/.test(entry.revision)) throw new Error("Invalid cache revision.");
    const source = await readSource(path.join(cache, "snapshots", entry.revision), options.version);
    const evidence = JSON.parse(await readFile(path.join(source.root, "source.json"), "utf8")) as SourceEvidence;
    if (evidence.schemaSha256 !== source.schemaSha256 || evidence.specSha256 !== source.specSha256) throw new Error("Cached source contents differ from recorded hashes; retrieve a clean source.");
    return { ...source, freshness: "cached" };
  }
  if (options.offline) return cached();
  if (options.version !== "latest") {
    try { return await cached(); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  await mkdir(cache, { recursive: true });
  const checkout = path.join(cache, "upstream.git");
  try { await lstat(checkout); } catch {
    await exec("git", ["clone", "--bare", "--", remote, checkout], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
  }
  await git(checkout, ["fetch", "--prune", "origin", "+refs/heads/*:refs/heads/*", "+refs/tags/*:refs/tags/*"]);
  const schemaAt = async (ref: string) => JSON.parse(await git(checkout, ["show", `${ref}:schemas/model.schema.json`])) as unknown;
  let revision: string | undefined;
  if (options.version === "latest") {
    const tags = (await git(checkout, ["tag", "--list"])).split("\n")
      .filter(tag => /^v?\d+\.\d+\.\d+$/.test(tag))
      .sort((a, b) => {
        const av = a.replace(/^v/, "").split(".").map(Number);
        const bv = b.replace(/^v/, "").split(".").map(Number);
        return bv[0] - av[0] || bv[1] - av[1] || bv[2] - av[2];
      });
    for (const tag of tags) {
      try {
        if (declaredVersion(await schemaAt(tag)) === tag.replace(/^v/, "")) { revision = await git(checkout, ["rev-parse", `${tag}^{commit}`]); break; }
      } catch { /* ignore unrelated or incomplete tags */ }
    }
    if (!revision) {
      // Resolve remote HEAD after fetching, rather than trusting a stale local default branch.
      const heads = await git(checkout, ["ls-remote", "--symref", "origin", "HEAD"]);
      revision = /^([a-f0-9]{40,64})\s+HEAD$/m.exec(heads)?.[1];
      if (!revision) throw new Error("Cannot resolve canonical default branch.");
      const version = declaredVersion(await schemaAt(revision));
      const readme = await git(checkout, ["show", `${revision}:README.md`]);
      if (!version || !readme.includes(version)) throw new Error("No matching release tag or current version identified by canonical README/schema.");
    }
  } else {
    // Prefer a matching release tag; if upstream has no tags, resolve its actual schema history.
    for (const tag of [`v${options.version}`, options.version]) {
      try {
        if (declaredVersion(await schemaAt(tag)) === options.version) { revision = await git(checkout, ["rev-parse", `${tag}^{commit}`]); break; }
      } catch { /* no matching tag */ }
    }
    if (!revision) for (const commit of (await git(checkout, ["log", "--all", "--format=%H", "--", "schemas/model.schema.json"])).split("\n").filter(Boolean)) {
      if (declaredVersion(await schemaAt(commit)) === options.version) { revision = commit; break; }
    }
  }
  if (!revision) throw new Error(`No canonical source revision found for CMMF ${options.version}.`);
  const version = declaredVersion(await schemaAt(revision));
  if (!version) throw new Error("Selected source has no identifiable CMMF version.");
  const destination = path.join(cache, "snapshots", revision);
  await mkdir(path.dirname(destination), { recursive: true });
  try { await lstat(destination); } catch {
    const staging = await mkdtemp(path.join(cache, "snapshot-"));
    try {
      const files = (await git(checkout, ["ls-tree", "-r", "--name-only", revision])).split("\n").filter(file =>
        file === "README.md" || /^LICENSE(?:\..+)?$/.test(file) || file === "schemas/model.schema.json" ||
        file === `spec/cmmf-v${version}.md` || (file.startsWith("docs/") && file.endsWith(".md")));
      for (const file of files) {
        if (path.isAbsolute(file) || file.split("/").includes("..")) throw new Error("Unsafe source path.");
        const target = path.join(staging, file);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, await git(checkout, ["show", `${revision}:${file}`]), "utf8");
      }
      const source = await readSource(staging, version);
      await writeFile(path.join(staging, "source.json"), JSON.stringify({ ...source, revision, remote }, null, 2));
      await rename(staging, destination);
    } finally { await rm(staging, { recursive: true, force: true }); }
  }
  const source = await readSource(destination, version);
  const evidence = JSON.parse(await readFile(path.join(destination, "source.json"), "utf8")) as SourceEvidence;
  if (evidence.schemaSha256 !== source.schemaSha256 || evidence.specSha256 !== source.specSha256) throw new Error("Cached source contents differ from recorded hashes; retrieve a clean source.");
  await writeFile(pointer, JSON.stringify({ revision, version }));
  return { ...source, freshness: "fetched" };
}
