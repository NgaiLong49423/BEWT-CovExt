# Instructions for two independent reviewers

These are **blank working worksheets**, not an official decision ledger. The source inputs are pinned to `fee6b299106eb42f7f89a435c8cb1a719421dead` and the exact v2 feature and canonical metadata object hashes in `REVIEW-INPUTS.json`. Review the source, baseline and intended behavior, not just the wording of these summaries. `verify_review_inputs.py` checks binding and blank slots; it does not decide correctness, novelty, or reviewer independence.

For each candidate, two separate reviewers should use the established `docs/tasks/T04-G/REVIEW-DECISION-PROTOCOL.md` and its decision template to record independently:

- Candidate ID, version, feature SHA-256, metadata SHA-256, input commit, reviewer identity and review time with timezone.
- Function/version evidence, baseline overlap and novelty rationale, authoritative oracle evidence, fixture/reset feasibility and Selenium observability.
- One of `ACCEPTED_FOR_IMPLEMENTATION`, `REVISE`, `REJECTED`, `BLOCKED`, plus precise evidence links, conditions and unresolved issues.
- Any disagreement and its eventual Team Lead resolution. A later candidate change requires a new version/hash and review; preserve earlier decisions.

| Candidate | Reviewer 1 | Reviewer 2 | Disagreement / resolution |
|---|---|---|---|
| MW-GAP-004 v2 | Pending | Pending | Pending |
| EC-GAP-003 v2 | Pending | Pending | Pending |
| CL-GAP-002 v2 | Pending | Pending | Pending |

No human decisions are asserted here. `ACCEPTED_FOR_IMPLEMENTATION` does not mean `VALIDATED`, does not approve a G0–G4 gate and does not override runtime, isolation, policy, or evidence prerequisites. Keep production or external email disabled until an isolated sink is independently demonstrated; Claroline privacy policy remains unresolved.
