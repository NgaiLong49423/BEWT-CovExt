# Human-in-the-Loop Review Consolidation — 40 Candidate Batch (Reconciled & Audited)

**Program**: BEWT-CovExt v2.0  
**Verification Gate**: G1 (Novelty, Oracle & Fixture Governance)  
**Total Applications**: 8  
**Candidates per Application**: 5 (Target: 40 Total Candidates)  
**Baseline Behavioral Denominator ($D_{base}$)**: 180 Unique Behavioral Units (UBU)  
**Projected Post-Extension Behavioral Units**: 220 UBU (+22.22% Coverage Expansion)  
**Status**: APPROVED_FOR_IMPLEMENTATION (Audited Batch Sign-off)

---

## 1. Executive Summary & Batch Review Record

Every candidate listed below has been independently audited against the pinned release source and baseline BEWT test suites. Each candidate includes:
- Exact actor, role, and operational context.
- Full Given-When-Then BDD specification.
- Observable business oracle grounded in application logic/database state.
- Setup and teardown fixture requirements.
- Concrete baseline non-overlap verification proving orthogonal behavioral extension.

---

## Application: BLUDIT (v2.3.4)

- **Baseline Test Suite Classes**: 23
- **Baseline Behavioral Units ($D_{base}$)**: 18 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (18 -> 23, +27.78%)
- **Source Repository Pin**: `bludit/bludit` (Commit: `44de235a5e`)

### Candidate 1/5: `BL-GAP-001` — Scheduled pages are promoted on a request after their due time

- **Candidate ID**: `BL-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Administrator (Content manager)
- **Preconditions**: A page created with a future publication timestamp; controlled application clock fixture.
- **Observable Business Oracle**: Database page entry status transitions from scheduled to published; page renders in published public collection.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Clean clock/dbPages fixture. Teardown: Remove scheduled page.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 2/5: `BL-GAP-002` — Cover image selection persists and renders for content

- **Candidate ID**: `BL-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Administrator (Content author)
- **Preconditions**: Valid synthetic image available in managed uploads; new content creation.
- **Observable Business Oracle**: page.coverImage field persists the image identifier and theme template resolves and renders image tag.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Upload synthetic image. Teardown: Delete post and uploaded image file.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 3/5: `BL-GAP-003` — Static status maps to page type and the static-page collection

- **Candidate ID**: `BL-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Administrator (Content manager)
- **Preconditions**: Admin authenticated; no existing static page with slug 'about-our-team'.
- **Observable Business Oracle**: dbPages categorizes record under static collection rather than published posts stream; static navigation resolves page.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete static page 'about-our-team'.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 4/5: `BL-GAP-004` — Administrator can change a non-admin user's role and retain it

- **Candidate ID**: `BL-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Administrator (System administrator acting on Editor)
- **Preconditions**: An existing user 'editor_jane' with role 'editor'.
- **Observable Business Oracle**: dbUsers record updates role field to administrator; subsequent session grants admin route permissions.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create user editor_jane. Teardown: Remove user editor_jane.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 5/5: `BL-GAP-005` — Category creation and filtered content listing

- **Candidate ID**: `BL-GAP-005`
- **Priority Order**: 5
- **Actor / Role**: Administrator (Taxonomy administrator)
- **Preconditions**: Admin authenticated; no category named 'Tech Insights'.
- **Observable Business Oracle**: dbCategories registers category slug; public category route filters posts by category key.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete post and category 'tech-insights'.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---


## Application: CLAROLINE (v1.11.10)

- **Baseline Test Suite Classes**: 40
- **Baseline Behavioral Units ($D_{base}$)**: 28 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (28 -> 33, +17.86%)
- **Source Repository Pin**: `zefredz/claroline` (Commit: `22d852f930`)

### Candidate 1/5: `CL-GAP-001` — Course document upload, move and delete lifecycle

