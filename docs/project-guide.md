# CMMF Skills project guide

This repository develops portable CMMF skills and local tools. The host agent owns reasoning, conversation, authentication, permissions, and model-file editing. There is no standalone LLM loop or provider setup.

## Architecture

- `skills/`: six focused `SKILL.md` source entrypoints.
- `references/`: maintained workflow/source/tool references assembled into each released skill.
- `src/tools/repository.ts`: tolerant, raw-data-preserving inspection and model relationship graph.
- `src/tools/source.ts`: canonical source acquisition, historical revision resolution, caching, and evidence.
- `src/tools/validate.ts`: version-matched JSON Schema validation and cross-model checks.
- `src/tools/diff.ts`: additive/breaking/uncertain changes and dependent-model impact.
- `src/tools/document.ts`: catalogues and diagrams derived from the graph.
- `src/tools/cli.ts`: noninteractive `cmmf-tools` commands.
- `src/cmmf/instructions.ts`: shared convention-file discovery.
- `src/index.ts`: provider-free programmatic API.
- `scripts/`: clean build, portable test execution, dependency checks, and skill packaging/verification.
- `evals/`: host behavioural evaluation requests and acceptance criteria.

## Development workflow

```sh
npm ci
npm run check
```

`check` builds from a clean `dist/`, compiles/runs Node tests, verifies dependency policy, packages skills, and checks standalone execution. Use `npm run build`, `npm test`, `npm run skills:package`, and `npm run skills:verify` for focused work. Run `npm run deps:verify` after building. `npm run clean` removes derived build/test/release output while preserving source caches in `.tmp/`.

Build products include only the current runtime; stale agent/provider entrypoints are removed before compilation. TypeScript compilation does not depend on native esbuild or `tsx`. Packaging includes reviewed JavaScript dependencies and their licenses, so installed skills require Node but no package installation in a model project. The npm workspace is private; skill folders/archive are the current distribution artefacts.

## Model and source contracts

New models default to the latest published/current canonical CMMF source; existing models retain their manifest version. Numeric legacy `1` is resolved explicitly, rather than interpreted as latest 1.x. The skill instructs its host to retrieve the required source and read its normative spec and relevant docs. Tools require a version-matched source directory and expose the actual source revision/hashes.

Source acquisition uses a versioned cache outside model directories. Exact cached versions can be reused; `latest` checks upstream unless offline is explicit. Modified cached schemas/specs are rejected. No sibling checkout or environment variable is assumed. A local source can be supplied explicitly without switching or updating its branch.

Inspection preserves unknown raw data and aggregates parse errors. Validation adds schema checks, duplicate model/field ID detection, missing reference/object/rich-text embed targets, object target kind, and editorial label-field checks. Unsupported future helper semantics are reported rather than presented as fully validated. Linked cycles are not universally rejected.

Semantic diff considers effective manifest defaults, canonical repeatability and legacy aliases, removed/added values and targets, structure/ownership changes, metadata uncertainty, and transitive dependents. Constraint changes can require content sampling/backfill even when schema YAML is valid. The tools never claim to have migrated stored content.

## Project-specific modelling conventions

The skills/tooling retain these discovery locations:

- `cmmf.instructions.md`, `.txt`, `.yaml`, or `.yml` at the model repository root.
- Text/Markdown/YAML files inside `.cmmf/` or legacy `.cmmf-agent/`.

For example: require `internal_name`, reuse existing author identities, or explain project-local localisation defaults. These are convention directories, not model storage. Keep guidance concrete and short; inspect output bounds individual instruction content and identifies truncation. Read original files if more context is needed. Explicit user requests take precedence, and conflicts with canonical validity must be explained.

## Tool outputs and edits

Commands support JSON diagnostics and documented exit codes: 0 success, 1 invalid data or breaking/uncertain diff, 2 usage/source/execution failure. See [local tool reference](../references/local-tools.md) for flags and output semantics.

Model inputs are read-only. Use the host editor for requested changes, preserving comments, IDs, unrelated files, and existing work. For consequential breaking decisions not already authorised, prepare the diff and impact assessment before asking for the missing decision. Do not add the retired CLI's mandatory terminal confirmation to ordinary edits.

## Packaging and evaluation

The complete release directory is independently installable. No released reference or helper may depend on this checkout or another installed skill. The verifier checks release hashes, YAML metadata, local references, isolated inspect/validate/document/diff execution, and absence of obsolete generated entrypoints. CI uses the same `npm run check` path.

Installed-skill discovery and modelling quality still require the [host evaluation cases](../evals/core-workflows.md). Helper execution alone does not establish host behaviour. See [installation](skills-quickstart.md), [migration](migration.md), and [progress](implementation-progress.md) for release boundaries.
