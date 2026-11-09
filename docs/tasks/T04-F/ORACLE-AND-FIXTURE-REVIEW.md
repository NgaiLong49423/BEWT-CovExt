# Oracle & Fixture Review

Source-to-oracle assessment for all 27 proposals. `SOURCE_SUPPORTED` means the cited source supports the stated code-level behavior only; it does not establish runtime or E2E success. All runtime outcomes remain `NOT_RUN`.

## BL-GAP-001 — Scheduled pages are promoted on a request after their due time

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — A future-dated published page is stored with scheduled status; a page request after its due date runs the scheduler, changes its stored status to published, and makes it eligible for the published-page collection.
- Fixture: Create a published page with a future date; observe its scheduled state, then observe after the due time. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Repeat with a future-dated draft; it must remain unpublished.
- Risks: Clock control/scheduler cadence may be unavailable; no live runtime check was performed.; The pinned source ties the status transition to the request-time page boot rule; exact clock fixture, cache behavior and public response still require runtime verification.
- Limitations: Pinned source review only; no runtime validation.

## BL-GAP-002 — Cover image selection persists and renders for content

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Saved content references the selected image and the public page resolves that image in its cover slot.
- Fixture: Select a local cover image while editing content, save, reload and open the public content page. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Save without a cover image and verify no broken/placeholder URL is emitted.
- Risks: Theme-specific rendering and image cleanup may affect reproducibility.; Persistence is through the generic dbFields add/edit mapping; rendering is established only for the pinned alternative theme, not every theme. End-to-end selection flow remains unexecuted.
- Limitations: Pinned source review only; no runtime validation.

## BL-GAP-003 — Static status maps to page type and the static-page collection

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Setting static status sets type to page; the stored record appears in the static-page collection, while a published post remains in the published collection.
- Fixture: Create one page and one post using the two content types, then inspect public navigation/list and direct URLs. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Compare with a normal post under the same category/route context.
- Risks: Theme templates may alter listing placement; avoid assuming a particular menu entry.; The pinned model and collections support these stored/list outcomes; theme navigation and direct public URL placement are outside the cited path and require further verification.
- Limitations: Pinned source review only; no runtime validation.

## BL-GAP-004 — Administrator can change a non-admin user's role and retain it

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Persisted role is Administrator after reload and account permission reflects that role on an admin-only route.
- Fixture: Change the user's role to Administrator, save, reload the edit form, then log in with the seeded account. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Attempt the same role change while signed in as Editor; save must not grant elevated access.
- Risks: Authorization may be enforced in controller/router outside the inspected form; treat route denial as an uncertainty until traced.; View exposes role selector only for an Administrator; role persistence and privilege effect need validation.
- Limitations: Pinned source review only; no runtime validation.

## CL-GAP-001 — Course document upload, move and delete lifecycle

- Oracle: `INSUFFICIENT_EVIDENCE` — Uploaded file appears in the course document list; after move it appears at the new path, and after delete it is absent.
- Fixture: Upload the file, move it to a different course-folder path, then delete it through the document tool. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Student without edit permission attempts rename/delete; content remains unchanged.
- Risks: Legacy file UI and filesystem cleanup need an isolated course fixture.; Pinned document controller implements upload, move and delete commands with course/group access checks; exact UI outcomes need validation.
- Limitations: Pinned source only; no runtime/image validation.; For Claroline, incomplete archived source and unattributed runtime image patch materially limit inference.

## CL-GAP-002 — Group space is inaccessible to a non-member student

- Oracle: `INSUFFICIENT_EVIDENCE` — Unauthorized group content is not rendered; self-registration changes access only for the configured open group.
- Fixture: As the student, open group B directly, then join only if the interface permits self-registration. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Repeat against the student's assigned group A and verify access succeeds.
- Risks: Group membership fixture and legacy session isolation are required.; Source gates group-space entry with course/group authorization; policy for open self-registration requires exact config confirmation.
- Limitations: Pinned source only; no runtime/image validation.; For Claroline, incomplete archived source and unattributed runtime image patch materially limit inference.

