import Anthropic from "@anthropic-ai/sdk";
import { agentTurnSchema } from "../types.js";
import type { AgentProvider, ProviderInput } from "./base.js";
import { resolveDefaultModel } from "./base.js";

const questionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    question: { type: "string" },
    reason: { type: "string" },
    inputType: { type: "string", enum: ["text", "choice"] },
    options: { type: "array", items: { type: "string" } },
  },
  required: ["id", "question", "reason", "inputType"],
  additionalProperties: false,
} as const;

const fieldSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    type: { type: "string" },
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
  required: ["id", "type"],
  additionalProperties: false,
} as const;

export class AnthropicProvider implements AgentProvider {
  public readonly name = "anthropic" as const;

  private readonly client: Anthropic;

  public constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  public async runTurn(input: ProviderInput) {
    const response = (await this.client.messages.create({
      model: input.modelOverride ?? resolveDefaultModel(this.name, input.phase),
      max_tokens: 4000,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.userPrompt }],
      tools: [
        {
          name: "request_clarification",
          description: "Ask the user targeted clarifying questions before creating or updating CMMF models.",
          input_schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: questionSchema,
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
        {
          name: "submit_change_set",
          description: "Return a safe, complete CMMF change set.",
          input_schema: {
            type: "object",
            properties: {
              changeSet: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  rationale: { type: "array", items: { type: "string" } },
                  warnings: { type: "array", items: { type: "string" } },
                  manifest: { type: "object" },
                  models: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        operation: { type: "string", enum: ["create", "update"] },
                        reason: { type: "string" },
                        model: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            kind: { type: "string" },
                            description: { type: "string" },
                            tags: { type: "array", items: { type: "string" } },
                            localisation: { type: "boolean" },
                            singleton: { type: "boolean" },
                            fields: { type: "array", items: fieldSchema },
                            editorial: { type: "object" },
                            governance: { type: "object" },
                            translationHints: { type: "object" },
                          },
                          required: ["id", "name", "kind", "fields"],
                          additionalProperties: false,
                        },
                      },
                      required: ["operation", "reason", "model"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "rationale", "models"],
                additionalProperties: false,
              },
            },
            required: ["changeSet"],
            additionalProperties: false,
          },
        },
      ],
    } as never)) as any;

    const toolUse = Array.isArray(response.content) ? response.content.find((item: any) => item.type === "tool_use") : null;
    if (!toolUse) {
      throw new Error("Anthropic did not return a tool result.");
    }
    const payload = toolUse.name === "request_clarification"
      ? { type: "request_clarification", ...toolUse.input }
      : { type: "submit_change_set", ...toolUse.input };
    return agentTurnSchema.parse(payload);
  }
}
