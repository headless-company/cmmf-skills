import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { loadRepoGraph, summarizeRepo } from "./repo.js";
import { renderManifest, renderModel } from "./render.js";
import type { CmmfManifest, CmmfModel } from "../types.js";

async function createFixtureRepo(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "cmmf-agent-repo-"));
  await mkdir(path.join(root, "models"), { recursive: true });
  const manifest: CmmfManifest = {
    specVersion: 1,
    namespace: "test.repo",
    modelsPath: "./models",
    defaults: {
      required: false,
      localisation: false,
    },
  };
  const article: CmmfModel = {
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
    editorial: { labelField: "title" },
  };
  const person: CmmfModel = {
    id: "person",
    name: "Person",
    kind: "entry",
    fields: [{ id: "full_name", name: "Full Name", type: "string", required: true }],
  };

  await writeFile(path.join(root, "manifest.yaml"), renderManifest(manifest), "utf8");
  await writeFile(path.join(root, "models/article.yaml"), renderModel(article), "utf8");
  await writeFile(path.join(root, "models/person.yaml"), renderModel(person), "utf8");
  return root;
}

test("loadRepoGraph discovers manifest, models, and relationships", async () => {
  const root = await createFixtureRepo();
  const repo = await loadRepoGraph(root);

  assert.equal(repo.manifest?.namespace, "test.repo");
  assert.equal(repo.modelFiles.length, 2);
  assert.equal(repo.references.length, 1);
  assert.equal(repo.references[0]?.targets[0], "person");
});

test("summarizeRepo prioritizes relevant models", async () => {
  const root = await createFixtureRepo();
  const repo = await loadRepoGraph(root);
  const summary = summarizeRepo(repo, "Create an author biography object for article pages");

  assert.match(summary, /article/);
  assert.match(summary, /person/);
});
