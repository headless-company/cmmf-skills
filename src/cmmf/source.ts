import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
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
  const specPath = path.join(rootDir, "spec/cmmf-v1.md");
  const relationshipsDocPath = path.join(rootDir, "docs/relationships.md");
  const requiredFiles = [schemaPath, specPath, relationshipsDocPath];

  const exists = await Promise.all(requiredFiles.map((filePath) => pathExists(filePath)));
  if (!exists.every(Boolean)) {
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

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}\n...`;
}
