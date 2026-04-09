import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAgentTurnIdentifiers } from "./normalize.js";

test("normalizeAgentTurnIdentifiers sanitizes change-set identifiers", () => {
  const normalized = normalizeAgentTurnIdentifiers({
    type: "submit_change_set",
    changeSet: {
      summary: "Create a navigation model.",
      rationale: ["Needed for tenant navigation."],
      models: [
        {
          operation: "create",
          reason: "Create the reusable navigation model.",
          model: {
            id: "Header Navigation",
            name: "Header Navigation",
            kind: "entry",
            editorial: {
              labelField: "Internal Name",
            },
            fields: [
              { id: "Internal Name", name: "Internal Name", type: "string", required: true },
              {
                id: "Base Navigation",
                name: "Base Navigation",
                type: "reference",
                targets: ["Header Navigation"],
                relation: { cardinality: "one", ownership: "linked" },
              },
            ],
          },
        },
      ],
    },
  }) as {
    changeSet: {
      models: Array<{
        model: {
          id: string;
          editorial?: { labelField?: string };
          fields: Array<{ id: string; targets?: string[] }>;
        };
      }>;
    };
  };

  assert.equal(normalized.changeSet.models[0]?.model.id, "header_navigation");
  assert.equal(normalized.changeSet.models[0]?.model.editorial?.labelField, "internal_name");
  assert.equal(normalized.changeSet.models[0]?.model.fields[0]?.id, "internal_name");
  assert.equal(normalized.changeSet.models[0]?.model.fields[1]?.id, "base_navigation");
  assert.deepEqual(normalized.changeSet.models[0]?.model.fields[1]?.targets, ["header_navigation"]);
});

test("normalizeAgentTurnIdentifiers sanitizes clarification question identifiers", () => {
  const normalized = normalizeAgentTurnIdentifiers({
    type: "request_clarification",
    questions: [
      {
        id: "Author Model?",
        question: "Should authors be reusable?",
        reason: "This changes object vs reference semantics.",
        inputType: "choice",
      },
    ],
  }) as { questions: Array<{ id: string }> };

  assert.equal(normalized.questions[0]?.id, "author_model");
});
