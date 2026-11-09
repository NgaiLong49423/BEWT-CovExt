# Novelty & Overlap Audit

Pinned baseline: `OlianasD/BEWT@0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`). Each candidate was compared against mapped Gherkin and Java assertion locations where available. Mapping is navigation evidence, not semantic proof. All judgments are technical; novelty remains NOT_VERIFIED.

## BL-GAP-001 — Scheduled pages are promoted on a request after their due time

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Comparator cases: bludit-17-changepostdatetest; pinned Gherkin/Java mappings: 1.
- Assessment: BL-017 changes the post date; it does not assert request-time scheduler promotion. Clock, cache and public rendering remain runtime dependencies.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## BL-GAP-002 — Cover image selection persists and renders for content

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Comparator cases: bludit-01-addcontenttest; pinned Gherkin/Java mappings: 1.
- Assessment: BL-001 creates content; no cover-image persistence or theme-render assertion is mapped. Rendering is theme-dependent.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## BL-GAP-003 — Static status maps to page type and the static-page collection

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: bludit-01-addcontenttest, bludit-02-changeurltest, bludit-04-changeparenttest; pinned Gherkin/Java mappings: 3.
- Assessment: BL-001/002/004 cover add, URL and parent fields; none asserts static-page collection placement versus posts.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## BL-GAP-004 — Administrator can change a non-admin user's role and retain it

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Comparator cases: bludit-08-addusertest, bludit-16-deleteusertest, bludit-09-changepasswordtest; pinned Gherkin/Java mappings: 3.
- Assessment: BL-008/009/016 cover user creation, password and deletion; role editing and effective privilege are not asserted.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## CL-GAP-001 — Course document upload, move and delete lifecycle

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `1`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: Source is incomplete and the runtime image patch is unattributed, so the core-source overlap comparison cannot establish deployed behavior.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## CL-GAP-002 — Group space is inaccessible to a non-member student

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Comparator cases: claroline-27-adddeniedcoursetest, claroline-28-enroldeniedcoursetest, claroline-30-enrolpasswordcoursewrongpasswordusertest; pinned Gherkin/Java mappings: 3.
- Assessment: Mapped group-space code has the membership-denial block commented; denial oracle lacks support from the reviewed core path.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## CL-GAP-003 — Teacher imports an exercise package into a course

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: Exercise creation and question authoring are represented by separate pinned baseline cases; manual creation does not establish import behavior.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## CL-GAP-004 — Tracking controls are teacher-only while exercise attempts remain student-facing

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: claroline-11-docourseexercisequestionstest, claroline-12-viewprofilestatisticsusertest; pinned Gherkin/Java mappings: 2.
- Assessment: Related course/group workflows do not establish the candidate’s exact authorization or state-transition oracle; image provenance remains unresolved.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## EC-GAP-002 — Stock tracking rejects a cart quantity above available product or variant stock

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Comparator cases: expresscart-05-addproducttest, expresscart-07-addnewprodtocarttest; pinned Gherkin/Java mappings: 2.
- Assessment: Baseline add-to-cart covers ordinary addition. Source guard in /product/updatecart returns HTTP 400 for insufficient stock before quantity update under stock-tracking guards; this is source support only.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## EC-GAP-003 — Customer address update persists and is copied from session into order snapshot

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: Checkout cases cover adjacent purchase flow but not the candidate address-dataflow assertion.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## EC-GAP-004 — Invalid discount date windows are rejected during admin update

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: expresscart-12-adddiscountcodeamounttest, expresscart-13-adddiscountcodepercenttest, expresscart-15-usediscountcodeamounttest, expresscart-16-usediscountcodepercenttest; pinned Gherkin/Java mappings: 4.
- Assessment: Discount creation/use overlap exists; invalid date update behavior is not asserted by those cases.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## JO-GAP-001 — Featured article flag appears and is removed from the featured list

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Comparator cases: joomla-08-addnewarticle, joomla-10-editarticle, joomla-21-archivearticle; pinned Gherkin/Java mappings: 3.
- Assessment: Article lifecycle coverage does not assert the candidate featured-state visibility behavior.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## JO-GAP-002 — Publish-up and publish-down define the article visibility window

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Comparator cases: joomla-08-addnewarticle, joomla-10-editarticle, joomla-21-archivearticle; pinned Gherkin/Java mappings: 3.
- Assessment: Article edit coverage does not assert the exact publication-window boundary.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## JO-GAP-003 — Editor without edit-state permission cannot change publication state

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Comparator cases: joomla-23-addgroup, joomla-25-assignusertogroup, joomla-10-editarticle; pinned Gherkin/Java mappings: 3.
- Assessment: Article/group assertions are adjacent; they do not establish the exact denied-edit state.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## JO-GAP-004 — Editing an article increments its version counter

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: joomla-10-editarticle; pinned Gherkin/Java mappings: 1.
- Assessment: Existing version-related lifecycle assertions are adjacent, not the candidate’s exact version counter/state oracle.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MB-GAP-001 — User monitors and stops monitoring an issue for their own account

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `1`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: No mapped comparator establishes this exact permission outcome; insufficient evidence prevents a novelty claim.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MB-GAP-002 — Private issue note is hidden from users below the private-note threshold

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: Privacy behavior has no direct mapped comparator; insufficient evidence prevents a novelty claim.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MB-GAP-003 — Issue relationship rejects self-link and duplicate links

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Comparator cases: mantisbt-33-addmultiplesubprojects, mantisbt-34-unlinkmultiplesubprojects, mantisbt-35-linkmultiplesubprojects; pinned Gherkin/Java mappings: 3.
- Assessment: Subproject link/unlink is analogous, but does not assert issue relation semantics; likely overlap is not established.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MB-GAP-004 — Issue attachment upload is persisted and rejects invalid input

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `3`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: Attachment-related behavior lacks a direct comparator; configuration and upload constraints need further tracing.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MW-GAP-001 — Moving a page preserves content at the target and optionally creates a redirect

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Comparator cases: mediawiki-03-createpagetest, mediawiki-06-editpagetest, mediawiki-21-createredirecttest, mediawiki-22-followredirecttest; pinned Gherkin/Java mappings: 4.
- Assessment: Create/edit/redirect cases are adjacent but do not assert page move semantics.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MW-GAP-002 — Watch and unwatch state is scoped to the signed-in user

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `2`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: No watchlist comparator is mapped; absence from mapping is not evidence of novelty.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MW-GAP-003 — Upload validation rejects a disallowed or oversized file without creating a file page

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `3`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: Upload behavior is unmapped; frontend/no-save behavior is not established by the cited baseline.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## MW-GAP-004 — A new edit creates a retrievable revision distinct from the prior revision

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: mediawiki-06-editpagetest, mediawiki-16-revertlastcommittest; pinned Gherkin/Java mappings: 2.
- Assessment: Edit/revert workflow overlaps revision behavior and has the highest duplicate risk, but current evidence remains partial.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## PS-GAP-001 — Cart-rule per-customer usage limit is enforced

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `1`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: No direct mapped comparator; shop/zone/payment configuration and expected outcome remain insufficiently evidenced.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## PS-GAP-002 — Carrier eligibility follows configured price/weight range

- Technical classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `2`.
- Comparator cases: none mapped; pinned Gherkin/Java mappings: 0.
- Assessment: No direct mapped comparator; stock/combinations setup and expected oracle remain insufficiently evidenced.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## PS-GAP-003 — Successful payment creates one order and applies stock synchronization

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Comparator cases: prestashop-28-outofstockvalidity, prestashop-01-addnewproduct; pinned Gherkin/Java mappings: 2.
- Assessment: Add-product/out-of-stock ordering overlaps adjacent catalog/cart cases; no positive payment-order flow is mapped.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.

## PS-GAP-004 — Available quantity update stays consistent with product/combination stock

- Technical classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Comparator cases: prestashop-01-addnewproduct, prestashop-28-outofstockvalidity; pinned Gherkin/Java mappings: 2.
- Assessment: Baseline stock model is adjacent but does not establish the candidate’s combination-admin flow.
- See evidence index for commit-pinned permalinks and source line ranges. Runtime `NOT_RUN`; no human novelty decision is implied.
