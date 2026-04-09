import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { pathExists } from "../utils/fs.js";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const defaultSiblingRepo = path.resolve(packageRoot, "../content-model-master-format");
const expectedRemote = "https://github.com/headless-company/content-model-master-format";

export interface CmmfSource {
  rootDir: string;
  schemaPath: string;
  specPath: string;
  relationshipsDocPath: string;
  revision: string | null;
  branch: string | null;
  remoteUrl: string | null;
}

export async function resolveCmmfSource(explicitPath?: string): Promise<CmmfSource> {
  const candidates = [explicitPath, process.env.CMMF_SPEC_REPO_PATH, defaultSiblingRepo].filter(
    (value): value is string => Boolean(value && value.trim().length > 0),
  );

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    const source = await tryLoadCmmfSource(resolved);
    if (source) {
      return source;
    }
  }

  throw new Error(
    [
      "Unable to find a usable CMMF spec repository.",
      `Checked: ${candidates.map((value) => path.resolve(value)).join(", ") || "(no candidates)"}`,
      `Pass --cmmf-repo /path/to/content-model-master-format or set CMMF_SPEC_REPO_PATH.`,
      `Expected repository: ${expectedRemote}`,
    ].join("\n"),
  );
}

export async function loadSpecExcerpt(source: CmmfSource): Promise<string> {
  const [specText, relationshipsText] = await Promise.all([
    readFile(source.specPath, "utf8"),
    readFile(source.relationshipsDocPath, "utf8"),
  ]);

  return [
    `Spec repo: ${source.rootDir}`,
    source.revision ? `Spec revision: ${source.revision}` : undefined,
    source.branch ? `Spec branch: ${source.branch}` : undefined,
    source.remoteUrl ? `Spec remote: ${source.remoteUrl}` : undefined,
    "",
    "CMMF v1 spec excerpt:",
    truncate(specText, 2200),
    "",
    "Relationships excerpt:",
    truncate(relationshipsText, 1600),
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatCmmfSource(source: CmmfSource): string {
  const bits = [source.rootDir];
  if (source.branch || source.revision) {
    bits.push([source.branch, source.revision].filter(Boolean).join("@"));
  }
  if (source.remoteUrl) {
    bits.push(source.remoteUrl);
  }
  return bits.join(" | ");
}

async function tryLoadCmmfSource(rootDir: string): Promise<CmmfSource | null> {
  const schemaPath = path.join(rootDir, "schemas/model.schema.json");
  const relationshipsDocPath = path.join(rootDir, "docs/relationships.md");
  const requiredFiles = [schemaPath, relationshipsDocPath];

  const exists = await Promise.all(requiredFiles.map((filePath) => pathExists(filePath)));
  if (!exists.every(Boolean)) {
    return null;
  }

  const specPath = await findLatestSpecPath(path.join(rootDir, "spec"));
  if (!specPath) {
    return null;
  }

  const { revision, branch, remoteUrl } = await getGitMetadata(rootDir);
  return {
    rootDir,
    schemaPath,
    specPath,
    relationshipsDocPath,
    revision,
    branch,
    remoteUrl,
  };
}

async function getGitMetadata(rootDir: string): Promise<Pick<CmmfSource, "revision" | "branch" | "remoteUrl">> {
  try {
    const [{ stdout: revision }, { stdout: branch }, { stdout: remoteUrl }] = await Promise.all([
      execFileAsync("git", ["-C", rootDir, "rev-parse", "--short", "HEAD"]),
      execFileAsync("git", ["-C", rootDir, "branch", "--show-current"]),
      execFileAsync("git", ["-C", rootDir, "remote", "get-url", "origin"]),
    ]);

    return {
      revision: revision.trim() || null,
      branch: branch.trim() || null,
      remoteUrl: remoteUrl.trim() || null,
    };
  } catch {
    return {
      revision: null,
      branch: null,
      remoteUrl: null,
    };
  }
}

async function findLatestSpecPath(specDir: string): Promise<string | null> {
  if (!(await pathExists(specDir))) {
    return null;
  }

  const entries = await readdir(specDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      version: parseSpecVersion(entry.name),
    }))
    .filter((entry): entry is { name: string; version: number[] } => entry.version !== null)
    .sort((left, right) => compareVersions(right.version, left.version));

  const latest = candidates[0];
  return latest ? path.join(specDir, latest.name) : null;
}

function parseSpecVersion(fileName: string): number[] | null {
  const match = /^cmmf-v(\d+(?:\.\d+)*)\.md$/i.exec(fileName);
  if (!match) {
    return null;
  }

  return match[1].split(".").map((part) => Number.parseInt(part, 10));
}

function compareVersions(left: number[], right: number[]): number {
  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}\n...`;
}
