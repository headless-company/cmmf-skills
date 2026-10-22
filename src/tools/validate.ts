import AjvModule, { type ErrorObject } from "ajv";
import { readFile } from "node:fs/promises";
import { fields, record, issue, type Diagnostic, type Repository } from "./repository.js";
import type { SourceEvidence } from "./source.js";
import { validateHints } from "./validation-hints.js";

const Ajv = AjvModule as unknown as new (options: Record<string, unknown>) => {
  compile(schema: unknown): { (data: unknown): boolean; errors?: ErrorObject[] | null };
};
export const supportedVersions = ["1", "1.1.0", "1.2.0", "1.2.1", "1.3.0-beta.1"];

export async function validateRepository(repo: Repository, source: SourceEvidence): Promise<Diagnostic[]> {
  const diagnostics = [...repo.diagnostics];
  if (!supportedVersions.includes(source.version)) diagnostics.push(issue("HELPER_VERSION_UNSUPPORTED", source.specFile, "", `Schema checks can run, but graph/manifest semantics are not supported for CMMF ${source.version}. Tested semantics: ${supportedVersions.join(", ")}.`));
  if (repo.manifest) {
    const manifest = repo.manifest;
    const version = manifest.specVersion === 1 ? "1" : manifest.specVersion;
    if (version !== source.version) diagnostics.push(issue("SOURCE_VERSION_MISMATCH", repo.manifestFile, "specVersion", `Manifest declares ${String(manifest.specVersion)}; schema source is ${source.version}. No implicit upgrade or legacy remapping is performed.`));
    if (typeof manifest.namespace !== "string" || !manifest.namespace.length) diagnostics.push(issue("MANIFEST_INVALID", repo.manifestFile, "namespace", "namespace must be a nonempty string."));
    if (manifest.defaults !== undefined) {
      if (!record(manifest.defaults)) diagnostics.push(issue("MANIFEST_INVALID", repo.manifestFile, "defaults", "defaults must be a mapping."));
      else for (const [key, value] of Object.entries(manifest.defaults)) {
        if (!["required", "localisation"].includes(key) || typeof value !== "boolean") diagnostics.push(issue("MANIFEST_INVALID", repo.manifestFile, `defaults.${key}`, "Only boolean required/localisation defaults are supported."));
      }
    }
  }
  const schema = JSON.parse(await readFile(source.schemaFile, "utf8")) as unknown;
  const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
  const ids = new Map<string, string>();
  for (const { file, data } of repo.models) {
    const schemaValid = validate(data);
    if (!schemaValid) for (const error of validate.errors ?? []) {
      diagnostics.push(issue("MODEL_SCHEMA_INVALID", file, error.instancePath, `${error.message ?? "Schema validation failed"} (${error.schemaPath})`));
    }
    if (schemaValid && source.version === "1.3.0-beta.1") diagnostics.push(...validateHints(data, file));
    if (typeof data.id !== "string") continue;
    if (ids.has(data.id)) diagnostics.push(issue("MODEL_ID_DUPLICATE", file, "id", `Model ${data.id} is also defined in ${ids.get(data.id)}.`));
    else ids.set(data.id, file);
    const fieldIds = new Set<string>();
    for (const [index, field] of fields(data).entries()) {
      if (typeof field.id === "string") {
        if (fieldIds.has(field.id)) diagnostics.push(issue("FIELD_ID_DUPLICATE", file, `/fields/${index}/id`, `Field ${field.id} is defined more than once.`));
        fieldIds.add(field.id);
      }
    }
    const editorial = record(data.editorial) ? data.editorial : {};
    if (typeof editorial.labelField === "string" && !fieldIds.has(editorial.labelField)) diagnostics.push(issue("EDITORIAL_FIELD_MISSING", file, "editorial.labelField", `Label field ${editorial.labelField} does not exist.`));
  }
  for (const edge of repo.edges) {
    const file = ids.get(edge.from) ?? repo.root;
    if (!ids.has(edge.to)) diagnostics.push(issue("TARGET_MISSING", file, `${edge.field}.${edge.kind}`, `Target ${edge.to} does not exist.`));
    else if (edge.kind === "object") {
      const target = repo.models.find(model => model.data.id === edge.to);
      if (target?.data.kind !== "object") diagnostics.push(issue("OBJECT_TARGET_KIND", file, `${edge.field}.objectType`, `Embedded target ${edge.to} has kind ${String(target?.data.kind)}; expected object.`));
    }
  }
  return diagnostics;
}
