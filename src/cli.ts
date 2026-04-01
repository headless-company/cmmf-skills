#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runAgent, previewChangeSet } from "./agent/controller.js";
import { loadRepoGraph, summarizeRepo } from "./cmmf/repo.js";
import { renderManifest, renderModel } from "./cmmf/render.js";
import { formatCmmfSource, resolveCmmfSource } from "./cmmf/source.js";
import { createCmmfValidators, formatIssues } from "./cmmf/validate.js";
import { createProvider, resolveProviderName } from "./providers/index.js";
import type { ClarificationQuestion, RepoGraph } from "./types.js";
import { writeText } from "./utils/fs.js";

interface ParsedArgs {
  command: string | undefined;
  positionals: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index += 1;
  }
  return {
    command: positionals.shift(),
    positionals,
    flags,
  };
}

function getFlag(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === "string" ? value : undefined;
}

async function withPrompter<T>(callback: (rl: readline.Interface) => Promise<T>): Promise<T> {
  const rl = readline.createInterface({ input, output });
  try {
    return await callback(rl);
  } finally {
    rl.close();
  }
}

async function askYesNo(rl: readline.Interface, prompt: string, defaultValue = true): Promise<boolean> {
  const suffix = defaultValue ? " [Y/n] " : " [y/N] ";
  const answer = (await rl.question(`${prompt}${suffix}`)).trim().toLowerCase();
  if (!answer) {
    return defaultValue;
  }
  return ["y", "yes"].includes(answer);
}

async function answerClarifications(rl: readline.Interface, questions: ClarificationQuestion[]): Promise<Record<string, string>> {
  const answers: Record<string, string> = {};
  for (const question of questions) {
    output.write(`\nClarification needed: ${question.reason}\n`);
    if (question.inputType === "choice" && question.options && question.options.length > 0) {
      output.write(`${question.question}\n`);
      question.options.forEach((option, index) => {
        output.write(`  ${index + 1}. ${option}\n`);
      });
      const raw = (await rl.question("> ")).trim();
      const numeric = Number(raw);
      answers[question.id] =
        Number.isInteger(numeric) && numeric >= 1 && numeric <= question.options.length
          ? question.options[numeric - 1]
          : raw;
      continue;
    }
    answers[question.id] = (await rl.question(`${question.question}\n> `)).trim();
  }
  return answers;
}

async function handleGenerate(args: ParsedArgs): Promise<void> {
  const repoPath = path.resolve(getFlag(args, "repo") ?? process.cwd());
  const cmmfSource = await resolveCmmfSource(getFlag(args, "cmmf-repo"));
  const validators = await createCmmfValidators(cmmfSource);
  const instruction = args.positionals.join(" ").trim();
  if (!instruction) {
    throw new Error("Provide a natural-language instruction after `generate`.");
  }

  const repo = await loadRepoGraph(repoPath);
  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  await withPrompter(async (rl) => {
    let bootstrapManifest = false;
    if (!repo.manifestPath) {
      if (!isInteractive) {
        throw new Error("No manifest.yaml found. Re-run interactively to allow bootstrapping a new CMMF repository.");
      }
      bootstrapManifest = await askYesNo(rl, "No manifest.yaml found. Create one with ./models as the default model directory?");
    }

    const providerName = resolveProviderName(process.env, getFlag(args, "provider"));
    const provider = createProvider(providerName, process.env);
    const changeSet = await runAgent({
      provider,
      repo,
      instruction,
      modelOverride: getFlag(args, "model") ?? process.env.CMMF_AGENT_MODEL,
      bootstrapManifest,
      cmmfSource,
      validators,
      answerQuestions: (questions) => answerClarifications(rl, questions),
    });

    output.write(`\nCMMF source: ${formatCmmfSource(cmmfSource)}\n\n${previewChangeSet(repo, changeSet)}\n`);
    const shouldWrite = getFlag(args, "yes") === undefined ? await askYesNo(rl, "Write these changes to disk?") : true;
    if (!shouldWrite) {
      output.write("Skipped writing changes.\n");
      return;
    }

    await writeChangeSet(repo, changeSet);
    output.write("Changes written successfully.\n");
  });
}

async function handleInspect(args: ParsedArgs): Promise<void> {
  const repoPath = path.resolve(getFlag(args, "repo") ?? process.cwd());
  const repo = await loadRepoGraph(repoPath);
  const cmmfSource = await resolveCmmfSource(getFlag(args, "cmmf-repo"));
  output.write(`CMMF source: ${formatCmmfSource(cmmfSource)}\n${summarizeRepo(repo)}\n`);
}

async function handleValidate(args: ParsedArgs): Promise<void> {
  const repoPath = path.resolve(getFlag(args, "repo") ?? process.cwd());
  const repo = await loadRepoGraph(repoPath);
  const cmmfSource = await resolveCmmfSource(getFlag(args, "cmmf-repo"));
  const validators = await createCmmfValidators(cmmfSource);
  const issues: string[] = [];

  if (repo.manifestPath && repo.manifest) {
    const manifestIssues = validators.validateManifest(repo.manifest);
    if (manifestIssues.length > 0) {
      issues.push(`Manifest ${repo.manifestPath}\n${formatIssues(manifestIssues)}`);
    }
  } else {
    issues.push("Manifest not found.");
  }

  for (const modelFile of repo.modelFiles) {
    const modelIssues = validators.validateModel(modelFile.model);
    if (modelIssues.length > 0) {
      issues.push(`Model ${modelFile.path}\n${formatIssues(modelIssues)}`);
    }
  }

  if (issues.length > 0) {
    output.write(`${issues.join("\n\n")}\n`);
    process.exitCode = 1;
    return;
  }

  output.write(`Validated ${repo.modelFiles.length} model(s) successfully using ${formatCmmfSource(cmmfSource)}.\n`);
}

async function writeChangeSet(repo: RepoGraph, changeSet: Awaited<ReturnType<typeof runAgent>>): Promise<void> {
  if (changeSet.manifest) {
    const manifestPath = repo.manifestPath ?? path.join(repo.rootDir, "manifest.yaml");
    await writeText(manifestPath, renderManifest(changeSet.manifest));
  }

  for (const modelChange of changeSet.models) {
    const modelPath = repo.modelsById.get(modelChange.model.id)?.path ?? path.join(repo.modelsDir, `${modelChange.model.id}.yaml`);
    await writeText(modelPath, renderModel(modelChange.model));
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "generate":
      await handleGenerate(args);
      break;
    case "inspect":
      await handleInspect(args);
      break;
    case "validate":
      await handleValidate(args);
      break;
    case "help":
    case undefined:
      output.write(
        [
          "Usage:",
          "  cmmf-agent generate \"Create an article and author model\" [--repo path] [--cmmf-repo path] [--provider openai|anthropic] [--model model-id] [--yes]",
          "  cmmf-agent inspect [--repo path] [--cmmf-repo path]",
          "  cmmf-agent validate [--repo path] [--cmmf-repo path]",
        ].join("\n") + "\n",
      );
      break;
    default:
      throw new Error(`Unknown command: ${args.command}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  output.write(`${message}\n`);
  process.exitCode = 1;
});
