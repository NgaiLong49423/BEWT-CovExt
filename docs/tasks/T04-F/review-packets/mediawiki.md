# Mediawiki — Human Review Packet (Milestone 3 / G1)

**Application Version:** 1.40.0  
**Baseline Physical Features:** 27  
**Baseline Test Classes:** 27  
**Baseline Assertions:** 44  
**Baseline Unique Behavioral Units (D_base):** 19  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Mediawiki** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. MW-GAP-001 — Moving a page preserves content at the target and creates a redirect

- **Target Novelty Class:** `NOVEL_PAGE_MIGRATION`
- **Actor:** Editor with move permission (Registered user with page-move right)
- **Preconditions:** Source page 'Legacy Feature Guide' exists with body text 'Important documentation.'; destination title 'Current Feature Guide' is unused.
- **Test Data:** `{"oldTitle": "Legacy Feature Guide", "newTitle": "Current Feature Guide", "reason": "Title restructuring"}`

#### Gherkin Specification
```gherkin
Feature: Page Movement and Redirection
  Scenario: Moving a page preserves content at the target and creates a redirect
    Given page "Legacy Feature Guide" exists with text "Important documentation."
    And target page "Current Feature Guide" does not exist
    When user moves "Legacy Feature Guide" to "Current Feature Guide" with redirect enabled
    Then page "Current Feature Guide" displays "Important documentation."
    When user navigates to "Legacy Feature Guide"
    Then the user is automatically redirected to "Current Feature Guide"
    And a notification "(Redirected from Legacy Feature Guide)" is shown
```

#### Observable Business Oracle
- **Positive Oracle:** page title is updated in page table; old page title becomes page with redirect flag and body #REDIRECT [[Current Feature Guide]].
- **Negative Control:** Attempting to move to an already occupied destination title without overwrite rights fails with error.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete both source and target pages.

#### Source Code Anchors
- **File:** `includes/MovePage.php` (Lines: `110-180`) @ commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` — *page move and redirect insertion handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** MW-03 creates page, MW-06 edits, MW-21 creates redirect manually, MW-22 follows redirect; baseline never tests page move operation.

#### Review Ledger Entry Template
- **Candidate ID:** `MW-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. MW-GAP-002 — Watch and unwatch state is scoped to the signed-in user

- **Target Novelty Class:** `NOVEL_USER_PREFERENCE_ISOLATION`
- **Actor:** Registered Editor (User managing personal watchlist)
- **Preconditions:** Two distinct users 'UserAlice' and 'UserBob'; page 'Target Research Page'.
- **Test Data:** `{"page": "Target Research Page", "userA": "UserAlice", "userB": "UserBob"}`

#### Gherkin Specification
```gherkin
Feature: Personal Watchlist
  Scenario: Watch and unwatch state is scoped to the signed-in user
    Given page "Target Research Page" exists
    And "UserAlice" is logged into MediaWiki
    When "UserAlice" clicks the "Watch" star on "Target Research Page"
    Then "Target Research Page" appears in "UserAlice"'s Special:Watchlist
    When "UserBob" logs in and views Special:Watchlist
    Then "Target Research Page" is NOT present in "UserBob"'s Special:Watchlist
    When "UserAlice" un-watches the page
    Then "Target Research Page" disappears from "UserAlice"'s Special:Watchlist
```

#### Observable Business Oracle
- **Positive Oracle:** watchlist table receives row (wl_user, wl_namespace, wl_title) for Alice only; Bob's query returns null.
- **Negative Control:** An anonymous user cannot star pages or access a personal watchlist.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Ensure watchlist entry is removed.

#### Source Code Anchors
- **File:** `includes/watchlist/WatchlistManager.php` (Lines: `80-140`) @ commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` — *watchlist add/remove manager*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline has zero watchlist tests across all 27 test files.

#### Review Ledger Entry Template
- **Candidate ID:** `MW-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. MW-GAP-003 — Upload validation rejects a disallowed file extension without creating a file page

- **Target Novelty Class:** `NOVEL_UPLOAD_VALIDATION`
- **Actor:** Uploader (Authenticated user with upload rights)
- **Preconditions:** MediaWiki Special:Upload accessible; disallowed file 'malicious_script.exe'.
- **Test Data:** `{"disallowedFile": "malicious_script.exe"}`

