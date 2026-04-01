import OpenAI from "openai";
import { agentTurnSchema } from "../types.js";
import type { AgentProvider, ProviderInput } from "./base.js";
import { resolveDefaultModel } from "./base.js";

const questionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "question", "reason", "inputType"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9_-]+$" },
    question: { type: "string" },
    reason: { type: "string" },
    inputType: { type: "string", enum: ["text", "choice"] },
    options: { type: "array", items: { type: "string" } },
  },
} as const;

const fieldSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "type"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    type: {
      type: "string",
      enum: ["string", "text", "number", "boolean", "date", "datetime", "slug", "enum", "richText", "asset", "json", "object", "reference"],
    },
    required: { type: "boolean" },
    localisation: { type: "boolean" },
    default: {},
    list: { type: "boolean" },
    validations: { type: "object" },
    editorial: { type: "object" },
    relation: { type: "object" },
    objectType: { type: "string" },
    targets: { type: "array", items: { type: "string" } },
    values: { type: "array", items: { type: "string" } },
    translationHints: { type: "object" },
  },
} as const;

const modelSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "kind", "fields"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    kind: { type: "string", enum: ["entry", "component", "object", "taxonomy", "settings"] },
    description: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    localisation: { type: "boolean" },
    singleton: { type: "boolean" },
    fields: { type: "array", items: fieldSchema },
    editorial: { type: "object" },
    governance: { type: "object" },
    translationHints: { type: "object" },
  },
} as const;

const manifestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["specVersion", "namespace"],
  properties: {
    specVersion: { type: "number", enum: [1] },
    namespace: { type: "string" },
    modelsPath: { type: "string" },
    defaults: { type: "object" },
  },
} as const;

export class OpenAIProvider implements AgentProvider {
  public readonly name = "openai" as const;

  private readonly client: OpenAI;

  public constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async runTurn(input: ProviderInput) {
    const response = (await this.client.responses.create({
      model: input.modelOverride ?? resolveDefaultModel(this.name, input.phase),
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: input.systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: input.userPrompt }],
        },
      ],
      parallel_tool_calls: false,
      tools: [
        {
          type: "function",
          name: "request_clarification",
          description: "Ask the user targeted clarifying questions before creating or updating CMMF models.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["questions"],
            properties: {
              questions: {
                type: "array",
                items: questionSchema,
              },
            },
          },
        },
        {
          type: "function",
          name: "submit_change_set",
          description: "Return a safe, complete CMMF change set.",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["changeSet"],
            properties: {
              changeSet: {
                type: "object",
                additionalProperties: false,
                required: ["summary", "rationale", "models"],
                properties: {
                  summary: { type: "string" },
                  rationale: { type: "array", items: { type: "string" } },
                  warnings: { type: "array", items: { type: "string" } },
                  manifest: manifestSchema,
                  models: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["operation", "reason", "model"],
                      properties: {
                        operation: { type: "string", enum: ["create", "update"] },
                        reason: { type: "string" },
                        model: modelSchema,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    } as never)) as any;

    const output = Array.isArray(response.output) ? response.output : [];
    const toolCall = output.find((item: any) => item.type === "function_call");
    if (!toolCall) {
      throw new Error(`OpenAI did not return a tool call. Output text: ${response.output_text ?? "(empty)"}`);
    }
    const args = JSON.parse(toolCall.arguments ?? "{}");
    return agentTurnSchema.parse(toolCall.name === "request_clarification" ? { type: "request_clarification", ...args } : { type: "submit_change_set", ...args });
  }
}
