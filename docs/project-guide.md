# Project Guide

## Purpose

The CMMF Creation Agent is a CLI-first developer tool that converts natural-language content modeling requests into valid CMMF v1 YAML. It is designed for two primary modes:

- greenfield generation in a new CMMF repository
- safe extension of an existing CMMF repository

The core product goal is to preserve modeling intent while keeping the resulting output deterministic, reviewable, and valid against the CMMF spec.

## User Workflow

### Inspect

`inspect` summarizes the target repository:

- repo root
- manifest path
- models directory
- model count
- model inventory with relationship/object density

This is useful for quickly understanding an existing CMMF repo before generating changes.

### Validate

`validate` checks:

- manifest structure against the local manifest rules
- each model against the canonical CMMF v1 model schema loaded from a CMMF repo checkout plus stricter runtime validation

The command exits non-zero on validation failure.

### Generate

`generate` is the primary workflow:

1. Discover the target repo.
2. Load the manifest and models.
3. Build a repo graph with:
   - existing models by ID
   - reference relationships
   - object embeddings
4. Rank the most relevant existing models for the current prompt.
5. Send a compact but high-signal prompt to the chosen provider.
6. Receive either:
   - `request_clarification`
   - `submit_change_set`
7. Validate the proposed manifest/models.
8. Enforce safe-update rules on existing models.
9. Preview the full YAML change set.
10. Write only after explicit confirmation.

## Clarification Policy

The agent should only ask follow-up questions when the answer materially changes the resulting schema. The current implementation is designed around these ambiguity classes:

- `object` versus `reference`
- relationship `cardinality`
- relationship `ownership`
- reuse of an existing model versus creating a new one
- enum values
- required/localisation behavior when the prompt implies it but does not define it clearly

## Safety Rules For Existing Repositories

When updating an existing model, the agent currently blocks:

- model kind changes
- field removal
- field type changes
- `list` flag changes
- `objectType` changes
- requiredness changes from optional to required
- target removal or target replacement for reference fields
- relationship `cardinality` changes
- relationship `ownership` changes

This keeps v1 biased toward additive, reviewable changes instead of autonomous refactors.

## Authentication

### Supported

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

### Recommended Local Setup

Use `direnv` with a repo-local `.envrc`:

```bash
export OPENAI_API_KEY="your_openai_api_key_here"
export CMMF_AGENT_PROVIDER="openai"
export CMMF_SPEC_REPO_PATH="../content-model-master-format"
```

Then run:

```bash
direnv allow
```

Why this approach is recommended:

- credentials stay local to this repository
- no global shell profile changes are required
- `.envrc` is gitignored
- `.envrc.example` documents the expected shape for contributors

### Not Supported

- ChatGPT Pro login as a substitute for API access
- Claude subscription login as a substitute for API access

## Provider Architecture

The provider layer is intentionally split into:

- a shared agent contract in the runtime types
- one adapter for OpenAI
- one adapter for Anthropic

Each provider must return one of two high-level outcomes:

- `request_clarification`
- `submit_change_set`

This keeps the CLI and safety logic independent from any one model vendor.

## CMMF Runtime Architecture

### Parsing And Graphing

`src/cmmf/repo.ts` loads the manifest and all YAML model files, then builds a graph containing:

- the manifest and models directory
- parsed models
- references from one model to others
- object embeddings

### Validation

`src/cmmf/validate.ts` combines:

- the JSON schema loaded directly from the configured CMMF spec repository
- stricter Zod-based runtime checks

`src/cmmf/source.ts` resolves the CMMF repository in this order:

- `--cmmf-repo`
- `CMMF_SPEC_REPO_PATH`
- sibling checkout at `../content-model-master-format`

The intended upstream repository is [headless-company/content-model-master-format](https://github.com/headless-company/content-model-master-format).

### Rendering

`src/cmmf/render.ts` outputs deterministic YAML with a stable property order so diffs remain readable.

### Safety

`src/cmmf/safety.ts` checks whether returned updates are additive and safe before any write happens.

## Dependency Security

This project intentionally adds stronger-than-default supply-chain controls.

### Repository Policy

- `packageManager` pins npm 11
- `.npmrc` sets `min-release-age=7`
- `.npmrc` sets `ignore-scripts=true`
- `package-lock.json` is the reviewed lockfile

### Verification

Run:

```bash
npm run deps:verify
```

This verifies:

- `min-release-age=7` is still present
- `ignore-scripts=true` is still present
- npm 11 is still pinned in `package.json`
- `axios` does not appear in `package-lock.json`
- `axios` does not appear in the installed dependency graph

## Testing

Current automated coverage includes:

- repo discovery and graphing
- relevance-aware repo summaries
- clarification loop behavior
- destructive update rejection
- dependency-policy verification

Run tests with:

```bash
npm test
```

Run everything with:

```bash
npm run check
```

## Release Notes For Public Users

If this repo is published publicly, the minimum onboarding path should be:

1. install Node and npm versions that satisfy the repo policy
2. install dependencies with `npm install`
3. configure `.envrc`
4. run `direnv allow`
5. run `npm run inspect` or `npm run generate`

Documentation that should stay current before release:

- README command examples
- provider auth setup
- CMMF spec repo setup
- dependency-security expectations
- current limitations
- example prompts for `generate`

## Known Environment Caveat

The repository is pinned to npm 11.x features, including `min-release-age`. If a local machine is still on npm 10.x, dependency installation may fail until npm is upgraded to a reviewed npm 11 release.