#### Gherkin Specification
```gherkin
Feature: File Upload Governance
  Scenario: Upload validation rejects a disallowed file extension without creating a file page
    Given an authenticated user is on "Special:Upload"
    When the user selects disallowed file "malicious_script.exe"
    And submits the upload form
    Then upload is rejected with error "File extension .exe does not match the allowed file types"
    And no page titled "File:Malicious_script.exe" is created in the File namespace
    And the file repository disk store contains no uploaded artifact
```

#### Observable Business Oracle
- **Positive Oracle:** UploadBase::checkFileExtension returns FILE_EXTENSION_ERROR; no record in image table or File: page created.
- **Negative Control:** Uploading a permitted .png file succeeds and creates corresponding File: page.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Ensure temporary upload directory is clean.

#### Source Code Anchors
- **File:** `includes/upload/UploadBase.php` (Lines: `410-470`) @ commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` — *file extension and MIME validation*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline has zero file upload tests in mediawiki-01..27.

#### Review Ledger Entry Template
- **Candidate ID:** `MW-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. MW-GAP-004 — Revision history side-by-side diff comparison between two consecutive edits

- **Target Novelty Class:** `NOVEL_DIFF_ENGINE_INSPECTION`
- **Actor:** Editor (Content auditor)
- **Preconditions:** Dedicated page 'Diff Comparison Test' with two distinct sequential edits (Rev 1: 'First baseline sentence.', Rev 2: 'Second modified sentence.').
- **Test Data:** `{"page": "Diff Comparison Test", "v1Text": "First baseline sentence.", "v2Text": "Second modified sentence."}`

#### Gherkin Specification
```gherkin
Feature: Revision Difference Inspection
  Scenario: Revision history side-by-side diff comparison between two consecutive edits
    Given page "Diff Comparison Test" has revision 1 with "First baseline sentence."
    And revision 2 with "Second modified sentence."
    When user navigates to the page history view
    And selects the radio buttons for revision 1 and revision 2
    And clicks "Compare selected revisions"
    Then the diff table renders comparing revision 1 (older) and revision 2 (newer)
    And deleted text "First baseline sentence." is highlighted in the left column
    And added text "Second modified sentence." is highlighted in the right column
```

#### Observable Business Oracle
- **Positive Oracle:** DifferenceEngine renders table.diff containing class 'diff-deletedline' and class 'diff-addedline' with expected texts.
- **Negative Control:** Comparing a revision with itself shows 'No differences'.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete test page 'Diff Comparison Test'.

#### Source Code Anchors
- **File:** `includes/diff/DifferenceEngine.php` (Lines: `150-230`) @ commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` — *diff engine table renderer*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** MW-06 edits a page and MW-16 clicks rollback; baseline never tests the revision history diff comparison screen or diff engine.

#### Review Ledger Entry Template
- **Candidate ID:** `MW-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. MW-GAP-005 — Page protection restriction level modification restricts editing to administrators

- **Target Novelty Class:** `NOVEL_ACCESS_RESTRICTION_GOVERNANCE`
- **Actor:** Administrator and Regular Editor (Administrator protects; regular user is blocked)
- **Preconditions:** Page 'Community Standards' exists; administrator 'admin' and regular user 'editor_dan'.
- **Test Data:** `{"page": "Community Standards", "protectLevel": "sysop"}`

#### Gherkin Specification
```gherkin
Feature: Page Protection Governance
  Scenario: Page protection restriction level modification restricts editing to administrators
    Given page "Community Standards" is initially editable by all registered users
    When administrator logs in and changes protection level to "Allow only administrators"
    And submits the protection form
    Then page "Community Standards" displays protection status "Protected"
    When regular editor "editor_dan" views "Community Standards"
    Then the "Edit" tab is replaced by "View source"
    When "editor_dan" accesses the direct edit URL for "Community Standards"
    Then access is denied with error "This page has been protected to prevent editing"
```

#### Observable Business Oracle
- **Positive Oracle:** page_restrictions table receives row (pr_page, pr_type='edit', pr_level='sysop'); userCan checks user_groups; denies non-admin.
- **Negative Control:** Administrator logging in retains full edit access on the protected page.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Unprotect or delete page.

#### Source Code Anchors
- **File:** `includes/page/WikiPage.php` (Lines: `1400-1460`) @ commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` — *page protection verification*
- **File:** `includes/specials/SpecialProtect.php` (Lines: `80-140`) @ commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` — *protection submission handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** MW-15 edits a protected page as admin; baseline never tests setting protection or the denial of regular editors.

#### Review Ledger Entry Template
- **Candidate ID:** `MW-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
