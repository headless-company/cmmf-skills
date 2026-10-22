# Resolve the canonical CMMF source

The canonical repository is https://github.com/headless-company/content-model-master-format. Read the normative specification, schema, and relevant documents from one revision. Do not invent CMMF syntax from a CMS schema or an old example.

## Choose a version

- Existing repository: read `manifest.yaml` or `manifest.yml` and use its declared `specVersion`.
- New repository: use the latest published release unless the user specifies a version.
- Explicit historical version: retrieve that source; do not silently rewrite an existing manifest. Clarify an actual upgrade only if the user's intent leaves it unresolved.
- Numeric `specVersion: 1` denotes the original legacy format, not “any 1.x”. Resolve its historical schema; do not validate it against 1.2.0 while retaining the old version declaration.

## Retrieve and record

Released skill directories contain a local helper. Set `cmmf_skill_dir` to the absolute directory containing the active `SKILL.md`; use that path independently of the current working directory. Choose a writable source cache outside the target model directory, using the host's normal cache or temporary workspace. No additional LLM API keys are needed.

```sh
node "$cmmf_skill_dir/scripts/cmmf-tools/tools/cli.js" source --version latest --cache "$cmmf_source_cache" --format json
```

Replace `latest` with the manifest's declared version for an existing project. The result contains `source.root`, the resolved version/revision, hashes, and cache freshness. Use `source.root` for subsequent `--cmmf-repo` arguments; read the normative `specFile` and relevant `docs/` files there. A latest request refreshes upstream; an exact version reuses its cache when available. `--offline` requires an existing cached source and cannot establish that cached latest is still current.

The helper resolves matching version tags, or actual schema history when there are no matching tags. For untagged latest, it checks the version identified by the canonical README/schema at remote HEAD. It never pairs a historical spec file with a newer schema in the same checkout.

An explicit local checkout is also usable. Verify its schema version matches the requested model version and note relevant uncommitted source changes. Do not update the user's checkout or switch its branch without a request.

If Git/helper execution is unavailable but the host has another retrieval tool, retrieve the same version/revision and read the matching schema/spec/documents through that tool. Preserve source provenance. If network access fails, use an identified exact-version cached source if available. Otherwise explain what could not be retrieved; do not claim validation or freshness.

Resolve once per modelling task. Record source version/revision and actual validation evidence in the handoff. Changing upstream midway through a task defeats reproducibility. The helper recognises legacy `1`, `1.1.0`, `1.2.0`, `1.2.1`, and `1.3.0-beta.1` semantics. Explicit prerelease versions are supported, including offline cached snapshots. Latest prefers stable release tags; without them it uses the version at canonical remote HEAD, which may be a beta. Other versions still require reporting and separate verification of unsupported executable semantics.

The original `v1.3.0-beta.1` tag predates the ID casing fix merged into the beta branch. Its schema still requires lowercase IDs. Preserve the selected revision's rules; do not silently substitute the newer branch or relax its schema. An explicitly supplied current beta checkout can include the casing fix while retaining the same prerelease version string, so record hashes and revision as well as version.
