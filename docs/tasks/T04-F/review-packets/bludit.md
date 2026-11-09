# bludit — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 2.3.4
- Source pin: [bludit/bludit@44de235a5eedda9b80d9f0babd9fd5cb8c6943bd](https://github.com/bludit/bludit/tree/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd) (tree `15a959ca224f4d2ff86e0e22d9adf2bba40cb584`; provenance PINNED_RELEASE_SOURCE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/bludit/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/bludit/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/bludit/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 4; technical review order: 3. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## BL-GAP-001 — Scheduled pages are promoted on a request after their due time

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Administrator / Admin.
- Proposed preconditions: A page with a future publish date; isolated clock-controlled fixture or bounded wait; no existing page with same slug.
- Proposed fixture/action: Create a published page with a future date; observe its scheduled state, then observe after the due time.
- Expected observable (oracle proposal, not approved): A future-dated published page is stored with scheduled status; a page request after its due date runs the scheduler, changes its stored status to published, and makes it eligible for the published-page collection.
- Negative control: Repeat with a future-dated draft; it must remain unpublished.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Potentially distinct from BL-017 change-post-date; that baseline case changes the date but does not specify the scheduler transition. Novelty remains unverified.

Baseline references:
`bludit-17-changepostdatetest` — `bludit/gherkin/bludit-3.13.1/17_ChangePostDateTest.feature` (); Java `bludit/baseline/bludit-2.3.4/src/test/java/tests/ChangePostDateTest.java`, assertion refs 27:assertEquals.

Source references:
- [BL-S01](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/dbpages.class.php) — `bl-kernel/dbpages.class.php` lines 13-18,39-53,82-110,131-140,149-166,193-216,313-373,417-423,449-456,548-579; blob `9283d3f27354817808a4419691b2536db4682202`. Stores and persists page fields; maps future publish dates to scheduled; scheduler promotes due entries to published; published/static collections are separately queried.
- [BL-S02](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/boot/rules/69.pages.php) — `bl-kernel/boot/rules/69.pages.php` lines 87-100,102-129; blob `b3cb53cd97475cc824f9ce5f6b742f8305ebb721`. Invokes the database page scheduler during page boot, then builds public pages from published content.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Scheduled pages are promoted on a request after their due time
  Given A page with a future publish date; isolated clock-controlled fixture or bounded wait; no existing page with same slug.
  When Create a published page with a future date; observe its scheduled state, then observe after the due time.
  Then A future-dated published page is stored with scheduled status; a page request after its due date runs the scheduler, changes its stored status to published, and makes it eligible for the published-page collection.
  And Repeat with a future-dated draft; it must remain unpublished.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Confirm the clock-control strategy can drive the request-time scheduler deterministically; do not use an unbounded sleep. Review whether persisted status and public visibility are both needed as separate assertions.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## BL-GAP-002 — Cover image selection persists and renders for content

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Administrator / Editor or Administrator.
- Proposed preconditions: Use a small synthetic PNG in the app-managed images area; choose a unique content slug.
- Proposed fixture/action: Select a local cover image while editing content, save, reload and open the public content page.
- Expected observable (oracle proposal, not approved): Saved content references the selected image and the public page resolves that image in its cover slot.
- Negative control: Save without a cover image and verify no broken/placeholder URL is emitted.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Potential gap beyond generic add-content; baseline content creation does not state a cover-image persistence/render oracle.

Baseline references:
`bludit-01-addcontenttest` — `bludit/gherkin/bludit-3.13.1/01_AddContentTest.feature` (); Java `bludit/baseline/bludit-2.3.4/src/test/java/tests/AddContentTest.java`, assertion refs 22:assertEquals.

Source references:
- [BL-S01](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/dbpages.class.php) — `bl-kernel/dbpages.class.php` lines 13-18,39-53,82-110,131-140,149-166,193-216,313-373,417-423,449-456,548-579; blob `9283d3f27354817808a4419691b2536db4682202`. Stores and persists page fields; maps future publish dates to scheduled; scheduler promotes due entries to published; published/static collections are separately queried.
- [BL-S03](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/admin/views/edit-content.php) — `bl-kernel/admin/views/edit-content.php` lines 91-110; blob `2b0bd4833d517b089f67658733140cc46aa7c56a`. Edit-content view exposes the Images tab and cover-image field.
- [BL-S08](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/page.class.php) — `bl-kernel/page.class.php` lines 311-331; blob `e5b5ac30e92cb255b6a7c7cfd3e446e1560ba60a`. Page coverImage accessor resolves a stored image key into the app-managed image URL; it returns false when unset.
- [BL-S09](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-themes/alternative/php/page.php) — `bl-themes/alternative/php/page.php` lines 17-27; blob `354a0e993cdfd513c9aafb3e54e43afc3faf7638`. Pinned alternative theme renders the page cover image accessor in its page template.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Cover image selection persists and renders for content
  Given Use a small synthetic PNG in the app-managed images area; choose a unique content slug.
  When Select a local cover image while editing content, save, reload and open the public content page.
  Then Saved content references the selected image and the public page resolves that image in its cover slot.
  And Save without a cover image and verify no broken/placeholder URL is emitted.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Scope rendering to the exact source-supported theme and pin that theme/configuration. Generic content creation is only partial overlap; no UI/runtime proof exists.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## BL-GAP-004 — Administrator can change a non-admin user's role and retain it

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Administrator / Administrator acting on an Editor.
- Proposed preconditions: Seed a second non-admin user and record their current role; use synthetic credentials.
- Proposed fixture/action: Change the user's role to Administrator, save, reload the edit form, then log in with the seeded account.
- Expected observable (oracle proposal, not approved): Persisted role is Administrator after reload and account permission reflects that role on an admin-only route.
- Negative control: Attempt the same role change while signed in as Editor; save must not grant elevated access.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline add/delete user and password cases do not assert role editing or role-specific access.

Baseline references:
`bludit-08-addusertest` — `bludit/gherkin/bludit-3.13.1/08_AddUserTest.feature` (); Java `bludit/baseline/bludit-2.3.4/src/test/java/tests/AddUserTest.java`, assertion refs 27:assertEquals.
`bludit-16-deleteusertest` — `bludit/gherkin/bludit-3.13.1/16_DeleteUserTest.feature` (); Java `bludit/baseline/bludit-2.3.4/src/test/java/tests/DeleteUserTest.java`, assertion refs 22:assertFalse.
`bludit-09-changepasswordtest` — `bludit/gherkin/bludit-3.13.1/09_ChangePasswordTest.feature` (); Java `bludit/baseline/bludit-2.3.4/src/test/java/tests/ChangePasswordTest.java`, assertion refs 25:assertEquals.

Source references:
- [BL-S04](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/admin/views/edit-user.php) — `bl-kernel/admin/views/edit-user.php` lines 56-62,135-160; blob `fa84c88ec6efdd8acea415831bfc9822713a2d98`. Admin-only role selector offers Editor/Administrator; disabled-user password guidance.
- [BL-S06](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/admin/controllers/edit-user.php) — `bl-kernel/admin/controllers/edit-user.php` lines 18-20,33,44; blob `fa312712e3bbb845744d70a0466b9ee3ccefb60e`. Only admin can change role; controller removes posted role for non-admin and calls editUser.
- [BL-S07](https://github.com/bludit/bludit/blob/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd/bl-kernel/dbusers.class.php) — `bl-kernel/dbusers.class.php` lines 9,61-99; blob `283f7e36584c5c15e0f27f933029268631d86260`. User storage model defines default editor role and saves user records.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Administrator can change a non-admin user's role and retain it
  Given Seed a second non-admin user and record their current role; use synthetic credentials.
  When Change the user's role to Administrator, save, reload the edit form, then log in with the seeded account.
  Then Persisted role is Administrator after reload and account permission reflects that role on an admin-only route.
  And Attempt the same role change while signed in as Editor; save must not grant elevated access.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Source includes an admin-only role editor/controller guard. Reviewer should still confirm effective-role behavior on an admin-only route and distinguish UI hiding from server authorization.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