## CL-GAP-003 — Teacher imports an exercise package into a course

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Import reports success and the new exercise/questions appear exactly once in the course list.
- Fixture: Use the exercise import command to import the fixture. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Submit a malformed package and verify no partial exercise is created.
- Risks: Requires a valid legacy package fixture and transactional cleanup.; Pinned exercise page requires edit permission and calls `import_exercise`; exact package format and atomicity remain to verify.
- Limitations: Pinned source only; no runtime/image validation.; For Claroline, incomplete archived source and unattributed runtime image patch materially limit inference.

## CL-GAP-004 — Tracking controls are teacher-only while exercise attempts remain student-facing

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Student receives the attempt outcome; teacher tracking is available only to an editor when tracking is enabled.
- Fixture: Submit the exercise as student, then inspect tracking as teacher and as student. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Disable tracking and verify the tracking view is unavailable without removing student exercise access.
- Risks: Tracking setting and legacy permission model make the oracle configuration-sensitive.; Source derives tracking permission from editor status and tracking configuration; full result semantics are not inferred.
- Limitations: Pinned source only; no runtime/image validation.; For Claroline, incomplete archived source and unattributed runtime image patch materially limit inference.

## EC-GAP-002 — Stock tracking rejects a cart quantity above available product or variant stock

- Oracle: `SOURCE_SUPPORTED` — With stock tracking enabled and tracking not disabled for the item, attempting to set quantity above product/variant stock returns HTTP 400 with an insufficient-stock message and leaves the prior cart quantity unchanged.
- Fixture: Set tracked product or variant stock to 1, add quantity 1, then request update to quantity 2 and inspect response and cart state. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: With global trackStock disabled or product stock tracking disabled, do not assert this stock-rejection response.
- Risks: The exact rejection path may depend on cart validation outside the inspected product routes.; Pinned routes/index.js implements a hard stock bound and separately aggregates quantities held in other carts; cart update UI feedback and configuration/variant edge cases remain unexecuted.
- Limitations: Pinned source review only; no runtime validation.

## EC-GAP-003 — Customer address update persists and is copied from session into order snapshot

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Customer update writes address fields to the customer record and session; a subsequent order creation request that omits address fields falls back to those session values in the persisted order snapshot.
- Fixture: Update address through /customer/update, verify database and session values, then create one order with request address fields omitted and compare order snapshot. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Use a distinct request-body address and verify the order route prefers the request value over the session fallback.
- Risks: Session-cached address may mask persistence unless a new session/relogin is used.; Source shows DB update/session refresh and the order route explicit request-body-or-session fallback. The POST /admin/order/create handler lacks restrict/checkAccess; that auth defect is tracked separately. Runtime flow is NOT_RUN.
- Limitations: Pinned source review only; no runtime validation.

## EC-GAP-004 — Invalid discount date windows are rejected during admin update

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Each invalid update returns the validation error and leaves the stored discount window unchanged.
- Fixture: One unique discount record with a future valid window; no real customer data. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Submit a future start and an end later than start; the update should be accepted.
- Risks: Date parsing and timezone must be controlled; route-level validation can be asserted without relying on redemption behavior.; Pinned route source checks start-before-now and end-not-after-start on update. It does not establish checkout redemption semantics.
- Limitations: Pinned source review only; no runtime validation.

## JO-GAP-001 — Featured article flag appears and is removed from the featured list

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Article appears exactly once in featured list while enabled and disappears when disabled; article record remains published.
- Fixture: Toggle featured on, reload list, then toggle off. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Use a published but unfeatured article and verify it remains outside the featured list.
- Risks: Feature visibility can depend on front-end menu configuration.; Model updates the featured table and featured query filters by flag/state/access; public rendering remains configuration-dependent.
- Limitations: Pinned source review only; no runtime validation.

## JO-GAP-002 — Publish-up and publish-down define the article visibility window

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Article is hidden before start, visible during the window, and hidden after end.
- Fixture: Set future publish-up and future publish-down, then inspect before, within and after the window. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Keep a normal published article as a control at each observation time.
- Risks: Timezone, cache and server clock can make boundaries flaky.; Source listing exposes publish_up/down and model assigns publish dates; actual front-end boundary behavior requires runtime check.
- Limitations: Pinned source review only; no runtime validation.

