# Novelty & Overlap Audit

## Review scope and counts

Pinned baseline: `OlianasD/BEWT@0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`). The audit has 27 candidate records, including all 20 shortlist entries. Semantic classifications: 19 `PARTIAL_SEMANTIC_OVERLAP`, 8 `INSUFFICIENT_EVIDENCE`, 0 `LIKELY_DUPLICATE`, and 0 `NO_DIRECT_SEMANTIC_OVERLAP`. Absence of a relevant baseline case is not evidence of novelty.

Before correction the evidence index held 42 candidate-less comparison rows across 33 distinct cases. After correction it holds 46 candidate–baseline links across 35 distinct cases; the additional 4 links are the two Claroline manual exercise cases and the two ExpressCart checkout cases for EC-GAP-003. EC checkout cases also remain linked to their other candidate where applicable.

## No relevant baseline case identified at pin

The following eight candidates were screened against the pinned T04-D application inventory using mapped case titles, Gherkin expected-result line references, Java assertion references, and targeted nearby Gherkin/Java files listed per candidate. This does not claim line-by-line reading of every source file. The search outcome is `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`; it is not a novelty confirmation. `HUMAN-REVIEW-PACKETS.json` and the evidence index contain the complete tree counts, mapped and unmapped paths, case IDs, and limits.

### CL-GAP-001 — Course document upload, move and delete lifecycle

- Candidate behavior: course documents: upload/move/delete
- Scope: 40 pinned feature entries, with 40 mapped Java paths for `claroline`; the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: Course create/search/enrol, event, exercise/question authoring/attempt/removal and user/course lifecycle inventory screened. CL-04 and CL-07 inspected as nearby course/event setup; neither asserts file/document upload, move, or delete. No relevant document-lifecycle case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### MB-GAP-001 — User monitors and stops monitoring an issue for their own account

- Candidate behavior: per-user issue monitor/unmonitor state
- Scope: 38 pinned feature files (37 mapped; `0_Login.feature` is feature-only) and 37 matched Java test files for `mantisbt`; the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: 38 pinned MantisBT feature entries enumerated (37 mapped to Java; `0_Login.feature` is feature-only), and matched Java assertions screened; issue add/assign/status/update, project, user and subproject workflows were considered. No monitor/unmonitor or per-user monitor-state assertion identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### MB-GAP-002 — Private issue note is hidden from users below the private-note threshold

- Candidate behavior: private issue note visibility threshold
- Scope: 38 pinned feature files (37 mapped; `0_Login.feature` is feature-only) and 37 matched Java test files for `mantisbt`; the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: 38 pinned MantisBT feature entries enumerated (37 mapped to Java; `0_Login.feature` is feature-only), and matched Java assertions screened; MB-08 issue creation and MB-18 summary update are nearby issue operations but assert category/severity/summary, not note privacy, threshold authorization or visibility. No relevant private-note case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### MB-GAP-004 — Issue attachment upload is persisted and rejects invalid input

- Candidate behavior: issue attachment upload validation/persistence
- Scope: 38 pinned feature files (37 mapped; `0_Login.feature` is feature-only) and 37 matched Java test files for `mantisbt`; the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: 38 pinned MantisBT feature entries enumerated (37 mapped to Java; `0_Login.feature` is feature-only), and matched Java assertions screened; MB-08/18 cover issue creation and summary editing but no attachment upload/download, invalid file or persisted attachment assertion. No relevant attachment case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### MW-GAP-002 — Watch and unwatch state is scoped to the signed-in user

- Candidate behavior: user-scoped watch/unwatch state
- Scope: 27 pinned feature entries, with 27 mapped Java paths for `mediawiki`; the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: All 27 mapped MediaWiki feature entries and matched Java inventory screened; create/edit/search/revert and user-page flows do not assert watchlist state or per-user scoping. No relevant watch/unwatch case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### MW-GAP-003 — Upload validation rejects a disallowed or oversized file without creating a file page

- Candidate behavior: upload type/size rejection and no page creation
- Scope: 27 pinned feature entries, with 27 mapped Java paths for `mediawiki`; the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: All 27 mapped MediaWiki feature entries and matched Java inventory screened; MW-03 create page, MW-06 edit page and MW-08 source editor inspect page-text creation/editing, not media upload validation, byte/type limits or absence of a file page. No relevant upload-validation case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### PS-GAP-001 — Cart-rule per-customer usage limit is enforced

