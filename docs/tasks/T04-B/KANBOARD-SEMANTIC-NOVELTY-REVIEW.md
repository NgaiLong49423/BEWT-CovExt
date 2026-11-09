# Kanboard Semantic Novelty Review

The generator performs **rule-based screening**, not an independent semantic review. It compares each of the five shortlisted candidate actions/oracles with every one of the 30 mapped baseline cases and flags eight configured adjacency/overlap pairs. The complete pairwise record, including baseline actions, expected oracles, Java assertions, pinned source references, and screening rule, is `data/reviews/kanboard/t04b-review-dataset.json` (150 rows).

`NO_DIRECT_OVERLAP_FLAGGED` means that a configured rule did not flag the pair. It does not mean that the pair was independently reviewed or shown to be distinct. `PARTIAL_SEMANTIC_OVERLAP` records the eight specific overlap flags and their rationale. All 150 pairs have `semanticReviewStatus: PENDING_INDEPENDENT_REVIEW` and `humanNoveltyDecision: null`. No pair is labeled `DISTINCT_BEHAVIOR_SUPPORTED`; no global novelty or G1 claim is made.

The inspected historical Sprint 01–05 and final reports concern ExpressCart. No Kanboard-specific entry was found in that corpus. This limited negative search is not proof that no related behavior was previously studied elsewhere. Baseline KB-023 and KB-026 are compared using their observed behavior/assertion, not misleading raw titles; the accepted inventory preserves both title and interpretation.

Human novelty and oracle decisions remain pending in each review packet.
