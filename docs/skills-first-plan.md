# CMMF Skills: repository transformation plan

Status: skills source cutover complete on 2026-10-20; host behavioural evaluation and later capabilities remain open. See [implementation progress](implementation-progress.md) and [migration notes](migration.md). This document records the original transformation design.
Date: 2026-10-13.

## Product direction

Transform this repository into **CMMF Skills**: an installable suite that teaches an existing coding agent to discover, create, review, explain, and evolve portable content models. Initial hosts are Codex, Claude Code, and GitHub Copilot. Other hosts can follow through the same portable skill format and explicit compatibility testing.

The host supplies the model, authentication, conversation, file access, and execution permissions. This repository supplies CMMF knowledge, modelling workflows, examples, and deterministic helpers. Users need no additional LLM API keys for these skills; the host's normal access requirements and usage limits still apply.

CMMF remains the contract of modelling intent. CMS configuration, generated documentation, and visualisations are derived outputs. The suite should help practitioners reason about content, not merely generate YAML or turn every modelling decision into a platform implementation choice.

## Original agent baseline and planned changes

At planning time, the application had three commands: `generate`, `inspect`, and `validate`. Generation runs an OpenAI or Anthropic adapter through a bounded clarification/synthesis loop, validates a change set, blocks selected breaking changes, and previews YAML before writing. Repository discovery also loads local modelling instructions and builds a relationship/object graph.

| Existing element | Proposed treatment |
| --- | --- |
| `src/cmmf/repo.ts` | Reuse discovery and graph concepts; separate loading raw files from validation so malformed repositories can still be diagnosed. |
| `src/cmmf/validate.ts`, `src/types.ts` | Align with supported canonical releases; separate specification errors from project policy and quality advice. Add whole-repository validation. |
| `src/cmmf/source.ts` | Retain provenance and local-source support; replace implicit newest-spec selection and sibling-path assumptions with explicit version resolution. |
| `src/cmmf/render.ts` | Retain deterministic output where useful; preserve all supported data and avoid rewriting unrelated files or comments during small edits. |
| `src/cmmf/safety.ts` | Evolve into semantic change analysis with additive, breaking, and uncertain outcomes, plus dependent-model impact. |
| `src/agent/prompt.ts` | Extract useful modelling decisions into skill instructions and references; discard provider-specific tool-call rules. |
| `src/agent/controller.ts`, `src/agent/normalize.ts` | Move useful domain logic into helpers. Retire provider orchestration and response repair once equivalent skill workflows work. |
| `src/providers/*`, provider configuration | Remove LLM clients, API-key setup, model selection, and provider dependencies at migration completion. |
| `src/cli.ts` | Replace interactive generation with noninteractive local inspection/validation/diff/documentation helpers. Natural-language authoring belongs to the host. |
| Tests and dependency policy | Preserve useful coverage and existing supply-chain constraints; update tests around the new tool and release boundaries. |
| README and project guide | Rewrite around installation, workflows, supported hosts/spec versions, and troubleshooting. |

There are existing uncommitted changes in the README, project guide, prompt, repository loader/tests, types, and a new prompt test. Preserve and reconcile these when implementation starts; do not reset the worktree.

### Foundational gaps identified during planning

- The sibling canonical checkout identifies CMMF **1.2.0**, while `manifestSchema` accepts only numeric `specVersion: 1`. Its normative spec uses the string `"1.2.0"` and describes numeric `1` as legacy compatibility.
- CMMF 1.2.0 supports `richTextConfig`, including reference embeds. The current strict field type rejects it and the renderer has no representation for it. The repository graph also needs rich-text embed edges.
- Validation checks individual shapes but does not currently resolve targets across the complete repository or detect duplicate model IDs before inserting them into a map.
- Parsing can throw before validation gathers useful diagnostics. Inspection and repair need to work with incomplete or invalid inputs.
- The safety check compares sorted targets by position, which can reject a legitimate additive target. Some effective-default changes and removed relationship metadata also need closer analysis.
- Helpers must distinguish a legacy format, a supported current version, an unsupported version, and a project-specific convention. Local restrictions must not silently become the CMMF specification.

