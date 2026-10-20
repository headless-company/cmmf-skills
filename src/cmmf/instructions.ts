import { readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { pathExists, readText } from "../utils/fs.js";

export interface ProjectInstructionFile {
  path: string;
  relativePath: string;
  content: string;
}

const PROJECT_INSTRUCTION_FILENAMES = [
  "cmmf.instructions.md",
  "cmmf.instructions.txt",
  "cmmf.instructions.yaml",
  "cmmf.instructions.yml",
];
const PROJECT_INSTRUCTION_DIRECTORIES = [".cmmf", ".cmmf-agent"];
const MAX_PROJECT_INSTRUCTION_BYTES = 16_000;

export async function loadProjectInstructions(rootDir: string): Promise<ProjectInstructionFile[]> {
  const root = await realpath(rootDir);
  async function assertInside(candidate: string): Promise<void> {
    const relative = path.relative(root, await realpath(candidate));
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`Project instruction path resolves outside the repository: ${candidate}`);
    }
  }
  const filePaths = new Set<string>();

  for (const filename of PROJECT_INSTRUCTION_FILENAMES) {
    const candidate = path.join(rootDir, filename);
    if (await pathExists(candidate)) {
      await assertInside(candidate);
      filePaths.add(candidate);
    }
  }

  for (const directoryName of PROJECT_INSTRUCTION_DIRECTORIES) {
    const directoryPath = path.join(rootDir, directoryName);
    if (!(await pathExists(directoryPath))) {
      continue;
    }
    await assertInside(directoryPath);
    const files = await listYamlAndTextFiles(directoryPath);
    for (const filePath of files) {
      filePaths.add(filePath);
    }
  }

  const instructions = await Promise.all(
    [...filePaths]
      .sort((left, right) => left.localeCompare(right))
      .map(async (filePath) => {
        await assertInside(filePath);
        const content = (await readText(filePath)).trim();
        if (!content) {
          return null;
        }
        return {
          path: filePath,
          relativePath: path.relative(rootDir, filePath) || path.basename(filePath),
          content:
            content.length > MAX_PROJECT_INSTRUCTION_BYTES
              ? `${content.slice(0, MAX_PROJECT_INSTRUCTION_BYTES)}\n\n[File truncated for prompt size.]`
              : content,
        } satisfies ProjectInstructionFile;
      }),
  );

  return instructions.filter((instruction): instruction is ProjectInstructionFile => instruction !== null);
}

async function listYamlAndTextFiles(rootDir: string): Promise<string[]> {
  if (!(await pathExists(rootDir))) {
    return [];
  }

  const results: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && /\.(md|txt|ya?ml)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  try {
    await walk(rootDir);
  } catch {
    return [];
  }
  return results.sort();
}
