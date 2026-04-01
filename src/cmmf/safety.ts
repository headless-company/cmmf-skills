import type { CmmfField, CmmfModel, ModelChange, RepoGraph } from "../types.js";

function normaliseTargets(value: string[] | undefined): string[] {
  return [...(value ?? [])].sort();
}

function fieldMap(model: CmmfModel): Map<string, CmmfField> {
  return new Map(model.fields.map((field) => [field.id, field]));
}

export function assertSafeModelChange(repo: RepoGraph, change: ModelChange): void {
  if (change.operation === "create") {
    if (repo.modelsById.has(change.model.id)) {
      throw new Error(`Cannot create model ${change.model.id}; it already exists.`);
    }
    return;
  }

  const existing = repo.modelsById.get(change.model.id);
  if (!existing) {
    throw new Error(`Cannot update model ${change.model.id}; it does not exist.`);
  }

  const next = change.model;
  if (existing.model.kind !== next.kind) {
    throw new Error(`Unsafe update for ${next.id}: kind cannot change from ${existing.model.kind} to ${next.kind}.`);
  }

  const currentFields = fieldMap(existing.model);
  const nextFields = fieldMap(next);
  for (const currentField of existing.model.fields) {
    const replacement = nextFields.get(currentField.id);
    if (!replacement) {
      throw new Error(`Unsafe update for ${next.id}: existing field ${currentField.id} cannot be removed.`);
    }
    assertSafeFieldChange(next.id, currentField, replacement);
  }
}

function assertSafeFieldChange(modelId: string, currentField: CmmfField, nextField: CmmfField): void {
  const criticalKeys: Array<keyof CmmfField> = ["type", "list", "objectType"];
  for (const key of criticalKeys) {
    if (currentField[key] !== nextField[key]) {
      throw new Error(`Unsafe update for ${modelId}.${currentField.id}: ${String(key)} cannot change.`);
    }
  }

  if (currentField.required === false && nextField.required === true) {
    throw new Error(`Unsafe update for ${modelId}.${currentField.id}: optional fields cannot become required.`);
  }

  const currentTargets = normaliseTargets(currentField.targets);
  const nextTargets = normaliseTargets(nextField.targets);
  if (currentTargets.some((target, index) => nextTargets[index] !== target)) {
    throw new Error(`Unsafe update for ${modelId}.${currentField.id}: existing targets cannot change or be removed.`);
  }

  const currentRelation = currentField.relation;
  const nextRelation = nextField.relation;
  if (currentRelation?.cardinality && nextRelation?.cardinality && currentRelation.cardinality !== nextRelation.cardinality) {
    throw new Error(`Unsafe update for ${modelId}.${currentField.id}: relation.cardinality cannot change.`);
  }
  if (currentRelation?.ownership && nextRelation?.ownership && currentRelation.ownership !== nextRelation.ownership) {
    throw new Error(`Unsafe update for ${modelId}.${currentField.id}: relation.ownership cannot change.`);
  }
}