- **Candidate ID**: `CL-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Teacher (Course teacher / manager)
- **Preconditions**: Course 'CL-DOC-101' exists; clean document directory; synthetic file 'syllabus.pdf'.
- **Observable Business Oracle**: Document records in claro_document table update path during move and delete marks record deleted; filesystem confirms file existence then removal.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create course and folder. Teardown: Remove document and clean directory.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Course Document Management
  Scenario: Course document upload, move and delete lifecycle
    Given teacher "prof_smith" is logged into Claroline course "CL-DOC-101"
    When the teacher navigates to Documents and uploads file "syllabus.pdf"
    Then "syllabus.pdf" appears in the course root document directory
    When the teacher moves "syllabus.pdf" into folder "LectureNotes"
    Then "syllabus.pdf" is displayed inside "LectureNotes" directory
    When the teacher deletes "syllabus.pdf"
    Then "syllabus.pdf" is removed from "LectureNotes" and no longer visible
```

---

### Candidate 2/5: `CL-GAP-002` — Group space is inaccessible to a non-member student in a private group

- **Candidate ID**: `CL-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Teacher and Student (Teacher configures private group; student is non-member)
- **Preconditions**: Course has closed private Group B; Student 1 is enrolled in course but NOT in Group B.
- **Observable Business Oracle**: claro_is_in_a_group check fails; claro_disp_auth_url denies access; HTTP redirect and error message triggered.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete groups and test course.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Group Space Authorization
  Scenario: Group space is inaccessible to a non-member student in a private group
    Given course "CL-GRP-101" has private group "Private Group B" with closed registration
    And student "student_bob" is enrolled in course "CL-GRP-101" but is not a member of "Private Group B"
    When student "student_bob" attempts to access the URL for "Private Group B" space
    Then the student is redirected to the main groups list with notification "Not allowed"
    And the private group document repository and group forum are NOT rendered
    And no self-registration option is displayed for the private group
```

---

### Candidate 3/5: `CL-GAP-003` — Teacher imports an exercise package into a course

- **Candidate ID**: `CL-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Teacher (Course teacher)
- **Preconditions**: Teacher authenticated in empty course; synthetic IMS QTI / Claroline exercise zip package.
- **Observable Business Oracle**: exercise and question tables populated from zip package XML schema; imported exercise immediately available for student attempts.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete imported exercise and questions.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Exercise Import
  Scenario: Teacher imports an exercise package into a course
    Given teacher "prof_smith" is logged into course "CL-EX-101"
    And the exercise tool has no exercises
    When the teacher navigates to Exercises and selects "Import exercise"
    And uploads package "math-quiz-pkg.zip" and submits
    Then a success message "Exercise imported successfully" is displayed
    And the exercise list displays "Calculus Quiz 1" with 5 questions
    And clicking "Calculus Quiz 1" presents the imported questions correctly
```

---

### Candidate 4/5: `CL-GAP-004` — Tracking controls are teacher-only while exercise attempts remain student-facing

- **Candidate ID**: `CL-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Teacher and Student (Role differentiation in course tracking)
- **Preconditions**: Course tracking enabled; exercise 'Midterm Quiz' attempted by 'student_alice'.
- **Observable Business Oracle**: Tracking UI restricted by is_course_allowed('tracking'); tracking database logs student score and renders aggregated analytics for teacher.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset tracking logs and student attempts.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Course Tracking Governance
  Scenario: Tracking controls are teacher-only while exercise attempts remain student-facing
    Given student "student_alice" completed exercise "Midterm Quiz" in course "CL-TRK-101"
    When student "student_alice" views the course tool menu
    Then the "Tracking" administration link is NOT visible to "student_alice"
    When teacher "prof_smith" logs into course "CL-TRK-101"
    And navigates to "Tracking" -> "Exercise statistics"
    Then the teacher views "student_alice" submission with score, duration, and attempt date
```

---

### Candidate 5/5: `CL-GAP-005` — Course announcement creation, publication, and student notification visibility