## JO-GAP-003 — Editor without edit-state permission cannot change publication state

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Editor cannot persist state change and receives an authorization outcome; administrator can perform the change.
- Fixture: Attempt to unpublish as editor, then as administrator. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Admin control confirms the test target is otherwise editable.
- Risks: ACL setup and cached sessions need clean users.; Model's `canEditState` checks `core.edit.state`; UI messaging and effective role mapping require reviewer/runtime verification.
- Limitations: Pinned source review only; no runtime validation.

## JO-GAP-004 — Editing an article increments its version counter

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Version counter increases once for one successful save and remains unchanged after a rejected save.
- Fixture: Edit and save a single field, then reload version/history information. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Submit an invalid edit and verify version does not increment.
- Risks: Displayed version/history UI may require Joomla content-history configuration.; Source model increments the article version on save; UI history visibility is a separate uncertainty.
- Limitations: Pinned source review only; no runtime validation.

## MB-GAP-001 — User monitors and stops monitoring an issue for their own account

- Oracle: `INSUFFICIENT_EVIDENCE` — Monitoring indicator and per-user state change only for the acting account; a second user remains unchanged.
- Fixture: Enable monitoring, reload, disable monitoring, reload. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Second account must not inherit the first user's monitor state.
- Risks: Email notification configuration may obscure the UI oracle.; Pinned route explicitly uses current user and monitor threshold; end-to-end notification effects are excluded.
- Limitations: Pinned source review only; no runtime validation.

## MB-GAP-002 — Private issue note is hidden from users below the private-note threshold

- Oracle: `INSUFFICIENT_EVIDENCE` — Authorized reporter sees note and recorded time; viewer below threshold cannot see private note or marker.
- Fixture: Add a private note with time-tracking value, then open as reporter and lower-privilege viewer. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Add a public note control; both users should see it.
- Risks: Threshold defaults and permission settings require explicit pinning in fixture.; Source path uses the visible-bugnote query; the exact permission threshold and privacy persistence must be pinned in the fixture.
- Limitations: Pinned source review only; no runtime validation.

## MB-GAP-003 — Issue relationship rejects self-link and duplicate links

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — First relation is recorded once; duplicate and self-link are rejected or safely handled without duplicate rows.
- Fixture: Create a related/duplicate/dependency link, repeat it, then try linking an issue to itself. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Try a destination issue the actor cannot view; no relationship details should leak.
- Risks: Relationship type-specific constraints and duplicate handling need separate assertions.; Source rejects same issue and detects existing same-type relationships; exact UI outcome needs validation.
- Limitations: Pinned source review only; no runtime validation.

## MB-GAP-004 — Issue attachment upload is persisted and rejects invalid input

- Oracle: `INSUFFICIENT_EVIDENCE` — The issue page shows the uploaded attachment after reload; oversized/missing input produces an error and leaves no partial attachment.
- Fixture: Upload attachment, reload issue, download it as authorized user, then attempt as unauthorized user. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: As a user without update access, attempt upload and verify no attachment is created.
- Risks: Filesystem vs database attachment mode changes storage cleanup.; Source validates upload input/size and checks issue access; storage configuration and exact UI error remain unverified.
- Limitations: Pinned source review only; no runtime validation.

## MW-GAP-001 — Moving a page preserves content at the target and optionally creates a redirect

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — New title contains prior content; old title resolves as redirect when selected; move history records the operation.
- Fixture: Move page to a new title with reason and redirect; open old and new titles. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Try an invalid occupied target and verify source page remains intact.
- Risks: Move permissions, title normalization and redirect suppression rights affect outcome.; Source checks permission/source/target and supports redirect choice; UI route and subpage/talk-page behavior need validation.
- Limitations: Pinned source review only; no runtime validation.

## MW-GAP-002 — Watch and unwatch state is scoped to the signed-in user

