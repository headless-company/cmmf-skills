import path from "node:path";
import { renderManifest, renderModel } from "../cmmf/render.js";
import { summarizeRepo, selectRelevantModels } from "../cmmf/repo.js";
import type { CmmfSource } from "../cmmf/source.js";
import type { CmmfManifest, RepoGraph } from "../types.js";

export interface PromptContext {
  repo: RepoGraph;
  instruction: string;
  clarificationAnswers: Record<string, string>;
  bootstrapManifest: CmmfManifest | null;
  specContext: string;
  cmmfSource: CmmfSource;
}

export function buildSystemPrompt(): string {
  return [
    "You are a CMMF v1 content modeling agent.",
    "Return exactly one tool call per turn.",
    "Use request_clarification only when the instruction leaves a material ambiguity about object vs reference, relation cardinality or ownership, enum values, reuse of an existing model/object, or required/localisation defaults that would change the schema.",
    "Otherwise use submit_change_set.",
    "Generate valid CMMF v1 models only.",
    "When updating existing repos, preserve existing model IDs and structure. Only propose additive field updates, new relationships, and safe metadata enrichment.",
    "Never rename, remove, or rewrite existing models without explicit user approval.",
    "Prefer reusing an existing model or object when the repository already contains a clear match.",
    "Include practical editorial metadata and basic validations when they are strongly implied by the request.",
    "Keep governance and translationHints minimal unless explicitly requested.",
  ].join("\n");
}

export function buildUserPrompt(context: PromptContext): string {
  const relevantModels = selectRelevantModels(context.repo, context.instruction, 6);
  const relevantModelText = relevantModels.length
    ? relevantModels
        .map(
          ({ path: filePath, model }) =>
            `# ${path.relative(context.repo.rootDir, filePath)}\n${renderModel(model)}`,
        )
        .join("\n")
    : "No existing models were found.";

  const manifestText = context.repo.manifest
    ? renderManifest(context.repo.manifest)
    : context.bootstrapManifest
      ? renderManifest(context.bootstrapManifest)
      : "No manifest exists yet.";

  return [
    `User instruction:\n${context.instruction}`,
    "",
    `Repository summary:\n${summarizeRepo(context.repo, context.instruction)}`,
    "",
    `CMMF source:\n${context.cmmfSource.rootDir}`,
    "",
    `CMMF spec context:\n${context.specContext}`,
    "",
    `Manifest context:\n${manifestText}`,
    "",
    `Prior clarification answers:\n${JSON.stringify(context.clarificationAnswers, null, 2)}`,
    "",
    `Relevant existing models:\n${relevantModelText}`,
    "",
    "If no manifest exists and bootstrapping is available, you may include a manifest in the change set.",
    "For update operations, return the full resulting model definition, not a patch.",
  ].join("\n");
}
