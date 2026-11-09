# Kanboard G1 Blocker Register

| ID | Blocker / dependency | Evidence state | Resolution owner / next action |
|---|---|---|---|
| G1-KB-01 | G0 acceptance is unresolved because Run A/B recorded Surefire hashes disagree with preserved XML. | `BLOCKED_EVIDENCE` | Team Lead decides whether authentic contemporaneous files resolve this or G0 remains deferred / a separate run is needed. |
| G1-KB-02 | Independent human oracle and novelty decisions have not been recorded for five proposed candidates. | `NOT_EVALUATED`; ledger empty | Team Lead reviews pinned packets and supplies actual decisions. |
| G1-KB-03 | Candidate 001 primary oracle needs state transition prioritized over search corroboration. | Technical `RECOMMEND_REVISE` | Team Lead may request revision; a changed candidate hash requires renewed review. |
| G1-KB-04 | Candidate 004 must bound actor role, membership, fixture and authorization; forged `owner_id` rejection is unverified. | Technical `RECOMMEND_REVISE` | Resolve before implementation review; do not claim negative authorization evidence. |
| G1-KB-05 | Three successful E2E repeats/reset/cleanup per candidate are not available. | `NOT_RUN` | Only after review and implementation, execute the accepted protocol. |
| G1-KB-06 | Selected AI-generated Gherkin/Java artifacts and runtime outcomes do not exist for these candidates. | `NOT_RUN` | Dependent on authorization and later task scope. |
| G1-KB-07 | T04-B semantic review is separate from rule-based overlap screening; no global novelty decision exists. | `PENDING_INDEPENDENT_REVIEW` | Review pair evidence with the project rubric; do not infer novelty from screening labels. |

The dataset remains five records; all are `PROPOSED`/`PENDING`. G1 stays `NOT_VERIFIED`. This register is not a gate decision.
