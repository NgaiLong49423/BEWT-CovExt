# Security and Provenance Audit

## Provenance

- Current outer repository baseline: `da6399536ff75a1edf4417819eb4d166cc1d781c`.
- Nested BEWT source baseline: `0501249ff3e9a5ea83a06155cd2971dc36197056`; pre-existing generated build/Gradle files are dirty. No reset, cleanup, or edits were performed there.
- G0/G3 run records do not record the source commit, test source hash, image digest, runtime manifest, Java version, or Docker version. G3 records also use `g0-<app>` task labels.
- Dataset Java source SHA-256 mismatches the actual class for JO-GAP-004; its `registration.json` hash matches the observed file instead.
- `extension/expresscart` manifest lacks `imageDigest`.

## Credential scan

A secret-safe lexical scan of 4,049 tracked files found 61 credential-shaped login call lines: 51 under `experiments/claroline/bewt-suite`, five Claroline Revision 2 extension artifacts, and five framework code-template lines. The 51 active-suite lines include the five Claroline candidate R2 copies; remaining legacy test lines need per-use classification. A separate token-pattern pass found no cloud/GitHub/Slack token-pattern matches and one test-fixture private-key header pattern. These are lexical matches, not proof that every match is a live credential. Values are intentionally omitted from this report.

GitHub Secret Scanning is enabled for the public repository and its alerts endpoint returned no alerts at the time of review. Local `gitleaks`, `trufflehog`, `detect-secrets`, and `secretlint` commands were unavailable, so the lexical scan does not substitute for those scanners or prove the history is secret-free. The scan does not establish whether any test value is used outside disposable fixtures. Preserve historical extension Revision 2 artifacts; assess rotation privately for any value confirmed to be live or reused outside the benchmark.

Security-only Revision 3 copies were created for five Claroline and five Kanboard candidates. Their active Maven copies and registration manifests were added on `task/active-maven-credential-integration`; both suites compiled with tests skipped, and all ten normalized source hashes matched. No R3 browser test was run, and the R3 semantic defects remain. The candidate R2 copies remain historical and unchanged; the five Claroline active R2 copies still contain credential-shaped login calls pending follow-up. No equivalent credential literals were found in PrestaShop test login calls; its generated classes pass shared `adminMail`/`adminPsw` variables.

No credential values were printed in audit output. No secrets or local environment files were staged or committed.
