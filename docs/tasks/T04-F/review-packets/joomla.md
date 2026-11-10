# Joomla — Human Review Packet (Milestone 3 / G1)

**Application Version:** 3.10.11  
**Baseline Physical Features:** 35  
**Baseline Test Classes:** 35  
**Baseline Assertions:** 43  
**Baseline Unique Behavioral Units (D_base):** 24  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Joomla** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. JO-GAP-001 — Featured article flag appears and is removed from the featured list

- **Target Novelty Class:** `NOVEL_FEATURED_CONTENT_GOVERNANCE`
- **Actor:** Content Administrator (Joomla Content Manager)
- **Preconditions:** Article 'Featured Launch Article' published and unfeatured.
- **Test Data:** `{"articleTitle": "Featured Launch Article"}`

#### Gherkin Specification
```gherkin
Feature: Featured Content Management
  Scenario: Featured article flag appears and is removed from the featured list
    Given administrator is logged into Joomla admin
    And published article "Featured Launch Article" is currently not featured
    When administrator toggles the "Featured" star on for "Featured Launch Article"
    Then "Featured Launch Article" appears in the "Featured Articles" view
    When administrator toggles the "Featured" star off
    Then "Featured Launch Article" is removed from the "Featured Articles" view
    And the article remains published in the standard articles list
```

#### Observable Business Oracle
- **Positive Oracle:** content_frontpage table entry is created then deleted; article published state in #__content remains 1.
- **Negative Control:** An unpublished article marked featured does not render on the public frontpage.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete article 'Featured Launch Article'.

#### Source Code Anchors
- **File:** `administrator/components/com_content/models/articles.php` (Lines: `380-420`) @ commit `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` — *featured toggle handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** JO-08 creates article, JO-10 edits article, JO-21 archives article; none test featured list membership.

#### Review Ledger Entry Template
- **Candidate ID:** `JO-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. JO-GAP-002 — Publish-up and publish-down define the article visibility window

- **Target Novelty Class:** `NOVEL_TIMED_PUBLICATION_LIFECYCLE`
- **Actor:** Content Administrator and Guest (Admin schedules; Guest views)
- **Preconditions:** Clean timezone fixture; article with future publish-up date.
- **Test Data:** `{"articleTitle": "Timed Press Release", "publishUp": "+1 day", "publishDown": "+5 days"}`

#### Gherkin Specification
```gherkin
Feature: Publication Window Scheduling
  Scenario: Publish-up and publish-down define the article visibility window
    Given administrator is logged into Joomla admin
    When administrator creates article "Timed Press Release" with publish-up set to future date
    Then the article status badge shows "Published but Pending"
    And a guest visiting the public category cannot view "Timed Press Release"
    When the system time is within the publish-up and publish-down window
    Then a guest visiting the public category can view "Timed Press Release"
    When the system time advances past publish-down
    Then the article status badge shows "Expired" and is hidden from public view
```

#### Observable Business Oracle
- **Positive Oracle:** SQL queries filter by (publish_up <= NOW() AND (publish_down >= NOW() OR publish_down = '0000-00-00 00:00:00')).
- **Negative Control:** An administrator logged into frontend can preview expired articles if configured, but guest cannot.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Remove timed article.

#### Source Code Anchors
- **File:** `components/com_content/models/articles.php` (Lines: `150-210`) @ commit `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` — *timed publication filter*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline tests article publishing state (1 or 0), but zero timed publication window tests.

#### Review Ledger Entry Template
- **Candidate ID:** `JO-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. JO-GAP-003 — Editor without edit-state permission cannot change publication state

- **Target Novelty Class:** `NOVEL_ACL_GRANULAR_AUTHORIZATION`
- **Actor:** Editor User and Administrator (User assigned to custom group lacking core.edit.state permission)
- **Preconditions:** User 'junior_editor' belongs to group 'Staff Authors' which has core.edit but NOT core.edit.state.
- **Test Data:** `{"user": "junior_editor", "article": "Policy Guidelines"}`

