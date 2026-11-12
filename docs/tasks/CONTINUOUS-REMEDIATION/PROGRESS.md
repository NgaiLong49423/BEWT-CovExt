# Continuous Remediation Progress

Updated: 2026-11-12

## Active tracks

| Track | Branch / commit | Current result | Next evidence needed |
|---|---|---|---|
| PR #27 review remediation | `task/final-remediation-audit` / base HEAD `acfe1272b3af00350ca929a4e4b69aa97c7c7508` | Retrieved hosted Sonar issues `javascript:S4036` (PATH-resolved `git` execution) and `javascript:S7773` (`NaN`). Removed subprocess and fixed numeric sentinel; 17/17 focused metrics tests pass. Acceptance matrices now separate historical false-PASS defects from current fixes and remaining RQ2/RQ3 incompleteness. | Commit and push these changes; obtain a fresh hosted SonarCloud `A` Security Rating. |
| G3 run accounting | Same branch; derived by `audit-g3-run-accounting.mjs` | 79 summarized run IDs map to 79 run records. Five additional run records and one additional JUnit/Maven execution artifact are classified separately; JO-GAP-003 denominators are explicit. Two residual volume names associate with a Kanboard run ID, while four opaque IDs and historical Docker labels remain unverified. No Docker resource was touched. | Obtain trustworthy historical ownership/intent evidence if still available; do not infer it from missing metadata. |
| Active Claroline/Kanboard Maven revisions | `task/active-maven-credential-integration` / `31390d7021da34b0e54a424fd7590bbfcde06f51` in isolated worktree | Added credential-safe R3 source copies and registration manifests; both Maven `test` lifecycle compile phases passed with `-DskipTests`. No browser tests executed; candidates remain outside broad TestSuite. Commit not yet integrated/published. | Review isolated diff, then integrate through its own PR; runtime still needs verified app/WebDriver and fixture ownership. |
| Candidate behavior repair | `task/claroline-kanboard-r4` in isolated worktree | Source review identified correct controller actions and scenario mismatches; implementation work is in progress. No review decisions or runtime outcomes inferred. | Complete first R4 vertical slice, then compile via active suite and continue by application/candidate. |
| Evidence-driven metrics | `task/metrics-evidence-calculation` in isolated worktree | Baseline requires a defensible UBU denominator and source-bound G3 evidence; metrics changes pending. | Add evidence-driven RQ2/RQ3 computation and positive/negative state-transition tests without changing present `BLOCKED` results. |
| G0/G3 Cloud runtime | Main workspace | Read-only check found no active `gcloud` account or configured project; no GCP VM list was available. No Cloud or Docker resources were created, started, stopped, or removed. | Requires an authorized active Cloud account/project and verified VM/app ownership before runtime work. |

## Current verified tests

- `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs` — 20/20 passed.
- `node --check docs/research-results/v2/replication/recompute-metrics.mjs` — passed.
- `node --check docs/research-results/v2/replication/audit-g3-run-accounting.mjs` — passed.
- `node docs/research-results/v2/replication/audit-g3-run-accounting.mjs` — derived 79/84/85 execution accounting.
- Maven Claroline and Kanboard `mvn -B -ntp -DskipTests test` — both passed in the isolated Maven worktree; Surefire tests were skipped.

## Acceptance state

The program remains `ACCEPTANCE_BLOCKED`. The 40 cases have not been semantically repaired or source-bound rerun; human oracle/novelty decisions are still unsigned; no active GCP account/project was available; RQ2/RQ3 evidence calculation remains incomplete; live successful Gemini generation and final manuscript/PDF validation remain unverified. No branch has been merged.
