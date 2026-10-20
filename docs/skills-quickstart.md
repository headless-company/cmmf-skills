# Install and use CMMF Skills

CMMF Skills is the sole product workflow in this repository. The six skills and local tools require no additional provider credentials. Packaged execution is tested; installed-skill discovery and real modelling behaviour in Codex, Claude Code, and GitHub Copilot remain host evaluation work.

## Build and verify

Use the repository's reviewed Node/npm requirements and lockfile. No LLM provider credentials are needed for these commands.

```sh
npm ci
npm run check
```

The check builds, tests, verifies dependencies, assembles all six skills, and verifies the standalone packages. For a focused rebuild, use `npm run skills:package` followed by `npm run skills:verify`.

The test runner compiles TypeScript before running Node's tests; it does not depend on a native esbuild binary. Package building assembles JavaScript runtime dependencies and their license files, so installed skills need no npm installation. Generated outputs are ignored by Git.

## Install

Copy the desired complete directory from `release/skills/` into the host's project skill directory, or its personal skill directory. Each directory includes `SKILL.md`, references, a license, and local helpers. Do not copy only the development `skills/<name>/SKILL.md`.

| Coding host | Project destination | Personal destination |
| --- | --- | --- |
| Codex | `.agents/skills/<name>/` | `~/.agents/skills/<name>/` |
| Claude Code | `.claude/skills/<name>/` | `~/.claude/skills/<name>/` |
| GitHub Copilot | `.github/skills/<name>/` | `~/.copilot/skills/<name>/` |

For example, from this repository, install the author skill into a target project's Codex directory:

```sh
mkdir -p /path/to/project/.agents/skills
cp -R release/skills/cmmf-author /path/to/project/.agents/skills/
```

Inspect an existing destination before copying so local customisations are preserved. To update, replace only the installed version you own after preserving customisations. To uninstall, remove that skill's directory. No settings or credentials are modified by building or extracting the archive.

The full suite archive is `release/cmmf-skills.tar.gz`; `release/manifest.json` records file hashes. Direct skill-folder installation is the initial distribution path. Native plugin packaging is not implemented yet.

## Ask your agent

- “Use cmmf-discover to turn these workshop notes into a modelling brief.”
- “Use cmmf-author to create article, reusable author, and embedded SEO models.”
- “Use cmmf-validate to check this repository and repair errors supported by the requirements.”
- “Use cmmf-review to assess the customer-story model for editorial usability.”
- “Use cmmf-document to generate a catalogue and relationship diagram.”
- “Use cmmf-evolve to plan splitting customers out of stories.”

Use the host's native skill selector where available. The skill instructions tell the agent to resolve the source version, inspect files, apply authorised edits, and use local validation. Node 22+ is required for helpers. Git/network access is additionally needed for source retrieval. Host subscriptions, permissions, and usage limits still apply.

## Run tools directly during development

```sh
npm run build
npm run tools -- inspect --repo /path/to/model-repo --format json
npm run tools -- source --version latest --cache /path/to/source-cache --format json
npm run tools -- validate --repo /path/to/model-repo --cmmf-repo /path/from/source.root --format json
npm run tools -- document --repo /path/to/model-repo --cmmf-repo /path/from/source.root
npm run tools -- diff --before /path/to/before --after /path/to/after --cmmf-repo /path/from/source.root --format json
```

The source cache should be outside model directories. Existing projects use their declared version; new projects default to latest. Historical snapshots include a matching schema/spec/docs revision. `--offline` reuses an identified cache and does not verify latest freshness. Use an explicit local canonical checkout when appropriate; the helper rejects version mismatches instead of combining a historical spec with a current schema.

The current helpers recognise legacy `1`, `1.1.0`, and `1.2.0` semantics. Tests use synthetic historical fixtures; the canonical 1.2.0 checkout is also used for a manual integration check. Future versions can be read by the agent, but unsupported helper semantics are reported. Inspection retains raw data rather than stripping unfamiliar properties. Content-instance validation, content transfer, CMS import/export, native plugins, and host behavioural evaluation remain future work.

The old API-backed agent and `generate` command have been removed. See [migration notes](migration.md) for command/API changes. `cmmf-tools` is the local command entrypoint; natural-language model authoring runs through the installed host skills.