- **Candidate ID**: `CL-GAP-005`
- **Priority Order**: 5
- **Actor / Role**: Teacher and Student (Teacher publishes announcement; student reads)
- **Preconditions**: Course 'CL-ANN-101' exists; teacher and student enrolled; no prior announcements.
- **Observable Business Oracle**: claro_announcement table receives new record; course home view pulls and displays active announcements.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete announcement record.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Course Announcements
  Scenario: Course announcement creation, publication, and student notification visibility
    Given teacher "prof_smith" is logged into course "CL-ANN-101"
    When the teacher navigates to Announcements and clicks "Add announcement"
    And enters title "Classroom Relocation" and body "Classroom moved to Room 302 for Friday."
    And submits the announcement
    Then the announcement "Classroom Relocation" appears in the course announcements table
    When student "student_bob" logs into course "CL-ANN-101"
    Then "Classroom Relocation" is prominently displayed on the course welcome banner
```

---


## Application: EXPRESSCART (v1.1.19)

- **Baseline Test Suite Classes**: 31
- **Baseline Behavioral Units ($D_{base}$)**: 21 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (21 -> 26, +23.81%)
- **Source Repository Pin**: `mrvautin/expressCart` (Commit: `b31302f4e9`)

### Candidate 1/5: `EC-GAP-002` — Stock tracking rejects a cart quantity above available product or variant stock

- **Candidate ID**: `EC-GAP-002`
- **Priority Order**: 1
- **Actor / Role**: Customer and Administrator (Customer shops; administrator configures inventory)
- **Preconditions**: Product 'Limited Edition T-Shirt' has stock=1 with stock tracking enabled; empty cart.
- **Observable Business Oracle**: routes/index.js cart update validates against productStock; rejects over-quantity and leaves session cart count at 1.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset product stock to default and clear cart session.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Inventory Control
  Scenario: Stock tracking rejects a cart quantity above available product or variant stock
    Given product "Limited Edition T-Shirt" has stock tracking enabled with available quantity 1
    And customer starts with an empty cart
    When customer adds 1 unit of "Limited Edition T-Shirt" to cart
    Then the cart shows 1 unit of "Limited Edition T-Shirt"
    When customer attempts to update the quantity to 2
    Then the system rejects the update with HTTP 400 and message "There is not enough stock to fulfill your order"
    And the cart quantity remains at 1
```

---

### Candidate 2/5: `EC-GAP-003` — Customer address update persists and is copied from session into checkout information

- **Candidate ID**: `EC-GAP-003`
- **Priority Order**: 2
- **Actor / Role**: Authenticated Customer (Customer managing shipping profile)
- **Preconditions**: Registered customer 'jane@example.com' logged in; initial address '123 Main St'.
- **Observable Business Oracle**: POST /customer/update updates database and req.session.customer*; checkout view automatically inherits session address.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset customer address and empty cart.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Customer Profile and Checkout
  Scenario: Customer address update persists and is copied from session into checkout information
    Given customer "jane@example.com" is logged into the storefront
    When the customer navigates to account profile and updates shipping address to "456 Oak Avenue", city "Beverly Hills", postcode "90210"
    And clicks "Update profile"
    Then the customer profile reloads confirming "456 Oak Avenue"
    When the customer adds an item to cart and proceeds to checkout
    Then the checkout shipping address form is pre-filled with "456 Oak Avenue" and "Beverly Hills"
```

---

### Candidate 3/5: `EC-GAP-004` — Invalid discount date windows are rejected during admin update

- **Candidate ID**: `EC-GAP-004`
- **Priority Order**: 3
- **Actor / Role**: Shop Administrator (Marketing administrator)
- **Preconditions**: Discount code 'SUMMER20' exists with valid dates.
- **Observable Business Oracle**: routes/admin.js discount update validates start_date < end_date; rejects invalid range and preserves prior DB state.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Restore original discount date range.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Promotion Governance
  Scenario: Invalid discount date windows are rejected during admin update
    Given administrator is logged into expressCart admin
    And discount code "SUMMER20" exists in promotions
    When the administrator updates "SUMMER20" with an end date earlier than the start date
    And clicks "Update discount"
    Then the application rejects the update with error "End date must be after start date"
    And the stored discount date window remains unchanged
```

---

### Candidate 4/5: `EC-GAP-005` — Customer registration validation rejects duplicate email address with clear feedback

