# Continuous Remediation Progress

Updated: 2026-11-12

## Active tracks

| Track | Branch / commit | Current result | Next evidence needed |
|---|---|---|---|
| PR #27 review remediation | `task/final-remediation-audit` / `9646f075d892f23e23876a5573713e16735ed167` pushed to PR #27 | Removed PATH-resolved subprocess and `NaN` findings. Latest Sonar run `131070784266` failed on regex backtracking, missing sort comparator, 3.0% new-code duplication, and D Reliability Rating. Annotation fixes are local; focused suite is 20/20. | Commit and push the annotation fixes; recheck hosted Reliability Rating and duplication gate. |
| G3 run accounting | Same branch; derived by `audit-g3-run-accounting.mjs` | 79 summarized run IDs map to 79 run records. Five additional run records and one additional JUnit/Maven execution artifact are classified separately; JO-GAP-003 denominators are explicit. Two residual volume names associate with a Kanboard run ID, while four opaque IDs and historical Docker labels remain unverified. No Docker resource was touched. | Obtain trustworthy historical ownership/intent evidence if still available; do not infer it from missing metadata. |
| Active Claroline/Kanboard Maven revisions | `task/active-maven-credential-integration` / `31390d7021da34b0e54a424fd7590bbfcde06f51` in isolated worktree | Added credential-safe R3 source copies and registration manifests; both Maven `test` lifecycle compile phases passed with `-DskipTests`. No browser tests executed; candidates remain outside broad TestSuite. Commit not yet integrated/published. | Review isolated diff, then integrate through its own PR; runtime still needs verified app/WebDriver and fixture ownership. |
| Candidate behavior repair | `task/claroline-kanboard-r4` / `c3871b072f2e7a5c7f99c2b5c154977ed06a4b09` in isolated worktree | KB-GAP-001 R4 reopens a uniquely named task through the confirmed UI action and asserts the open badge plus `status:open` search. Registration/hash and traceability checks pass; status remains `NOT_RUN / PENDING_REVIEW / NOT_VALIDATED`. | Integrate into active Maven suite, compile, then obtain human review and authorized runtime evidence. |
| Evidence-driven metrics | `task/metrics-evidence-calculation` in isolated worktree | Evidence-driven RQ2/RQ3 implementation and positive/negative tests are in progress; current outputs remain blocked/partial where required attestations and runtime evidence are absent. | Finish candidate-level BLOCKED dispositions and CSV, then review and commit locally. |
| Live Gemini generation | `t01c-0d69a24e-5d54-42eb-bbf3-4bd44b7204cc` | One approved `gemini-3.8-flash` request ran within the configured 8,000-character/2,000-output-token/$0.04/60-second/zero-retry bounds. Provider returned a schema error (`expected object, received null`); no review packet or Java artifact was produced. Sanitized request/result evidence is under `docs/tasks/T01-C/evidence/t01c-0d69a24e-5d54-42eb-bbf3-4bd44b7204cc/model-calls/`. | No retry under the one-call authorization; RQ4 remains incomplete pending separate authorization for any additional live call. |
| G0/G3 Cloud runtime | Main workspace | Read-only check found no active `gcloud` account or configured project; no GCP VM list was available. No Cloud or Docker resources were created, started, stopped, or removed. | Requires an authorized active Cloud account/project and verified VM/app ownership before runtime work. |

## Current verified tests

- `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs` — 20/20 passed.
- `node --check docs/research-results/v2/replication/recompute-metrics.mjs` — passed.
- `node --check docs/research-results/v2/replication/audit-g3-run-accounting.mjs` — passed.
- `node docs/research-results/v2/replication/audit-g3-run-accounting.mjs` — derived 79/84/85 execution accounting.
- Maven Claroline and Kanboard `mvn -B -ntp -DskipTests test` — both passed in the isolated Maven worktree; Surefire tests were skipped.

## Acceptance state

The program remains `ACCEPTANCE_BLOCKED`. The 40 cases have not been semantically repaired or source-bound rerun; human oracle/novelty decisions are still unsigned; no active GCP account/project was available; RQ2/RQ3 evidence calculation remains incomplete; live successful Gemini generation and final manuscript/PDF validation remain unverified. No branch has been merged.