The canonical checkout inspected was clean at revision `32604441aff09a6dbfe2361e97078af5263fd321`. This is planning evidence, not an automatic decision to adopt every future upstream change.

## Proposed skills and deliverables

Start with six focused skills. Each has a distinct trigger and produces concrete, reviewable files or findings. References shared during development are assembled into independently installable skill folders at release time.

| Skill | Typical request | Deliverable |
| --- | --- | --- |
| `cmmf-discover` | “Turn these workshop notes into a content modelling brief.” | Candidate entities, relationships, editorial needs, decisions, assumptions, source traceability, and the few unanswered questions that materially affect structure. |
| `cmmf-author` | “Create these models” or “Extend this existing model.” | Valid manifest/model YAML, reuse of existing structures, concise rationale, scoped diffs, and validation evidence. Covers greenfield bootstrap and additive edits. |
| `cmmf-validate` | “Check this repository” or “Fix these CMMF errors.” | Structured specification/graph diagnostics, proposed or requested repairs, and a rerun that verifies the resulting repository. |
| `cmmf-review` | “Review this model for modelling quality and editorial usability.” | Prioritised findings grounded in actual fields and relationships, with tradeoffs and proposed improvements. Distinguishes invalid data from judgement calls. |
| `cmmf-document` | “Explain this model to the content team.” | A model catalogue, field dictionary, and Mermaid diagrams generated from the actual graph. Include ownership, repeatability, embedding, and model kind. |
| `cmmf-evolve` | “Split this model” or “What breaks if we make this required?” | Semantic before/after diff, dependent-model and content impact, migration steps, and requested model changes with explicit treatment of breaking decisions. |

Useful review topics include object versus reference, reuse versus excessive fragmentation, taxonomy, singleton/settings use, editorial labels and help text, localisation, validations, rich-text capabilities, and ownership. Do not prescribe one universal model shape or invent governance requirements.

### Later capabilities

| Capability | Purpose and scope |
| --- | --- |
| `cmmf-import` | Convert supplied legacy/CMS schema exports into draft CMMF, retaining source identifiers and a mapping/uncertainty report. Begin with exported files rather than live credentials. |
| `cmmf-translate` | Produce implementation files for a named CMS and a decisions/loss report. Use explicit strict-preservation versus platform-optimised modes; support one verified target first. |
| Content migration mapping | Map legacy content fields to the agreed future model, including transformations, required-value gaps, unresolved ownership, and reconciliation checks. Schema changes alone do not migrate entries. |
| Fixture generation | Produce representative valid and invalid content examples for implementation checks, with a separate documented content-fixture contract. CMMF schema validation alone does not validate content instances. |
| Workshop board exports | Extend the same graph into a portable board representation. Add Miro/FigJam integration only when there is a concrete supported import or API path. |
| Project convention setup | Help establish local naming, editorial, localisation, and review conventions in existing CMMF instruction files. Keep this in author/review initially; split it only if real usage justifies another skill. |

CMS target selection remains open. Choose it from an actual project and available schema fixtures, rather than claiming broad CMS support from generic instructions. Live CMS writes, full content transfer, and a visual editor are separate future projects.

## Architecture and packaging

Use three layers:

1. **Portable skills:** concise `SKILL.md` instructions, precise descriptions, task-specific references, and useful templates. The agent can conduct discovery/review without a helper runtime.
2. **Deterministic local tooling:** TypeScript development code, with a tested distributable JavaScript bundle for schema validation, graph inspection, semantic diff, and generated documentation. Node is required for these operations; LLM SDKs are not.
3. **Host packaging:** installation instructions and optional native metadata/plugin manifests generated from one maintained skill source. Host-specific invocation syntax stays outside the portable workflow.

