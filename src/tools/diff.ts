import { isDeepStrictEqual } from "node:util";
import { fields, record, repeatable, strings, type Data, type Repository } from "./repository.js";

export interface Change {
  code: string; classification: "additive" | "breaking" | "uncertain";
  model: string; field?: string; message: string; dependents: string[];
}
function effective(repo: Repository, field: Data, key: "required" | "localisation"): unknown {
  if (field[key] !== undefined) return field[key];
  const defaults = record(repo.manifest?.defaults) ? repo.manifest.defaults : {};
  return defaults[key] ?? false;
}
export function semanticDiff(before: Repository, after: Repository): Change[] {
  const changes: Change[] = [];
  function add(code: string, classification: Change["classification"], model: string, message: string, field?: string) {
    const dependents = new Set<string>();
    const pending = [model];
    while (pending.length) {
      const target = pending.pop();
      for (const edge of before.edges) if (edge.to === target && edge.from !== model && !dependents.has(edge.from)) {
        dependents.add(edge.from); pending.push(edge.from);
      }
    }
    changes.push({ code, classification, model, field, message, dependents: [...dependents].sort() });
  }
  const oldModels = new Map(before.models.filter(m => typeof m.data.id === "string").map(m => [String(m.data.id), m.data]));
  const newModels = new Map(after.models.filter(m => typeof m.data.id === "string").map(m => [String(m.data.id), m.data]));
  if (!isDeepStrictEqual(before.manifest?.specVersion, after.manifest?.specVersion)) add("SPEC_VERSION_CHANGED", "uncertain", "(manifest)", "Specification version changed; review upgrade semantics.");
  if (before.manifest?.namespace !== after.manifest?.namespace) add("NAMESPACE_CHANGED", "breaking", "(manifest)", "Model namespace changed; review external identity/mappings.");
  if (before.manifest?.modelsPath !== after.manifest?.modelsPath) add("MODELS_PATH_CHANGED", "uncertain", "(manifest)", "Model file location changed; review tooling and repository references.");
  for (const [id, model] of oldModels) {
    const next = newModels.get(id);
    if (!next) { add("MODEL_REMOVED", "breaking", id, "Model removed."); continue; }
    if (model.kind !== next.kind) add("MODEL_KIND_CHANGED", "breaking", id, "Model kind changed.");
    const oldFields = new Map(fields(model).map(f => [String(f.id), f]));
    const newFields = new Map(fields(next).map(f => [String(f.id), f]));
    for (const [fieldId, field] of oldFields) {
      const replacement = newFields.get(fieldId);
      if (!replacement) { add("FIELD_REMOVED", "breaking", id, "Field removed; existing content needs mapping or retention.", fieldId); continue; }
      for (const key of ["type", "objectType"] as const) if (field[key] !== replacement[key]) add("FIELD_STRUCTURE_CHANGED", "breaking", id, `${key} changed.`, fieldId);
      if (repeatable(field) !== repeatable(replacement)) add("REPEATABILITY_CHANGED", "breaking", id, "Effective repeatability changed.", fieldId);
      if (effective(before, field, "required") !== effective(after, replacement, "required")) add("REQUIREDNESS_CHANGED", effective(after, replacement, "required") === true ? "breaking" : "additive", id, "Effective requiredness changed (including manifest defaults).", fieldId);
      if (effective(before, field, "localisation") !== effective(after, replacement, "localisation")) add("LOCALISATION_CHANGED", "breaking", id, "Effective localisation changed.", fieldId);
      for (const key of ["targets", "values"] as const) {
        const previous = strings(field[key]); const current = strings(replacement[key]);
        if (previous.some(value => !current.includes(value))) add("ALLOWED_VALUES_REMOVED", "breaking", id, `Existing ${key} removed.`, fieldId);
        if (current.some(value => !previous.includes(value))) add("ALLOWED_VALUES_ADDED", "additive", id, `New ${key} added.`, fieldId);
      }
      const oldRelation = record(field.relation) ? field.relation : {};
      const newRelation = record(replacement.relation) ? replacement.relation : {};
      if (oldRelation.ownership !== newRelation.ownership) add("OWNERSHIP_CHANGED", "breaking", id, "Relationship ownership changed or removed.", fieldId);
      // Canonicalise handled properties so legacy cardinality aliases and target ordering do not cause spurious changes.
      function remainder(value: Data): Data {
        const result = { ...value };
        for (const key of ["id", "type", "objectType", "list", "required", "localisation", "targets", "values"]) delete result[key];
        if (record(result.relation)) {
          const relation = { ...result.relation }; delete relation.cardinality; delete relation.ownership;
          if (Object.keys(relation).length) result.relation = relation; else delete result.relation;
        }
        return result;
      }
      if (!isDeepStrictEqual(remainder(field), remainder(replacement))) add("FIELD_METADATA_CHANGED", "uncertain", id, "Other field constraints, rich-text capabilities, defaults, or metadata changed; review content/editorial impact.", fieldId);
    }
    for (const [fieldId, field] of newFields) if (!oldFields.has(fieldId)) add("FIELD_ADDED", effective(after, field, "required") === true ? "breaking" : "additive", id, "Field added; required fields may need content backfill.", fieldId);
    if (!isDeepStrictEqual(model.validationHints, next.validationHints)) add("VALIDATION_HINTS_CHANGED", "uncertain", id, "Document-level validation intent changed; review content and translator impact. Hints are not enforced by this tool.");
    const { fields: ignoredOldFields, kind: ignoredOldKind, validationHints: ignoredOldHints, ...oldMeta } = model;
    const { fields: ignoredNewFields, kind: ignoredNewKind, validationHints: ignoredNewHints, ...newMeta } = next;
    if (!isDeepStrictEqual(oldMeta, newMeta)) add("MODEL_METADATA_CHANGED", "uncertain", id, "Model metadata changed; review governance/editorial impact.");
  }
  for (const id of newModels.keys()) if (!oldModels.has(id)) add("MODEL_ADDED", "additive", id, "Model added.");
  return changes;
}
