# Migrating from CMMF Creation Agent to CMMF Skills

The source cutover is complete as of 2026-10-20. The workspace package is `cmmf-skills` 0.2.0. The primary deliverables are complete skill directories and the suite archive, built with `npm run check` or `npm run skills:package`. The hosted repository is now [headless-company/cmmf-skills](https://github.com/headless-company/cmmf-skills). The npm workspace remains private; no npm package has been published.

## Existing Git checkouts

Update origin to the renamed repository:

```sh
git remote set-url origin git@github.com:headless-company/cmmf-skills.git
git remote -v
git fetch origin
```

For HTTPS checkouts, use `https://github.com/headless-company/cmmf-skills.git` instead. The repository name is **CMMF Skills**; this replaces the previous standalone-agent identity. Existing local directory names can stay as they are.

## Workflow changes

| Previous interface | Skills workflow |
| --- | --- |
| `cmmf-agent generate "..."` / `npm run generate` | Install `cmmf-author` and ask the host agent to create/edit models |
| `cmmf-agent inspect` / `npm run inspect` | `npm run tools -- inspect --repo PATH --format json`; the inspect alias also targets the new tool |
| `cmmf-agent validate` / `npm run validate` | Resolve the declared source version, then `npm run tools -- validate --repo PATH --cmmf-repo SOURCE --format json` |
| Provider and model flags/environment variables | The host agent selects its model and authenticates normally |
| An implicit sibling spec checkout or `CMMF_SPEC_REPO_PATH` | Retrieve a canonical snapshot with `source`, or pass an explicit local source directory |
| Mandatory interactive clarification/write prompts | Normal host conversation and authorised edits; material questions only |
| Provider-generated change-set tool calls | Host file edits, complete repository validation, and semantic before/after diff |

`cmmf-tools` replaces the old command binary. There is no compatibility `generate` command: generation is a host skill workflow. All local tool commands are noninteractive and work without provider API keys. Existing model repositories are not rewritten during this cutover.

The `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CMMF_AGENT_PROVIDER`, `CMMF_AGENT_MODEL`, and old implicit source environment setup are no longer used by this project. The credential template has been removed. Private local `.envrc`/`.env` files are left untouched and remain ignored; review them yourself if you want to remove obsolete settings. Keep credentials needed by other tools.

## Programmatic API

The old `runAgent`, provider factories/types, tool-call contracts, strict legacy model types, `loadRepoGraph`, renderer functions, and `resolveCmmfSource` interfaces are removed.

The new `src/index.ts` exports:

- `inspectRepository` and raw `Repository`, `ModelFile`, `Edge`, `Diagnostic`, and `Data` types.
- `acquireSource`, `readSource`, canonical remote, and source evidence/options types.
- `validateRepository` and supported helper versions.
- `semanticDiff` and `Change`.
- `documentRepository`.
- `loadProjectInstructions` and its instruction-file type.

Callers should move to the raw-data-preserving repository representation and pass a version-matched source explicitly. Use host edits for YAML authoring; there is no provider-backed generation API replacement. `.cmmf-agent/` convention files remain discoverable for existing projects alongside `.cmmf/` and `cmmf.instructions.*`.

## Build and dependency changes

The OpenAI/Anthropic SDKs, Zod-based agent contracts, `tsx`, esbuild, and provider-only dependencies are removed. AJV and YAML remain runtime dependencies; TypeScript and Node types are development dependencies. The lockfile is pruned without upgrading retained dependency versions.

Every build clears `dist/` before compiling so a retired `dist/cli.js`, agent loop, or provider adapter cannot survive in generated output. Rebuild any old checkout before packaging. The suite manifest includes the new product version and per-file hashes. `npm run check` exercises the full build/test/dependency/package verification path used by CI.

## Evaluation status

This cutover makes the skills the sole product path at the user's request. It does not establish new cross-host behavioural evidence. Packaged runtime checks and model/source tests remain separate from realistic installed-skill evaluation in Codex, Claude Code, and GitHub Copilot. Those evaluations and later CMS import/translation work remain in the [evaluation backlog](../evals/core-workflows.md).
