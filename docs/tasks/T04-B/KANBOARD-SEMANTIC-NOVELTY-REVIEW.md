# Kanboard Semantic Novelty Review

The review compares each of the five shortlisted candidate actions and expected oracles to every one of the 30 mapped baseline cases. The complete pairwise record, including baseline actions, expected oracles, Java assertions, and source references, is `data/reviews/kanboard/t04b-review-dataset.json` (150 rows). Pair classes are static analysis labels, not a research novelty verdict.

`DISTINCT_BEHAVIOR_SUPPORTED` means no matching primary action-and-oracle pair was found in this mapping; it does not prove novelty outside the mapping. `PARTIAL_SEMANTIC_OVERLAP` flags an adjacent baseline workflow while retaining a distinct candidate-specific assertion. No pair was classified as a duplicate based solely on title. `INSUFFICIENT_EVIDENCE` is reserved for claims that source evidence does not establish, especially forged non-member assignee rejection.

The inspected historical Sprint 01–05 and final reports concern ExpressCart. No Kanboard-specific entry was found in that corpus. This limited negative search is not proof that no related behavior was previously studied elsewhere. Baseline KB-023 and KB-026 are compared using their observed behavior/assertion, not misleading raw titles; the accepted inventory preserves both title and interpretation.

Human novelty and oracle decisions remain pending in each review packet.