- Oracle: `INSUFFICIENT_EVIDENCE` — User A's watchlist gains/removes the page; user B's watchlist remains unchanged.
- Fixture: Watch the page as user A, inspect watchlist, then unwatch and inspect again. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Repeat with user B to verify isolation.
- Risks: Watchlist expiry settings and anonymous account behavior can vary.; Source includes a dedicated watch action and watchlist manager; UI labels require review.
- Limitations: Pinned source review only; no runtime validation.

## MW-GAP-003 — Upload validation rejects a disallowed or oversized file without creating a file page

- Oracle: `INSUFFICIENT_EVIDENCE` — Allowed upload is stored and addressable; invalid upload has a validation error and creates no file page/blob.
- Fixture: Upload allowed file, then attempt the invalid control file. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Use a valid small file as positive control and verify only one file record exists.
- Risks: Upload config, MIME detection and storage backend must be pinned.; Pinned UploadBase marks disallowed/missing extensions as a title error before performUpload; exact API/Special upload error presentation and no-file persistence must be confirmed through their frontend paths and runtime.
- Limitations: Pinned source review only; no runtime validation.

## MW-GAP-004 — A new edit creates a retrievable revision distinct from the prior revision

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — New revision has a later ID/timestamp and new content; old revision remains retrievable unchanged.
- Fixture: Edit one sentence and open page history or revision API for both revisions. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Attempt a rejected edit and verify no new revision is added.
- Risks: History display/API state and edit tokens need pinned config.; PageUpdater links a normal edit commit to RevisionStore insertion; RevisionStore exposes lookup by revision ID. The history UI and baseline overlap remain for further verification.
- Limitations: Pinned source review only; no runtime validation.

## PS-GAP-001 — Cart-rule per-customer usage limit is enforced

- Oracle: `INSUFFICIENT_EVIDENCE` — First redemption is accepted; second is rejected or omitted and the order total reflects no second discount.
- Fixture: Redeem once, reset cart and attempt to redeem again as the same customer. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: A different customer can redeem if global quantity remains available.
- Risks: Order state, cart rule caches and generated customer account need deterministic reset.; Source stores per-customer quantity and checkValidity evaluates usage; UI wording and order timing remain unverified.
- Limitations: Pinned source review only; no runtime validation.

## PS-GAP-002 — Carrier eligibility follows configured price/weight range

- Oracle: `INSUFFICIENT_EVIDENCE` — The available-carrier calculation returns only carriers with a matching price/weight range when range_behavior requests deactivation; with fallback behavior enabled, the carrier remains eligible and the configured maximum-range price path applies.
- Fixture: Proceed to carrier selection with cart value/weight below, at and above configured ranges. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Switch from price-based to weight-based range and ensure the other basis does not determine eligibility.
- Risks: Carrier module/config and tax inclusion influence calculated values.; Pinned getCarriersForOrder and getAvailableCarrierList implement the eligibility and range/fallback logic. The checkout template/API presentation and zone/shop configuration effects still require runtime validation.
- Limitations: Pinned source review only; no runtime validation.

## PS-GAP-003 — Successful payment creates one order and applies stock synchronization

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Exactly one order/history entry exists and stock quantity changes according to configured stock-dependency mode.
- Fixture: Complete checkout once; reload order confirmation and product stock. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Force payment validation failure and verify no completed order/stock decrement is falsely recorded.
- Risks: Payment module and stock dependency settings must be fixed; avoid real payment provider.; Source validates orders, writes order details/history and conditionally synchronizes stock; payment result semantics need test module.
- Limitations: Pinned source review only; no runtime validation.

## PS-GAP-004 — Available quantity update stays consistent with product/combination stock

- Oracle: `PARTIALLY_SOURCE_SUPPORTED` — Each combination retains its own expected quantity unless stock sharing is enabled; storefront availability follows the configured quantity.
- Fixture: Update available quantity for each combination through admin and reload product availability. Cleanup is only planned; shared-state safety must be validated before execution.
- Negative control: Attempt a negative/non-integer quantity and verify validation rejects it.
- Risks: Product-combination and shop stock-sharing settings complicate reset and oracle.; Source models quantity and synchronization; combination/shop-specific semantics need configuration pinning.
- Limitations: Pinned source review only; no runtime validation.
