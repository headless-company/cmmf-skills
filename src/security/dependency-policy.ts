import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface DependencyPolicyResult {
  errors: string[];
  warnings: string[];
}

function collectAxiosMatchesFromLockfile(lockfile: Record<string, unknown>): string[] {
  const matches = new Set<string>();
  const packages = (lockfile.packages ?? {}) as Record<string, { name?: string }>;
  for (const [packagePath, metadata] of Object.entries(packages)) {
    if (metadata?.name === "axios" || packagePath.includes("node_modules/axios")) {
      matches.add(packagePath || "root");
    }
  }

  const dependencies = (lockfile.dependencies ?? {}) as Record<string, unknown>;
  if ("axios" in dependencies) {
    matches.add("dependencies.axios");
  }

  return [...matches].sort();
}

async function hasNodeModules(rootDir: string): Promise<boolean> {
  try {
    await access(path.join(rootDir, "node_modules"), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function verifyDependencyPolicy(rootDir: string): Promise<DependencyPolicyResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const npmrcPath = path.join(rootDir, ".npmrc");
  const packageJsonPath = path.join(rootDir, "package.json");
  const lockfilePath = path.join(rootDir, "package-lock.json");

  const [npmrc, packageJsonText, lockfileText] = await Promise.all([
    readFile(npmrcPath, "utf8"),
    readFile(packageJsonPath, "utf8"),
    readFile(lockfilePath, "utf8"),
  ]);

  if (!npmrc.includes("min-release-age=7")) {
    errors.push(".npmrc must include min-release-age=7.");
  }
  if (!npmrc.includes("ignore-scripts=true")) {
    errors.push(".npmrc must include ignore-scripts=true.");
  }

  const packageJson = JSON.parse(packageJsonText) as { packageManager?: string };
  if (!packageJson.packageManager?.startsWith("npm@11.")) {
    errors.push("package.json must pin npm 11 in packageManager.");
  }

  const lockfile = JSON.parse(lockfileText) as Record<string, unknown>;
  const axiosMatches = collectAxiosMatchesFromLockfile(lockfile);
  if (axiosMatches.length > 0) {
    errors.push(`axios is banned but appears in package-lock.json at: ${axiosMatches.join(", ")}`);
  }

  if (await hasNodeModules(rootDir)) {
    try {
      const { stdout } = await execFileAsync("npm", ["ls", "axios", "--all", "--json"], {
        cwd: rootDir,
      });
      if (stdout.includes('"axios"')) {
        errors.push("axios is banned but appears in npm ls output.");
      }
    } catch (error) {
      const stdout = typeof error === "object" && error && "stdout" in error ? String((error as { stdout?: string }).stdout ?? "") : "";
      if (stdout.includes('"axios"')) {
        errors.push("axios is banned but appears in npm ls output.");
      } else if (stdout.trim().length === 0) {
        warnings.push("Skipped npm ls axios verification because npm ls returned no JSON output.");
      }
    }
  } else {
    warnings.push("node_modules not found; skipped npm ls axios verification.");
  }

  return { errors, warnings };
}