Proposed development layout:

```text
skills/
  cmmf-discover/SKILL.md
  cmmf-author/SKILL.md
  cmmf-validate/SKILL.md
  cmmf-review/SKILL.md
  cmmf-document/SKILL.md
  cmmf-evolve/SKILL.md
references/                 # maintained shared source; bundled where needed
src/cmmf/                   # reusable parsing, graph, validation, diff, rendering
src/tools/                  # noninteractive command entrypoints
scripts/                    # build, package and package verification
tests/fixtures/             # valid, invalid and legacy repositories
evals/                      # realistic user requests and outcome criteria
docs/                       # install, compatibility and maintainer guidance
```

Release each skill as a complete directory. A copied skill must not depend on `../../references`, this checkout, a sibling repository, another installed skill, or an undeclared global command. Bundle the relevant references and local helper under the skill where needed. Shared source stays central for maintenance; generated release copies are checked for consistency. If duplicated bundles become costly, introduce a versioned shared tool package later with an explicit dependency contract.

The proposed helper bundle should run after extraction without an npm install inside a user's target repository. Keep source dependencies reviewed and locked during development. Generate command examples only once the real entrypoint and flags exist.

### CMMF source policy

- The canonical CMMF repository remains the authority. Skills instruct the host to retrieve the required specification, schema, and relevant reference documents directly; do not vendor a frozen specification as the default source.
- For an existing repository, resolve the manifest's declared CMMF version. For a new repository without an explicit version requirement, resolve the latest published release; if upstream has no release/tag convention, use the version identified as current by the canonical repository and record the exact commit. Do not equate the highest-numbered file on a development branch with a published release.
- An explicit user version requirement takes precedence for the requested operation. If it differs from an existing manifest, distinguish a comparison/upgrade request from ordinary editing; do not silently migrate the repository. Treat numeric legacy `1` separately and document its mapping to a canonical historical source rather than assuming it means the latest 1.x release.
- Resolve one canonical revision per task and read its specification, schema, and relevant documentation together. Record that version and commit in validation evidence so the outcome can be reproduced even when “latest” changes later.
- Cache retrieved sources by version/revision in a documented cache outside model directories. Reuse an exact-version cache when available; check upstream freshness when the request requires latest. Support an explicit local checkout override and report its revision and any relevant uncommitted changes.
- Source retrieval is part of the normal skill workflow, subject to host network access and permissions. A missing connection can fall back to an explicitly identified cached source; if latest cannot be checked, state that limitation. Do not claim validation when the required schema/source is unavailable.
- Keep helper compatibility separate from source freshness. Loading a newer schema must not cause older parsers, renderers, graph logic, or diff rules to drop unfamiliar data or falsely claim complete support. Preserve unknown data where practical and report unsupported semantics explicitly. Maintain tested helper-version coverage without forcing the skill's modelling knowledge to stay frozen at that coverage.
- Check source provenance and redistribution terms for cached or packaged resources. Avoid assuming release tags or old-version paths exist; resolve them from actual upstream history.

### Helper contract

Provide human-readable and JSON output, stable issue codes, file/model/field locations, documented exit codes, and explicit target/source paths. Commands should be noninteractive and usable from CI. Aggregate parse, manifest, model, and graph problems rather than stopping at the first bad model.

Whole-repository checks should include duplicate IDs, missing reference/object/embed targets, object target kind, and specification-defined relationship constraints. Detect cycles for review, but do not universally reject them: linked references can validly be cyclic. Handle effective manifest defaults in semantic diff. Keep project-policy checks and heuristic quality warnings distinct from specification errors.

Use generated graph outputs for documentation so diagrams cannot quietly invent or omit relationships. Ensure manifest model paths, model IDs, and symlinks cannot accidentally direct helper writes outside the selected output scope.

## Cross-agent support

