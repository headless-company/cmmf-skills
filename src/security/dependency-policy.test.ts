import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { verifyDependencyPolicy } from "./dependency-policy.js";

async function createPolicyFixture(withAxios: boolean): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "cmmf-agent-deps-"));
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, ".npmrc"),
    ["engine-strict=true", "ignore-scripts=true", "min-release-age=7", "package-lock=true"].join("\n"),
    "utf8",
  );
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "fixture", packageManager: "npm@11.11.0" }, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(root, "package-lock.json"),
    JSON.stringify(
      withAxios
        ? {
            name: "fixture",
            lockfileVersion: 3,
            packages: {
              "": { name: "fixture" },
              "node_modules/axios": { name: "axios", version: "1.0.0" },
            },
          }
        : {
            name: "fixture",
            lockfileVersion: 3,
            packages: {
              "": { name: "fixture" },
            },
          },
      null,
      2,
    ),
    "utf8",
  );
  return root;
}

test("verifyDependencyPolicy passes when npm policy is present and axios is absent", async () => {
  const root = await createPolicyFixture(false);
  const result = await verifyDependencyPolicy(root);

  assert.equal(result.errors.length, 0);
});

test("verifyDependencyPolicy fails when axios is present in the lockfile", async () => {
  const root = await createPolicyFixture(true);
  const result = await verifyDependencyPolicy(root);

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0] ?? "", /axios/);
});
