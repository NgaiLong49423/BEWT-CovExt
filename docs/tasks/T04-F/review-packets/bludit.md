# Bludit — Human Review Packet (Milestone 3 / G1)

**Application Version:** 2.3.4  
**Baseline Physical Features:** 23  
**Baseline Test Classes:** 23  
**Baseline Assertions:** 27  
**Baseline Unique Behavioral Units (D_base):** 18  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Bludit** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. BL-GAP-001 — Scheduled pages are promoted on a request after their due time

- **Target Novelty Class:** `NOVEL_TEMPORAL_STATE_PROMOTION`
- **Actor:** Administrator (Content manager)
- **Preconditions:** A page created with a future publication timestamp; controlled application clock fixture.
- **Test Data:** `{"title": "Scheduled Announcement", "futureDate": "+1 minute"}`

#### Gherkin Specification
```gherkin
Feature: Content Scheduling
  Scenario: Scheduled pages are promoted on a request after their due time
    Given the administrator is logged into Bludit admin dashboard
    When the administrator creates a page with title "Scheduled Announcement" and future date
    Then the page is saved with status "scheduled" and is hidden from public blog
    When the application clock advances past the scheduled publication time
    And a visitor requests the public site home page
    Then the page "Scheduled Announcement" status changes to "published"
    And the page title "Scheduled Announcement" is visible on the public blog listing
```

#### Observable Business Oracle
- **Positive Oracle:** Database page entry status transitions from scheduled to published; page renders in published public collection.
- **Negative Control:** A draft page with future date remains draft and is not published by scheduler.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Clean clock/dbPages fixture. Teardown: Remove scheduled page.

