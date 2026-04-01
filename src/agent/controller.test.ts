import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { runAgent } from "./controller.js";
import { renderManifest, renderModel } from "../cmmf/render.js";
import { resolveCmmfSource } from "../cmmf/source.js";
import { createCmmfValidators } from "../cmmf/validate.js";
import { loadRepoGraph } from "../cmmf/repo.js";
import type { AgentProvider } from "../providers/base.js";
import type { AgentTurn, CmmfManifest, CmmfModel } from "../types.js";
import { createCmmfSourceFixture } from "../test-support/cmmf-source-fixture.js";

class MockProvider implements AgentProvider {
  public readonly name = "openai" as const;

  public constructor(private readonly turns: AgentTurn[]) {}

  public async runTurn(): Promise<AgentTurn> {
    const turn = this.turns.shift();
    if (!turn) {
      throw new Error("No more mock turns available.");
    }
    return turn;
  }
}

async function createRepo(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "cmmf-agent-controller-"));
  await mkdir(path.join(root, "models"), { recursive: true });
  const manifest: CmmfManifest = {
    specVersion: 1,
    namespace: "test.repo",
    modelsPath: "./models",
    defaults: { required: false, localisation: false },
  };
  const article: CmmfModel = {
    id: "article",
    name: "Article",
    kind: "entry",
    fields: [{ id: "title", name: "Title", type: "string", required: true }],
  };
  await writeFile(path.join(root, "manifest.yaml"), renderManifest(manifest), "utf8");
  await writeFile(path.join(root, "models/article.yaml"), renderModel(article), "utf8");
  return root;
}

test("runAgent handles clarification and returns a validated change set", async () => {
  const root = await createRepo();
  const cmmfSourcePath = await createCmmfSourceFixture();
  const repo = await loadRepoGraph(root);
  const cmmfSource = await resolveCmmfSource(cmmfSourcePath);
  const validators = await createCmmfValidators(cmmfSource);
  const provider = new MockProvider([
    {
      type: "request_clarification",
      questions: [
        {
          id: "author_model",
          question: "Should the author be reusable across multiple articles?",
          reason: "This decides object vs reference semantics.",
          inputType: "choice",
          options: ["Yes, reusable", "No, embedded"],
        },
      ],
    },
    {
      type: "submit_change_set",
      changeSet: {
        summary: "Add a reusable author reference to articles.",
        rationale: ["A person model already fits reusable authorship."],
        warnings: [],
        models: [
          {
            operation: "create",
            reason: "Create the reusable author model.",
            model: {
              id: "person",
              name: "Person",
              kind: "entry",
              fields: [{ id: "full_name", name: "Full Name", type: "string", required: true }],
            },
          },
          {
            operation: "update",
            reason: "Link articles to reusable people.",
            model: {
              id: "article",
              name: "Article",
              kind: "entry",
              fields: [
                { id: "title", name: "Title", type: "string", required: true },
                {
                  id: "author",
                  name: "Author",
                  type: "reference",
                  targets: ["person"],
                  relation: { cardinality: "one", ownership: "linked" },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  const changeSet = await runAgent({
    provider,
    repo,
    instruction: "Add authors to articles.",
    bootstrapManifest: false,
    cmmfSource,
    validators,
    answerQuestions: async (questions) => {
      assert.equal(questions.length, 1);
      return { author_model: "Yes, reusable" };
    },
  });

  assert.equal(changeSet.models.length, 2);
  assert.equal(changeSet.models[0]?.model.id, "person");
  assert.equal(changeSet.models[1]?.operation, "update");
});

test("runAgent rejects destructive updates", async () => {
  const root = await createRepo();
  const cmmfSourcePath = await createCmmfSourceFixture();
  const repo = await loadRepoGraph(root);
  const cmmfSource = await resolveCmmfSource(cmmfSourcePath);
  const validators = await createCmmfValidators(cmmfSource);
  const provider = new MockProvider([
    {
      type: "submit_change_set",
      changeSet: {
        summary: "Rewrite article model.",
        rationale: ["Testing destructive safety."],
        warnings: [],
        models: [
          {
            operation: "update",
            reason: "Change a required field type.",
            model: {
              id: "article",
              name: "Article",
              kind: "entry",
              fields: [{ id: "title", name: "Title", type: "text", required: true }],
            },
          },
        ],
      },
    },
  ]);

  await assert.rejects(
    runAgent({
      provider,
      repo,
      instruction: "Make article titles long-form text.",
      bootstrapManifest: false,
      cmmfSource,
      validators,
      answerQuestions: async () => ({}),
    }),
    /Unsafe update/,
  );
});
