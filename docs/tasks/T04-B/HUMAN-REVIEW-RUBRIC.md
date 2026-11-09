# T04-B Human Review Rubric

Apply each dimension independently. Use the evidence descriptions below and record rationale plus evidence pointers in the candidate packet. **Do not sum, average, or convert these qualitative findings into an automatic ACCEPT.** A missing mandatory condition remains a blocker regardless of other findings.

| Dimension | Review question | Suggested record values |
|---|---|---|
| Source validity | Does the pinned Kanboard version and cited source support the described behavior? | `SUPPORTED_STATIC_SOURCE`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE` |
| Behavioral novelty | Is the action and observable outcome semantically distinct across all 30 baseline cases and the inspected historical corpus? | `SUPPORTED_FOR_REVIEW`, `OVERLAP_REQUIRES_REVISION`, `INSUFFICIENT_EVIDENCE` |
| Oracle clarity | Is there a specific, correct, observable assertion for the same entity after the action? | `CLEAR_STATIC_PROPOSAL`, `AMBIGUOUS`, `NOT_VERIFIED_RUNTIME` |
| Fixture feasibility | Can required project/task/user/column identities be seeded repeatably? | `PROPOSED_FEASIBLE`, `BLOCKED`, `NOT_RUN` |
| UI automation feasibility | Is there a credible UI interaction and stable selector path? | `SOURCE_PATH_EXISTS`, `LOCATOR_NOT_VERIFIED`, `INFEASIBLE` |
| Isolation and cleanup | Can a run reset or clean only owned state without collateral effects? | `PROPOSED_ISOLATED_RESET`, `OWNERSHIP_UNPROVEN`, `NOT_RUN` |
| Historical overlap | What prior research corpus was inspected, and what can its coverage establish? | `LIMITED_CORPUS_NO_MATCH`, `OVERLAP_FOUND`, `NOT_EVALUATED` |
| Evidence sufficiency | Are source path, line, commit, content hash, baseline assertion, and candidate rationale traceable? | `STATIC_TRACEABLE`, `INCOMPLETE`, `CONTRADICTORY` |

Each reviewer record must include candidate ID, source evidence, baseline comparison, oracle review, known risks, unresolved questions, proposed decision, decision rationale, implementation conditions, and evidence references. Official human fields (identity, date, exact reviewed commit, decision, rationale, oracle confirmation, novelty assessment, implementation conditions, reviewer evidence) remain empty until the Team Lead performs review. `ACCEPT` permits implementation planning only; it does not mean `VALIDATED` or G1 acceptance.
