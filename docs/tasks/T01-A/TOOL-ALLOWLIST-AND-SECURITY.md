# T01-A — Tool Allowlist and Security Contract

## Fixed tool surface

`ToolRequest` is a discriminated union containing only: `read-baseline-inventory`, `validate-gherkin`, `read-approved-manifest`, `generate-source-artifact`, `compile-maven-project`, `run-selenium-test`, `prepare-fixture`, `collect-test-evidence`, and `cleanup-experiment`.

There is no shell/command tool. `parseToolRequest` rejects unknown tools, unexpected fields (including `command` and Maven selectors), malformed revisions, invalid fully qualified Java class names and unsafe paths. A T01-B dispatcher must map each discriminator to a fixed implementation and never interpolate model-authored command strings.

## Authorization enforced by `authorizeToolRequest`

1. Manifest, workflow and request app IDs agree.
2. Source commit agrees across manifest, workflow and request; candidate source version matches the manifest package or benchmark version.
3. Tool is listed in the manifest allowlist.
4. Docker manifests must pin both an image reference and a 64-hex SHA-256 digest; fixture prepare/cleanup tools must be present in the allowlist.
5. Paths use normalized repository-relative POSIX syntax with no absolute path, drive prefix, backslash, `.` or `..`, and lie under a configured trusted root. This is lexical validation only. Realpath/symlink containment, file integrity and ownership are explicitly unverified until the T01-B runtime dispatcher checks them immediately before access.
6. Candidate ID/revision match the active candidate. Selenium requests include a generated artifact path and class; the policy requires an exact matching `generated_java` artifact record bound to that candidate ID/revision and class.
7. Compile/Selenium project paths must equal the reviewed manifest `baseSuitePath`; the model cannot select a different Maven project beneath a broad app root.
8. Generation, compile, E2E, fixture preparation and cleanup require an applied human `ACCEPT` for that exact revision.
9. Tool-specific workflow states constrain fixture, compile and E2E calls. Cleanup remains available in `BLOCKED`/`FAILED` states for an already approved candidate.
10. Fixture preparation/cleanup experiment key matches manifest ownership.
11. Repair attempts are integers 0–2; `startRepair` increments and enforces the bound.

Manifest, state, candidate and allowed roots are trusted host inputs. T01-B must derive them from reviewed configuration, never model output. T01-A checks lexical paths; the runtime dispatcher must resolve symlinks/real paths and verify containment immediately before filesystem access.

## Data handling

- `parseToolResult` validates outcomes and evidence; output sanitization redacts common email, token/bearer and credential-value patterns.
- Do not log environment values, user data, raw database rows or unfiltered process output.
- Cleanup is a fixed adapter operation scoped by the manifest experiment key; no global Docker prune or cross-project database operation is defined.
- T01-A does not execute tools, authenticate reviewers, resolve filesystem realpaths/symlinks, verify Docker ownership, or prove sanitization covers all secret formats.

## Adversarial tests

`framework/test/contracts.test.ts` rejects path traversal, unsupported command fields, invalid class names, candidate/artifact/class mismatches, wrong revisions, unknown tools, wrong source/app pins, non-allowlisted actions, unapproved generation, wrong experiment ownership and repair-limit overflow. These are policy unit tests, not a security assessment of an actual dispatcher.