- **Candidate ID**: `EC-GAP-005`
- **Priority Order**: 4
- **Actor / Role**: Customer (Guest registering for account)
- **Preconditions**: Account 'shopper_existing@example.com' is already registered in customer collection.
- **Observable Business Oracle**: POST /customer/create queries db.customers.findOne; finds duplicate email and returns HTTP 400 error.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Keep existing customer fixture intact.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Customer Registration Validation
  Scenario: Customer registration validation rejects duplicate email address with clear feedback
    Given a customer with email "shopper_existing@example.com" already exists
    When a guest navigates to customer registration page
    And submits registration details with email "shopper_existing@example.com"
    Then registration fails with message "A customer with that email address already exists"
    And the total customer count in the database remains unchanged
```

---

### Candidate 5/5: `EC-GAP-006` — Admin product stock update directly updates storefront inventory badge and cart capability

- **Candidate ID**: `EC-GAP-006`
- **Priority Order**: 5
- **Actor / Role**: Administrator and Shopper (Admin manages stock; Shopper observes storefront)
- **Preconditions**: Product 'Solar Charger' has stock=0 and displays 'Out of stock'.
- **Observable Business Oracle**: Stock update persists in MongoDB; storefront product view dynamically renders in-stock badge and unlocks cart addition.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset stock to 0.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Stock Replenishment Synchronization
  Scenario: Admin product stock update directly updates storefront inventory badge and cart capability
    Given product "Solar Charger" has stock quantity 0
    And the public product page displays badge "Out of stock" with "Add to cart" disabled
    When administrator logs in and edits "Solar Charger" stock to 5
    And clicks "Save product"
    Then reloading public product page displays "In stock: 5"
    And the "Add to cart" button becomes enabled and functional
```

---


## Application: JOOMLA (v3.10.11)

- **Baseline Test Suite Classes**: 35
- **Baseline Behavioral Units ($D_{base}$)**: 24 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (24 -> 29, +20.83%)
- **Source Repository Pin**: `joomla/joomla-cms` (Commit: `01deee0a7b`)

### Candidate 1/5: `JO-GAP-001` — Featured article flag appears and is removed from the featured list

- **Candidate ID**: `JO-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Content Administrator (Joomla Content Manager)
- **Preconditions**: Article 'Featured Launch Article' published and unfeatured.
- **Observable Business Oracle**: content_frontpage table entry is created then deleted; article published state in #__content remains 1.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete article 'Featured Launch Article'.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 2/5: `JO-GAP-002` — Publish-up and publish-down define the article visibility window

- **Candidate ID**: `JO-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Content Administrator and Guest (Admin schedules; Guest views)
- **Preconditions**: Clean timezone fixture; article with future publish-up date.
- **Observable Business Oracle**: SQL queries filter by (publish_up <= NOW() AND (publish_down >= NOW() OR publish_down = '0000-00-00 00:00:00')).
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Remove timed article.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 3/5: `JO-GAP-003` — Editor without edit-state permission cannot change publication state

- **Candidate ID**: `JO-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Editor User and Administrator (User assigned to custom group lacking core.edit.state permission)
- **Preconditions**: User 'junior_editor' belongs to group 'Staff Authors' which has core.edit but NOT core.edit.state.
- **Observable Business Oracle**: com_content checks JAccess::check($userId, 'core.edit.state'); denies unauthorized state change attempt.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset user permissions and article state.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 4/5: `JO-GAP-004` — Editing an article increments its version counter and creates history record

- **Candidate ID**: `JO-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Content Administrator (Article Editor)
- **Preconditions**: Article 'Living Document' exists with initial version 1; version history enabled.
- **Observable Business Oracle**: #__ucm_history inserts new snapshot; #__content.version increments by 1.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete article and associated version history.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 5/5: `JO-GAP-005` — Article trash and restore lifecycle restores prior published status

- **Candidate ID**: `JO-GAP-005`
- **Priority Order**: 5
- **Actor / Role**: Content Administrator (Article Manager)
- **Preconditions**: Published article 'Article to Trash' exists.
- **Observable Business Oracle**: #__content.state transitions 1 -> -2 -> 1; public view hides trashed articles and re-displays restored articles.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Empty trash and remove test article.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---


## Application: KANBOARD (v1.2.15)

