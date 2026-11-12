# G0–G4 Acceptance Matrix

These states are the audit's evidence-based recommendation, not Team Lead acceptance.

| Gate | Proposed status | Evidence and reason |
|---|---|---|
| G0 Environment | `PARTIALLY_VERIFIED` | 8-app G0 summary and JUnit/Maven artifacts exist. Per-run identity lacks app source commit, test hash, image digest, and runtime manifest. ExpressCart config has no digest field. |
| G1 Dataset/Coverage | `BLOCKED` | 40 implementation authorizations exist, but all human review records remain pending and unsigned. Novelty and oracle approval are not evidenced. |
| G2 Framework | `PARTIALLY_VERIFIED` | Framework code and offline tests exist; anti-trivial checks do not establish semantic alignment, and checked-in T01-C evidence has no successful live model candidate. |
| G3 Validation | `FAILED` for semantic correctness; raw execution `PARTIALLY_VERIFIED` | 40 registered Java tests and raw run outputs exist, but 0/40 implementations match their Gherkin/oracle. Run identity is incomplete and one cleanup verification is false. The 11 reported raw passes do not count as behaviorally validated cases. |
| G4 Research Release | `BLOCKED` | Metrics engine emits false PASS values from regex checks, default denominators, and fallbacks; review and provenance conflicts remain. |

No gate is `ACCEPTED_WITH_EVIDENCE` or `READY_FOR_HUMAN_ACCEPTANCE` at this point.
