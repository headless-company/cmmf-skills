import path from "node:path";
import { MAX_AGENT_TURNS } from "../config.js";
import { renderManifest, renderModel } from "../cmmf/render.js";
import { assertSafeModelChange } from "../cmmf/safety.js";
import { loadSpecExcerpt, type CmmfSource } from "../cmmf/source.js";
import type { CmmfValidators } from "../cmmf/validate.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompt.js";
import { modelIdFromName } from "../utils/strings.js";
import type { AgentProvider } from "../providers/base.js";
import type { ChangeSet, ClarificationQuestion, CmmfManifest, RepoGraph } from "../types.js";

export interface RunAgentOptions {
  provider: AgentProvider;
  repo: RepoGraph;
  instruction: string;
  modelOverride?: string;
  bootstrapManifest: boolean;
  cmmfSource: CmmfSource;
  validators: CmmfValidators;
  answerQuestions: (questions: ClarificationQuestion[]) => Promise<Record<string, string>>;
}

export async function runAgent(options: RunAgentOptions): Promise<ChangeSet> {
  const clarificationAnswers: Record<string, string> = {};
  const bootstrapManifest = options.bootstrapManifest ? createBootstrapManifest(options.repo.rootDir) : null;
  const specContext = await loadSpecExcerpt(options.cmmfSource);

  for (let turnNumber = 0; turnNumber < MAX_AGENT_TURNS; turnNumber += 1) {
    const phase = Object.keys(clarificationAnswers).length > 0 ? "synthesis" : "clarification";
    const result = await options.provider.runTurn({
      instruction: options.instruction,
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt({
        repo: options.repo,
        instruction: options.instruction,
        clarificationAnswers,
        bootstrapManifest,
        specContext,
        cmmfSource: options.cmmfSource,
      }),
      phase,
      modelOverride: options.modelOverride,
    });

    if (result.type === "request_clarification") {
      const answers = await options.answerQuestions(result.questions);
      Object.assign(clarificationAnswers, answers);
      continue;
    }

    const finalized = finalizeChangeSet(options.repo, result.changeSet, bootstrapManifest);
    validateChangeSet(options.repo, finalized, options.validators);
    return finalized;
  }

  throw new Error(`Agent did not complete within ${MAX_AGENT_TURNS} turns.`);
}

export function previewChangeSet(repo: RepoGraph, changeSet: ChangeSet): string {
  const lines = [changeSet.summary, ""];
  if (changeSet.rationale.length > 0) {
    lines.push("Rationale:");
    lines.push(...changeSet.rationale.map((item) => `- ${item}`));
    lines.push("");
  }
  if (changeSet.warnings.length > 0) {
    lines.push("Warnings:");
    lines.push(...changeSet.warnings.map((item) => `- ${item}`));
    lines.push("");
  }
  if (changeSet.manifest) {
    lines.push(`Manifest -> ${path.relative(repo.rootDir, repo.manifestPath ?? path.join(repo.rootDir, "manifest.yaml")) || "manifest.yaml"}`);
    lines.push(renderManifest(changeSet.manifest).trimEnd());
    lines.push("");
  }
  for (const modelChange of changeSet.models) {
    const targetPath = repo.modelsById.get(modelChange.model.id)?.path ?? path.join(repo.modelsDir, `${modelChange.model.id}.yaml`);
    lines.push(`${modelChange.operation.toUpperCase()} ${path.relative(repo.rootDir, targetPath)}`);
    lines.push(`Reason: ${modelChange.reason}`);
    lines.push(renderModel(modelChange.model).trimEnd());
    lines.push("");
  }
  return lines.join("\n");
}

function createBootstrapManifest(rootDir: string): CmmfManifest {
  return {
    specVersion: 1,
    namespace: `local.${modelIdFromName(path.basename(rootDir)) || "content_model"}`,
    modelsPath: "./models",
    defaults: {
      required: false,
      localisation: false,
    },
  };
}

function finalizeChangeSet(repo: RepoGraph, changeSet: ChangeSet, bootstrapManifest: CmmfManifest | null): ChangeSet {
  if (!repo.manifest && bootstrapManifest && !changeSet.manifest) {
    return {
      ...changeSet,
      manifest: bootstrapManifest,
    };
  }
  return changeSet;
}

function validateChangeSet(repo: RepoGraph, changeSet: ChangeSet, validators: CmmfValidators): void {
  if (changeSet.manifest) {
    validators.assertManifestValid(changeSet.manifest);
  }
  for (const modelChange of changeSet.models) {
    validators.assertModelValid(modelChange.model);
    assertSafeModelChange(repo, modelChange);
  }
}
