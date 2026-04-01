import test from "node:test";
import assert from "node:assert/strict";
import { createCmmfSourceFixture } from "../test-support/cmmf-source-fixture.js";
import { loadSpecExcerpt, resolveCmmfSource } from "./source.js";
import { createCmmfValidators } from "./validate.js";

test("resolveCmmfSource finds a valid spec repo and validators use its schema", async () => {
  const fixture = await createCmmfSourceFixture();
  const source = await resolveCmmfSource(fixture);
  const validators = await createCmmfValidators(source);

  assert.match(source.schemaPath, /model\.schema\.json$/);
  assert.equal(validators.validateModel({ id: "article", name: "Article", kind: "entry", fields: [] }).length, 0);
  assert.ok(validators.validateModel({ id: "article", name: "Article", kind: "entry" }).length > 0);
});

test("loadSpecExcerpt includes repository and spec text", async () => {
  const fixture = await createCmmfSourceFixture();
  const source = await resolveCmmfSource(fixture);
  const excerpt = await loadSpecExcerpt(source);

  assert.match(excerpt, /CMMF v1/);
  assert.match(excerpt, /Relationships/);
});
