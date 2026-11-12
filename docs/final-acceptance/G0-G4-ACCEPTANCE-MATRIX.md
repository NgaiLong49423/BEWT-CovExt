# G0–G4 Acceptance Matrix

These states are the audit's evidence-based recommendation, not Team Lead acceptance.

| Gate | Proposed status | Evidence and reason |
|---|---|---|
| G0 Environment | `PARTIALLY_VERIFIED` | Historical 8-app G0 summary and JUnit/Maven artifacts exist. Per-run identity lacks app source commit, test hash, image digest, and runtime manifest; ExpressCart config has no digest field. The summary is not independently source/runtime-bound. |
| G1 Dataset/Coverage | `BLOCKED` | 40 implementation authorizations exist, but all primary human review records remain pending and unsigned. Novelty and oracle approval are not evidenced. |
| G2 Framework | `PARTIALLY_VERIFIED` | Framework code and offline tests exist; anti-trivial checks do not establish semantic alignment, and checked-in T01-C evidence has no successful live model candidate. |
| G3 Validation | `FAILED` for semantic correctness; raw execution `PARTIALLY_VERIFIED` | 40 registered R2 Java tests and historical raw outputs exist, but 0/40 audited mappings match their Gherkin/oracle. Run identity is incomplete and one cleanup verification is false. The 11 reported raw passes do not count as behaviorally validated cases. |
| G4 Research Release | `PARTIALLY_VERIFIED; acceptance blocked` | Historical defect: regex checks, default denominators, and fallbacks permitted unsupported PASS values. Fixed in the current revision: Cucumber parser, primary review/hash checks, evidence-aware blockers, and negative tests are verified (17/17). Remaining limitation: current RQ2/RQ3 paths return `NOT_EVALUATED` unconditionally; evidence-driven final computation and valid state-transition controls are still required. |

These are evidence-based technical recommendations, not Team Lead acceptance. No gate is `ACCEPTED_WITH_EVIDENCE` or `READY_FOR_HUMAN_ACCEPTANCE` at this point.

## Post-audit runtime update (2026-11-12)

- G0 now has a fresh Cloud baseline smoke task with 8/8 application/base-test passes and zero-residual cleanup for each. Status remains `PARTIALLY_VERIFIED` because installer exit codes, five active smoke classes have source-hash differences, and per-container identity/image bindings are incomplete. See `docs/tasks/G0-CLOUD-20261112/TASK-REPORT.md` and PR #29.
- G3 now has one candidate-level preliminary engineering result: Kanboard `KB-GAP-001` R8 passed an initial run plus three clean-state reruns. The case remains outside `VALIDATED` pending human oracle/novelty approval and reviewer resolution of the Gherkin/UI label difference. Its runner also lacks per-container image binding. The historical 0/40 semantic audit and 79-run accounting remain unchanged; new attempts are separately reported in `docs/tasks/KB-GAP-001-R5/` and PR #30.
- Overall G1, G2, and G4 statuses are not promoted by these runtime results; final acceptance remains blocked.

## 2026-11-12 candidate-level G3 update

KB-GAP-001 R10 has preliminary G3 engineering evidence: compile PASS (43 sources), initial run PASS, three clean-state reruns PASS (4/4), cleanup zero residual 4/4. R9's 0/4 failure remains in history. This does not promote any program-level gate or scientific validation; human oracle/novelty review is pending. Evidence: docs/tasks/KB-GAP-001-R5/evidence/g3-r10-acceptance-manifest.json.