#### Gherkin Specification
```gherkin
Feature: Granular Permission Enforcement
  Scenario: Editor without edit-state permission cannot change publication state
    Given user "junior_editor" has edit permission but lacks edit-state permission
    And published article "Policy Guidelines" exists
    When "junior_editor" edits "Policy Guidelines"
    Then the "Status" dropdown is disabled or absent from the edit view
    When "junior_editor" attempts to unpublish via direct API or URL manipulation
    Then the action is denied with message "You are not authorized to change the state of this item"
    And "Policy Guidelines" remains published
```

#### Observable Business Oracle
- **Positive Oracle:** com_content checks JAccess::check($userId, 'core.edit.state'); denies unauthorized state change attempt.
- **Negative Control:** An administrator with full permissions can change status without restriction.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset user permissions and article state.

#### Source Code Anchors
- **File:** `administrator/components/com_content/controllers/article.php` (Lines: `80-120`) @ commit `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` — *edit.state authorization check*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** JO-23 adds group, JO-25 assigns user to group, JO-10 edits article; baseline never tests granular edit.state restriction.

#### Review Ledger Entry Template
- **Candidate ID:** `JO-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. JO-GAP-004 — Editing an article increments its version counter and creates history record

- **Target Novelty Class:** `NOVEL_VERSION_HISTORY_AUDIT`
- **Actor:** Content Administrator (Article Editor)
- **Preconditions:** Article 'Living Document' exists with initial version 1; version history enabled.
- **Test Data:** `{"article": "Living Document", "updateText": "Revised section 3 content."}`

#### Gherkin Specification
```gherkin
Feature: Version History Auditing
  Scenario: Editing an article increments its version counter and creates history record
    Given article "Living Document" exists with version counter 1
    When administrator edits "Living Document" body with "Revised section 3 content."
    And clicks "Save"
    Then the article version counter increments to 2
    When administrator opens the "Versions" modal
    Then two distinct revision rows (version 1 and version 2) are listed with timestamps and author "admin"
```

#### Observable Business Oracle
- **Positive Oracle:** #__ucm_history inserts new snapshot; #__content.version increments by 1.
- **Negative Control:** Closing the edit modal without saving does not increment version counter.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete article and associated version history.

#### Source Code Anchors
- **File:** `administrator/components/com_content/models/article.php` (Lines: `250-290`) @ commit `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` — *version history save handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** JO-10 edits article; baseline never asserts version counter increment or history modal entries.

#### Review Ledger Entry Template
- **Candidate ID:** `JO-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. JO-GAP-005 — Article trash and restore lifecycle restores prior published status

- **Target Novelty Class:** `NOVEL_TRASH_RESTORE_LIFECYCLE`
- **Actor:** Content Administrator (Article Manager)
- **Preconditions:** Published article 'Article to Trash' exists.
- **Test Data:** `{"article": "Article to Trash"}`

#### Gherkin Specification
```gherkin
Feature: Trash and Restore Lifecycle
  Scenario: Article trash and restore lifecycle restores prior published status
    Given published article "Article to Trash" exists
    When administrator selects "Article to Trash" and clicks "Trash"
    Then the article status changes to Trashed (-2)
    And "Article to Trash" is hidden from public view and main articles list
    When administrator filters articles by status "Trashed"
    And selects "Article to Trash" and clicks "Publish"
    Then the article status is restored to Published (1)
    And "Article to Trash" reappears in the public blog listing
```

#### Observable Business Oracle
- **Positive Oracle:** #__content.state transitions 1 -> -2 -> 1; public view hides trashed articles and re-displays restored articles.
- **Negative Control:** Permanently deleting an article from Trash removes it completely from database.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Empty trash and remove test article.

#### Source Code Anchors
- **File:** `administrator/components/com_content/models/articles.php` (Lines: `120-180`) @ commit `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` — *trash and restore model actions*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** JO-21 archives article; baseline never tests the trash and restore lifecycle.

#### Review Ledger Entry Template
- **Candidate ID:** `JO-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