- Candidate behavior: per-customer cart-rule usage limit
- Scope: 33 pinned Gherkin files and 35 Java test files for `prestashop` (33 filename mappings; two suite-only Java classes); the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: 33 pinned PrestaShop Gherkin files and 35 Java tests enumerated (including two suite-only Java classes); product, customer/address, employee and out-of-stock flows do not assert cart-rule redemption counts or per-customer limit enforcement. No relevant cart-rule usage case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

### PS-GAP-002 — Carrier eligibility follows configured price/weight range

- Candidate behavior: carrier eligibility at configured price/weight boundaries
- Scope: 33 pinned Gherkin files and 35 Java test files for `prestashop` (33 filename mappings; two suite-only Java classes); the full inventory path list is in the packet searchScope.
- Result: `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN`. Nearby cases screened: 33 pinned PrestaShop Gherkin files and 35 Java tests enumerated (including two suite-only Java classes); PS-12 adds a customer address and PS-28 rejects an out-of-stock order, but neither asserts carrier selection or price/weight boundary eligibility. No relevant carrier-range case identified.
- Conclusion limit: no relevant comparator was identified in this bounded inventory search; novelty remains `NOT_VERIFIED`.

## Candidate comparisons

Each candidate section below identifies mapped comparator cases where applicable. Evidence links resolve to pinned Gherkin/Java files and assertion/Then line anchors. A comparison can be adjacent rather than semantically equivalent. The entries for the ten previously unlinked candidates now distinguish two candidates with relevant adjacent comparators from eight bounded no-relevant-case searches.