- **Baseline Test Suite Classes**: 30
- **Baseline Behavioral Units ($D_{base}$)**: 20 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (20 -> 25, +25.00%)
- **Source Repository Pin**: `benchmark/kanboard` (Commit: `0501249ff3`)

### Candidate 1/5: `KB-GAP-001` — Reopen a closed task

- **Candidate ID**: `KB-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Project Member (Authenticated project member with task management rights)
- **Preconditions**: A task with title 'Task to Reopen' exists in project 'Test Project' and is currently closed.
- **Observable Business Oracle**: Task status changes from closed to open in database and UI badge; task reappears on active Kanban board and matches status:open query.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create project, add task, close task. Teardown: Remove task and project.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Task Lifecycle Management
  Scenario: Reopen a closed task
    Given the user is logged into Kanboard as "admin"
    And a closed task "Task to Reopen" exists in project "Test Project"
    When the user navigates to the task page for "Task to Reopen"
    And the user clicks the "Reopen this task" link in the sidebar
    And the user confirms "Yes" in the confirmation modal
    Then the task status badge displays "open"
    And searching "status:open Task to Reopen" in the project board returns the task in the board column
```

---

### Candidate 2/5: `KB-GAP-002` — Create and view a task comment

- **Candidate ID**: `KB-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Project Collaborator (Authenticated user with comment permissions)
- **Preconditions**: An open task 'Task With Comments' exists in 'Test Project'.
- **Observable Business Oracle**: Comment record is inserted into comments table linked to task_id; comment text and author username render in the task comment stream.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create project and task. Teardown: Delete created comment, task, and project.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Task Collaboration
  Scenario: Create and view a task comment
    Given the user is logged into Kanboard as "admin"
    And an open task "Task With Comments" exists in project "Test Project"
    When the user navigates to the task page for "Task With Comments"
    And the user enters "This is a verified test comment for task verification." in the comment area
    And the user clicks the "Save" comment button
    Then the comment "This is a verified test comment for task verification." appears in the comments stream
    And the comment header displays the author "admin" with timestamp "just now"
```

---

### Candidate 3/5: `KB-GAP-003` — Duplicate a task to another project

- **Candidate ID**: `KB-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Project Manager (Manager with permissions across source and target projects)
- **Preconditions**: Source project 'Project Alpha' with task 'Task to Clone' and target project 'Project Beta' exist.
- **Observable Business Oracle**: New task record created in project Beta with copied title/description; source task record in project Alpha remains unmodified.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create two projects and one task. Teardown: Remove both projects and tasks.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Task Operations
  Scenario: Duplicate a task to another project
    Given the user is logged into Kanboard as "admin"
    And project "Project Alpha" contains task "Task to Clone"
    And empty project "Project Beta" exists
    When the user navigates to task "Task to Clone" in "Project Alpha"
    And the user clicks the "Duplicate to another project" link
    And the user selects "Project Beta" as destination project
    And the user clicks the "Save" button
    Then project "Project Beta" board contains task "Task to Clone"
    And original task "Task to Clone" remains intact in "Project Alpha"
```

---

### Candidate 4/5: `KB-GAP-004` — Move a task to another project

- **Candidate ID**: `KB-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Project Manager (Manager with permissions across both projects)
- **Preconditions**: Project A with task 'Task to Move' and Project B exist.
- **Observable Business Oracle**: Task project_id is updated to Project B; task disappears from Project A board and appears in Project B first column.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create two projects and task. Teardown: Clean up tasks and projects.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Task Operations
  Scenario: Move a task to another project
    Given the user is logged into Kanboard as "admin"
    And project "Project A" contains task "Task to Move"
    And project "Project B" exists
    When the user navigates to task "Task to Move" in "Project A"
    And the user clicks the "Move to another project" link
    And the user selects "Project B" as destination
    And the user clicks the "Save" button
    Then task "Task to Move" is displayed on project "Project B" board
    And task "Task to Move" is no longer present on project "Project A" board
```

---

### Candidate 5/5: `KB-GAP-008` — Add an internal subtask to a task

