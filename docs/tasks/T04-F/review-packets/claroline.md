# claroline — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 1.11.10
- Source pin: [zefredz/claroline@22d852f93081bc36b1d08b93f5e0c14b49a573f6](https://github.com/zefredz/claroline/tree/22d852f93081bc36b1d08b93f5e0c14b49a573f6) (tree `f10d5b9747f13e0256b3f52f7663a1475340bfe4`; provenance PARTIAL_RELEASE_SOURCE_CORE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/claroline/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/claroline/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/claroline/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 4; technical review order: 3. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## CL-GAP-001 — Course document upload, move and delete lifecycle

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Teacher / Course editor.
- Proposed preconditions: Dedicated course with document tool enabled; synthetic text file; no pre-existing same-name document.
- Proposed fixture/action: Upload the file, move it to a different course-folder path, then delete it through the document tool.
- Expected observable (oracle proposal, not approved): Uploaded file appears in the course document list; after move it appears at the new path, and after delete it is absent.
- Negative control: Student without edit permission attempts rename/delete; content remains unchanged.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. T04-D maps user/course/exercise/event operations but no document file lifecycle.

Source references:
- [CL-S01](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/document/document.php) — `claroline/document/document.php` lines 20-51,69-104,202-375,742-767,1208-1224; blob `8afb874f28190449bb604e413b40d9236ac56eda`. Document tool implements upload, move and delete commands and gates course/group access.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Course document upload, move and delete lifecycle
  Given Dedicated course with document tool enabled; synthetic text file; no pre-existing same-name document.
  When Upload the file, move it to a different course-folder path, then delete it through the document tool.
  Then Uploaded file appears in the course document list; after move it appears at the new path, and after delete it is absent.
  And Student without edit permission attempts rename/delete; content remains unchanged.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Claroline source availability is PARTIAL: only pinned core Git source is represented; CLCHAT files are release-archive-only. Confirm document tool semantics and safe filesystem cleanup fixture.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## CL-GAP-002 — Group space is inaccessible to a non-member student

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Teacher and student / Teacher manages; student is not in target group.
- Proposed preconditions: Course with two groups and one enrolled student assigned only to group A; group B has private content.
- Proposed fixture/action: As the student, open group B directly, then join only if the interface permits self-registration.
- Expected observable (oracle proposal, not approved): Unauthorized group content is not rendered; self-registration changes access only for the configured open group.
- Negative control: Repeat against the student's assigned group A and verify access succeeds.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Baseline course enrollment/password/denied-course cases cover course-level gates, not group-space membership boundary.

Baseline references:
`claroline-27-adddeniedcoursetest` — `claroline/gherkin/27_AddDeniedCourseTest.feature` (Adds a denied (closed registrations) course); Java `claroline/baseline/claroline-1.11.10/src/test/java/test/Claroline_AddDeniedCourseTest.java`, assertion refs 20:assertEquals.
`claroline-28-enroldeniedcoursetest` — `claroline/gherkin/28_EnrolDeniedCourseTest.feature` (Tries to enrol to a closed registration course and fails); Java `claroline/baseline/claroline-1.11.10/src/test/java/test/Claroline_EnrolDeniedCourseTest.java`, assertion refs 20:assertEquals.
`claroline-30-enrolpasswordcoursewrongpasswordusertest` — `claroline/gherkin/30_EnrolPasswordCourseWrongPasswordUserTest.feature` (The user tries to enrol to a password protected course using a wrong password and fails); Java `claroline/baseline/claroline-1.11.10/src/test/java/test/Claroline_EnrolPasswordCourseWrongPasswordUserTest.java`, assertion refs 20:assertEquals.

Source references:
- [CL-S03](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group_space.php) — `claroline/group/group_space.php` lines 29-41; blob `825d811e822c687968fc0c48c59dad7b8fae2261`. Group space checks course/group authorization and redirects or denies access.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Group space is inaccessible to a non-member student
  Given Course with two groups and one enrolled student assigned only to group A; group B has private content.
  When As the student, open group B directly, then join only if the interface permits self-registration.
  Then Unauthorized group content is not rendered; self-registration changes access only for the configured open group.
  And Repeat against the student's assigned group A and verify access succeeds.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Resolve exact group visibility and whether self-registration is enabled for the tested group. Keep access-to-course controls distinct from group membership.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## CL-GAP-003 — Teacher imports an exercise package into a course

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Teacher / Course editor.
- Proposed preconditions: Fresh course with exercise tool enabled and a harmless export-format package containing a unique exercise/question.
- Proposed fixture/action: Use the exercise import command to import the fixture.
- Expected observable (oracle proposal, not approved): Import reports success and the new exercise/questions appear exactly once in the course list.
- Negative control: Submit a malformed package and verify no partial exercise is created.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline creates exercises and questions manually; it does not cover package import.

Source references:
- [CL-S02](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/exercise/exercise.php) — `claroline/exercise/exercise.php` lines 17-23,66-92; blob `0fa1ed922ae3f40cde4528b0c144c56565f135df`. Exercise page checks course access, separates edit/tracking rights and imports exercises for editors.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Teacher imports an exercise package into a course
  Given Fresh course with exercise tool enabled and a harmless export-format package containing a unique exercise/question.
  When Use the exercise import command to import the fixture.
  Then Import reports success and the new exercise/questions appear exactly once in the course list.
  And Submit a malformed package and verify no partial exercise is created.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Specify a valid import package format and an observable atomicity oracle before implementation; malformed-package rollback is not established by the current source note.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