### BL-GAP-001 — Scheduled pages are promoted on a request after their due time

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Baseline cases: bludit-17-changepostdatetest.
- Assessment: Potentially distinct from BL-017 change-post-date; that baseline case changes the date but does not specify the scheduler transition. Novelty remains unverified.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### BL-GAP-002 — Cover image selection persists and renders for content

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Baseline cases: bludit-01-addcontenttest.
- Assessment: Potential gap beyond generic add-content; baseline content creation does not state a cover-image persistence/render oracle.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### BL-GAP-003 — Static status maps to page type and the static-page collection

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: bludit-01-addcontenttest, bludit-02-changeurltest, bludit-04-changeparenttest.
- Assessment: Baseline add-content, parent and URL cases cover content fields/relationships but do not assert page-versus-post placement.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### BL-GAP-004 — Administrator can change a non-admin user's role and retain it

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Baseline cases: bludit-08-addusertest, bludit-16-deleteusertest, bludit-09-changepasswordtest.
- Assessment: Baseline add/delete user and password cases do not assert role editing or role-specific access.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### CL-GAP-001 — Course document upload, move and delete lifecycle

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `1`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### CL-GAP-002 — Group space is inaccessible to a non-member student

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Baseline cases: claroline-27-adddeniedcoursetest, claroline-28-enroldeniedcoursetest, claroline-30-enrolpasswordcoursewrongpasswordusertest.
- Assessment: Baseline course enrollment/password/denied-course cases cover course-level gates, not group-space membership boundary.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### CL-GAP-003 — Teacher imports an exercise package into a course

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Baseline cases: claroline-08-addcourseexercisetest, claroline-10-addcourseexercisequestionstest.
- Assessment: CL-08 asserts manual exercise creation; CL-10 asserts manually added question titles/types. These are adjacent authoring cases, not package import or import-fidelity checks. The comparison supports partial overlap, not equivalence.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### CL-GAP-004 — Tracking controls are teacher-only while exercise attempts remain student-facing

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: claroline-11-docourseexercisequestionstest, claroline-12-viewprofilestatisticsusertest.
- Assessment: Baseline exercise completion and profile-statistics cases may overlap on results; role-specific tracking visibility is not asserted.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### EC-GAP-002 — Stock tracking rejects a cart quantity above available product or variant stock

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Baseline cases: expresscart-05-addproducttest, expresscart-07-addnewprodtocarttest.
- Assessment: Base AddProduct and AddNewProdToCart exercise creation/cart addition but do not assert stock quantity boundary.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### EC-GAP-003 — Customer address update persists and is copied from session into order snapshot

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Baseline cases: expresscart-15-usediscountcodeamounttest, expresscart-16-usediscountcodepercenttest.
- Assessment: EC-15/16 traverse checkout → shipping → payment and assert displayed discount text. Neither Gherkin nor Java asserts customer-address persistence or an address snapshot on the resulting order. The workflow overlap is real; address dataflow is untested by these assertions.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### EC-GAP-004 — Invalid discount date windows are rejected during admin update

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: expresscart-12-adddiscountcodeamounttest, expresscart-13-adddiscountcodepercenttest, expresscart-15-usediscountcodeamounttest, expresscart-16-usediscountcodepercenttest.
- Assessment: Base discount cases create/use amount and percent codes and include empty/deleted-code paths, but do not assert invalid date-window validation. Historical EC-C01 tests discount removal, a separate behavior. This is a potential gap only.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### JO-GAP-001 — Featured article flag appears and is removed from the featured list

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Baseline cases: joomla-08-addnewarticle, joomla-10-editarticle, joomla-21-archivearticle.
- Assessment: Baseline creates/edits/archives articles and categories, but does not assert featured-list membership.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### JO-GAP-002 — Publish-up and publish-down define the article visibility window

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Baseline cases: joomla-08-addnewarticle, joomla-10-editarticle, joomla-21-archivearticle.
- Assessment: Baseline Add/Edit Article and Archive Article cases do not assert timed visibility boundaries.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### JO-GAP-003 — Editor without edit-state permission cannot change publication state

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Baseline cases: joomla-23-addgroup, joomla-25-assignusertogroup, joomla-10-editarticle.
- Assessment: Baseline user/group and article CRUD cases do not verify an authorization denial on state changes.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### JO-GAP-004 — Editing an article increments its version counter

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: joomla-10-editarticle.
- Assessment: Baseline EditArticle overlaps the edit operation but does not explicitly assert version increment/history state.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MB-GAP-001 — User monitors and stops monitoring an issue for their own account

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `1`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MB-GAP-002 — Private issue note is hidden from users below the private-note threshold

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MB-GAP-003 — Issue relationship rejects self-link and duplicate links

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `2`.
- Baseline cases: mantisbt-33-addmultiplesubprojects, mantisbt-34-unlinkmultiplesubprojects, mantisbt-35-linkmultiplesubprojects.
- Assessment: Baseline links/unlinks project subprojects; issue-to-issue relationship semantics are not covered.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MB-GAP-004 — Issue attachment upload is persisted and rejects invalid input

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `3`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MW-GAP-001 — Moving a page preserves content at the target and optionally creates a redirect

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `1`.
- Baseline cases: mediawiki-03-createpagetest, mediawiki-06-editpagetest, mediawiki-21-createredirecttest, mediawiki-22-followredirecttest.
- Assessment: Baseline creates/edits/deletes/redirects pages but does not map to page move.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MW-GAP-002 — Watch and unwatch state is scoped to the signed-in user

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `2`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MW-GAP-003 — Upload validation rejects a disallowed or oversized file without creating a file page

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `3`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### MW-GAP-004 — A new edit creates a retrievable revision distinct from the prior revision

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: mediawiki-06-editpagetest, mediawiki-16-revertlastcommittest.
- Assessment: Baseline edit and revert cases overlap with revision behavior; this narrower persistence/history oracle may still be redundant.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### PS-GAP-001 — Cart-rule per-customer usage limit is enforced

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `1`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### PS-GAP-002 — Carrier eligibility follows configured price/weight range

- Classification: `INSUFFICIENT_EVIDENCE`; shortlisted: `true`; priority: `2`.
- Baseline cases: no relevant case identified at pin (bounded search recorded above).
- Assessment: No relevant mapped baseline case identified in the bounded search above; this is insufficient evidence, not evidence of novelty.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### PS-GAP-003 — Successful payment creates one order and applies stock synchronization

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `true`; priority: `3`.
- Baseline cases: prestashop-28-outofstockvalidity, prestashop-01-addnewproduct.
- Assessment: Baseline out-of-stock validity concerns product state but does not exercise payment-to-order transition or stock delta.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.

### PS-GAP-004 — Available quantity update stays consistent with product/combination stock

- Classification: `PARTIAL_SEMANTIC_OVERLAP`; shortlisted: `false`; priority: `not shortlisted`.
- Baseline cases: prestashop-01-addnewproduct, prestashop-28-outofstockvalidity.
- Assessment: Baseline adds products and tests out-of-stock validity but does not compare updates across combinations.
- Runtime: `NOT_RUN`; novelty: `NOT_VERIFIED`. No human decision is implied.
