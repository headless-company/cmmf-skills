# CMMF Skills: documentation-site handover

Prepared: 20 October 2026; version-support guidance updated 22 October 2026. Audience: the documentation implementer, a new modeller, and the technical/content architecture lead evaluating adoption.

**Purpose:** update the CMMF documentation site for the completed move to `headless-company/cmmf-skills` and the replacement of the standalone creation agent with six independently installable skills. This file includes the user-facing documentation substance, site change inventory, operational contracts, and acceptance criteria. It is a handover for site implementation; the website has not been changed by preparing it.

## Contents

1. [Evidence and source ownership](#1-evidence-and-source-ownership)
2. [What changed and how to explain it](#2-what-changed-and-how-to-explain-it)
3. [Website implementation and link migration](#3-website-implementation-and-link-migration)
4. [Installation, updates, and first use](#4-installation-updates-and-first-use)
5. [Shared workflow and version rules](#5-shared-workflow-and-version-rules)
6. [Full skill documentation](#6-full-skill-documentation)
7. [Worked journeys](#7-worked-journeys)
8. [Deterministic tool reference](#8-deterministic-tool-reference)
9. [Team adoption and assurance](#9-team-adoption-and-assurance)
10. [Troubleshooting](#10-troubleshooting)
11. [Implementation sequence and completion criteria](#11-implementation-sequence-and-completion-criteria)
12. [Maintaining the documentation](#12-maintaining-the-documentation)
13. [Verification recorded for this handover](#13-verification-recorded-for-this-handover)

## 1. Evidence and source ownership

### Baselines inspected

| Item | Inspected baseline |
| --- | --- |
| Skills source | `https://github.com/headless-company/cmmf-skills` |
| Skills Git revision | `68ec28d3993eb08298ebf9a896f6a9d51b425bf0` |
| Skills workspace version | `0.2.0`, private npm workspace |
| Skills initial worktree | Clean before this handover was added |
| Docs site | `headless-company/cmmf-docs-web` |
| Docs Git revision | `2da7154f79046716ef37d4d0fdc2cbb54e72d6ef` |
| Docs initial worktree | Clean; read-only inspection for this task |
| Website stack | Astro/Starlight, static output, Cloudflare Pages configuration |
| Existing site tool evidence | October 14 working-tree snapshot at base `53cf3928e1a08c724dab0cf58098485c5d7de2bb`, recorded under the former repository name |

The local checkouts establish these facts. Remote release availability, production deployment, and current hosted-page contents were not audited for this handover. Do not infer a published npm package or downloadable GitHub release from the workspace version or generated archive. Recheck availability before adding a download CTA.

Use this immutable source base to reproduce the implementation described here:

`https://github.com/headless-company/cmmf-skills/blob/68ec28d3993eb08298ebf9a896f6a9d51b425bf0/`

The site implementation can use `main` for ordinary repository navigation, but capability/evaluation evidence should identify a full revision and hashes. This handover itself is a new working-tree document based on the revision above.

### Read these source files

All paths in this table are relative to the Skills source repository. They are available at the immutable base above and can be fetched without any adjacent checkout.

| Source | Authority for |
| --- | --- |
| `README.md`, `package.json`, `.nvmrc`, `.npmrc` | Identity, requirements, build commands, distribution status and dependency policy |
| `docs/skills-quickstart.md` | Installation, invocation, updates and runtime requirements |
| `docs/migration.md` | Removed commands, provider setup, Git remote changes and API breakage |
| `docs/project-guide.md` | Architecture, conventions and developer workflow |
| `skills/<name>/SKILL.md` | Each skill's instructions and boundaries |
| `references/source-resolution.md` | Selecting and retrieving canonical CMMF source |
| `references/local-tools.md` | Installed helper use and diagnostics |
| `references/modelling-decisions.md` | Practitioner guidance, distinct from normative format rules |
| `src/tools/{cli,repository,source,validate,diff,document}.ts` | Actual command and output behaviour |
| `scripts/package-skills.mjs`, `scripts/verify-skills.mjs` | Package composition, hashes and isolated runtime verification |
| `src/tools/toolkit.test.ts`, `src/security/dependency-policy.test.ts` | Automated coverage and its limits |
| `evals/core-workflows.md` | Realistic host evaluation cases; currently pending |
| `docs/implementation-progress.md` | Dated historical evidence; earlier milestones are not the current test count |
| `.github/workflows/ci.yml` | Intended CI checks; inspecting configuration is not a live CI result |

### Repository boundaries

| Repository | Owns |
| --- | --- |
| `content-model-master-format` | Normative CMMF specification, schemas, translation contracts and canonical examples |
| `cmmf-skills` | Skill workflows, shared references, deterministic helpers, packages and skill evaluation evidence |
| `cmmf-docs-web` | Public explanations, tutorials, navigation, search, site examples and deployment |
| `cmmf-branding` | Canonical artwork, brand tokens and usage guidance |
| `cmmf-visual-editor` | The separate editor application; retain the site's existing publication hold |

“Everything moved under cmmf-skills” refers to the former agent's workflows and tools. It does not move the normative specification or website into this repository. Keep `vendor/cmmf/` and `vendor/cmmf-beta/` read-only in the site. Refresh them only through the site's explicit source-sync process with an exact version and full revision. Updating Skills evidence does not require changing the format pin.

## 2. What changed and how to explain it

### Suggested public overview copy

> CMMF Skills adds six content-modelling workflows to your existing coding agent: discover, author, validate, review, document and evolve. The agent reads your brief and model files, follows the installed workflow, and uses local tools to check the result. Your usual host provides the conversation, authentication, permissions and file editing. CMMF Skills supplies the CMMF guidance, canonical source retrieval and deterministic checks.
>
> Install complete packaged skill directories built from the source repository. The helpers need Node.js 22 or newer, and source retrieval needs Git and permitted network access. No additional LLM provider API key is required; your host's usual subscription, usage limits and access rules still apply.
>
> New projects use the latest published/current canonical CMMF source unless you request another version. Existing projects retain their manifest-declared version. Each modelling handoff should identify the source revision and the checks actually performed.

Keep public copy precise and practitioner-led. Explain the modelling need before tooling. The following distinctions must remain visible near installation and validation, rather than being buried in a limitations page.

| Previous workflow | Current workflow | Documentation consequence |
| --- | --- | --- |
| Standalone CMMF Creation Agent | Skills used inside an existing coding host | Replace standalone-agent onboarding with host skill installation and task prompts |
| `cmmf-agent generate "..."`, `npm run generate` | Ask the host to use `cmmf-author` | No replacement `generate` CLI exists |
| Provider adapters and project API-key setup | Host authentication and model selection | Remove provider-key setup as a CMMF prerequisite |
| Provider configuration flags/environment variables | Host's own configuration | Do not invent equivalent `cmmf-tools` provider flags |
| Implicit sibling spec repo or `CMMF_SPEC_REPO_PATH` | Retrieved snapshot or explicitly passed source directory | Show source selection and `--cmmf-repo` in tool examples |
| Terminal clarification/write-confirmation loop | Normal host conversation and scoped authorised edits | Material unresolved modelling decisions need answers; ordinary requested edits have no extra CMMF confirmation gate |
| Provider-generated change-set calls | Host edits followed by validation and semantic diff | Teach readers to review files, evidence and impact |
| Old repository links | `headless-company/cmmf-skills` | Update active source, issue, clone, edit and contribution links |
| Standalone package assumptions | Complete skill folders and suite archive built locally | Do not advertise npm install, npx execution, a marketplace plugin or an unverified hosted archive |

Removed environment variables include `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CMMF_AGENT_PROVIDER`, `CMMF_AGENT_MODEL` and the old implicit source-path setup. They are no longer used by this project. Do not tell users to delete shared credentials blindly: other tools may use them. Existing private `.env`/`.envrc` files are left untouched.

`.cmmf-agent/` remains a supported legacy convention directory. Its continued presence does not mean the agent runtime still exists. Existing model YAML is not rewritten by the repository rename or skill installation.

### Status wording

Use: “Six packaged skills and deterministic helpers are implemented. Automated helper and standalone-package checks pass at the recorded baseline. Installed-skill discovery and realistic modelling behaviour in Codex, Claude Code and GitHub Copilot remain to be evaluated.”

Do not upgrade that statement to “fully supported in all three hosts” because their products support skills. Native plugin packaging, CMS schema import/translation, content-instance validation and executing live content migrations are outside the implemented product.

The suite's `0.2.0` version is independent of the CMMF specification version. The helpers recognise legacy `1`, `1.1.0`, `1.2.0`, `1.2.1` and `1.3.0-beta.1` semantics. Explicit prerelease retrieval and offline caches are supported. Beta hints receive schema and semantic declaration checks, appear in documentation and are tracked in diffs; content evaluation and expression execution are not implemented. Other versions still report unsupported semantics. The original beta tag predates the camel-case fix merged into the beta branch; preserve the selected schema's rules and record its exact revision and hashes.

## 3. Website implementation and link migration

### Recommended information architecture

Retain the two existing public URLs. Add child pages instead of concentrating every workflow in one installation page. The following new routes are proposals, not existing published destinations.

| Public route | Site source under `src/content/owned/` | Content to implement |
| --- | --- | --- |
| `/tools/` | `tools/index.md` | Overview copy, task-to-skill chooser, source link, status and route into installation |
| `/tools/skills/` | `tools/skills.md` | Full build/install/update/uninstall procedure; first successful bounded task; host paths and status |
| `/tools/skills/discover/` | `tools/skills/discover.md` | Discover documentation from section 6 |
| `/tools/skills/author/` | `tools/skills/author.md` | Author documentation from section 6 |
| `/tools/skills/validate/` | `tools/skills/validate.md` | Validate documentation from section 6 |
| `/tools/skills/review/` | `tools/skills/review.md` | Review documentation from section 6 |
| `/tools/skills/document/` | `tools/skills/document.md` | Document documentation from section 6 |
| `/tools/skills/evolve/` | `tools/skills/evolve.md` | Evolve documentation from section 6 |
| `/tools/skills/workflows/` | `tools/skills/workflows.md` | Worked journeys, prompts and output contracts from section 7 |
| `/tools/skills/sources-and-versions/` | `tools/skills/sources-and-versions.md` | Canonical-source selection, cache/offline behaviour, supported versions and provenance |
| `/tools/skills/local-tools/` | `tools/skills/local-tools.md` | Commands, actual output shapes, exit codes and direct execution |
| `/tools/skills/team-adoption/` | `tools/skills/team-adoption.md` | Suitability, trial protocol, evidence template, acceptance and CI integration |
| `/tools/skills/migration/` | `tools/skills/migration.md` | Standalone-agent retirement, Git links/remotes and programmatic breakage |
| `/tools/skills/troubleshooting/` | `tools/skills/troubleshooting.md` | Diagnosis and recovery from section 10 |

Use a “CMMF Skills” sidebar group with Installation, Workflows, the six skill pages, Sources and versions, Local tools, Team adoption, Migration and Troubleshooting. Keep the format learning journey first in the site's overall navigation. Every skill page should link to installation, sources/versions, its relevant companion workflow and team acceptance criteria. Each should include purpose, inputs, example prompt, steps, outputs, success checks and limits.

Add entries in `content-map.json` for every new route, with `owner: site`, `role: site-authored`, a meaningful description, and an implemented status only once built. Match the site's existing inventory schema. Tool suite version belongs in tool evidence; do not populate `sourceVersion` with `0.2.0` as though it were a format edition. Avoid making these version-independent tool pages duplicate under each specification edition.

### Concrete change inventory from the inspected site

| Existing file/location | Required change |
| --- | --- |
| `src/content/owned/tools/index.md` | Replace old repo URL; replace October 14 working-tree-only explanation with the current pinned source/evidence statement; explain the host/skill/helper split and six workflows |
| `src/content/owned/tools/skills.md` | Replace old repo URL and `53cf3928` installation rationale; document source build from the new repo and complete-folder install; remove redundant package/verify reruns after `npm run check`; link to individual skill pages |
| `src/content/owned/contributing.md` | Change the Skills contribution destination to the new repo; format issues still go to the specification repo |
| `src/pages/index.astro` | Review “Skills development release” card text against current status; keep it modest and linked to `/tools/`; do not imply cross-host certification |
| `src/content/owned/docs/index.md` | Update tool status wording and link into the new overview/journeys |
| `src/content/owned/docs/guides/visualisation.mdx` | Describe validated generated views and link to Document; retain YAML as authority and document omitted scope |
| `src/content/owned/docs/guides/validation.md` | Where site-owned, link to Validate and explain schema/graph/convention/quality/content boundaries; preserve the portable example validator as its own working route |
| `src/content/owned/docs/guides/errors.md` | Add a short handoff to Skills troubleshooting rather than conflating tool installation errors with format errors |
| `src/content/owned/docs/get-started/first-model.md` | Keep the manual first-model route useful; offer an agent-assisted alternative and explain the different command locations |
| `src/content/owned/learn/why-cmmf.md` | Existing Skills link is appropriate; check wording against updated status and preserve the modelling-first introduction |
| `astro.config.mjs` | Add sidebar entries/group; retain existing routes and trailing slashes |
| `content-map.json` | Update current Skills titles/descriptions/status and register every new page; existing installation title still says development-release installation |
| `source-provenance.json` | Refresh Skills evidence using the current repo, full SHA, snapshot kind and byte hashes; retain historical provenance honestly |
| `reference/tools/skills-repository-readme.md`, `skills-quickstart.md`, `skills-implementation-progress.md` | Refresh these evidence snapshots from the pinned Skills revision, or preserve them as clearly historical and add a new current snapshot set |
| `scripts/prepare-content.mjs` | Review generic working-tree evidence wording in generated `llms.txt`; keep it accurate if other sources still have working-tree evidence |
| `scripts/check-site.mjs` | It currently requires a Starlight aside on `/tools/skills/` with a “development notice” message. Keep an accurate status aside, or update the assertion if the presentation changes |
| `scripts/review-site.mjs` | Extend journey, link, theme, mobile, table and diagram checks for the new pages |
| `scripts/inventory.mjs` / `handover/page-inventory.md` | Regenerate inventory after route changes; review generated status prose |
| `handover/implementation-plan.md`, `handover/source-workflow.md`, `README.md`, `LICENSES.md` | Review active ownership/evidence/repository references and document the refreshed Skills source process |

Some rows are neighbouring pages to review, rather than confirmed stale URLs. The confirmed active old GitHub links are the two tools pages and `contributing.md`. The provenance source also still uses the old repository name. Earlier exported handover text, including `handover/repository-decision.md` and `artifacts/cmmf-site-handover/`, records the old identity historically. Add a current-context note or replacement mapping outside immutable evidence; do not mechanically rewrite historical hashes or an integrity-checked archive.

### URL and identifier mapping

| Old reference | Replacement or treatment |
| --- | --- |
| `https://github.com/headless-company/cmmf-creation-agent` | `https://github.com/headless-company/cmmf-skills` in active material |
| `git@github.com:headless-company/cmmf-creation-agent.git` | `git@github.com:headless-company/cmmf-skills.git` |
| `https://github.com/headless-company/cmmf-creation-agent.git` | `https://github.com/headless-company/cmmf-skills.git` |
| Old repo `/issues`, `/pulls`, `/tree/...`, `/blob/...`, `/edit/...`, raw file and badge URLs | Change repo slug and verify the target path/revision exists; retain immutable historical references where they provide evidence |
| Local `cd cmmf-creation-agent` in fresh-clone instructions | `cd cmmf-skills`; existing local folder names may remain |
| CMMF Creation Agent / `cmmf-agent` as current product | CMMF Skills / `cmmf-tools` as appropriate |
| `/tools/` and `/tools/skills/` | Preserve; no redirect needed |
| Old standalone-agent command examples | Show only in a labelled migration comparison |
| `.cmmf-agent/` | Retain as supported legacy convention path |
| `content-model-master-format` links | Retain; they identify the normative source |
| `cmmf-docs-web` edit links | Retain; site-owned pages are edited in the website repo |

Do not rely on GitHub's rename redirect for active links. If additional old public site routes are discovered, inventory inbound links and add permanent redirects at the site's deployment layer; no old `/tools/agent/` route was established by this inspection. Do not invent one as an existing redirect requirement.

### Generated surfaces and versioned pages

Edit owned sources, not `.generated/docs/`, `dist/`, `public/raw/`, `public/llms.txt` or generated downloads. `prepare-content.mjs` regenerates raw Markdown and retrieval-index links from owned content and the content map. Run the build to propagate changes. Check search, `/llms.txt`, `/raw/site/tools/...`, page descriptions, canonical URLs, edit/source links and sitemap entries.

The site baseline also publishes stable `1.2.0` and experimental `1.3.0-beta.1` documentation. Tools pages should remain shared. Check `scripts/prepare-versions.mjs` and `scripts/lib/versions.mjs`: broad version replacement must not alter explicit Skills compatibility statements. Skills now support stable `1.2.1` and beta `1.3.0-beta.1`, including explicit prerelease source requests. Link beta readers to the declaration-only validation scope and the original beta tag's older casing rules. Recheck the site's stable version through its source-sync process; this handover does not update the website pin.

Retain the site's existing release hold for the separate editor. The new Skills pages must not introduce held product names or routes into public content or raw copies; `check-site.mjs` currently enforces this. The handover may explain repository ownership internally without publishing that ownership table verbatim.

## 4. Installation, updates, and first use

### Who needs what

| Reader | Requirements |
| --- | --- |
| Person building the suite from source | Git, Node.js 22+, pinned `npm@11.11.0`, source checkout, dependency-download access for `npm ci` |
| Person using an assembled skill | A host/environment that can load local skills, read/edit the project and run Node.js 22+; no npm installation in the model project |
| Person retrieving a canonical source | Git, writable cache outside the model directory and permitted access to the canonical remote, or an already identified exact-version cache/local source |
| Team running deterministic checks | Node runtime, built helper, model repository and an explicitly supplied matching canonical source; no LLM session required |

The package declares npm `>=11.10.0`, while `packageManager` pins `11.11.0`. Use the pin for reproducible contributor instructions. `.nvmrc` currently says `22`; use the site's separate Node requirement for the website itself. Do not instruct readers to disable dependency policy to get a successful install.

### Build from source

Run in a location chosen for the Skills checkout, separate from the model project:

```sh
git clone https://github.com/headless-company/cmmf-skills.git
cd cmmf-skills
# Select your team's reviewed full Git revision before building.
node --version
npm --version
npm ci
npm run check
```

A team reproducing this handover can select `68ec28d3993eb08298ebf9a896f6a9d51b425bf0` with `git switch --detach` in this fresh checkout. A public quickstart should link to a reviewed revision and explain whether it is a source baseline or an actual published release.

`npm run check` builds, runs tests and dependency checks, packages all six skills, and verifies every package separately. It already includes packaging/verification. For a focused rebuild use `npm run skills:package` followed by `npm run skills:verify`.

| Build output | Meaning |
| --- | --- |
| `dist/` | Compiled local tools and programmatic exports |
| `release/skills/<skill-name>/` | Complete independently installable skill |
| `release/cmmf-skills.tar.gz` | Suite archive containing `skills/` and `manifest.json` |
| `release/manifest.json` | `formatVersion`, product `name`/`version`, skill names and per-file `sha256` map |

Each packaged skill includes `SKILL.md`, shared `references/`, `LICENSE.md`, and `scripts/cmmf-tools/` containing the local runtime, JavaScript dependencies and dependency licences. The source `skills/` directories alone are not installable equivalents. The suite manifest is outside individual skill directories: preserve it separately as installation evidence. Hashes identify/check bytes; they are not a signed publisher attestation. The current manifest does not contain the source Git SHA; record that separately.

These outputs are ignored by Git and generated locally. No globally available `cmmf-tools` command is established merely by cloning, building, or copying a skill. No npm package publication is implemented by these commands.

### Install complete folders

Choose one scope and host destination. Add `<skill-name>/` beneath the listed parent.

| Host | Project parent | Personal parent | Official reference |
| --- | --- | --- | --- |
| Codex | `.agents/skills/` | `~/.agents/skills/` | [Build skills](https://learn.chatgpt.com/docs/build-skills) |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` | [Extend Claude with skills](https://code.claude.com/docs/en/skills) |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` | [Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) |

These documented paths were checked against official pages on 20 October 2026. They are installation locations, not evidence that this suite has passed host-specific evaluation. Recheck the chosen host surface and settings when publishing. Personal files on a laptop should not be assumed present in a cloud session; provision the complete package in the environment that actually executes it. [Claude Code's documentation](https://code.claude.com/docs/en/skills) specifically distinguishes local personal skills from cloud-session project skills.

For a fresh Codex project destination, run from the Skills checkout:

```sh
mkdir -p /path/to/model-project/.agents/skills
cp -R release/skills/cmmf-author /path/to/model-project/.agents/skills/
```

Replace `/path/to/model-project` with the actual target path. Inspect any existing destination before copying. Use the same pattern for another skill or host parent. Installing all six is optional: each package has its own references/runtime and no dependency on another installed skill.

### Verify installation and run a bounded first task

1. Check that the installed directory directly contains `SKILL.md`, `references/` and `scripts/cmmf-tools/tools/cli.js`; avoid an extra nested `<name>/<name>/` directory.
2. Use the host's documented skill list/selector or start a new session as appropriate. Confirm the named skill is visible in the intended project/environment. Visibility is an observation to record, not an assumed outcome.
3. Check helper execution independently:

```sh
node /absolute/path/to/installed/cmmf-author/scripts/cmmf-tools/tools/cli.js --help
```

4. In an empty disposable model project, ask:

> Use cmmf-author to create an Article with a required title, reusable Authors and SEO metadata embedded within each Article. Authors are shared across articles; SEO has no independent lifecycle. Use CMMF 1.2.0 for this trial. Put models in models/. Validate the complete repository and report the source revision, files changed, assumptions and actual validation result.

5. Confirm the agent used a matching canonical source and produced a manifest plus all referenced model files. Confirm that Author is referenced and SEO is embedded, and that validation used the installed helper or another identified executable validator.
6. Review the actual files and result. A clean validator establishes the checked format/graph properties; have the content team assess whether the boundaries and editing behaviour satisfy the brief.

Use an explicit known version for the repeatable onboarding trial. Separately test a `latest` request and record what it actually resolves to; do not hard-code an assertion that latest always means 1.2.0.

### Update, rollback and uninstall

Record the source SHA, suite version, package manifest and installed file hashes before rollout. Inspect the destination for local customisations and preserve them. Build/verify the selected update, compare its manifest and instructions, replace only the owned installed skill directory, and repeat the bounded task. Avoid recursive copy over an existing folder that leaves obsolete runtime files behind. Keep project conventions in project files where possible, rather than editing every installed package.

For rollback, restore the previously recorded complete package and rerun the relevant trial. Removing or rolling back a skill does not revert model edits. To uninstall, remove only that installed skill's directory; retain model files, conventions and source caches unless their removal is explicitly intended. Builds/extraction do not configure provider credentials.

## 5. Shared workflow and version rules

The normal cycle is: **understand the request → inspect existing work/conventions → resolve canonical source when needed → reason and make authorised changes → validate the whole model set → assess impact → report evidence**. Users can enter at any skill; this is not a mandatory six-stage wizard.

### Inputs and file ownership

Inspect `manifest.yaml` or `manifest.yml`, the declared model directory, existing IDs/relationships, requirements and applicable conventions. The helper defaults the model directory to `models/` when `modelsPath` is omitted, and reads YAML/YML recursively. Model paths must remain within the selected repository. Both manifest filenames present is an ambiguity to resolve. Parse failures can make the graph incomplete.

Project conventions are discovered from root `cmmf.instructions.md`, `.txt`, `.yaml` or `.yml`, and text/Markdown/YAML guidance under `.cmmf/` or legacy `.cmmf-agent/`. These directories are for conventions, not the model storage contract. Inspect output bounds instruction content; read original files if truncated. The agent interprets conventions; the validator does not automatically enforce every natural-language rule. For example, a team rule requiring `internal_name` needs review or a separate executable check if it is a release gate.

Explicit user requests take precedence over project guidance. Explain conflicts with canonical validity rather than quietly generating invalid YAML. Preserve existing IDs, comments, unrelated files and uncommitted work. Helpers read model inputs; the host editor performs changes. Source retrieval writes to its cache, and package/build commands write derived outputs in the Skills checkout.

### Source selection table

| Situation | Required behaviour |
| --- | --- |
| New project, no version requested | Resolve latest published/current canonical source; write an explicit versioned manifest |
| Existing project | Read manifest and use that exact declared version |
| Explicit historical request | Resolve matching historical schema/spec/docs; retain requested version |
| Numeric `specVersion: 1` | Treat as original legacy format, not any current 1.x version |
| Explicit format upgrade | Validate isolated before/after snapshots against their respective matching sources |
| Missing/malformed/ambiguous manifest | Report the uncertainty; do not silently choose latest for existing work |
| Version outside the supported list | Report unsupported source request or helper semantics and the remaining checks; never label it full success |

Resolve once per modelling task. Read the normative spec and relevant docs from the selected revision. Do not change the source halfway through a task as upstream moves.

### Retrieval and provenance

The canonical remote is `https://github.com/headless-company/content-model-master-format.git`. `source` prefers matching release tags; historical retrieval can inspect actual schema history where tags are absent. For `latest`, it selects the highest suitable numeric release tag or, if none qualifies, the version identified by canonical README/schema at remote HEAD. It does not mix an old spec file with a current schema.

Choose a writable cache outside the target model directory. An exact-version request reuses an existing valid cached snapshot. A normal `latest` request refreshes upstream. `--offline` requires an existing pointer/snapshot and cannot establish current freshness of cached latest. Cache namespaces are separated by remote; snapshots are stored by revision. Cached schema/spec bytes are checked against recorded hashes; this is not a complete attestation of every docs file.

The `source` JSON result wraps evidence in `source`, including `root`, `version`, `revision`, `dirty`, `schemaSha256`, `specSha256`, `specFile`, `schemaFile`, `remote` and `freshness` (`local`, `fetched` or `cached`). Use `source.root` for subsequent `--cmmf-repo` arguments. A non-Git local source can have `revision: null`; retain its content hashes and disclose that limitation. A dirty local checkout needs hashes and its relevant changes recorded; commit SHA alone cannot identify those bytes.

An explicit local source checkout is valid when schema/spec/version match. Do not fetch, switch its branch or edit it as a side effect of reading it. Do not assume an adjacent clone or source environment variable. If network/helper access fails, use a genuinely identified exact cached/local source or report unavailable checks; an agent's plausible reading of YAML is not executable validation.

## 6. Full skill documentation

All six are independently installable. Output filenames below are recommended documentation conventions, not hard-coded files created by the skills. Users choose destinations; reports may be delivered in conversation when no file is requested. Host-generated prose and authoring results vary; the workflows and evidence requirements are the contract.

### cmmf-discover — turn requirements into modelling decisions

**Use when:** a brief, workshop, content inventory or domain discussion needs to become an agreed modelling brief. Useful before YAML authoring, and when an existing model needs to be reconciled with new requirements. It is content-modelling discovery, not generic product discovery.

**Provide:** the actual notes/brief and their locations; desired channels/editorial outcomes; known reuse, ownership and lifecycle needs; any current model repository/conventions; and where to save the brief. Unknowns are acceptable and should be identified.

**Prompt:**

> Use cmmf-discover on notes/customer-stories.md and the current models. Customers can appear in many stories. We have not agreed whether quotes belong to a story or are reusable. Save a traceable modelling brief to docs/modelling-brief.md. Identify only questions whose answers change the model.

**How it works:** reads the notes and modelling guidance; inspects existing definitions and conventions if supplied; identifies content concepts, ownership, reuse, relationships, editorial workflow and delivery needs; separates evidence from inference. It resolves canonical source when version-specific concepts or draft models are needed. It asks consequential questions and continues independent analysis. If YAML is also requested, it can proceed into authoring and validation without requiring another installed skill.

**Expected output:** a brief containing candidate models and reasons for their boundaries; key fields; embedded-versus-linked intent and repeatability; supported localisation/validation/editorial needs; decisions and consequential assumptions traced to the input; and unresolved questions that change structure or constraints. It need not produce YAML.

A useful output fragment would say: “Customer identity is reusable because the notes say the same customer appears in several stories. Story-to-Customer is a reference. Quote ownership is unresolved: if quotes are reusable identities, reference them; if they exist only within a story, consider embedding. Resolve that before finalising the structure.” This is illustrative reasoning, not a fixed schema template.

**New-user success check:** you can explain why each proposed model exists and which decisions remain. The report has not invented CMS fields or configuration unsupported by the brief.

**Staff acceptance:** trace each consequential boundary to evidence; check reuse against existing semantic definitions; verify that ownership, localisation, repeatability and publication requirements are explicit enough to author. A brief that hides a consequential unanswered question is not ready merely because it reads fluently.

**Limits and next step:** discovery is not schema validation and cannot prove stored content is compatible. Agree the material decisions, then request authoring; retain the brief as design evidence.

### cmmf-author — create or extend model YAML

**Use when:** creating a model repository or making scoped additions/edits from natural-language requirements or an agreed brief. It handles portable CMMF modelling, not translating a CMS export into a live CMS configuration.

**Provide:** the target repository, brief/decisions, intended scope, version request if any, project conventions, output locations and any facts about reuse/ownership. For existing work, identify files or areas that must be preserved.

**Prompt:**

> Use cmmf-author to add reusable authors to articles in this repository. Reuse the existing Person model if it represents the same identity. Authors may appear on multiple articles, and an article may have several authors. Keep the declared CMMF version and existing IDs. Validate the whole repository and show a semantic before/after comparison.

**How it works:** resolves/reads the required canonical source, inspects current models/conventions, reuses meaningfully equivalent structures and preserves stable IDs. For new repositories it creates an explicit manifest and models in the declared directory. It asks only questions that materially change the schema: ownership, embedding, reuse, repeatability, enum values, localisation, requiredness or ambiguous existing definitions. It applies authorised edits through the host and validates the complete resulting graph. For existing repositories it compares isolated before/after snapshots; it must not reset the worktree to manufacture the baseline.

**Expected output:** `manifest.yaml`/`.yml` for a new project, model YAML files, a changed-file summary, concise rationale and assumptions, actual whole-repository validation evidence, and semantic impact for existing work. For the Article/Author/SEO brief, expect all targets to exist, shared Author identity to be referenced, and SEO to be an embedded object. Exact IDs follow the brief/conventions.

**New-user success check:** every relationship points to an included model, the manifest matches the selected source, and the output tells you which files changed and why. The validation command and result are visible.

**Staff acceptance:** compare the resulting YAML against the brief, inspect the semantic changes and preserved IDs, distinguish pre-existing problems from introduced failures, and review effective manifest defaults. Validate the entire resulting repository. Any unrequested breaking decision must be resolved with concrete impact evidence before implementation. Ordinary already-authorised edits do not need an extra confirmation ritual.

**Limits and next step:** valid files do not prove a good editing experience or consumer compatibility. Review architecture/editorial behaviour, then generate docs or make an evolution plan as needed. No content instances are created or migrated by the helper.

### cmmf-validate — check format and cross-model integrity

**Use when:** establishing whether a complete model repository conforms to its declared canonical format and graph constraints, diagnosing failures, or repairing issues when explicitly requested. It does not validate stored content entries.

**Provide:** the repository and manifest, matching source/cache access, intended check-only versus repair scope, and requirements that determine any ambiguous repair.

**Prompt, check only:**

> Use cmmf-validate to check this entire repository against its declared version. Report errors with file/model/field locations, source revision, the command and exit code. Keep modelling advice separate from invalidity.

**Prompt, repair:**

> Use cmmf-validate to repair errors whose intended meaning is clear from the brief. Preserve existing IDs, comments and the manifest version. Report unresolved target intent instead of inventing models, then rerun whole-repository validation.

**How it works:** resolves the declared source, inspects files, runs executable canonical schema and graph checks, and uses actual diagnostics/exit codes. It reports incomplete-graph limitations from malformed YAML. It cannot substitute an agent's visual assessment for execution. For repairs it makes scoped host edits, reruns validation and inspects the final diff. A malformed manifest that makes the version unknowable is a blocking dependency to explain, not permission to use latest.

**Expected output:** a located findings report and actual command evidence, source version/revision/hashes, error/warning counts or diagnostic list, repairs/diff if requested, and remaining checks. JSON diagnostic fields are `code`, `severity`, `file`, `path`, `message`. Important codes include `YAML_PARSE_ERROR`, `MANIFEST_MISSING`, `MANIFEST_AMBIGUOUS`, `MODEL_SCHEMA_INVALID`, `MODEL_ID_DUPLICATE`, `FIELD_ID_DUPLICATE`, `TARGET_MISSING`, `OBJECT_TARGET_KIND`, `EDITORIAL_FIELD_MISSING`, `PATH_OUTSIDE_REPOSITORY`, `MODEL_SYMLINK_UNSUPPORTED`, `SOURCE_VERSION_MISMATCH` and `HELPER_VERSION_UNSUPPORTED`. A source mismatch can also surface as a source/tool failure before validation returns.

**Checks covered:** YAML/read/manifest failures; canonical model schema; duplicate model/field IDs; missing reference, object and rich-text reference-embed targets; embedded target kind; label-field existence; contained paths and unsupported model symlinks. Linked cycles are not automatically invalid.

**New-user success check:** `valid: true`/exit 0 is tied to an identified matching source, with warnings and limitations disclosed. A report that never ran a validator does not meet this check.

**Staff acceptance:** distinguish format/graph invalidity, project convention findings, design tradeoffs and content-instance checks. Test detection against known invalid fixtures. Verify that repairs preserve intent and do not erase fields or invent targets just to produce green output. An unsupported version must not pass as fully validated.

**Limits and next step:** validation cannot decide whether a model meets all business needs, whether content satisfies constraints, or whether deployment/migration is safe. Use Review and Evolve for those additional analyses.

### cmmf-review — assess architecture and editorial usability

**Use when:** evaluating whether model boundaries, reuse and relationships express the intended architecture and support editors. It is not general code review. A review request alone does not authorise changes.

**Provide:** actual models, requirements, project conventions, editorial/localisation context and the audience/scope of the review. Content samples and consumer details improve recommendations when available.

**Prompt:**

> Use cmmf-review on our Customer Story models for the content team and implementers. Focus on customer/quote ownership, reuse, label fields and requiredness against the publication workflow. Return prioritised findings with field locations, consequences and concrete improvements. Review only.

**How it works:** establishes schema/graph validity before treating design suggestions as the main result, then reviews boundaries, reuse, object/reference choices, ownership, repeatability, taxonomy/settings, localisation, rich-text capabilities and editorial metadata. It ties suggestions to practical consequences. It does not assume every cycle is invalid or every repeated structure deserves independent identity.

**Expected output:** prioritised findings, each with model/field/file location, evidence, editing or implementation impact, a concrete recommendation or unresolved decision, and a category distinguishing invalidity, convention violation and design tradeoff. Include useful sound decisions where they explain the assessment; no manufactured quota of issues. Suggested report file: `docs/model-review.md` when requested.

An illustrative finding format: “Design tradeoff — `customer_story.quote`: ownership is not recorded in the supplied requirements. Editors cannot tell whether changing a shared quote should affect other stories. Agree independent reuse versus story ownership before choosing reference or embedding.” Do not label a tradeoff a spec error.

**New-user success check:** each recommendation explains a real consequence in your model, and review-only use has not silently changed files.

**Staff acceptance:** confirm the reviewer inspected the actual files and relevant requirements, grounded each finding, applied project rules separately from canonical validity, and avoided treating preference as specification. If implementation is requested afterward, check the authorised diff and rerun validation.

**Limits and next step:** a review depends on the supplied requirements and content evidence. It is not certification of a CMS editing interface. Agree improvements and request scoped Author/Evolve work where needed.

### cmmf-document — explain the actual model set

**Use when:** producing stakeholder documentation, model catalogues, field dictionaries and Mermaid relationship diagrams from CMMF source. The YAML remains authoritative.

**Provide:** the complete repository, target audience, output path(s), desired bounded scope for a large graph, and any recorded design rationale/brief. Provide matching canonical source access.

**Prompt:**

> Use cmmf-document to explain the Article, Author and SEO architecture to our content team. Save a catalogue and Mermaid diagram to docs/content-model.md. Explain linked authors versus embedded SEO, effective required/localised defaults and relevant field constraints. Include source and validation evidence, and label inferred rationale.

**How it works:** resolves source, validates the graph, uses the documentation helper for an initial catalogue/diagram, and saves requested output through the host editor. It adapts language to the audience and supplements the generated overview with constraints, enum values, localisation, rich-text and editorial/governance detail from the real files. Large bounded views must say what was omitted. Invalid or incomplete graphs must not produce a complete-looking unexplained diagram.

**Expected output:** Markdown catalogue, per-model field tables, Mermaid flowchart, model IDs/kinds, embedded/reference/rich-text-embed edges, repeatability and available ownership, plus audience-specific explanation and provenance/validation evidence. The helper's field table has Field, Type, Required, Localised, Repeatable and Description columns. It includes effective required/localised defaults and model editorial/governance blocks where present.

The helper prints Markdown; it has no `--output` flag. Its plain Markdown includes namespace and declared CMMF version but does not automatically embed the complete source revision/hash/validation record. The skill must add that evidence; use `document --format json` to retain the source/diagnostics alongside the Markdown. The overview is not a complete field-constraint reference on its own.

**New-user success check:** you can trace diagram nodes/edges and field descriptions back to real models, distinguish embedded and linked content, and identify the generation source/date and validation result.

**Staff acceptance:** compare generated output against the files, including defaults and rich-text reference embeds; check scope omissions; verify that added rationale is supplied evidence or labelled inference. Regenerate affected documentation after model changes. Do not accept diagrams that simplify away ownership or missing targets without explanation.

**Limits and next step:** diagrams are derived views. They neither define model semantics nor evaluate stored entries. Readers can use them for review; changes return to YAML and must be revalidated before regeneration.

### cmmf-evolve — plan or implement intentional change

**Use when:** analysing/removing/splitting/renaming models or fields, changing constraints/ownership, or explicitly upgrading the specification. Supports a concrete plan and scoped authorised model edits; it does not execute live content transfer.

**Provide:** the current repository, proposed outcome, requirements/content constraints, consumer/integration information, content samples/counts when available, upgrade intent if any, and whether you want a plan or implementation. Identify rollout/backfill constraints and decisions already approved.

**Prompt:**

> Use cmmf-evolve to plan moving embedded customer details out of stories into reusable Customers. Preserve story IDs. Explain deduplication, old-to-new mappings, translations, dependent models, consumers, backfill, verification and rollback. Produce the proposed model changes and semantic impact report. Do not claim content has been migrated.

**How it works:** captures isolated before/after snapshots without resetting user work, resolves matching sources for each side, validates both, then uses semantic diff for additive/breaking/uncertain changes and transitive incoming dependent models. It supplements that evidence with content, consumer, editorial and migration analysis. For planning, it returns a concrete proposal and steps; for authorised implementation, it edits scoped files and validates the result. It does not silently upgrade the manifest or delete fields to silence errors.

**Expected output:** proposed or implemented model diff; semantic change records with `code`, `classification`, `model`, optional `field`, `message`, `dependents`; concrete old-to-new field/identity mappings; deduplication/ownership decisions; backfill and translation needs; external consumer impact; rollout/verification/rollback sequence; assumptions, missing content evidence and source/validation records. Suggested files: `docs/change-impact.md` and `docs/migration-plan.md` when requested.

**Interpretation:** required-field additions, removals, structure/ownership/localisation/repeatability changes and removed allowed values can be breaking. Constraint, rich-text and metadata changes can be uncertain. Additive output is evidence of the helper's classification, not proof that every consumer remains compatible. Dependent models come from the before graph; unrepresented consumers, CMS configuration and application code need separate inventory. Renames are not automatically inferred as data mappings from matching prose.

**New-user success check:** the plan tells you what happens to existing data, who/what changes, in what order, how to test the transition and how to recover. A green model validator alone is insufficient.

**Staff acceptance:** validate both model sets, inspect the diff classes and missing evidence, sample existing content where available, verify deduplication and retained IDs, assign consumer/backfill owners, and set measurable cutover/rollback criteria. Resolve unapproved consequential breaking decisions using the concrete proposal. Content migration completion requires actual content/consumer evidence beyond this skill.

**Limits and next step:** model files and migration plans do not move content. Execute any live migration through the team's separately authorised implementation and operational process, then verify data, consumers and editorial workflow before retiring old structures.

## 7. Worked journeys

These are documentation teaching scenarios. Run them during implementation and preserve actual outputs before publishing them as verified examples. Do not present illustrative prose below as an executed host evaluation.

### New project: brief to reviewed model

1. Give Discover a customer-story brief: customers can appear in many stories; quotes have unresolved ownership; products already have reusable identity. Ask for a brief with traced decisions. Settle quote ownership explicitly before encoding it.
2. Ask Author to create models from that agreed brief using the trial's explicit supported version, keeping product identity reusable. Specify the target project and output locations.
3. Check the entire resulting repository with Validate. Record command, source revision, diagnostics and exit code. Fix only supported/requested repairs.
4. Ask Review to assess publication requiredness, label/help text, localisation and ownership against the agreed workflow. Resolve high-impact findings; revalidate after edits.
5. Ask Document for a team catalogue/diagram with provenance. Review YAML and generated documentation together.

Expected reviewable deliverables: an agreed brief; manifest and complete model set; validation record; architecture findings/decisions; derived catalogue/diagram. Installation of all five skills is optional: a skill can complete requested related work using its own bundled references/helpers.

### Existing repository: safe change

> Use cmmf-evolve to add a required Summary to existing Customer Stories while retaining the declared version. Propose the model change and analyse existing records, translations and consumers before implementation. Preserve uncommitted work. State missing data evidence and propose a backfill/transition plan.

Expected outcome: adding a required field is identified as breaking/backfill work, even if the new model YAML is valid. Preserve a before snapshot including relevant uncommitted user state; create the candidate after separately; validate/diff both. With no content access, the result must explicitly leave content compatibility unverified. After authorised changes and validation, regenerate team docs. Do not use `git reset` or checkout replacement to capture a baseline.

### Review-only audit

> Use cmmf-review and executable validation to audit these models against requirements.md and cmmf.instructions.md. Report invalidity first, then convention issues and design tradeoffs, each with locations and consequences. Do not edit model files. Include evidence and unresolved questions.

Expected outcome: no model changes, reproducible validation evidence, prioritised actionable findings, and an honest account of unavailable requirements/content. The report should allow a staff reviewer to accept or reject each recommendation on its evidence.

### Output record to request in every technical handoff

```text
Task and scope:
Skill(s), package version, source Git SHA and package manifest/hashes:
Host/surface/model version (if an agent was involved):
Model repository revision and relevant working-tree changes:
Canonical CMMF version/revision, schema/spec hashes and cache freshness:
Inputs and project conventions read:
Changed files or review-only confirmation:
Decisions, rationale and consequential assumptions:
Commands actually run, exit codes and diagnostics:
Semantic impact/dependents (when relevant):
Pre-existing issues versus introduced issues:
Content/consumer checks performed and still missing:
Output paths and next owner/action:
```

This is a recommended reporting template, not an implemented report-file schema or extra mandatory approval flow.

## 8. Deterministic tool reference

The helpers are noninteractive, provider-free commands. They read model inputs, and source retrieval maintains a separate cache. They neither invoke an LLM nor edit model YAML. The agent skills decide how to use the evidence and make authorised file edits.

### Invocation contexts

Inside a built Skills source checkout:

```sh
npm run tools -- inspect --repo /path/to/model-project --format json
npm run tools -- source --version 1.2.0 --cache /path/to/cmmf-source-cache --format json
npm run tools -- validate --repo /path/to/model-project --cmmf-repo /path/from/source.root --format json
npm run tools -- document --repo /path/to/model-project --cmmf-repo /path/from/source.root --format json
npm run tools -- diff --before /path/to/before --after /path/to/after --cmmf-repo /path/from/source.root --format json
```

In an installed skill, the same argument list goes after:

```sh
node /absolute/path/to/installed/skill/scripts/cmmf-tools/tools/cli.js
```

For example:

```sh
node /absolute/path/to/installed/skill/scripts/cmmf-tools/tools/cli.js inspect --repo /path/to/model-project --format json
```

Use absolute paths so working directory does not determine the active package or model repository. Substitute the actual `source.root` returned by retrieval; it is not the cache parent. A model project's own `npm run validate` script, such as a downloaded site example's validator, is a separate interface from the Skills source checkout command.

### Commands and actual output

| Command | Arguments | Output/meaning |
| --- | --- | --- |
| `inspect` | `--repo PATH`, optional `--format json` | Always JSON: `root`, `manifest`, `manifestFile`, raw `models`, `edges`, `instructions`, `diagnostics`. Never fetches canonical sources; parse success is not schema validity |
| `source` | `--version VERSION --cache PATH`, optional `--offline`, `--remote URL`, `--format json` | JSON `{source: ...}` or readable root/version/revision/freshness. Defaults to canonical remote; remote override is an explicit advanced/test option |
| `validate` | `--repo PATH --cmmf-repo SOURCE`, optional `--format json` | JSON `{valid, source, diagnostics}` or readable source, model/relationship counts and findings |
| `document` | Same source/repo flags, optional `--format json` | On valid input: Markdown by default or `{valid, source, diagnostics, markdown}` JSON. Invalid input returns diagnostics, not a misleading catalogue |
| `diff` | `--before PATH --after PATH --cmmf-repo SOURCE`, optional `--after-cmmf-repo SOURCE`, `--format json` | Always JSON: `{valid, sources: {before, after}, diagnostics, changes}`. Validates both repositories before computing changes; invalid sides yield `changes: []` |

Omit `--format` for the command's default output; the only accepted format value is `json`. No `--fix`, `--output`, `--provider`, `--model`, `--yes`, `generate` or live migration command exists. `--help` is a top-level invocation. Do not build tutorials around unsupported flags.

For an explicit specification upgrade, resolve each version separately and use:

```sh
npm run tools -- diff --before /path/to/before --after /path/to/after --cmmf-repo /path/to/old-source --after-cmmf-repo /path/to/new-source --format json
```

### Exit codes and automation

| Exit | Meaning | Correct response |
| --- | --- | --- |
| `0` | Success for that command; a diff has no breaking/uncertain classification | Read warnings and scope; do not extrapolate to content or architecture approval |
| `1` | Invalid model data, or a valid diff with breaking/uncertain changes | Inspect `valid`, diagnostics and changes. A reviewed breaking change is a result to handle, not a tool crash |
| `2` | Usage, source resolution or execution failure | Fix invocation/environment/source availability; validation may not have run |

The top-level CLI failure handler writes a JSON `TOOL_ERROR` message to stderr. Diagnostic arrays use `code`, `severity`, `file`, `path`, `message`; not every `path` is a JSON Pointer, so retain it as reported. Preserve stderr and process exit codes when capturing evidence. In particular, `diff` exit 1 with `valid: true` means impact review is needed; with `valid: false`, fix invalid sides before treating changes as complete. The helper does not contain an approval mechanism for breaking changes.

### Programmatic migration for implementers

The package exports `inspectRepository`, `acquireSource`, `readSource`, `validateRepository`, `semanticDiff`, `documentRepository`, `loadProjectInstructions`, canonical-remote/supported-version values and associated raw data/evidence types from `src/index.ts`/compiled `dist/index.js`.

The retired `runAgent`, provider factories/types, tool-call contracts, strict legacy model types, `loadRepoGraph`, renderer functions and old `resolveCmmfSource` interfaces are removed. There is no provider-generation API replacement. Programmatic callers must pass matching source evidence explicitly and validate both inputs before `semanticDiff`; the CLI provides that orchestration, while the exported diff function itself does not. Use `docs/migration.md` and exported TypeScript types as the API reference, without advertising npm availability.

## 9. Team adoption and assurance

### Decide whether it fits

| Team need | Fit at this baseline | Evidence still needed locally |
| --- | --- | --- |
| Portable model authoring/review within an existing coding host | Implemented skill workflow | Host discovery, real modelling quality and team conventions trial |
| Deterministic schema and repository graph checks | Implemented helpers with automated tests | Matching canonical version and coverage of the team's actual model patterns |
| Architecture and editorial guidance | Skill reasoning with project context | Content-team review and real requirements; not guaranteed by helper tests |
| Derived catalogues/relationship diagrams | Implemented generator plus skill explanation | Accuracy/scope review and added detailed field constraints |
| Model evolution and migration planning | Implemented diff and planning workflow | Content sampling, consumer inventory, backfill feasibility and rollout ownership |
| Stored entry validation or live content migration | Not implemented | Separate tooling and operational implementation |
| CMS import/export/translation | Not implemented | Separate target selection and translation work |
| Universal host support, native plugins or marketplace install | Not established/implemented | Host-specific evaluations or future packaging |
| Experimental 1.3.0-beta.1 helper support | Implemented: retrieval, hint declaration checks, documentation and diff | Verify the selected source revision and actual model patterns; content evaluation and CMS translation remain separate |

A team can run the helper checks independently of an agent. Staff members should require evidence at four separate levels: (1) executable format/graph validity, (2) compliance with team conventions, (3) modelling/editorial suitability, and (4) content/consumer migration safety where relevant. None substitutes for the others.

### Trial protocol

Run in a disposable repository using one complete released package at a time, matching `evals/core-workflows.md`. Record host product/surface/version, model/version, skill source SHA and manifest hashes, canonical source/version/hashes, prompt/inputs, artefacts, commands, diagnostics and verdict. Mark each intended host **not run**, **pass**, **fail** or **blocked** with reason; helper execution is not a substitute for host discovery.

| Evaluation | Observable pass criteria |
| --- | --- |
| Discover: customer stories, shared customers, unresolved quote ownership | Reusable customer identity, traced decisions, meaningful ownership question, no invented CMS config |
| Author: Article/shared Authors/embedded SEO | Correct versioned manifest, complete target set, reference versus embedding matches intent, actual whole-set validation |
| Validate: malformed YAML, duplicate IDs, missing reference and rich-text target | Aggregated located findings; incomplete graph disclosed; no invented repairs |
| Review: unclear ownership, weak editorial identification, indiscriminate requiredness | Grounded prioritised consequences; validity distinguished from advice; no unauthorised edits |
| Document: validated Article/Author/SEO | Actual IDs/kinds, correct edges/defaults/ownership/repeatability, source and validation evidence |
| Evolve: extract reusable Customers from embedded details | Concrete proposal, mappings/deduplication/backfill, dependent and consumer analysis, no content-migrated claim |
| Team convention requiring `internal_name` | Agent finds/applies or reports the rule; generic schema validation is not claimed to enforce arbitrary prose |
| Existing legacy and explicit historical source | Exact version respected; no silent manifest upgrade or mixed schema/spec |
| Network failure with/without exact cache | Identified cached source used honestly or blocked source checks stated; no invented freshness |
| Missing Node or unsupported helper version | Clear limitation and genuine alternative evidence if available; no full validation claim |
| Existing unrelated working changes | Preserved; snapshots/diffs do not reset or overwrite user work |

Host checks are pending in the repository's recorded evaluation status. Publish actual trial results separately with dates and artefacts before expanding support claims. A single successful prompt is a bounded observation, not universal certification.

### Release and model-change checks

For suite maintainers, `npm ci` with the pinned runtime and `npm run check` are the normal release preparation checks. Dependency policy requires a reviewed lockfile, ignored install scripts, seven-day minimum package age and the existing axios ban. The build clears stale compiled agent/provider entrypoints; packaging verifies all six independent runtimes. Do not bypass policy in public onboarding.

For a model repository, a CI job can run the built/installed validator against a pinned matching canonical source, retain JSON/exit evidence, and fail invalid changes. Keep canonical source retrieval/refresh explicit so a routine build does not depend on moving upstream. If diff is included, distinguish invalidity from reviewed breaking/uncertain results; the team must decide how an intentional migration is reviewed. Convention rules need their own enforcement where required. No such target-project CI pipeline is installed automatically by copying a skill.

Before accepting a modelling change, require: scope and decisions match the brief; retained IDs and version are intentional; complete validation passed or the exact limitation is accepted; diff/backfill/dependent implications are understood; generated docs match the accepted YAML; any content migration has separate evidence and an owner. Do not impose a new mandatory approval ritual on ordinary local edits already requested by the user.

## 10. Troubleshooting

| Symptom | Likely cause and recovery |
| --- | --- |
| Skill not visible | Wrong host parent/scope, extra nested directory, different execution environment or host settings. Inspect the installed tree and official host guidance; record discovery separately from helper execution |
| References/helper missing | Only source `SKILL.md` or development `skills/` folder copied. Install the complete assembled `release/skills/<name>/` |
| `node` unavailable/too old | Provide Node 22+ in the actual host execution environment; a terminal on another machine is not enough |
| `npm ci` rejects engines | Check Node/npm and use the pinned npm 11.11.0; do not disable `engine-strict` as an onboarding fix |
| `cmmf-tools` not found | Copying a skill does not register a global executable. Use its absolute `node .../scripts/cmmf-tools/tools/cli.js` entrypoint or `npm run tools --` in the built Skills checkout |
| `generate`/provider flags rejected | Retired interface. Ask the host to use Author; use the documented local command flags |
| Source fetch fails | Check Git/network permissions and remote access. Use a valid exact-version cache/local source if available; otherwise report unavailable validation |
| Offline latest appears cached | Expected: offline cache does not prove upstream freshness. Label it cached; refresh explicitly when network is available |
| Cache hash mismatch | Cached schema/spec changed. Preserve evidence if needed, then acquire a clean source; do not edit hashes just to accept altered files |
| Source mismatch | Manifest and schema are different versions. Resolve matching source or perform an explicitly requested upgrade; do not rewrite the manifest to silence the error |
| Beta request rejected or IDs rejected | Update installed skill packages to obtain prerelease support. For casing failures, inspect the exact source revision: the original beta tag predates the casing fix. Do not bypass genuine schema errors |
| Inspection returns models but validation fails | Inspection is tolerant and not canonical validation. Read parse/schema/graph diagnostics; the graph may be incomplete |
| Missing reference/object/rich-text target | Supply the actual intended model or correct the relationship using requirements. Do not invent a meaningless target |
| Model path/symlink rejected | Keep declared model files within the selected repo using ordinary files; inspect path diagnostic rather than following external links |
| Convention text truncated | Read the actual instruction file; the inspect summary is bounded |
| Diff exits 1 | Check `valid`: invalid sides need repairs; valid breaking/uncertain changes need impact review. It is not automatically a command failure |
| Documentation looks incomplete | Helper overview omits detailed constraints; ask for evidence-based field/rich-text/localisation explanations and explicit scope |
| Markdown not written to disk | Document prints stdout. Ask the host to save it, or deliberately capture output outside model directories while retaining exit/JSON evidence |
| Changed YAML, no content migrated | Expected boundary. Use the mapping/backfill plan with separate content migration implementation and verification |
| Existing customisations lost after update | Restore preserved complete package/customisations, move team conventions into project guidance, and compare package manifests before replacing owned folders |

## 11. Implementation sequence and completion criteria

### Implementation sequence

1. Read the docs repo's `AGENTS.md`, `README.md`, `handover/implementation-brief.md` and `handover/repository-decision.md`, noting which exported statements are historical. Preserve unrelated work and existing publication holds.
2. Capture Skills evidence from the pinned baseline: copy the current README, quickstart, migration/project guide, six skill files, three references and evaluation cases to a versioned reference location in the site. Record source/bundled paths, full SHA, snapshot kind and SHA-256 values in provenance. Preserve old evidence as historical or replace it through an explicit reviewed refresh with accurate metadata.
3. Fix confirmed active repository links and remove old standalone onboarding. Rewrite overview/install first, including status, exact command contexts, source rules and beta validation boundaries.
4. Implement the six skill pages with section 6 as the content brief. Add shared sources/tools/workflows/adoption/migration/troubleshooting pages. Keep user-facing copy independent of this implementation handover.
5. Update navigation and content inventory; connect format learning/examples/validation/visualisation pages to the relevant workflows without displacing the manual route.
6. Run the bounded trials in disposable projects and retain actual outputs. Use the existing site Article and Customer Story complete example sets where appropriate, not incomplete snippets treated as standalone repositories. Label all unrun host trials pending.
7. Regenerate content, run the site's normal checks/build/browser review, inspect generated/raw/search surfaces, and update provenance/inventory/review notes.
8. Deliver the reviewable site change and evidence using the normal repository workflow. Deployment and live URL checks are a separate completion claim requiring actual execution; this handover does not authorise or establish deployment.

### Commands for the website implementer

Run inside `cmmf-docs-web` with its own reviewed Node/npm environment:

```sh
npm ci
npm run source:check
npm run check
npm run build
npm run test:browser
node scripts/inventory.mjs
```

`build` includes source/example/beta checks, content generation, Astro output and internal link/version checks. Run `npm run handover:check` when verifying the preserved original handover archive; it verifies that old pack, not the new Skills source evidence. Do not regenerate historical hashes just to hide archive edits. If modifying Markdown processor settings, follow the site's cache invalidation instructions before validation.

### Acceptance checklist for the site change

- [ ] Both original tool URLs still work, and every new route is built, inventoried and discoverable.
- [ ] Active source/contribution/clone/edit/issue links use the correct repo and valid target paths.
- [ ] No active onboarding asks for CMMF provider keys, old `generate` commands, implicit sibling sources, npm publication or unavailable plugin installs.
- [ ] Historical references and `.cmmf-agent/` are retained only with their correct meaning.
- [ ] All six pages contain actionable inputs, prompts, process, expected outputs, verification and limits.
- [ ] Readers can build a complete package, install it in the selected host, check helper execution and run a bounded task.
- [ ] Version selection, exact cache/offline limitations and beta/future helper support are explicit.
- [ ] Format/graph validity, conventions, architecture quality and content/migration safety are clearly distinguished.
- [ ] Package manifests and Git source revision are recorded separately; no signed/released/host-certified status is invented.
- [ ] Plain generated Document output is supplemented with source/validation evidence and detailed field constraints where needed.
- [ ] Stable and beta editions do not accidentally rewrite tool compatibility statements.
- [ ] New pages, raw Markdown, `/llms.txt`, Pagefind/search, metadata and sitemap contain correct links and scope.
- [ ] No held editor material becomes public through new copy, generated raw content or diagrams.
- [ ] Existing complete examples and exact canonical downloads still pass checks.
- [ ] Mobile/desktop and both themes are visually inspected for new tables, code blocks, notices, diagrams, heading links and navigation; keyboard/search/contrast checks pass within the site's established review scope.
- [ ] Automated helper checks and actual host trial results are reported separately, including not-run/blocked cases.
- [ ] Site source/build/browser results and remaining limitations accompany the handoff; live deployment is claimed only with separate direct evidence.

For repository-wide migration searches, start with editable sources and active metadata. Review matches rather than running a global replacement:

```sh
rg -n 'cmmf-creation-agent|cmmf-agent|53cf3928|CMMF_SPEC_REPO_PATH|CMMF_AGENT_PROVIDER|CMMF_AGENT_MODEL|OPENAI_API_KEY|ANTHROPIC_API_KEY' src scripts reference handover README.md LICENSES.md source-provenance.json content-map.json astro.config.mjs
```

After the build, search `dist/` and generated raw outputs too. Old terms may legitimately appear on the labelled migration page; test active install instructions for retired commands separately. Check external URL destinations manually/with permitted network tools: the site's current internal-link checker does not verify every external destination.

## 12. Maintaining the documentation

Assign a Skills maintainer to workflow/runtime accuracy and a docs maintainer to site explanations/navigation. On each proposed Skills update:

1. Select the reviewed full source SHA and compare the package version, skill files, references, CLI/help, supported versions, dependency policy, test and evaluation changes.
2. Run `npm run check` in the matching source checkout and record environment, manifest/hashes and actual result. Do not copy an old test count from a milestone paragraph.
3. Refresh the site's Skills reference/provenance set as a separate source from its specification locks. If using working-tree content, archive exact bytes and record that status; a base SHA is insufficient.
4. Update affected skill pages, quickstart, migration, capability/support statements and examples together. Recheck official host setup docs with a date; host product support is independent of suite evaluations.
5. Repeat affected host trials, build/link checks and visual reviews. Update public evidence only to the level actually observed.

The website should remain buildable without sibling repositories or a live fetch of Skills/spec `main`. Link to immutable upstream evidence and preserve the source snapshot needed for the site's claims. Use normal build generation for public raw content and retrieval indexes, rather than manually maintaining a second copy.

## 13. Verification recorded for this handover

The evidence below records the original 20 October baseline. On 22 October, the version-support update passed `npm run check` with 14 tests and verification of all six standalone skill packages. Persona also passed the normal validate/document commands against 1.2.1 and the current local beta checkout. Source retrieval against the original beta tag preserved its older lowercase-only schema. The original baseline revision and results below are retained as historical evidence, not the current compatibility list.

On 20 October 2026, the Skills checkout at `68ec28d3993eb08298ebf9a896f6a9d51b425bf0` completed `npm run check` successfully using its existing installed dependencies:

- Clean TypeScript build completed.
- All **10 tests** passed, covering dependency policy, tolerant loading/diagnostics, rich text and cycles, source mismatch/unsupported semantics, path containment, semantic diff/defaults/dependents, project conventions, credential-free CLI/exit codes, and synthetic historical/cache retrieval.
- Dependency-policy verification passed.
- All six complete skill packages were assembled.
- Each package passed metadata/reference/hash and isolated credential-free inspect/validate/document/diff execution.

Execution environment: Node `v22.7.0`, npm `10.8.2`. The checked-in recommended contributor environment remains Node 22+ with pinned npm `11.11.0`; this run did not perform a fresh `npm ci` and does not establish clean-install verification under that pin. No dependency policy was changed for this run.

The package verifier uses a minimal synthetic canonical fixture. The automated source-history tests also use fixtures. Prior canonical integration results are recorded in `docs/implementation-progress.md`; they were not rerun as live canonical fetches here. No new host installation/discovery/behavioural evaluation, beta helper implementation, site build, site modification or production verification was performed while preparing this handover.

Official host installation paths were checked against the linked OpenAI, Anthropic and GitHub documentation on this date. All runtime contracts above were cross-checked against the local implementation as well as repository prose. Recheck source and site baselines when implementing if either has moved.
