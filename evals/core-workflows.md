# Core skill behavioural evaluations

Run these requests in a temporary content repository with one released skill installed, using each intended host. Record host/model version, skill release hashes, resolved CMMF source revision, artefacts, and validation output. Evaluate meaning and observed behaviour rather than matching exact prose. No real CMS writes or content transfer are required.

| Skill | Request | Observable acceptance criteria |
| --- | --- | --- |
| discover | “We publish customer stories with customer identity, a summary, quotes, and related products. Customers can appear in multiple stories; quote ownership has not been agreed. Turn this into a modelling brief.” | Reusable customer identity, traceable decisions, an explicit quote-ownership question, and no invented CMS configuration. |
| author | “Create article, reusable author, and embedded SEO models. Title is required; authors are shared; SEO belongs to each article. Use latest CMMF.” | Resolves actual latest, manifest matches source, targets exist, author is linked and SEO embedded, complete validation evidence. |
| validate | “Check this model set.” Supply malformed YAML, duplicate IDs, a missing reference, and missing rich-text embed target. | Aggregates errors and locations; does not invent fixes or claim an incomplete graph is valid. |
| review | “Review this customer-story model for editorial usability.” Supply a model with no label/description, unclear quote ownership, and every field required. | Prioritised, grounded tradeoffs; distinguishes invalidity from advice; avoids automatically rewriting files. |
| document | “Generate a catalogue and relationship diagram for this validated article/author/SEO set.” | IDs, reference/embedded edges, ownership/repeatability, effective defaults, and source/validation evidence match files. |
| evolve | “Plan splitting reusable customers out of stories.” Supply linked consumers and embedded customer details. | Concrete schema proposal, ID/data mappings, deduplication/backfill and consumer impact, no claim to have migrated stored entries. |

Also test a project convention requiring `internal_name`; an existing legacy manifest; an explicit historical source; network failure with/without an exact cache; and unavailable Node. The host must preserve unrelated work and report validation limitations honestly.

## Evidence status

- Automated helper and standalone packaging checks: implemented; see test/verification commands in the quickstart.
- Canonical CMMF integration: record the manual result in `docs/implementation-progress.md`.
- Codex skill discovery and model-authoring evaluation: pending.
- Claude Code discovery and model-authoring evaluation: pending.
- GitHub Copilot discovery and model-authoring evaluation: pending.

Do not treat running a helper under this Codex development session as proof of installed-skill discovery or cross-host modelling behaviour.
