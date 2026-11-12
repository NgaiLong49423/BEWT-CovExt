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