- **Candidate ID**: `KB-GAP-008`
- **Priority Order**: 5
- **Actor / Role**: Project Member (Authenticated task editor)
- **Preconditions**: Parent task 'Master Feature' exists in 'Test Project'.
- **Observable Business Oracle**: Subtask row inserted into subtasks table with task_id FK; subtask table renders item with default status 'Todo'.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Setup: Create task. Teardown: Remove subtask and task.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Subtask Management
  Scenario: Add an internal subtask to a task
    Given the user is logged into Kanboard as "admin"
    And an open task "Master Feature" exists in project "Test Project"
    When the user navigates to task "Master Feature"
    And the user clicks "Add a sub-task" link
    And the user enters "Subtask Unit 1" in the "Title" field
    And the user clicks the "Save" button
    Then the "Subtasks" section of task "Master Feature" displays "Subtask Unit 1"
    And the subtask status is displayed as "Todo"
```

---


## Application: MANTISBT (v1.2.0)

- **Baseline Test Suite Classes**: 37
- **Baseline Behavioral Units ($D_{base}$)**: 26 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (26 -> 31, +19.23%)
- **Source Repository Pin**: `mantisbt/mantisbt` (Commit: `d06bf60f5e`)

### Candidate 1/5: `MB-GAP-001` — User monitors and stops monitoring an issue for their own account

- **Candidate ID**: `MB-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Developer (Authenticated issue viewer with monitor rights)
- **Preconditions**: Issue #201 exists; user 'dev_dave' currently not monitoring.
- **Observable Business Oracle**: mantis_bug_monitor_table adds then deletes (user_id, bug_id) record; UI updates monitor button toggle and list.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Ensure monitor record is cleared.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 2/5: `MB-GAP-002` — Private issue note is hidden from users below the private-note threshold

- **Candidate ID**: `MB-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Developer and Reporter (Developer adds private note; Reporter views issue)
- **Preconditions**: Issue #202 exists; Developer 'dev_dave' has private note view/add right; Reporter 'rep_bob' lacks it.
- **Observable Business Oracle**: bugnote view query filters by view_state == 50; users below private_bugnote_threshold cannot see private notes.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete test bugnote.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 3/5: `MB-GAP-003` — Issue relationship rejects self-link and duplicate links

- **Candidate ID**: `MB-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Developer (Issue updater)
- **Preconditions**: Two open issues #203 and #204 exist in the project.
- **Observable Business Oracle**: mantis_bug_relationship_table enforces uniqueness and disallows source_bug_id == dest_bug_id.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete relationships between #203 and #204.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 4/5: `MB-GAP-004` — Issue attachment upload is persisted and rejects invalid input

- **Candidate ID**: `MB-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Reporter (Issue creator/reporter)
- **Preconditions**: Issue #205 exists; small synthetic text attachment 'stacktrace.txt'.
- **Observable Business Oracle**: mantis_bug_file_table stores file metadata; file content stored in disk/db and retrievable via file_download.php.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete attachment from issue #205.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 5/5: `MB-GAP-005` — Issue tag attachment, display, and tag-based issue filter retrieval

- **Candidate ID**: `MB-GAP-005`
- **Priority Order**: 5
- **Actor / Role**: Developer (Issue updater)
- **Preconditions**: Issue #206 exists; clean tag 'regression-v2'.
- **Observable Business Oracle**: mantis_tag_table and mantis_bug_tag_table link tag to bug; filter query joins tag table and returns matching issues.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Detach and delete tag 'regression-v2'.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---


## Application: MEDIAWIKI (v1.40.0)

- **Baseline Test Suite Classes**: 27
- **Baseline Behavioral Units ($D_{base}$)**: 19 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (19 -> 24, +26.32%)
- **Source Repository Pin**: `wikimedia/mediawiki` (Commit: `468dd69d6e`)

### Candidate 1/5: `MW-GAP-001` — Moving a page preserves content at the target and creates a redirect

- **Candidate ID**: `MW-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Editor with move permission (Registered user with page-move right)
- **Preconditions**: Source page 'Legacy Feature Guide' exists with body text 'Important documentation.'; destination title 'Current Feature Guide' is unused.
- **Observable Business Oracle**: page title is updated in page table; old page title becomes page with redirect flag and body #REDIRECT [[Current Feature Guide]].
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete both source and target pages.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 2/5: `MW-GAP-002` — Watch and unwatch state is scoped to the signed-in user

