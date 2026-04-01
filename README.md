# CMMF Creation Agent

CLI agent for generating and updating [Content Model Master Format (CMMF)](/Users/djeglin/Projects/HeadlessCo/content-model-master-format/README.md) models from natural-language instructions.

## What It Does

- Generates valid CMMF v1 YAML for new or existing repositories
- Inspects an existing CMMF repo before proposing changes
- Asks clarifying questions only when the prompt leaves schema-shaping ambiguity
- Supports OpenAI and Anthropic behind one provider contract
- Previews the full change set before writing files
- Enforces dependency-policy checks, including a 7-day minimum package age and an `axios` ban
- Uses the canonical CMMF git repository as the schema/spec source instead of keeping a vendored schema copy

## Quick Start

### Requirements

- Node.js 22+
- npm 11.10+ or newer
- `direnv` recommended for project-local credentials
- An OpenAI API key and/or Anthropic API key

### Install

```bash
npm install
```

### Set Up Local Credentials With `direnv`

1. Install `direnv` for your machine.
2. Hook it into your shell.
   For `zsh`, add this to `~/.zshrc`:

```bash
eval "$(direnv hook zsh)"
```

3. Restart your shell or reload your profile.
4. In this repo, edit `.envrc` and add your key:

```bash
export OPENAI_API_KEY="your_openai_api_key_here"
export CMMF_AGENT_PROVIDER="openai"
export CMMF_SPEC_REPO_PATH="../content-model-master-format"
```

5. Allow the file:

```bash
direnv allow
```

The repo includes:

- `.envrc` for your local machine only
- `.envrc.example` as the public template for other users

If you prefer not to use `direnv`, you can still set variables inline per command.

## Common Commands

Inspect a repo:

```bash
npm run inspect -- --repo /path/to/cmmf-repo
```

Validate a repo:

```bash
npm run validate -- --repo /path/to/cmmf-repo
```

Generate models from a prompt:

```bash
npm run generate -- "Create a blog post model with reusable author profiles" --repo /path/to/cmmf-repo --provider openai
```

Run the full local verification suite:

```bash
npm run check
```

## How Generate Works

The `generate` command:

1. Loads `manifest.yaml` and the configured models directory.
2. Parses existing models into a repo graph of models, references, and object usage.
3. Builds a compact repo summary plus the most relevant existing models for the prompt.
4. Calls the selected LLM provider.
5. Asks clarifying questions only when the answer changes the schema.
6. Validates the returned manifest/models against local CMMF validation rules.
7. Blocks destructive updates such as field removal, type changes, or relationship rewrites.
8. Shows the full YAML preview and writes only after confirmation.

If no `manifest.yaml` exists, the CLI can bootstrap a new CMMF repo interactively.

## Provider Configuration

Supported environment variables:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `CMMF_AGENT_PROVIDER`
- `CMMF_AGENT_MODEL`
- `CMMF_SPEC_REPO_PATH`

Provider selection order:

1. `--provider`
2. `CMMF_AGENT_PROVIDER`
3. exactly one configured API key

If both providers are configured and no provider is selected, the CLI stops and asks you to choose.

CMMF spec resolution order:

1. `--cmmf-repo`
2. `CMMF_SPEC_REPO_PATH`
3. sibling checkout at `../content-model-master-format`

The expected upstream repo is [headless-company/content-model-master-format](https://github.com/headless-company/content-model-master-format).

Default model intent:

- OpenAI: lighter model for clarification, stronger model for synthesis
- Anthropic: Sonnet by default, with Opus reserved as an explicit deeper-reasoning override

## Dependency Security Policy

This repo intentionally adds supply-chain constraints:

- `.npmrc` sets `min-release-age=7`
- `.npmrc` sets `ignore-scripts=true`
- `package-lock.json` is the reviewed lockfile
- `npm run deps:verify` fails if `axios` appears in the lockfile or installed dependency graph

CI enforces these checks on every push and pull request.

## Project Structure

- [src/cli.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/cli.ts): command entrypoint
- [src/agent/controller.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/agent/controller.ts): orchestration loop
- [src/cmmf/repo.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/cmmf/repo.ts): repo discovery and graph building
- [src/cmmf/source.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/cmmf/source.ts): CMMF spec repository resolution and loading
- [src/cmmf/validate.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/cmmf/validate.ts): manifest/model validation
- [src/cmmf/safety.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/cmmf/safety.ts): destructive-change guardrails
- [src/providers](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/providers): OpenAI and Anthropic adapters
- [src/security/dependency-policy.ts](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/src/security/dependency-policy.ts): dependency verification

## Documentation

For fuller implementation and release notes, see:

- [docs/project-guide.md](/Users/djeglin/Projects/HeadlessCo/cmmf-creation-agent/docs/project-guide.md)

## Current Limitations

- The CLI requires API keys; it does not support ChatGPT Pro or Claude Pro account login flows.
- The agent is CMMF-only in v1; it does not translate to CMS-specific schemas.
- The tool relies on interactive terminal prompts for clarification and final write confirmation.
