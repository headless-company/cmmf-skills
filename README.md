# CMMF Skills

Portable skills for discovering, creating, validating, reviewing, documenting, and evolving [Content Model Master Format (CMMF)](https://github.com/headless-company/content-model-master-format) models using your existing coding agent.

Your agent supplies reasoning, authentication, conversation, and file editing. This repository supplies CMMF workflows, canonical source retrieval, and deterministic local tools. No additional LLM API keys are required; your host's normal access requirements and usage limits apply.

## Skills

| Skill | Use it to |
| --- | --- |
| `cmmf-discover` | Turn briefs and workshop notes into modelling decisions and material questions |
| `cmmf-author` | Create or extend models while respecting existing structures and conventions |
| `cmmf-validate` | Check canonical schema compliance and relationships across a repository |
| `cmmf-review` | Assess content architecture and editorial usability |
| `cmmf-document` | Generate model catalogues, field dictionaries, and Mermaid diagrams |
| `cmmf-evolve` | Analyse changes, dependent models, and migration/backfill needs |

## Build and install

Contributors need Node.js 22+ and the pinned npm 11 version in `package.json`.

```sh
npm ci
npm run check
```

The check builds the tools, runs tests and dependency checks, assembles all six complete skill directories, and verifies them in isolation. Outputs:

- `release/skills/<skill-name>/`: independently installable skill, references, and local runtime.
- `release/cmmf-skills.tar.gz`: complete suite archive.
- `release/manifest.json`: package version and file hashes.

Copy a complete skill directory into your host's project or personal skill directory. For a Codex project, for example:

```sh
mkdir -p /path/to/project/.agents/skills
cp -R release/skills/cmmf-author /path/to/project/.agents/skills/
```

Use the [installation guide](docs/skills-quickstart.md) for Codex, Claude Code, and GitHub Copilot destinations, updates, and invocation examples. The development `skills/` folders are inputs to packaging; install the assembled folders under `release/skills/` so references and helpers are present.

Then ask your host: “Use cmmf-author to create article models with reusable authors and embedded SEO metadata.” Installed helpers require Node.js 22+; they need no npm installation in the target repository. Git and permitted network access are needed to retrieve canonical CMMF sources.

## CMMF versions and local tools

Skills retrieve the latest published/current canonical source for new projects and the manifest-declared version for existing projects. Explicit version requests are honoured without silently upgrading models. Source snapshots record the revision and schema/spec hashes; exact versions can be reused offline, while cached latest cannot establish current freshness.

Run the local tools after building:

```sh
npm run tools -- inspect --repo /path/to/model-repo --format json
npm run tools -- source --version latest --cache /path/to/source-cache --format json
npm run tools -- validate --repo /path/to/model-repo --cmmf-repo /path/from/source.root --format json
npm run tools -- document --repo /path/to/model-repo --cmmf-repo /path/from/source.root
npm run tools -- diff --before /path/to/before --after /path/to/after --cmmf-repo /path/from/source.root --format json
```

The command entrypoint is `cmmf-tools` (`dist/tools/cli.js`). The tools read model repositories; authorised edits are performed by the host agent. Diagnostics cover parse/schema failures, duplicate IDs, missing reference/object/rich-text targets, project instruction discovery, and semantic change impact. They do not validate stored content instances or execute content migrations.

Project conventions remain supported in `cmmf.instructions.{md,txt,yaml,yml}`, `.cmmf/`, and legacy `.cmmf-agent/`. See the [project guide](docs/project-guide.md).

## Status and migration

The repository has completed its source cutover from standalone agent to skills. The old `cmmf-agent generate` command, provider adapters, provider configuration, and API-key setup have been removed. See [migration notes](docs/migration.md) for command and API changes. The hosted repository has not been renamed or published by this change; this private npm workspace builds the distributable skill archive.

Standalone package execution and local tools are tested. Installed-skill discovery and realistic modelling behaviour in each target host remain evaluation work; native plugin packaging and CMS import/translation are not implemented. See [evaluation cases](evals/core-workflows.md) and [implementation progress](docs/implementation-progress.md).

Supply-chain controls remain in place: a reviewed lockfile, seven-day minimum package age, disabled install scripts, and dependency-policy verification including the existing `axios` ban.