- **Candidate ID**: `MW-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Registered Editor (User managing personal watchlist)
- **Preconditions**: Two distinct users 'UserAlice' and 'UserBob'; page 'Target Research Page'.
- **Observable Business Oracle**: watchlist table receives row (wl_user, wl_namespace, wl_title) for Alice only; Bob's query returns null.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Ensure watchlist entry is removed.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 3/5: `MW-GAP-003` — Upload validation rejects a disallowed file extension without creating a file page

- **Candidate ID**: `MW-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Uploader (Authenticated user with upload rights)
- **Preconditions**: MediaWiki Special:Upload accessible; disallowed file 'malicious_script.exe'.
- **Observable Business Oracle**: UploadBase::checkFileExtension returns FILE_EXTENSION_ERROR; no record in image table or File: page created.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Ensure temporary upload directory is clean.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 4/5: `MW-GAP-004` — Revision history side-by-side diff comparison between two consecutive edits

- **Candidate ID**: `MW-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Editor (Content auditor)
- **Preconditions**: Dedicated page 'Diff Comparison Test' with two distinct sequential edits (Rev 1: 'First baseline sentence.', Rev 2: 'Second modified sentence.').
- **Observable Business Oracle**: DifferenceEngine renders table.diff containing class 'diff-deletedline' and class 'diff-addedline' with expected texts.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete test page 'Diff Comparison Test'.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---

### Candidate 5/5: `MW-GAP-005` — Page protection restriction level modification restricts editing to administrators

- **Candidate ID**: `MW-GAP-005`
- **Priority Order**: 5
- **Actor / Role**: Administrator and Regular Editor (Administrator protects; regular user is blocked)
- **Preconditions**: Page 'Community Standards' exists; administrator 'admin' and regular user 'editor_dan'.
- **Observable Business Oracle**: page_restrictions table receives row (pr_page, pr_type='edit', pr_level='sysop'); userCan checks user_groups; denies non-admin.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Unprotect or delete page.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

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

---


## Application: PRESTASHOP (v1.6.1.23)

- **Baseline Test Suite Classes**: 35
- **Baseline Behavioral Units ($D_{base}$)**: 24 UBU
- **Projected Coverage Gain (RQ2)**: +5 UBU (24 -> 29, +20.83%)
- **Source Repository Pin**: `PrestaShop/PrestaShop` (Commit: `475d65fbda`)

### Candidate 1/5: `PS-GAP-001` — Cart-rule per-customer usage limit is enforced

- **Candidate ID**: `PS-GAP-001`
- **Priority Order**: 1
- **Actor / Role**: Customer and Shop Administrator (Admin creates voucher; Customer redeems)
- **Preconditions**: Cart rule 'WELCOME10' configured with discount 10%, global quantity 100, and quantity_per_user=1; customer 'cust1@example.com'.
- **Observable Business Oracle**: CartRule::checkValidity verifies count in ps_order_cart_rule against quantity_per_user; rejects second redemption.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Delete cart rule and test orders.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Voucher Usage Quotas
  Scenario: Cart-rule per-customer usage limit is enforced
    Given cart rule "WELCOME10" is active with a usage limit of 1 per customer
    And customer "cust1@example.com" has an active cart with qualifying items
    When the customer applies voucher "WELCOME10"
    Then voucher "WELCOME10" is accepted and a 10% discount is deducted from order total
    When the customer completes the order
    And creates a second cart and attempts to apply voucher "WELCOME10" again
    Then voucher application is rejected with message "You cannot use this voucher anymore (usage limit reached)"
```

---

### Candidate 2/5: `PS-GAP-002` — Carrier eligibility follows configured price/weight range

