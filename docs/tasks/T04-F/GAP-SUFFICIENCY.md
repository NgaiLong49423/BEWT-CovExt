# Gap Sufficiency Assessment

Seven-app target: 35 new cases (five per app). Current input remains 27 proposals / 20 shortlist entries. No proposals are invented and RQ2 gain is NOT_EVALUATED because a behavioral denominator is not established.

| Application | Proposals | Shortlist | Oracle clear enough to review* | Needs revision | Insufficient evidence | Shortfall to 5 |
|---|---:|---:|---:|---:|---:|---:|
| bludit | 4 | 3 | 4 | 1 | 0 | 1 |
| claroline | 4 | 3 | 2 | 1 | 2 | 1 |
| expresscart | 3 | 2 | 3 | 2 | 0 | 2 |
| joomla | 4 | 3 | 4 | 2 | 0 | 1 |
| mantisbt | 4 | 3 | 1 | 2 | 3 | 1 |
| mediawiki | 4 | 3 | 2 | 2 | 2 | 1 |
| prestashop | 4 | 3 | 2 | 1 | 2 | 1 |

*“Clear enough to review” means source-linked reviewable, not runtime-proven or accepted. Counts are technical screening counts and may overlap with revision/evidence needs.

## Review evidence counts (not research outcomes)

- Semantic overlap: 19 `PARTIAL_SEMANTIC_OVERLAP`; 8 `INSUFFICIENT_EVIDENCE` (CL-GAP-001, MB-GAP-001, MB-GAP-002, MB-GAP-004, MW-GAP-002, MW-GAP-003, PS-GAP-001, PS-GAP-002); 0 `LIKELY_DUPLICATE`; 0 `NO_DIRECT_SEMANTIC_OVERLAP`.
- Oracle: 25 `PARTIALLY_SOURCE_SUPPORTED`; 1 `SOURCE_SUPPORTED`; 1 `INSUFFICIENT_EVIDENCE` (CL-GAP-002).
- Insufficient-evidence union: **9 unique candidates** (CL-GAP-001, CL-GAP-002, MB-GAP-001, MB-GAP-002, MB-GAP-004, MW-GAP-002, MW-GAP-003, PS-GAP-001, PS-GAP-002), computed as the set union across semantic and oracle classifications.
- These are candidate review counts, not accepted or validated cases and not RQ1/RQ2 findings.
- Baseline traceability after correction: **46 candidate–baseline links over 35 distinct pinned cases** (previously 42 rows over 33 cases).

## Cross-cutting limits

- Proposal shortfall is eight: Bludit 1, Claroline 1, ExpressCart 2, Joomla 1, MantisBT 1, MediaWiki 1, PrestaShop 1. These are unfilled target slots, not presumed cases.
- Claroline source archive is incomplete and the runtime image has an unattributed patch; pinned core source cannot guarantee image behavior.
- ExpressCart EC-GAP-001 remains excluded. Historical Sprint 01–05 results remain separate; no historical runtime is reused as T04-F execution evidence. Authorization/control-flow observations are not passing-behavior claims.
- No behavioral denominator has been established, so RQ2 gain is not evaluated.
