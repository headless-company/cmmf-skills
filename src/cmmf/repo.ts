import path from "node:path";
import {
  manifestSchema,
  modelSchema,
  type CmmfManifest,
  type CmmfModel,
  type ParsedModelFile,
  type RepoGraph,
} from "../types.js";
import { pathExists, listYamlFiles, readText } from "../utils/fs.js";
import { toWords } from "../utils/strings.js";
import { parseYaml } from "../utils/yaml.js";

async function findManifestPath(rootDir: string): Promise<string | null> {
  for (const candidate of ["manifest.yaml", "manifest.yml"]) {
    const filePath = path.join(rootDir, candidate);
    if (await pathExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

function inferModelsDir(rootDir: string, manifest: CmmfManifest | null): string {
  return path.resolve(rootDir, manifest?.modelsPath ?? "./models");
}

export async function loadRepoGraph(rootDir: string): Promise<RepoGraph> {
  const absoluteRoot = path.resolve(rootDir);
  const manifestPath = await findManifestPath(absoluteRoot);
  const manifest = manifestPath
    ? manifestSchema.parse(parseYaml<CmmfManifest>(await readText(manifestPath)))
    : null;
  const modelsDir = inferModelsDir(absoluteRoot, manifest);
  const modelFiles = await loadModelFiles(modelsDir);
  const modelsById = new Map<string, ParsedModelFile>();
  const references: RepoGraph["references"] = [];
  const objectUsages: RepoGraph["objectUsages"] = [];

  for (const modelFile of modelFiles) {
    modelsById.set(modelFile.model.id, modelFile);
    for (const field of modelFile.model.fields) {
      if (field.type === "reference" && field.targets) {
        references.push({
          fromModelId: modelFile.model.id,
          fieldId: field.id,
          targets: field.targets,
        });
      }
      if (field.type === "object" && field.objectType) {
        objectUsages.push({
          fromModelId: modelFile.model.id,
          fieldId: field.id,
          objectType: field.objectType,
        });
      }
    }
  }

  return {
    rootDir: absoluteRoot,
    manifestPath,
    manifest,
    modelsDir,
    modelFiles,
    modelsById,
    references,
    objectUsages,
  };
}

export async function loadModelFiles(modelsDir: string): Promise<ParsedModelFile[]> {
  if (!(await pathExists(modelsDir))) {
    return [];
  }
  const files = await listYamlFiles(modelsDir);
  return Promise.all(
    files.map(async (filePath) => {
      const model = modelSchema.parse(parseYaml<CmmfModel>(await readText(filePath)));
      return { path: filePath, model };
    }),
  );
}

export function summarizeRepo(repo: RepoGraph, instruction?: string): string {
  const summaryLines = [
    `Root: ${repo.rootDir}`,
    `Manifest: ${repo.manifestPath ?? "not found"}`,
    `Models directory: ${repo.modelsDir}`,
    `Model count: ${repo.modelFiles.length}`,
  ];
  if (repo.manifest?.namespace) {
    summaryLines.push(`Namespace: ${repo.manifest.namespace}`);
  }
  if (repo.modelFiles.length > 0) {
    summaryLines.push("Models:");
    for (const modelFile of selectRelevantModels(repo, instruction, 8)) {
      const referenceFields = modelFile.model.fields.filter((field) => field.type === "reference").length;
      const objectFields = modelFile.model.fields.filter((field) => field.type === "object").length;
      summaryLines.push(
        `- ${modelFile.model.id} (${modelFile.model.kind}) fields=${modelFile.model.fields.length} refs=${referenceFields} objects=${objectFields}`,
      );
    }
  }
  return summaryLines.join("\n");
}

export function selectRelevantModels(repo: RepoGraph, instruction: string | undefined, limit: number): ParsedModelFile[] {
  if (!instruction) {
    return repo.modelFiles.slice(0, limit);
  }
  const instructionWords = new Set(toWords(instruction));
  return [...repo.modelFiles]
    .map((modelFile) => {
      const haystack = [
        modelFile.model.id,
        modelFile.model.name,
        modelFile.model.description ?? "",
        ...modelFile.model.fields.map((field) => `${field.id} ${field.name ?? ""} ${field.type}`),
      ]
        .join(" ")
        .toLowerCase();
      const score = [...instructionWords].reduce((total, word) => (haystack.includes(word) ? total + 1 : total), 0);
      return { modelFile, score };
    })
    .sort((left, right) => right.score - left.score || left.modelFile.model.id.localeCompare(right.modelFile.model.id))
    .slice(0, limit)
    .map((entry) => entry.modelFile);
}
