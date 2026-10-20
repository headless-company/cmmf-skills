# Skills-first implementation progress

Updated: 2026-10-20. The repository now uses skills as its sole product workflow. Cross-host behavioural evaluation remains pending.

## Repository identity — 2026-10-20

The skills cutover was committed and pushed as `60689c4`. The GitHub repository has been renamed to [headless-company/cmmf-skills](https://github.com/headless-company/cmmf-skills), its description now identifies the skills and local tools, and this checkout's origin is `git@github.com:headless-company/cmmf-skills.git`. README, installation/migration guidance, and package repository metadata use the new source location. Historical agent names remain only where they explain migration or supported legacy conventions.

## Agent retirement — 2026-10-20

The user authorised the source cutover. The workspace is now `cmmf-skills` 0.2.0, with `cmmf-tools` as its only CLI entrypoint. Provider adapters, agent orchestration/prompts, old strict validation/rendering/types, API-key setup instructions/template, and obsolete tests/scripts have been removed. The raw-data-preserving tools and six skills are the replacement. Existing convention discovery, including `.cmmf-agent/`, is retained and covered through the new workflow.

The dependency graph is reduced to AJV/YAML plus TypeScript/Node development types; provider SDKs, Zod, `tsx`, and esbuild are removed. Retained dependency versions were not upgraded. Every build clears obsolete compiled output, and `npm run check` now includes standalone package assembly/verification. The release manifest records the product name/version.

The current shell has npm 10; offline lockfile regeneration and pruning used a one-command engine override without downloading/upgrading dependencies. The repository still pins npm 11 and preserves its supply-chain settings; CI uses that pinned version. Existing local credential files were not read or modified. A copy of the pre-cutover legacy files and edited onboarding documents was preserved under ignored `.tmp/agent-retirement-backup-2026-10-20/`.

Cutover verification: `npm run check` passes with 10 tests, dependency-policy checks, package assembly, and isolated runtime verification for all six skills. Regression coverage includes convention-file discovery and CLI success/failure exit codes without provider configuration. The package verifier also checks that retired compiled entrypoints are absent. `npm ls --depth=0` shows only AJV, YAML, TypeScript, and Node types; the regenerated lockfile retains nine dependency packages with no additions or retained-version changes. The new public API imports successfully, and `cmmf-tools` help exposes only local-tool commands.

The sections below retain the first milestone baseline and evidence from 2026-10-13; they are not new host-evaluation claims.

## Baseline

The pre-existing worktree included changes to README, project guide, prompt, repository discovery/tests, types, and a new prompt test. Those changes were retained. Project instruction discovery was extracted into a shared module without removing its existing conventions or tests.

The original TypeScript build passed. The test runner failed before executing tests because installed esbuild was darwin-arm64 while the active Node process was x64. The test runner now compiles with TypeScript and executes the emitted tests directly through Node. Dependency verification also uses compiled JavaScript. All 12 pre-existing tests pass through this path.

## Delivered

- A separate provider-free CLI with `inspect`, `source`, `validate`, `diff`, and `document`; human-readable/JSON diagnostics and explicit exit codes.
- Raw/tolerant model loading, aggregated parse failures, data preservation, repository path containment, and scoped project convention discovery.
- Whole-repository validation for duplicate IDs, missing relationship/object/rich-text embed targets, object target kind, and editorial label fields, alongside canonical schema validation.
- Manifest/source version matching including explicit legacy handling. An existing numeric legacy manifest cannot accidentally pass against the current 1.2.0 schema.
- Canonical source retrieval: latest/current resolution, historical schema snapshots, per-revision cache, offline reuse, source hashes, and detection of altered cached spec/schema files. The skill instructions use this retrieval as part of the normal workflow.
- Semantic diff with effective manifest defaults, repeatability aliases, additive/removed targets and enum values, ownership/structure changes, uncertain constraint/metadata changes, and transitive dependent models.
- Generated Markdown catalogues and Mermaid diagrams from the validated graph.
- Six core skill sources with portable metadata, scoped workflows, and maintained shared references.
- Independent skill packages with local JavaScript runtime/dependencies/license files, release file hashes, and a complete-suite archive. Installed usage needs no npm installation or additional LLM API keys.
- CI checks for package assembly and isolated skill execution, plus a behavioural evaluation checklist.

## Verification

- `npm run check`: build, 18 tests, and dependency-policy verification pass. The six new integration tests include source history/cache behaviour, malformed/invalid repositories, rich-text/cyclic references, path escapes, raw extension preservation, and semantic impact analysis.
- `npm run skills:package` and `npm run skills:verify`: package six skills, check metadata/references/hashes, and run inspect/validate/document/diff with each installed separately in a temporary directory outside this checkout. Provider keys, source path variables, and `NODE_PATH` are removed during those checks.
- Local canonical integration: four example models validate with no diagnostics against the clean sibling CMMF 1.2.0 source at `32604441aff09a6dbfe2361e97078af5263fd321`.
- Live canonical fetch: latest/current resolves to CMMF 1.2.0 at `6d501cd51a16d07522d367866d6c6ab40236d82d`. The same example repository validates against that fetched schema with no diagnostics. The live network check required sandbox network escalation; no credentials were added.
- The bundled skill-creator Python validator could not run because PyYAML is absent. The standalone package verifier checks actual YAML frontmatter, names/descriptions, local links, hashes, and executable behaviour using the repository's reviewed YAML dependency.

Build products are under ignored `release/`; source snapshots and test compilation are under ignored `.tmp/`. No global skills were installed and no existing model repository was edited during verification.

## Remaining gates

Tooling foundations, the six skills/packages, and source retirement are delivered. Remaining evaluation and capability work:

1. Installed-skill discovery and realistic model-authoring/review behaviour in Codex, Claude Code, and GitHub Copilot. Automated execution of helper files does not establish these host behaviours.
2. Broader canonical historical-format fixtures and modelling trials; historical retrieval and legacy handling currently have synthetic integration coverage, while canonical 1.2.0 has a live integration check.
3. Refinement of quality guidance and documentation views from those trials, including any required native host metadata/plugin packaging.
4. CMS import/translation target selection and later migration/fixture/board capabilities from the plan.

Suggested next slice: install the packaged author/validate/review skills in a disposable target project, execute the recorded realistic cases through each host available to the user, and use the resulting artefacts to refine the skills. The legacy agent is now retired.
