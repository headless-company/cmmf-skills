import { z } from "zod";

export const modelKinds = ["entry", "component", "object", "taxonomy", "settings"] as const;
export const fieldTypes = [
  "string",
  "text",
  "number",
  "boolean",
  "date",
  "datetime",
  "slug",
  "enum",
  "richText",
  "asset",
  "json",
  "object",
  "reference",
] as const;
export const relationCardinalities = ["one", "many"] as const;
export const relationOwnerships = ["linked", "contained"] as const;

const previewSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
  })
  .strict()
  .partial();

export const editorialSchema = z
  .object({
    labelField: z.string().optional(),
    preview: previewSchema.optional(),
    helpText: z.string().optional(),
  })
  .strict()
  .partial();

export const relationSchema = z
  .object({
    cardinality: z.enum(relationCardinalities).optional(),
    ordered: z.boolean().optional(),
    uniqueItems: z.boolean().optional(),
    minItems: z.number().optional(),
    maxItems: z.number().optional(),
    ownership: z.enum(relationOwnerships).optional(),
  })
  .strict()
  .partial();

export const fieldSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_-]+$/),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(fieldTypes),
    required: z.boolean().optional(),
    localisation: z.boolean().optional(),
    default: z.unknown().optional(),
    list: z.boolean().optional(),
    validations: z.record(z.string(), z.unknown()).optional(),
    editorial: editorialSchema.optional(),
    relation: relationSchema.optional(),
    objectType: z.string().optional(),
    targets: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
    translationHints: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type === "object" && !value.objectType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Object fields must include objectType.",
        path: ["objectType"],
      });
    }
    if (value.type === "reference" && (!value.targets || value.targets.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reference fields must include targets.",
        path: ["targets"],
      });
    }
    if (value.type === "enum" && (!value.values || value.values.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enum fields must include values.",
        path: ["values"],
      });
    }
  });

export const modelSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/),
  name: z.string(),
  kind: z.enum(modelKinds),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  localisation: z.boolean().optional(),
  singleton: z.boolean().optional(),
  fields: z.array(fieldSchema),
  editorial: editorialSchema.optional(),
  governance: z.record(z.string(), z.unknown()).optional(),
  translationHints: z.record(z.string(), z.unknown()).optional(),
});

export const manifestSchema = z.object({
  specVersion: z.literal(1),
  namespace: z.string().min(1),
  modelsPath: z.string().optional(),
  defaults: z
    .object({
      required: z.boolean().optional(),
      localisation: z.boolean().optional(),
    })
    .strict()
    .partial()
    .optional(),
});

export type Relation = z.infer<typeof relationSchema>;
export type Editorial = z.infer<typeof editorialSchema>;
export type CmmfField = z.infer<typeof fieldSchema>;
export type CmmfModel = z.infer<typeof modelSchema>;
export type CmmfManifest = z.infer<typeof manifestSchema>;

export const clarificationQuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/),
  question: z.string().min(1),
  reason: z.string().min(1),
  inputType: z.enum(["text", "choice"]),
  options: z.array(z.string()).optional(),
});

export const modelChangeSchema = z.object({
  operation: z.enum(["create", "update"]),
  model: modelSchema,
  reason: z.string().min(1),
});

export const changeSetSchema = z.object({
  summary: z.string().min(1),
  rationale: z.array(z.string()).min(1),
  warnings: z.array(z.string()).default([]),
  manifest: manifestSchema.optional(),
  models: z.array(modelChangeSchema).min(1),
});

export const agentTurnSchema = z.union([
  z.object({
    type: z.literal("request_clarification"),
    questions: z.array(clarificationQuestionSchema).min(1),
  }),
  z.object({
    type: z.literal("submit_change_set"),
    changeSet: changeSetSchema,
  }),
]);

export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;
export type ModelChange = z.infer<typeof modelChangeSchema>;
export type ChangeSet = z.infer<typeof changeSetSchema>;
export type AgentTurn = z.infer<typeof agentTurnSchema>;

export interface ParsedModelFile {
  path: string;
  model: CmmfModel;
}

export interface RepoGraph {
  rootDir: string;
  manifestPath: string | null;
  manifest: CmmfManifest | null;
  modelsDir: string;
  modelFiles: ParsedModelFile[];
  modelsById: Map<string, ParsedModelFile>;
  references: Array<{ fromModelId: string; fieldId: string; targets: string[] }>;
  objectUsages: Array<{ fromModelId: string; fieldId: string; objectType: string }>;
}
