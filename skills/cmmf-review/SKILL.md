---
name: cmmf-review
description: Review CMMF models for content architecture, reuse, relationship intent, localisation, and editorial usability; provide prioritised findings grounded in actual fields. Use for content model review, not general code review.
---

Assess whether a valid model expresses useful intent for content practitioners and implementers.

Read [source-resolution](references/source-resolution.md), [local-tools](references/local-tools.md), and [modelling-decisions](references/modelling-decisions.md) as needed. Inspect the actual model files, project conventions, and available requirements. Establish schema/graph validity before treating modelling suggestions as the main findings.

Review boundaries, existing-model reuse, object/reference choice, ownership, repeatability, taxonomy/settings use, requiredness/localisation, rich-text capabilities, and editorial labels/help/validation. Tie each finding to a real editing or implementation consequence. Do not treat every cycle as invalid, every repetition as a reusable entity, or personal preference as a specification rule.

Return prioritised findings with model/field locations, evidence, impact, and a concrete improvement or unresolved decision. Separate blocking invalidity from convention violations and design tradeoffs. Mention sound decisions when useful for understanding the recommendations; don't manufacture findings to fill a quota.

A review request does not automatically request edits. If changes are also requested, apply only the authorised scope, validate it, and report the resulting diff. Breaking decisions require impact analysis and clarification only when not already authorised.

Example: “Review our customer-story model for editorial usability.” Examine how customer and quotes are owned/reused, whether authors can identify a story in the CMS, and whether required fields match the real publication workflow. Ground recommendations in the supplied files.
