import type { CmmfField, CmmfManifest, CmmfModel, Editorial, Relation } from "../types.js";
import { stringifyYaml } from "../utils/yaml.js";

function cleanObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function renderEditorial(editorial: Editorial | undefined): Record<string, unknown> | undefined {
  if (!editorial) {
    return undefined;
  }
  const preview = editorial.preview
    ? cleanObject({
        title: editorial.preview.title,
        description: editorial.preview.description,
        image: editorial.preview.image,
      })
    : undefined;
  return cleanObject({
    labelField: editorial.labelField,
    preview: preview && Object.keys(preview).length > 0 ? preview : undefined,
    helpText: editorial.helpText,
  });
}

function renderRelation(relation: Relation | undefined): Record<string, unknown> | undefined {
  if (!relation) {
    return undefined;
  }
  return cleanObject({
    cardinality: relation.cardinality,
    ordered: relation.ordered,
    uniqueItems: relation.uniqueItems,
    minItems: relation.minItems,
    maxItems: relation.maxItems,
    ownership: relation.ownership,
  });
}

function renderField(field: CmmfField): Record<string, unknown> {
  return cleanObject({
    id: field.id,
    name: field.name,
    type: field.type,
    description: field.description,
    required: field.required,
    localisation: field.localisation,
    default: field.default,
    list: field.list,
    validations: field.validations,
    editorial: renderEditorial(field.editorial),
    relation: renderRelation(field.relation),
    objectType: field.objectType,
    targets: field.targets,
    values: field.values,
    translationHints: field.translationHints,
  });
}

export function renderManifest(manifest: CmmfManifest): string {
  const payload = cleanObject({
    specVersion: manifest.specVersion,
    namespace: manifest.namespace,
    modelsPath: manifest.modelsPath,
    defaults: manifest.defaults,
  });

  return stringifyYaml(payload);
}

export function renderModel(model: CmmfModel): string {
  const payload = cleanObject({
    id: model.id,
    name: model.name,
    kind: model.kind,
    description: model.description,
    tags: model.tags,
    localisation: model.localisation,
    singleton: model.singleton,
    fields: model.fields.map(renderField),
    editorial: renderEditorial(model.editorial),
    governance: model.governance,
    translationHints: model.translationHints,
  });

  return stringifyYaml(payload);
}
