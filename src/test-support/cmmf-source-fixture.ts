import path from "node:path";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

export async function createCmmfSourceFixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "cmmf-spec-fixture-"));
  await mkdir(path.join(root, "schemas"), { recursive: true });
  await mkdir(path.join(root, "spec"), { recursive: true });
  await mkdir(path.join(root, "docs"), { recursive: true });

  await writeFile(
    path.join(root, "schemas/model.schema.json"),
    JSON.stringify(
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "CMMF v1 Model Schema",
        type: "object",
        required: ["id", "name", "kind", "fields"],
        properties: {
          id: { type: "string", pattern: "^[a-z0-9_-]+$" },
          name: { type: "string" },
          kind: { type: "string", enum: ["entry", "component", "object", "taxonomy", "settings"] },
          fields: { type: "array", items: { $ref: "#/definitions/field" } },
        },
        definitions: {
          field: {
            type: "object",
            required: ["id", "type"],
            properties: {
              id: { type: "string", pattern: "^[a-z0-9_-]+$" },
              type: {
                type: "string",
                enum: ["string", "text", "number", "boolean", "date", "datetime", "slug", "enum", "richText", "asset", "json", "object", "reference"],
              },
              objectType: { type: "string" },
              targets: { type: "array", items: { type: "string" } },
              values: { type: "array", items: { type: "string" } },
            },
            allOf: [
              {
                if: { properties: { type: { const: "object" } } },
                then: { required: ["objectType"] },
              },
              {
                if: { properties: { type: { const: "reference" } } },
                then: { required: ["targets"] },
              },
              {
                if: { properties: { type: { const: "enum" } } },
                then: { required: ["values"] },
              },
            ],
          },
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(
    path.join(root, "spec/cmmf-v1.md"),
    "# CMMF v1\n\n## Overview\n\nPortable content model format.\n\n## Model kinds\n\n- entry\n- object\n",
    "utf8",
  );
  await writeFile(
    path.join(root, "docs/relationships.md"),
    "# Relationships\n\nUse object for embedded structures and reference for reusable content.\n",
    "utf8",
  );

  return root;
}
