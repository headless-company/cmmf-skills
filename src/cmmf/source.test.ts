import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
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

test("resolveCmmfSource selects the latest versioned CMMF spec file", async () => {
  const fixture = await createCmmfSourceFixture({
    specFiles: {
      "cmmf-v1.md": "# CMMF v1\n",
      "cmmf-v1.2.md": "# CMMF v1.2\n",
      "cmmf-v1.10.0.md": "# CMMF v1.10.0\n",
      "translation-contract-v1.1.0.md": "# Translation contract\n",
      "cmmf-vnext.md": "# Invalid\n",
    },
  });

  const source = await resolveCmmfSource(fixture);

  assert.equal(path.basename(source.specPath), "cmmf-v1.10.0.md");
});
