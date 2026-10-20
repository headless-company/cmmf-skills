import path from "node:path";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { parseYaml } from "../utils/yaml.js";
import { loadProjectInstructions } from "../cmmf/instructions.js";

export type Data = Record<string, unknown>;
export interface Diagnostic {
  code: string;
  severity: "error" | "warning";
  file: string;
  path: string;
  message: string;
}
export interface ModelFile { file: string; data: Data }
export interface Edge {
  from: string; field: string; to: string;
  kind: "reference" | "object" | "richTextEmbed";
  list: boolean; ownership?: string;
}
export interface Repository {
  root: string;
  manifest: Data | null;
  manifestFile: string;
  models: ModelFile[];
  edges: Edge[];
  instructions: Array<{ relativePath: string; content: string }>;
  diagnostics: Diagnostic[];
}
export function record(value: unknown): value is Data {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function fields(model: Data): Data[] {
  return Array.isArray(model.fields) ? model.fields.filter(record) : [];
}
export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
export function repeatable(field: Data): boolean {
  return typeof field.list === "boolean" ? field.list : record(field.relation) && field.relation.cardinality === "many";
}
export function inside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}
export function issue(code: string, file: string, location: string, message: string, severity: Diagnostic["severity"] = "error"): Diagnostic {
  return { code, file, path: location, message, severity };
}

export async function inspectRepository(rootDir: string): Promise<Repository> {
  const root = await realpath(path.resolve(rootDir));
  const diagnostics: Diagnostic[] = [];
  const models: ModelFile[] = [];
  const edges: Edge[] = [];
  async function parse(file: string): Promise<Data | null> {
    try {
      const resolved = await realpath(file);
      if (!inside(root, resolved)) {
        diagnostics.push(issue("PATH_OUTSIDE_REPOSITORY", file, "", "File resolves outside the repository."));
        return null;
      }
      const data = parseYaml<unknown>(await readFile(file, "utf8"));
      if (!record(data)) {
        diagnostics.push(issue("DOCUMENT_NOT_OBJECT", file, "", "Expected a YAML mapping."));
        return null;
      }
      return data;
    } catch (error) {
      diagnostics.push(issue("YAML_PARSE_ERROR", file, "", String(error instanceof Error ? error.message : error)));
      return null;
    }
  }
  const manifests: string[] = [];
  for (const name of ["manifest.yaml", "manifest.yml"]) {
    const file = path.join(root, name);
    try { await lstat(file); manifests.push(file); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const manifestFile = manifests[0] ?? path.join(root, "manifest.yaml");
  if (manifests.length === 0) diagnostics.push(issue("MANIFEST_MISSING", manifestFile, "", "Manifest not found."));
  if (manifests.length > 1) diagnostics.push(issue("MANIFEST_AMBIGUOUS", manifestFile, "", "Both manifest.yaml and manifest.yml exist."));
  const manifest = manifests.length ? await parse(manifestFile) : null;
  const declaredPath = manifest?.modelsPath;
  if (declaredPath !== undefined && typeof declaredPath !== "string") diagnostics.push(issue("MANIFEST_INVALID", manifestFile, "modelsPath", "modelsPath must be a relative string."));
  const modelsDir = path.resolve(root, typeof declaredPath === "string" ? declaredPath : "models");
  if (!inside(root, modelsDir) || (typeof declaredPath === "string" && path.isAbsolute(declaredPath))) {
    diagnostics.push(issue("PATH_OUTSIDE_REPOSITORY", manifestFile, "modelsPath", "Model directory must be within the repository."));
  } else {
    const visited = new Set<string>();
    async function walk(dir: string): Promise<void> {
      try {
        const resolved = await realpath(dir);
        if (!inside(root, resolved)) {
          diagnostics.push(issue("PATH_OUTSIDE_REPOSITORY", dir, "", "Directory resolves outside the repository."));
          return;
        }
        if (visited.has(resolved)) return;
        visited.add(resolved);
        for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
          const file = path.join(dir, entry.name);
          if (entry.isDirectory()) await walk(file);
          else if (entry.isSymbolicLink()) diagnostics.push(issue("MODEL_SYMLINK_UNSUPPORTED", file, "", "Model symlinks are not followed; use ordinary files."));
          else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
            const data = await parse(file);
            if (data) models.push({ file, data });
          }
        }
      } catch (error) {
        diagnostics.push(issue((error as NodeJS.ErrnoException).code === "ENOENT" ? "MODELS_DIRECTORY_MISSING" : "MODELS_READ_ERROR", dir, "", String(error instanceof Error ? error.message : error)));
      }
    }
    await walk(modelsDir);
  }
  for (const { data } of models) {
    if (typeof data.id !== "string") continue;
    for (const field of fields(data)) {
      if (typeof field.id !== "string") continue;
      const relation = record(field.relation) ? field.relation : {};
      const base = { from: data.id, field: field.id, list: repeatable(field), ownership: typeof relation.ownership === "string" ? relation.ownership : undefined };
      if (field.type === "reference") for (const to of strings(field.targets)) edges.push({ ...base, to, kind: "reference" });
      if (field.type === "object" && typeof field.objectType === "string") edges.push({ ...base, to: field.objectType, kind: "object" });
      if (field.type === "richText" && record(field.richTextConfig) && Array.isArray(field.richTextConfig.embeds)) {
        for (const embed of field.richTextConfig.embeds.filter(record)) {
          if (embed.kind === "reference") for (const to of strings(embed.targets)) edges.push({ ...base, to, kind: "richTextEmbed", list: true, ownership: undefined });
        }
      }
    }
  }
  let instructions: Repository["instructions"] = [];
  try { instructions = await loadProjectInstructions(root); } catch (error) {
    diagnostics.push(issue("PROJECT_INSTRUCTIONS_READ_ERROR", root, "", String(error instanceof Error ? error.message : error)));
  }
  return { root, manifest, manifestFile, models, edges, instructions, diagnostics };
}
