# Local tool contract

The released runtime requires Node.js 22+; source retrieval additionally requires Git and permitted network access. It contains reviewed JavaScript dependencies and requires no npm install in the target repository. Run `node "<absolute-skill-directory>/scripts/cmmf-tools/tools/cli.js" --help` for the actual interface. The source checkout's `skills/` folders are authoring inputs; install the assembled folders under `release/skills/` so helpers and references are included.

Commands are noninteractive. Model repositories are read-only inputs. Use the host's normal file editor for authorised model changes; preserve unrelated work and YAML comments rather than formatting the entire repository.

```sh
node "$cmmf_skill_dir/scripts/cmmf-tools/tools/cli.js" inspect --repo "$cmmf_model_repo" --format json
node "$cmmf_skill_dir/scripts/cmmf-tools/tools/cli.js" validate --repo "$cmmf_model_repo" --cmmf-repo "$cmmf_source_repo" --format json
node "$cmmf_skill_dir/scripts/cmmf-tools/tools/cli.js" document --repo "$cmmf_model_repo" --cmmf-repo "$cmmf_source_repo"
node "$cmmf_skill_dir/scripts/cmmf-tools/tools/cli.js" diff --before "$cmmf_before_repo" --after "$cmmf_after_repo" --cmmf-repo "$cmmf_source_repo" --format json
```

Provide separately validated repository snapshots to `diff`; never reset the user's worktree to manufacture a baseline. For an intentional specification upgrade, add `--after-cmmf-repo` with the version-matched new source. The helper validates both sides before producing changes. It classifies removals, structure, effective requiredness/localisation, target/enum changes, ownership, and other metadata; uncertain changes need human/agent reasoning, not an automatic declaration of safety. Dependents include transitive incoming relationships.

Exit codes: **0** success; **1** invalid data or a diff with breaking/uncertain changes; **2** usage, source, or execution failure. A diff exit 1 is a review result, not a request to retry until all warnings disappear. JSON diagnostics contain stable `code`, `severity`, `file`, `path`, and `message`. Inspect may show an incomplete graph when parsing failed; check diagnostics before drawing conclusions.

Validation uses the chosen upstream JSON Schema plus separate manifest/graph checks: duplicate IDs, missing targets including rich-text embeds, object target kind, and label-field existence. The helper does not validate content entries or prove migration safety. Unknown future semantics are reported as unsupported. Model paths outside the selected repository and model symlinks are rejected rather than followed.

Project guidance is discovered from root `cmmf.instructions.{md,txt,yaml,yml}` files and text/YAML files under `.cmmf/` or legacy `.cmmf-agent/`. These are convention files, not model storage directories. Instructions are size bounded in inspect output: read the actual convention file if its content is truncated. User requests take precedence; conflicts with CMMF validity must be explained.

`document` prints Markdown with a relationship diagram and field dictionary only after validation. Save it to the requested destination with the host's file tool. It is a generated view; CMMF files remain authoritative. For detailed field constraints or rich-text/editorial needs, add explanations grounded in the original model data rather than treating the overview table as exhaustive.