All three named coding hosts document directory-based skills. Use the shared `name`/`description` frontmatter and ordinary Markdown/resources as the portable baseline. Support is an installation and behavioural test commitment, not a promise of identical agent decisions.

| Initial host surface | Project location | Personal location |
| --- | --- | --- |
| Codex local coding environments | `.agents/skills/` | `~/.agents/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| GitHub Copilot CLI / VS Code agent mode | `.github/skills/` | `~/.copilot/skills/` |

These are documented choices, not exhaustive discovery lists. Copilot also documents `.agents/skills` and `.claude/skills` for project skills. Test exact host versions and surfaces before claiming release support. Plain Claude chat, Cowork, Copilot cloud/review surfaces, and other agents require separate packaging/runtime checks.

Begin with manual directory installation, individual skill selection, and a complete-suite release archive. Verify invocation and helpers outside this checkout. Add native plugin bundles where they improve suite installation; OpenAI currently recommends plugins for reusable distribution, and Claude Code also supports plugin skills. Plugin packaging must use the same maintained content rather than diverging implementations.

Do not build a bespoke installer until manual installation exposes a concrete problem. If added, it should support project/personal scope, preview, selective install, versioned updates, and safe uninstall without replacing user-maintained files. Prefer copies for portable releases; development symlinks remain optional.

## Workflow and change behaviour

An ordinary end-to-end request should work as follows:

1. Read the supplied requirements, existing CMMF files, and applicable project conventions.
2. Retrieve or reuse the appropriate canonical specification revision and inspect the relevant models and relationships. Default new models to the latest published version; existing models retain their declared version unless an upgrade is requested.
3. Ask only about unresolved decisions that materially affect the model; record consequential assumptions and reuse user answers.
4. Draft or edit the requested artefacts within the user's scope. Reuse existing IDs and models when appropriate.
5. Run specification and whole-repository checks; inspect semantic diff for changes to existing models.
6. Report the result, modelling choices, unresolved questions, and actual validation evidence.

Separate proposals from authorised application. A request to create/edit files permits scoped local work under host permissions; do not preserve the old CLI's mandatory yes/no prompt for every write. For a breaking change, prepare a concrete diff and impact assessment, then confirm consequential decisions only if the request did not already authorise them. Live external changes remain governed by the user's request and host permissions.

Preserve unrelated working changes and existing conventions. Keep instructions separate from supplied workshop notes, schema exports, and model descriptions. When local conventions conflict with the supported spec, explain the conflict rather than manufacturing a new dialect.

## Implementation sequence

| Phase | Concrete work | Completion gate |
| --- | --- | --- |
| 0. Baseline and contracts | Preserve current work; run existing checks; capture representative inputs; define supported versions, issue/output contracts, skill boundaries, and retirement path. | Recorded baseline, fixtures, compatibility targets, and agreed core release scope. |
| 1. Extract and align tooling | Decouple CMMF logic from provider types; fix 1.2.0/legacy handling and rich text; add tolerant loading, graph validation, semantic diff, and reproducible local bundles. | Helpers run without provider credentials and correctly diagnose valid/invalid/legacy fixture repositories. |
| 2. Build core skills | Author six skills and bounded references; adapt existing instruction discovery; add templates, doc/diagram generators, and realistic workflow examples. | End-to-end discovery, authoring, validation, review, documentation, and evolution scenarios produce usable artefacts. |
| 3. Package and prove portability | Build standalone folders/archives; document install/update/remove; test clean project and personal installs in the three hosts; add native packaging as needed. | No broken references or checkout assumptions; host/version matrix has actual discovery, invocation, and helper evidence. |
| 4. Retire standalone agent | Remove provider SDKs, API-key requirements, model config, interactive generation loop, and obsolete tests; rewrite README/guide and CI; update product/package names. | Default onboarding is install skill → ask host → inspect artefact; useful prior capabilities survive without an extra LLM account setup. |
| 5. Expand from real use | Add file-based import, one CMS translator, migration mapping, and further outputs based on project evidence. | Each new capability has real fixtures, mapping/loss reporting, and independently verified output. |

The original plan made phases 1–3 dependencies of retiring the old product. On 2026-10-20 the user authorised the source cutover; retirement is now complete while host behavioural evaluation remains open. New deterministic code and skills can replace the old path incrementally; avoid maintaining two full products after the cutover. Renaming the hosted repository and published package is a release decision after compatibility and migration guidance are ready.

## Validation and definition of done

Automated CI should cover specification conformance, graph integrity, change classification, data-preserving parse/render behaviour, generated documentation, and portable release packaging. Preserve dependency-policy checks. Skill linting verifies metadata and links; it cannot establish modelling competence.

Use realistic evaluation cases with observable criteria:

- Bootstrap an article/author/SEO model set from a clear request without unnecessary questions.
- Derive a Customer Story brief/model from workshop notes while exposing genuinely unresolved ownership or reuse decisions.
- Extend an existing project while following a supplied `internal_name` convention and preserving unrelated changes.
- Diagnose malformed YAML, a missing target, duplicate IDs, and a rich-text embed with a bad target in one report.
- Accept a valid 1.2.0 rich-text model; handle a legacy numeric manifest according to the documented compatibility policy.
- Accept an added reference target; classify optional-to-required using effective defaults and identify dependent models for a removal/split.
- Generate documentation whose IDs and edges match the source graph.
- Install one released skill by itself into a clean target directory and run it without this checkout, sibling repositories, or LLM API-key variables.
- Repeat representative author/review/validation flows in Codex, Claude Code, and Copilot. Record host/model versions and outputs; judge semantics and evidence, not exact wording.
- Verify that a workflow with unavailable tools states its validation limitation instead of claiming success.
- Resolve latest for a new project, the declared historical version for an existing one, and an explicit requested version without silently changing a manifest. Verify cache reuse, source-revision evidence, and honest handling of unavailable network/source or unsupported helper semantics.

The first skills release is done when the six core workflows work, supported CMMF versions are explicit, all named host claims are evidenced, ordinary usage needs no additional provider credentials, and installation does not require users to understand the retired agent architecture. Do not make every CI run depend on paid LLM calls; conduct host behavioural evaluation during milestones/releases using available authorised environments.

## Recommended defaults and open choices

Recommended: **CMMF Skills** as the product name, six core skills, Node-based deterministic tooling, on-demand canonical spec retrieval with versioned caching, project and personal installation, and CMS translation after the core release.

Still to choose: final hosted repository/package names; which CMS is the first import/translation target; how much legacy-version support real projects require; and whether native plugin bundles belong in the first public release or the next packaging milestone. These do not prevent starting the foundational work.

The source cutover and provider-free foundations are delivered. Next work is installed-skill behavioural evaluation and refinement, followed by import/translation capabilities chosen from real projects.

## Sources checked

Host documentation was checked on 2026-10-13; discovery paths and packaging guidance may change.

- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) — skill format, Codex discovery paths, progressive disclosure, and plugin distribution guidance.
- [Claude Code: Extend Claude with skills](https://code.claude.com/docs/en/skills) — project/personal installation, supporting files, and host-specific versus portable features.
- [GitHub: Adding agent skills for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) — supported skill directories and skill structure.
- [Agent Skills specification](https://agentskills.io/specification) — portable metadata and resource layout.
- [Canonical CMMF spec at inspected revision](https://github.com/headless-company/content-model-master-format/blob/32604441aff09a6dbfe2361e97078af5263fd321/spec/cmmf-v1.2.0.md) — versioned manifest, rich text, relationships, and source intent; read from the local canonical checkout.
- Local implementation evidence: `src/types.ts`, `src/cmmf/{repo,source,validate,safety,render}.ts`, `src/agent/{prompt,controller}.ts`, `src/cli.ts`, package metadata, and project documentation.
