# Claroline — Human Review Packet (Milestone 3 / G1)

**Application Version:** 1.11.10  
**Baseline Physical Features:** 40  
**Baseline Test Classes:** 40  
**Baseline Assertions:** 73  
**Baseline Unique Behavioral Units (D_base):** 28  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Claroline** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. CL-GAP-001 — Course document upload, move and delete lifecycle

- **Target Novelty Class:** `NOVEL_DOCUMENT_MANAGEMENT`
- **Actor:** Teacher (Course teacher / manager)
- **Preconditions:** Course 'CL-DOC-101' exists; clean document directory; synthetic file 'syllabus.pdf'.
- **Test Data:** `{"course": "CL-DOC-101", "fileName": "syllabus.pdf", "targetFolder": "LectureNotes"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** Document records in claro_document table update path during move and delete marks record deleted; filesystem confirms file existence then removal.
- **Negative Control:** An enrolled student without edit rights cannot see Move or Delete action buttons.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create course and folder. Teardown: Remove document and clean directory.

#### Source Code Anchors
- **File:** `claroline/document/document.php` (Lines: `120-210`) @ commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` — *document upload/move/delete controller*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline exercises exercises, user enrollment, and calendar events, but zero document lifecycle tests.

#### Review Ledger Entry Template
- **Candidate ID:** `CL-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. CL-GAP-002 — Group space is inaccessible to a non-member student in a private group

- **Target Novelty Class:** `NOVEL_GROUP_AUTHORIZATION_BOUNDARY`
- **Actor:** Teacher and Student (Teacher configures private group; student is non-member)
- **Preconditions:** Course has closed private Group B; Student 1 is enrolled in course but NOT in Group B.
- **Test Data:** `{"course": "CL-GRP-101", "groupName": "Private Group B", "studentUser": "student_bob"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** claro_is_in_a_group check fails; claro_disp_auth_url denies access; HTTP redirect and error message triggered.
- **Negative Control:** When student_bob visits an open group or a group they belong to, group space renders normally.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete groups and test course.

#### Source Code Anchors
- **File:** `claroline/group/group_space.php` (Lines: `40-80`) @ commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` — *group space authorization gate*
- **File:** `claroline/inc/lib/group.lib.inc.php` (Lines: `110-145`) @ commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` — *membership verification function*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** CL-27/28/30 test course-level access and passwords; none test group-level authorization boundaries.

#### Review Ledger Entry Template
- **Candidate ID:** `CL-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. CL-GAP-003 — Teacher imports an exercise package into a course

- **Target Novelty Class:** `NOVEL_PACKAGE_INGESTION`
- **Actor:** Teacher (Course teacher)
- **Preconditions:** Teacher authenticated in empty course; synthetic IMS QTI / Claroline exercise zip package.
- **Test Data:** `{"course": "CL-EX-101", "package": "math-quiz-pkg.zip", "quizTitle": "Calculus Quiz 1"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** exercise and question tables populated from zip package XML schema; imported exercise immediately available for student attempts.
- **Negative Control:** Uploading a corrupted zip package displays validation error and creates zero exercise records.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete imported exercise and questions.

#### Source Code Anchors
- **File:** `claroline/exercise/exercise.php` (Lines: `180-240`) @ commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` — *import_exercise handler and QTI parser*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** CL-07..CL-11 manually create and answer exercises; none test package import mechanism.

#### Review Ledger Entry Template
- **Candidate ID:** `CL-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. CL-GAP-004 — Tracking controls are teacher-only while exercise attempts remain student-facing

- **Target Novelty Class:** `NOVEL_ANALYTICS_ACCESS_CONTROL`
- **Actor:** Teacher and Student (Role differentiation in course tracking)
- **Preconditions:** Course tracking enabled; exercise 'Midterm Quiz' attempted by 'student_alice'.
- **Test Data:** `{"course": "CL-TRK-101", "exercise": "Midterm Quiz", "student": "student_alice"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** Tracking UI restricted by is_course_allowed('tracking'); tracking database logs student score and renders aggregated analytics for teacher.
- **Negative Control:** Disabling course tracking in tool settings hides the tracking tool even from teachers.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Reset tracking logs and student attempts.

#### Source Code Anchors
- **File:** `claroline/tracking/courseLog.php` (Lines: `35-95`) @ commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` — *teacher tracking authorization gate*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** CL-12 views user profile statistics; baseline never tests course-wide tracking governance.

#### Review Ledger Entry Template
- **Candidate ID:** `CL-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. CL-GAP-005 — Course announcement creation, publication, and student notification visibility

- **Target Novelty Class:** `NOVEL_COURSE_COMMUNICATION`
- **Actor:** Teacher and Student (Teacher publishes announcement; student reads)
- **Preconditions:** Course 'CL-ANN-101' exists; teacher and student enrolled; no prior announcements.
- **Test Data:** `{"course": "CL-ANN-101", "title": "Classroom Relocation", "content": "Classroom moved to Room 302 for Friday."}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** claro_announcement table receives new record; course home view pulls and displays active announcements.
- **Negative Control:** An announcement set to 'Invisible' is hidden from students while visible to teachers.

#### Fixture & Lifecycle
- **Setup & Teardown:** Teardown: Delete announcement record.

#### Source Code Anchors
- **File:** `claroline/announcements/announcements.php` (Lines: `50-110`) @ commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` — *announcement creation and visibility handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline covers calendar events (CL-15), but zero announcement tool tests.

#### Review Ledger Entry Template
- **Candidate ID:** `CL-GAP-005`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
