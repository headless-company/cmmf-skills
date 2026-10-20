---
name: cmmf-discover
description: Turn content briefs, workshop notes, and domain requirements into a CMMF modelling brief with entities, relationships, decisions, and material open questions. Use before schema authoring; not for generic product discovery.
---

Help the team make modelling intent explicit before encoding it as CMMF.

Read [modelling-decisions](references/modelling-decisions.md). When the task requires version-specific concepts or a draft model, resolve the authoritative format using [source-resolution](references/source-resolution.md). Use [local-tools](references/local-tools.md) to inspect an existing model repository if supplied.

Read the actual notes and current project conventions. Identify content concepts, their purpose, ownership, reuse, relationships, editorial workflows, and delivery needs. Separate evidence from inference. Reuse existing definitions when their meaning matches; do not force workshop language into platform-specific content types.

Produce a brief in the user's requested location or in the conversation if no file is needed:

- Candidate models and why each deserves a distinct boundary.
- Key fields and relationship intent, including embedded versus linked content and repeatability.
- Editorial/localisation/validation needs supported by the evidence.
- Decisions, consequential assumptions, and traceability to source notes.
- Unresolved questions whose answers change the model.

Ask only the most consequential unresolved questions; continue independent analysis while answers are pending. If the user also requests YAML, proceed into authoring using the resolved specification and validate the resulting artefacts. Do not require another installed skill to complete the workflow.

Example: “Turn these customer-story workshop notes into a modelling brief.” Identify story, customer, quote, and related products only where the notes justify them; explain which are reusable identities versus embedded structures, and expose unresolved quote ownership. Finish with a concrete brief the content team can review.
