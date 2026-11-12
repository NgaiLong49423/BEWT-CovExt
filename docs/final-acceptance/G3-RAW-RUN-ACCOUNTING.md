# G3 Raw Run Accounting

## Reproducible counts

Run `node docs/research-results/v2/replication/audit-g3-run-accounting.mjs` from the repository root. The script derives run IDs from the consolidated summary, enumerates run records and Surefire XML, and cross-references Maven and cleanup artifacts.

| Evidence class | Count | Classification |
|---|---:|---|
| Run IDs explicitly listed in the consolidated 40-candidate summary | 79 | Primary reported denominator. All 79 have one corresponding `run-record.json`. |
| `run-record.json` files | 85 unique IDs | Six supplementary IDs are not in the consolidated summary. |
| Surefire JUnit XML files / unique execution directory IDs | 86 / 86 | One extra Kanboard JUnit/Maven attempt has no `run-record.json` or `cleanup-result.json`; the other supplementary executions have run records. |

Five of the six unlisted run records are four ExpressCart EC-GAP-005 executions (`g3-ecgap005[-r1|-r2|-r3]-20261110184936`) and one earlier failed Kanboard KB-GAP-001 execution (`g3-kbgap001-20261110184802`). The four ExpressCart records each contain a passing single-test JUnit result, Maven exit 0, and cleanup PASS. The Kanboard record contains a JUnit error, Maven exit 1, and cleanup PASS. The consolidated summary instead references the later EC-GAP-005 initial-plus-three-rerun set ending `20261110185226`, and the later KB-GAP-001 failed initial attempt `20261110193016`. These earlier executions remain **supplementary attempts with unresolved historical purpose**; they are preserved but not silently added to the summary's 79-run denominator.

The sixth unlisted record is `g3-jogap004-r3-20261113-initial6`, a **supplementary preliminary engineering attempt**. Its fixture setup is `BLOCKED` at `FRONTEND_SAVE` (`FRONTEND_ARTICLE_NOT_CONFIRMED`); the JUnit suite reports one setup error and zero assertion failures, so the candidate oracle was not reached (`candidateOutcome: NOT_RUN`). Fixture absence is `NOT_INDEPENDENTLY_VERIFIED`; the wide-page-text cleanup flag is not exact-row proof. The separate Docker runner cleanup record reports `PASS` with zero residual experiment containers, networks, and volumes. This attempt is classified outside the canonical 79-run sample and is not a candidate behavior result.

There is a further artifact-only Kanboard attempt, `g3-kbgap001-20261110190120`: its directory has `docker-before.json`, a failing JUnit XML and `maven-exit.json` (exit 1), but no run record and no cleanup result. It is a failed, unregistered execution artifact, not a validated protocol run. Thus there are seven JUnit execution IDs outside the 79-ID summary: six additional run-record IDs and this one incomplete artifact-only attempt.

The runner labels in the 85 records use `task: g0-<app>` even for these candidate G3 test commands. That label is inconsistent and does not establish each run's intended protocol role. Candidate ID, command, JUnit, cleanup, and membership in the consolidated summary are used for the accounting above; the attempt-6 engineering purpose is established by its evidence-review record, while the five historical extra attempts remain unresolved.

## Candidate-specific denominator clarifications

- **JO-GAP-003:** the initial run passed, while reruns were `FAIL, PASS, FAIL`. Rerun failure rate is **2/3 = 66.7%**. Across the initial run plus three reruns, failure rate is **2/4 = 50%**. Report these as separate denominators; do not label 2/3 as the all-run failure rate. See [consolidated result](../tasks/g3-evidence/JO-GAP-003-result.json).
- **BL-GAP-001 cleanup:** rerun 1 records `zeroResidualVerified: false` and four opaque residual resource IDs plus two Kanboard-named volumes. The volume names end with `g3-kbgap001-20261110190120`, matching the artifact-only Kanboard attempt above. This is strong name-based association, but saved Docker inspect labels are absent for those residual resources, so historical Docker ownership is **not conclusively verified**. The four opaque IDs remain unattributed. The record proves a global residual check failed; it does not prove that Bludit owned or deleted Kanboard resources. No current resources were inspected or removed during this accounting.

Primary evidence:

- `docs/tasks/g3-evidence/all-40-candidates-g3-consolidated-summary.json`
- `docs/tasks/g3-evidence/expresscart/EC-GAP-005/`
- `docs/tasks/g3-evidence/kanboard/KB-GAP-001/`
- `docs/tasks/g3-evidence/joomla/JO-GAP-004/g3-jogap004-r3-20261113-initial6/`
- `docs/tasks/g3-evidence/bludit/BL-GAP-001/g3-blgap001-r1-20261110190053/cleanup-result.json`

The extra run purpose and the historical Docker labels remain missing from checked-in evidence. The corrected accounting keeps those unknowns explicit and does not promote any historical raw pass to semantic validation.
