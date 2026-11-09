# T04-F — G1 review preparation for seven applications

**Base:** `origin/main` at `bd9b3b15fca28419ada9862b8a65bac910edf169`
**Branch:** `feature/offline-g1-review-prep`
**Scope:** source-linked Gherkin/oracle/novelty review packet for the seven non-Kanboard applications represented in merged T04-D/T04-E.
**Decision boundary:** proposals remain `PROPOSED`; every novelty decision remains `NOT_VERIFIED`; no human decision or implementation acceptance is recorded.

## Scope and current G1 evidence

T04-D and T04-E are already merged to `main` (#14 and #16). This task reuses rather than edits their historical datasets. The G1 input is seven apps: Bludit, Claroline, ExpressCart, Joomla, MantisBT, MediaWiki, and PrestaShop. Kanboard is deliberately excluded because its current review is contested and tracked on open PR #11. Open PR #15 is T05-B and is outside this G1 task.

- T04-E has **27 source-supported proposals**: 4 each for Bludit, Claroline, Joomla, MantisBT, MediaWiki and PrestaShop; 3 for ExpressCart. Its technical review order contains **20** entries. The remaining 7 proposals are not promoted to the shortlist to fill a quota.
- All proposals remain `PROPOSED`; novelty is `NOT_VERIFIED`; the decision fields are null. The source index has exact source commit/tree, file paths, line ranges, Git blob IDs and immutable permalinks. T04-E records 7/7 source commit/tree and 36/36 indexed file blob/permalink checks against pinned GitHub API refs.
- Claroline is `PARTIAL_RELEASE_SOURCE_CORE_AVAILABLE`; its candidate source refs support core behavior only and do not establish complete release/runtime provenance.
- T04-D baseline inventory for these seven apps: 227 feature files, 204 explicit Scenario headers, 228 TestSuite business entries, and 226 structural filename/class mappings. There is one MantisBT feature-only case and two PrestaShop suite-only entries. T02's projected aggregate differs by one from the independently measured T04-D count; preserve the discrepancy. Structural mapping and keyword tags are not semantic behavior oracles and are not an RQ2 denominator.
- No per-app behavioral denominator is established. RQ1 acceptance/novelty and RQ2 coverage gain remain `NOT_EVALUATED`; no app G1 gate is promoted.

## Per-app implementation status

| Application | Source provenance | G1 bundle | Gherkin/Java candidate implementation | Runtime | Human decision |
|---|---|---|---|---|---|
| Bludit | PINNED_RELEASE_SOURCE_AVAILABLE | OFFLINE_VERIFIED | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |
| Claroline | PARTIAL_RELEASE_SOURCE_CORE_AVAILABLE | OFFLINE_VERIFIED_WITH_SOURCE_LIMIT | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |
| ExpressCart | PINNED_SOURCE_AVAILABLE | OFFLINE_VERIFIED | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |
| Joomla | PINNED_RELEASE_SOURCE_AVAILABLE | OFFLINE_VERIFIED | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |
| MantisBT | PINNED_RELEASE_SOURCE_AVAILABLE | OFFLINE_VERIFIED | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |
| MediaWiki | PINNED_RELEASE_SOURCE_AVAILABLE | OFFLINE_VERIFIED | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |
| PrestaShop | PINNED_RELEASE_SOURCE_AVAILABLE | OFFLINE_VERIFIED | NOT_IMPLEMENTED | RUNTIME_PENDING | NOT_REVIEWED |

`OFFLINE_VERIFIED` here means the static bundle/provenance consistency checks ran; it does not mean candidate semantics, source runtime behavior, or G1 acceptance was validated.
## Review packet files

`review-packets/<app>.md` contains each shortlisted candidate's source pin and direct source links, baseline case/file/assertion mappings where present, source-backed observable proposal, negative control, risk/uncertainty, a draft-only Gherkin sketch, reviewer questions, and blank human-decision fields. The sketches are scaffolding for review, not approved scenario artifacts and not validated feature files.

Targeted reviewer holds:

- **EC-GAP-003:** hold for security-owner review; the referenced `/admin/order/create` route has a separately documented missing route-level authorization concern. Do not exercise it until the test boundary and safe principal are resolved.
- **MB-GAP-003:** current duplicate/self-link oracle allows “rejected or safely handled”; select one deterministic outcome and observable before approval.
- **MW-GAP-003:** narrow to a source-proven disallowed-extension case unless a pinned source reference is added for oversize handling and absence of persisted files.
- **PS-GAP-002:** split price-range and weight-range/fallback branches into separately reviewable scenarios.
- Remaining packets call out app-specific clock, theme, group ACL, package format, ACL, fixture, storage, redirect, watchlist and payment-module constraints.

## Offline verification

The source-backed validator and its 14 deterministic tests, T04-D inventory verifier, and T04-F packet verifier are run offline. No Docker, app runtime, HTTP/DB, Selenium, Gemini, or human review is performed. See `evidence/verification/` for exact commands, exit codes, outputs and hashes.

## Review requested

For each candidate, decide `ACCEPT_FOR_IMPLEMENTATION`, `REVISE`, or `REJECT` only after checking source links and baseline semantics. Confirm the Gherkin actor/preconditions/action, exact assertion oracle, novelty rationale, negative control and safe deterministic fixture/reset. Keep all decisions blank in this task until a human reviewer records them in the appropriate approved decision workflow. G1 remains `NOT_VERIFIED`.