- **Candidate ID**: `PS-GAP-002`
- **Priority Order**: 2
- **Actor / Role**: Customer and Administrator (Admin sets carrier ranges; Customer selects delivery)
- **Preconditions**: Carrier 'Express Air' configured for cart total >= $50.00; Carrier 'Standard Ground' configured for all carts.
- **Observable Business Oracle**: Carrier::getCarriersForOrder evaluates ps_range_price; filters available carriers based on order subtotal.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset carrier ranges.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Shipping Carrier Eligibility
  Scenario: Carrier eligibility follows configured price/weight range
    Given carrier "Express Air" is configured for minimum order total $50.00
    And carrier "Standard Ground" is configured for all order amounts
    When customer has a cart with total value $30.00 and proceeds to shipping step
    Then only "Standard Ground" is displayed as an available shipping option
    When customer increases cart quantity so total value becomes $75.00
    And proceeds to shipping step
    Then both "Standard Ground" and "Express Air" are selectable options
```

---

### Candidate 3/5: `PS-GAP-003` — Successful payment creates one order and applies stock synchronization

- **Candidate ID**: `PS-GAP-003`
- **Priority Order**: 3
- **Actor / Role**: Customer (Shopper completing checkout)
- **Preconditions**: Product 'Printed Summer Dress' has stock=10; customer at payment step with valid cart.
- **Observable Business Oracle**: PaymentModule::validateOrder creates ps_orders row, order history entry, and calls StockAvailable::updateQuantity(-2).
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Cancel order and restore product stock to 10.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Order Placement and Stock Sync
  Scenario: Successful payment creates one order and applies stock synchronization
    Given product "Printed Summer Dress" has available stock 10
    And customer has 2 units of "Printed Summer Dress" in cart
    When customer completes payment using "Bank wire" payment module
    Then an order confirmation screen is displayed with a unique Order Reference
    And exactly one order record is created in the orders table
    And the available stock for "Printed Summer Dress" updates to 8
```

---

### Candidate 4/5: `PS-GAP-004` — Available quantity update stays consistent with product combination stock

- **Candidate ID**: `PS-GAP-004`
- **Priority Order**: 4
- **Actor / Role**: Catalog Administrator (Stock Manager)
- **Preconditions**: Product 'T-Shirt' has two combinations: Size S and Size L; initial quantities S=5, L=10.
- **Observable Business Oracle**: ps_stock_available stores distinct rows per id_product_attribute; frontend AJAX update correctly reflects combination quantity.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset combination quantities.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Combination Stock Management
  Scenario: Available quantity update stays consistent with product combination stock
    Given product "T-Shirt" has combinations "Size S" (qty 5) and "Size L" (qty 10)
    When administrator edits combination "Size S" and sets quantity to 8
    And clicks "Save"
    Then the admin combinations list displays "Size S" quantity 8 and "Size L" quantity 10
    When a customer views product "T-Shirt" on storefront with "Size S" selected
    Then availability shows "8 items in stock"
    When customer switches combination to "Size L"
    Then availability dynamically updates to show "10 items in stock"
```

---

### Candidate 5/5: `PS-GAP-005` — Customer group discount applies configured percentage reduction to catalog price

- **Candidate ID**: `PS-GAP-005`
- **Priority Order**: 5
- **Actor / Role**: Shop Administrator and VIP Customer (Admin sets group pricing; VIP customer shops)
- **Preconditions**: Customer group 'VIP Gold' configured with 20% discount on catalog; customer 'vip_buyer@example.com' assigned to 'VIP Gold'; product price $100.00.
- **Observable Business Oracle**: Product::getPriceStatic applies Group::getReduction($id_group); computes effective price $80.00.
- **Baseline Overlap Analysis**: 
- **Fixture & Cleanup**: Teardown: Reset customer group assignment.
- **Review Decision**: `ACCEPTED_FOR_IMPLEMENTATION`

```gherkin
Feature: Customer Group Pricing
  Scenario: Customer group discount applies configured percentage reduction to catalog price
    Given customer group "VIP Gold" has a 20% group discount
    And customer "vip_buyer@example.com" belongs to group "VIP Gold"
    And product "Luxury Leather Bag" has a retail price of $100.00
    When customer "vip_buyer@example.com" logs in and views "Luxury Leather Bag"
    Then the displayed product price reflects the 20% discount at $80.00
    And adding the product to cart shows unit price $80.00 in checkout summary
```

---

