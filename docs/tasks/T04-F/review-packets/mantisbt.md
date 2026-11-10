# Mantisbt — Human Review Packet (Milestone 3 / G1)

**Application Version:** 1.2.0  
**Baseline Physical Features:** 38  
**Baseline Test Classes:** 37  
**Baseline Assertions:** 51  
**Baseline Unique Behavioral Units (D_base):** 26  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Mantisbt** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. MB-GAP-001 — User monitors and stops monitoring an issue for their own account

- **Target Novelty Class:** `NOVEL_ISSUE_OBSERVATION_STATE`
- **Actor:** Developer (Authenticated issue viewer with monitor rights)
- **Preconditions:** Issue #201 exists; user 'dev_dave' currently not monitoring.
- **Test Data:** `{"issueId": 201, "user": "dev_dave"}`

#### Gherkin Specification
```gherkin
Feature: Issue Monitoring
  Scenario: User monitors and stops monitoring an issue for their own account
    Given developer "dev_dave" is viewing issue #201
    And "dev_dave" is not currently listed as a monitor
    When "dev_dave" clicks the "Monitor" button
    Then the page reloads displaying "dev_dave" in the "Users monitoring this issue" list
    And the action button label changes to "End Monitoring"
    When "dev_dave" clicks "End Monitoring"
    Then "dev_dave" is removed from the monitoring list
    And other monitoring users remain unaffected
```

#### Observable Business Oracle
- **Positive Oracle:** mantis_bug_monitor_table adds then deletes (user_id, bug_id) record; UI updates monitor button toggle and list.
- **Negative Control:** A second user logging in sees 'dev_dave' monitoring state without their own account being affected.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Ensure monitor record is cleared.

