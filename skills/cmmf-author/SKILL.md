---
name: cmmf-author
description: Create or extend portable CMMF manifest and model YAML from an agreed brief or natural-language requirements, respecting existing models and project conventions. Use for greenfield or scoped model edits; not CMS schema translation.
---

Create valid, reviewable CMMF while preserving modelling intent and existing work.

Read [source-resolution](references/source-resolution.md) first and retrieve the required canonical revision. Read its normative specification and task-relevant docs. Use [local-tools](references/local-tools.md) to inspect the repository and [modelling-decisions](references/modelling-decisions.md) for substantive modelling choices.

Inspect existing models and convention files before editing. Keep stable IDs and reuse existing structures where meanings match. For a new repository, choose the latest published version unless the user requests another; write an explicit versioned manifest and the model files in its declared directory. For existing repositories, preserve their declared version unless an upgrade is requested.

Ask only about unresolved decisions that materially change the schema: embedded versus independently reusable content, ownership, repeatability, enum values, localisation, requiredness, or ambiguous model reuse. Keep decisions and assumptions concise.

Apply authorised scoped edits through the host's editor. Preserve unrelated files, comments, and working changes. Do not introduce a mandatory confirmation step for ordinary requested local edits. Before an unrequested breaking decision, prepare the concrete diff/impact explanation and resolve that decision with the user.

Validate the complete resulting repository against the selected source, not just the new model. For existing repositories compare isolated before/after snapshots with semantic diff. Fix errors attributable to the requested work; distinguish pre-existing findings. Report changed files, modelling rationale, and actual validation evidence or its precise limitation.

Example: “Add reusable authors to articles.” Reuse an existing person model if it represents authors, add the reference with clear repeatability/ownership, and verify the target exists. Add practical editorial metadata where supported by the request or conventions; avoid inventing governance or CMS hints.
