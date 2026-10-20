---
name: cmmf-evolve
description: Analyse or implement changes to existing CMMF models with semantic diffs, dependent-model impact, and migration/backfill plans. Use for removals, splits, renames, constraint changes, or explicit spec upgrades; not live content transfer.
---

Make model evolution intentional, inspectable, and grounded in actual content constraints.

Read [source-resolution](references/source-resolution.md), [local-tools](references/local-tools.md), and [modelling-decisions](references/modelling-decisions.md). Capture isolated before/after repository snapshots without resetting or overwriting the user's work. Resolve and validate each version separately for explicit specification upgrades.

Use semantic diff to identify additive, breaking, and uncertain changes and incoming dependent models. Analyse content backfill, old-to-new field mappings, external consumers, translations, editorial workflow, retained IDs, and rollback/transition needs. Treat helper results as evidence; metadata/constraint changes require additional judgement and content sampling where available.

For a planning request produce the concrete model proposal and migration steps. For authorised implementation apply scoped model changes and validate the resulting repository. Resolve consequential breaking decisions only when the user has not already authorised them. Do not silently migrate an old manifest to latest, erase fields to satisfy a validator, or claim stored content has been migrated because the schema changed.

Deliver a semantic diff/impact report and an actionable sequence: preserve/map data, populate or backfill new structures, verify consumers/content, transition reads/writes, and retire old structures when authorised. State assumptions, missing content evidence, source revisions, and remaining checks.

Example: “Split customer details out of stories into reusable customers.” Propose identities and relationships, map existing embedded data, explain deduplication and ownership choices, validate the new model set, and identify the dependent consumers that need migration.
