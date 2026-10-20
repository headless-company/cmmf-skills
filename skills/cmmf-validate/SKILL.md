---
name: cmmf-validate
description: Validate a CMMF model repository against its declared canonical version and check cross-model integrity; diagnose malformed YAML, duplicate IDs, missing targets, and requested repairs. Not a validator for stored content entries.
---

Establish whether the supplied repository is valid and explain actionable failures.

Read [source-resolution](references/source-resolution.md) to obtain a version-matched canonical source. Read [local-tools](references/local-tools.md) and run repository inspection and validation. Use the helper's actual exit codes and diagnostics; don't substitute an agent's visual reading of YAML for executable schema validation.

Report errors with file/model/field locations and practical fixes. Distinguish specification/graph errors from project-convention issues and modelling-quality suggestions. Include parse failures and incomplete-graph limitations. If a malformed manifest leaves the intended version unknowable, state that dependency rather than choosing latest silently.

When asked only to check, return findings. When repairs are requested, make scoped edits preserving intent, unrelated work, comments, and existing versions; rerun validation and inspect the final diff. Do not solve a missing target by inventing a model unless requirements establish its meaning.

If helpers are unavailable, use a genuinely available validator and the resolved schema where possible. State checks not performed. Unsupported future helper semantics or unavailable sources cannot be reported as full success. Record the source version/revision, command/result, remaining errors, and validation boundaries.

Example: “Check this repository and fix the errors.” Aggregate malformed YAML and missing rich-text embed targets, repair what the source intent determines, and ask about unresolved target intent while continuing independent repairs.