#### Source Code Anchors
- **File:** `bug_monitor_add.php` (Lines: `30-65`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *monitor add handler*
- **File:** `bug_monitor_delete.php` (Lines: `30-65`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *monitor delete handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline tests issue assignment, status, and project configuration, but zero monitoring tests.

#### Review Ledger Entry Template
- **Candidate ID:** `MB-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. MB-GAP-002 — Private issue note is hidden from users below the private-note threshold

- **Target Novelty Class:** `NOVEL_NOTE_PRIVACY_BOUNDARY`
- **Actor:** Developer and Reporter (Developer adds private note; Reporter views issue)
- **Preconditions:** Issue #202 exists; Developer 'dev_dave' has private note view/add right; Reporter 'rep_bob' lacks it.
- **Test Data:** `{"issueId": 202, "noteText": "Confidential security vulnerability details"}`

#### Gherkin Specification
```gherkin
Feature: Note Privacy Authorization
  Scenario: Private issue note is hidden from users below the private-note threshold
    Given issue #202 exists in project "Core System"
    When developer "dev_dave" adds a note "Confidential security vulnerability details" with "Private" checked
    Then the note is displayed to "dev_dave" with a "Private" badge
    When reporter "rep_bob" views issue #202
    Then the note "Confidential security vulnerability details" is NOT rendered
    And public notes on issue #202 remain visible to "rep_bob"
```

#### Observable Business Oracle
- **Positive Oracle:** bugnote view query filters by view_state == 50; users below private_bugnote_threshold cannot see private notes.
- **Negative Control:** A note saved as Public is visible to both dev_dave and rep_bob.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete test bugnote.

#### Source Code Anchors
- **File:** `bugnote_add.php` (Lines: `40-90`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *bugnote add handler with view_state*
- **File:** `core/bugnote_api.php` (Lines: `120-170`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *visible bugnotes access check*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline updates issue summary and status, but never tests bugnotes or note privacy levels.

#### Review Ledger Entry Template
- **Candidate ID:** `MB-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. MB-GAP-003 — Issue relationship rejects self-link and duplicate links

- **Target Novelty Class:** `NOVEL_ISSUE_RELATION_CONSTRAINTS`
- **Actor:** Developer (Issue updater)
- **Preconditions:** Two open issues #203 and #204 exist in the project.
- **Test Data:** `{"sourceBug": 203, "destBug": 204, "relType": "related-to"}`

#### Gherkin Specification
```gherkin
Feature: Issue Relationship Constraints
  Scenario: Issue relationship rejects self-link and duplicate links
    Given issues #203 and #204 exist in project "Core System"
    When developer links issue #203 as "parent of" issue #204
    Then issue #203 shows "parent of: #204" and issue #204 shows "child of: #203"
    When developer attempts to link issue #203 to issue #203
    Then the system rejects with error "You cannot link a bug to itself"
    When developer attempts to add a duplicate "parent of" link between #203 and #204
    Then the system rejects with error "Relationship already exists"
```

#### Observable Business Oracle
- **Positive Oracle:** mantis_bug_relationship_table enforces uniqueness and disallows source_bug_id == dest_bug_id.
- **Negative Control:** Linking issue #203 to an independent issue #205 succeeds without error.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete relationships between #203 and #204.

#### Source Code Anchors
- **File:** `bug_relationship_add.php` (Lines: `35-85`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *relationship validation and same-bug rejection*
- **File:** `core/relationship_api.php` (Lines: `80-130`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *relationship_exists check*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** MB-33..35 link/unlink project subprojects; baseline never tests issue-to-issue relationships or link constraints.

#### Review Ledger Entry Template
- **Candidate ID:** `MB-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. MB-GAP-004 — Issue attachment upload is persisted and rejects invalid input

- **Target Novelty Class:** `NOVEL_ATTACHMENT_MANAGEMENT`
- **Actor:** Reporter (Issue creator/reporter)
- **Preconditions:** Issue #205 exists; small synthetic text attachment 'stacktrace.txt'.
- **Test Data:** `{"issueId": 205, "fileName": "stacktrace.txt"}`

#### Gherkin Specification
```gherkin
Feature: Attachment Lifecycle
  Scenario: Issue attachment upload is persisted and rejects invalid input
    Given issue #205 exists in project "Core System"
    When reporter uploads file "stacktrace.txt" to issue #205
    Then the "Attached Files" section displays "stacktrace.txt" with file size and upload date
    And clicking "stacktrace.txt" downloads the exact original file content
    When reporter attempts to upload an empty file selection
    Then the system displays error "No file was selected for upload"
```

#### Observable Business Oracle
- **Positive Oracle:** mantis_bug_file_table stores file metadata; file content stored in disk/db and retrievable via file_download.php.
- **Negative Control:** Uploading a file exceeding max_file_size fails with file-size error.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete attachment from issue #205.

#### Source Code Anchors
- **File:** `bug_file_add.php` (Lines: `40-100`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *bug attachment upload handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline creates and updates issues, but has zero file attachment tests.

#### Review Ledger Entry Template
- **Candidate ID:** `MB-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. MB-GAP-005 — Issue tag attachment, display, and tag-based issue filter retrieval

- **Target Novelty Class:** `NOVEL_TAGGING_TAXONOMY`
- **Actor:** Developer (Issue updater)
- **Preconditions:** Issue #206 exists; clean tag 'regression-v2'.
- **Test Data:** `{"issueId": 206, "tagName": "regression-v2"}`

#### Gherkin Specification
```gherkin
Feature: Tagging and Filtered Retrieval
  Scenario: Issue tag attachment, display, and tag-based issue filter retrieval
    Given issue #206 exists with no tags
    When developer attaches tag "regression-v2" to issue #206
    Then issue #206 details view displays tag badge "regression-v2"
    When developer navigates to View Issues page and filters by tag "regression-v2"
    Then issue #206 is returned in the filtered list
    And issues without tag "regression-v2" are excluded from the list
```

#### Observable Business Oracle
- **Positive Oracle:** mantis_tag_table and mantis_bug_tag_table link tag to bug; filter query joins tag table and returns matching issues.
- **Negative Control:** Detaching the tag removes the badge and filtering by that tag no longer returns the issue.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Detach and delete tag 'regression-v2'.

#### Source Code Anchors
- **File:** `core/tag_api.php` (Lines: `40-120`) @ commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45` — *tag attach and filter API*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline has zero tagging tests across all 38 test files.

#### Review Ledger Entry Template
- **Candidate ID:** `MB-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
