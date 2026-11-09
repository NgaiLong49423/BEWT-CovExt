# mantisbt — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 1.2.0
- Source pin: [mantisbt/mantisbt@d06bf60f5ed9f96029bb830a005d4819a4f87b45](https://github.com/mantisbt/mantisbt/tree/d06bf60f5ed9f96029bb830a005d4819a4f87b45) (tree `55de24eebb87e4337e31b2f668554466c591d99d`; provenance PINNED_RELEASE_SOURCE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/mantisbt/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/mantisbt/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/mantisbt/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 4; technical review order: 3. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## MB-GAP-001 — User monitors and stops monitoring an issue for their own account

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Reporter or developer / Authenticated issue viewer with monitor permission.
- Proposed preconditions: Issue in accessible project; user initially not monitoring; separate account available for isolation.
- Proposed fixture/action: Enable monitoring, reload, disable monitoring, reload.
- Expected observable (oracle proposal, not approved): Monitoring indicator and per-user state change only for the acting account; a second user remains unchanged.
- Negative control: Second account must not inherit the first user's monitor state.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline assignment/status/project tests do not cover per-user monitoring state.

Source references:
- [MB-S02](https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/bug_monitor_add.php) — `bug_monitor_add.php` lines 30-67; blob `6bcc02763e4639108dd10dd9f92d150ed209c196`. Monitor route acts on current user and verifies monitoring permission.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: User monitors and stops monitoring an issue for their own account
  Given Issue in accessible project; user initially not monitoring; separate account available for isolation.
  When Enable monitoring, reload, disable monitoring, reload.
  Then Monitoring indicator and per-user state change only for the acting account; a second user remains unchanged.
  And Second account must not inherit the first user's monitor state.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Assert per-user monitor state only; explicitly exclude email delivery/notifications unless separately configured and evidenced.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## MB-GAP-003 — Issue relationship rejects self-link and duplicate links

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Developer / Can update source and destination issues.
- Proposed preconditions: Two accessible issues with no relationship; unique pair in isolated project.
- Proposed fixture/action: Create a related/duplicate/dependency link, repeat it, then try linking an issue to itself.
- Expected observable (oracle proposal, not approved): First relation is recorded once; duplicate and self-link are rejected or safely handled without duplicate rows.
- Negative control: Try a destination issue the actor cannot view; no relationship details should leak.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Baseline links/unlinks project subprojects; issue-to-issue relationship semantics are not covered.

Baseline references:
`mantisbt-33-addmultiplesubprojects` — `mantisbt/gherkin/33_AddMultipleSubprojects.feature` (Adds a new project and then adds two subprojects); Java `mantisbt/baseline/mantisbt-1.2.0/src/test/java/base/AddMultipleSubprojects.java`, assertion refs 35:assertTrue, 43:assertTrue.
`mantisbt-34-unlinkmultiplesubprojects` — `mantisbt/gherkin/34_UnlinkMultipleSubprojects.feature` (Unlinks two subprojects from their parent project); Java `mantisbt/baseline/mantisbt-1.2.0/src/test/java/base/UnlinkMultipleSubprojects.java`, assertion refs 20:assertFalse, 23:assertFalse.
`mantisbt-35-linkmultiplesubprojects` — `mantisbt/gherkin/35_LinkMultipleSubprojects.feature` (Links two subprojects to another project); Java `mantisbt/baseline/mantisbt-1.2.0/src/test/java/base/LinkMultipleSubprojects.java`, assertion refs 23:assertTrue, 29:assertTrue.

Source references:
- [MB-S03](https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/bug_relationship_add.php) — `bug_relationship_add.php` lines 31-83; blob `2af42c0d97251e2f6e4ad6914177d42c1d128643`. Relationship route validates source/destination, same-issue and existing relationship cases.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Issue relationship rejects self-link and duplicate links
  Given Two accessible issues with no relationship; unique pair in isolated project.
  When Create a related/duplicate/dependency link, repeat it, then try linking an issue to itself.
  Then First relation is recorded once; duplicate and self-link are rejected or safely handled without duplicate rows.
  And Try a destination issue the actor cannot view; no relationship details should leak.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Current oracle says “rejected or safely handled,” which is not a single deterministic expectation. Reviewer must choose the source-supported duplicate outcome and exact UI/API signal before approval.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## MB-GAP-004 — Issue attachment upload is persisted and rejects invalid input

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Reporter / Can update an issue and upload files.
- Proposed preconditions: Issue in isolated project; small synthetic text attachment with unique filename/content marker.
- Proposed fixture/action: Upload attachment, reload issue, download it as authorized user, then attempt as unauthorized user.
- Expected observable (oracle proposal, not approved): The issue page shows the uploaded attachment after reload; oversized/missing input produces an error and leaves no partial attachment.
- Negative control: As a user without update access, attempt upload and verify no attachment is created.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline issue creation/update/deletion has no attachment upload/download assertion.

Source references:
- [MB-S04](https://github.com/mantisbt/mantisbt/blob/d06bf60f5ed9f96029bb830a005d4819a4f87b45/bug_file_add.php) — `bug_file_add.php` lines 30-52; blob `ae768da9cb2a16fd946107f3718132811e27d7d8`. Attachment route validates bug/file input, upload limit and bug access.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Issue attachment upload is persisted and rejects invalid input
  Given Issue in isolated project; small synthetic text attachment with unique filename/content marker.
  When Upload attachment, reload issue, download it as authorized user, then attempt as unauthorized user.
  Then The issue page shows the uploaded attachment after reload; oversized/missing input produces an error and leaves no partial attachment.
  And As a user without update access, attempt upload and verify no attachment is created.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Pin filesystem/database attachment storage mode. Test oversize and missing-file controls separately; prove no partial database or filesystem artifact remains.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