#### Source Code Anchors
- **File:** `bl-kernel/dbpages.class.php` (Lines: `313-373`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *scheduler promotes due entries to published*
- **File:** `bl-kernel/boot/rules/69.pages.php` (Lines: `87-100`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *invokes page scheduler on request boot*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** BL-017 changes post date but never tests request-time scheduler promotion to published status.

#### Review Ledger Entry Template
- **Candidate ID:** `BL-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. BL-GAP-002 — Cover image selection persists and renders for content

- **Target Novelty Class:** `NOVEL_MEDIA_ATTACHMENT_PERSISTENCE`
- **Actor:** Administrator (Content author)
- **Preconditions:** Valid synthetic image available in managed uploads; new content creation.
- **Test Data:** `{"title": "Post With Cover", "imageFile": "cover-test.png"}`

#### Gherkin Specification
```gherkin
Feature: Rich Media Publishing
  Scenario: Cover image selection persists and renders for content
    Given the administrator is logged into Bludit
    When the administrator creates content "Post With Cover"
    And selects "cover-test.png" as the cover image in the Images sidebar
    And clicks the "Save" button
    Then the edit view reloads showing "cover-test.png" selected as cover image
    And navigating to the public post URL displays the image in the header cover slot
```

#### Observable Business Oracle
- **Positive Oracle:** page.coverImage field persists the image identifier and theme template resolves and renders image tag.
- **Negative Control:** Saving content without cover image renders normal title without broken img placeholder.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Upload synthetic image. Teardown: Delete post and uploaded image file.

#### Source Code Anchors
- **File:** `bl-kernel/admin/views/edit-content.php` (Lines: `91-110`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *cover image selector*
- **File:** `bl-kernel/page.class.php` (Lines: `311-331`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *coverImage URL resolver*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** BL-01 creates text content; baseline never tests cover image association or rendering.

#### Review Ledger Entry Template
- **Candidate ID:** `BL-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. BL-GAP-003 — Static status maps to page type and the static-page collection

- **Target Novelty Class:** `NOVEL_CONTENT_TYPE_PARTITIONING`
- **Actor:** Administrator (Content manager)
- **Preconditions:** Admin authenticated; no existing static page with slug 'about-our-team'.
- **Test Data:** `{"title": "About Our Team", "type": "static"}`

#### Gherkin Specification
```gherkin
Feature: Page Type Classification
  Scenario: Static status maps to page type and the static-page collection
    Given the administrator is logged into Bludit admin
    When the administrator creates content titled "About Our Team"
    And changes the status to "Static" in the advanced options
    And clicks "Save"
    Then the content is stored in the static pages collection
    And "About Our Team" appears in the static navigation menu
    And "About Our Team" does NOT appear in the chronological blog post stream
```

#### Observable Business Oracle
- **Positive Oracle:** dbPages categorizes record under static collection rather than published posts stream; static navigation resolves page.
- **Negative Control:** Creating normal post appears in blog stream and not in static navigation.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete static page 'about-our-team'.

#### Source Code Anchors
- **File:** `bl-kernel/dbpages.class.php` (Lines: `131-140`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *static status type assignment*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** BL-01, BL-02, BL-04 test blog posts; baseline does not test static page separation.

#### Review Ledger Entry Template
- **Candidate ID:** `BL-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. BL-GAP-004 — Administrator can change a non-admin user's role and retain it

- **Target Novelty Class:** `NOVEL_AUTHORIZATION_MODIFICATION`
- **Actor:** Administrator (System administrator acting on Editor)
- **Preconditions:** An existing user 'editor_jane' with role 'editor'.
- **Test Data:** `{"username": "editor_jane", "initialRole": "editor", "newRole": "administrator"}`

#### Gherkin Specification
```gherkin
Feature: User Access Governance
  Scenario: Administrator can change a non-admin user's role and retain it
    Given user "editor_jane" exists with role "editor"
    And the administrator is logged into Bludit admin
    When the administrator navigates to Users and edits "editor_jane"
    And changes the role dropdown from "Editor" to "Administrator"
    And clicks "Save"
    Then the edit form reloads confirming role "Administrator"
    And when "editor_jane" logs in, the admin-only "Settings" route is accessible without restriction
```

#### Observable Business Oracle
- **Positive Oracle:** dbUsers record updates role field to administrator; subsequent session grants admin route permissions.
- **Negative Control:** An Editor attempting to submit role change form cannot elevate permissions.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create user editor_jane. Teardown: Remove user editor_jane.

#### Source Code Anchors
- **File:** `bl-kernel/admin/controllers/edit-user.php` (Lines: `18-44`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *admin role authorization check*
- **File:** `bl-kernel/dbusers.class.php` (Lines: `61-99`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *role persistence in dbUsers*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** BL-08 adds user, BL-16 deletes user, BL-09 changes password; none test role modification or privilege elevation.

#### Review Ledger Entry Template
- **Candidate ID:** `BL-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. BL-GAP-005 — Category creation and filtered content listing

- **Target Novelty Class:** `NOVEL_TAXONOMY_FILTERING`
- **Actor:** Administrator (Taxonomy administrator)
- **Preconditions:** Admin authenticated; no category named 'Tech Insights'.
- **Test Data:** `{"categoryName": "Tech Insights", "categorySlug": "tech-insights", "postTitle": "Future of AI"}`

#### Gherkin Specification
```gherkin
Feature: Taxonomy Management
  Scenario: Category creation and filtered content listing
    Given the administrator is logged into Bludit admin
    When the administrator navigates to Categories and adds "Tech Insights"
    And creates a new blog post "Future of AI" assigned to "Tech Insights"
    And clicks "Save"
    Then the Categories management table lists "Tech Insights" with 1 associated post
    And visiting "/category/tech-insights" displays post "Future of AI"
    And posts belonging to other categories are excluded from "/category/tech-insights"
```

#### Observable Business Oracle
- **Positive Oracle:** dbCategories registers category slug; public category route filters posts by category key.
- **Negative Control:** Visiting a non-existent category slug returns HTTP 404.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete post and category 'tech-insights'.

#### Source Code Anchors
- **File:** `bl-kernel/dbcategories.class.php` (Lines: `25-85`) @ commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` — *category persistence and post count mapping*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline has zero category CRUD or filtered category listing tests.

#### Review Ledger Entry Template
- **Candidate ID:** `BL-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
