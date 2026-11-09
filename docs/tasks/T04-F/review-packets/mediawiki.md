# mediawiki — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 1.40.0
- Source pin: [wikimedia/mediawiki@468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4](https://github.com/wikimedia/mediawiki/tree/468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4) (tree `8d24c06db094d7abbadfc0d6ac6f31e3d75c8f5c`; provenance PINNED_RELEASE_SOURCE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/mediawiki/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/mediawiki/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/mediawiki/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 4; technical review order: 3. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## MW-GAP-001 — Moving a page preserves content at the target and optionally creates a redirect

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Editor with move permission / Editor with page-move right.
- Proposed preconditions: Existing source page with unique text; destination title unused; redirect option enabled.
- Proposed fixture/action: Move page to a new title with reason and redirect; open old and new titles.
- Expected observable (oracle proposal, not approved): New title contains prior content; old title resolves as redirect when selected; move history records the operation.
- Negative control: Try an invalid occupied target and verify source page remains intact.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline creates/edits/deletes/redirects pages but does not map to page move.

Baseline references:
`mediawiki-03-createpagetest` — `mediawiki/gherkin/03_CreatePageTest.feature` (Creates a new page); Java `mediawiki/baseline/mediawiki-1.40.0/src/test/java/mediawiki/CreatePageTest.java`, assertion refs 22:assertEquals, 23:assertEquals.
`mediawiki-06-editpagetest` — `mediawiki/gherkin/06_EditPageTest.feature` (Edits a page); Java `mediawiki/baseline/mediawiki-1.40.0/src/test/java/mediawiki/EditPageTest.java`, assertion refs 20:assertEquals, 21:assertEquals.
`mediawiki-21-createredirecttest` — `mediawiki/gherkin/21_CreateRedirectTest.feature` (Creates a new redirect); Java `mediawiki/baseline/mediawiki-1.40.0/src/test/java/mediawiki/CreateRedirectTest.java`, assertion refs 21:assertEquals.
`mediawiki-22-followredirecttest` — `mediawiki/gherkin/22_FollowRedirectTest.feature` (Searches a keyword for which a redirect has been defined); Java `mediawiki/baseline/mediawiki-1.40.0/src/test/java/mediawiki/FollowRedirectTest.java`, assertion refs 16:assertEquals, 17:assertEquals.

Source references:
- [MW-S01](https://github.com/wikimedia/mediawiki/blob/468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4/includes/page/MovePage.php) — `includes/page/MovePage.php` lines 325-413,504-528; blob `20a30cd25355e85f73113cd74a9d17c2c56079ef`. Move operation checks permissions, validates source/target and exposes optional redirect creation.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Moving a page preserves content at the target and optionally creates a redirect
  Given Existing source page with unique text; destination title unused; redirect option enabled.
  When Move page to a new title with reason and redirect; open old and new titles.
  Then New title contains prior content; old title resolves as redirect when selected; move history records the operation.
  And Try an invalid occupied target and verify source page remains intact.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Pin redirect enabled/disabled and source/target behavior; test occupied-title negative control without losing source-page content.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## MW-GAP-002 — Watch and unwatch state is scoped to the signed-in user

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Registered editor / Authenticated user.
- Proposed preconditions: Two registered users and one existing page; watchlist initially excludes the page for both.
- Proposed fixture/action: Watch the page as user A, inspect watchlist, then unwatch and inspect again.
- Expected observable (oracle proposal, not approved): User A's watchlist gains/removes the page; user B's watchlist remains unchanged.
- Negative control: Repeat with user B to verify isolation.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline page create/edit/search/revert cases do not cover user-specific watchlist state.

Source references:
- [MW-S02](https://github.com/wikimedia/mediawiki/blob/468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4/includes/actions/WatchAction.php) — `includes/actions/WatchAction.php` lines 28-64; blob `2882d987e8938fe1876270c1c49f8a3e3512a10e`. Watch action integrates current page with user watchlist and expiry configuration.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Watch and unwatch state is scoped to the signed-in user
  Given Two registered users and one existing page; watchlist initially excludes the page for both.
  When Watch the page as user A, inspect watchlist, then unwatch and inspect again.
  Then User A's watchlist gains/removes the page; user B's watchlist remains unchanged.
  And Repeat with user B to verify isolation.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Use two registered users and clean sessions; confirm watchlist state is user-scoped and avoid asserting notification delivery.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## MW-GAP-003 — Upload validation rejects a disallowed or oversized file without creating a file page

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Uploader / Authenticated user with upload permission.
- Proposed preconditions: Synthetic allowed text/image file and a disallowed or over-limit control file; upload enabled in local config.
- Proposed fixture/action: Upload allowed file, then attempt the invalid control file.
- Expected observable (oracle proposal, not approved): Allowed upload is stored and addressable; invalid upload has a validation error and creates no file page/blob.
- Negative control: Use a valid small file as positive control and verify only one file record exists.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. T04-D baseline has no mapped upload case.

Source references:
- [MW-S04](https://github.com/wikimedia/mediawiki/blob/468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4/includes/upload/UploadBase.php) — `includes/upload/UploadBase.php` lines 646-692,905-945,963-1064; blob `485e92dab9b7b80485949781d7137da5201cf0e5`. UploadBase validates filename/extensions and reports title errors; successful performUpload delegates to LocalFile::upload; frontend error rendering is not inferred.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Upload validation rejects a disallowed or oversized file without creating a file page
  Given Synthetic allowed text/image file and a disallowed or over-limit control file; upload enabled in local config.
  When Upload allowed file, then attempt the invalid control file.
  Then Allowed upload is stored and addressable; invalid upload has a validation error and creates no file page/blob.
  And Use a valid small file as positive control and verify only one file record exists.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- NARROW before approval: current title includes oversized files, while cited uncertainty primarily establishes extension/title validation. Keep only disallowed-extension behavior unless a pinned source reference proves the oversize branch and no-file persistence.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
