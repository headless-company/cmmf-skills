import path from "node:path";
import process from "node:process";
import { verifyDependencyPolicy } from "../src/security/dependency-policy.js";

async function main(): Promise<void> {
  const rootDir = path.resolve(process.cwd());
  const result = await verifyDependencyPolicy(rootDir);

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`Error: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Dependency policy verification passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
