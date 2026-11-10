# Kanboard — Human Review Packet (Milestone 3 / G1)

**Application Version:** 1.2.15  
**Baseline Physical Features:** 30  
**Baseline Test Classes:** 30  
**Baseline Assertions:** 43  
**Baseline Unique Behavioral Units (D_base):** 20  
**Shortlisted Candidates:** 5  
**Review Status:** PENDING HUMAN REVIEW (NO SELF-APPROVAL)

---

## Executive Summary
This packet presents the 5 prioritized, source-backed scenario candidates for **Kanboard** to achieve the 40-case milestone objective. Each candidate provides complete Gherkin specifications, observable business oracles, test fixtures, negative controls, and exact source code anchors.

---

### 1. KB-GAP-001 — Reopen a closed task

- **Target Novelty Class:** `NOVEL_LIFECYCLE_TRANSITION`
- **Actor:** Project Member (Authenticated project member with task management rights)
- **Preconditions:** A task with title 'Task to Reopen' exists in project 'Test Project' and is currently closed.
- **Test Data:** `{"project": "Test Project", "taskTitle": "Task to Reopen", "targetStatus": "open"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** Task status changes from closed to open in database and UI badge; task reappears on active Kanban board and matches status:open query.
- **Negative Control:** A user without task modification permission sees no 'Reopen this task' link and direct POST is rejected.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create project, add task, close task. Teardown: Remove task and project.

#### Source Code Anchors
- **File:** `app/Template/task/sidebar.php` (Lines: `81`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *Reopen action in sidebar*
- **File:** `app/Controller/TaskStatusController.php` (Lines: `28-36`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *open() action transitions task is_active to 1*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** KB-018 closes a task, and KB-027 searches closed tasks. Baseline never exercises task reopening.

#### Review Ledger Entry Template
- **Candidate ID:** `KB-GAP-001`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 2. KB-GAP-002 — Create and view a task comment

- **Target Novelty Class:** `NOVEL_COLLABORATION_FEATURE`
- **Actor:** Project Collaborator (Authenticated user with comment permissions)
- **Preconditions:** An open task 'Task With Comments' exists in 'Test Project'.
- **Test Data:** `{"taskTitle": "Task With Comments", "commentText": "This is a verified test comment for task verification."}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** Comment record is inserted into comments table linked to task_id; comment text and author username render in the task comment stream.
- **Negative Control:** Submitting an empty comment field triggers validation error and no comment row is created.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create project and task. Teardown: Delete created comment, task, and project.

#### Source Code Anchors
- **File:** `app/Template/task_comments/create.php` (Lines: `1-25`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *Comment creation template*
- **File:** `app/Controller/CommentController.php` (Lines: `30-65`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *create/save comment handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline has zero comment coverage across all 30 tests (KB-001..KB-030).

#### Review Ledger Entry Template
- **Candidate ID:** `KB-GAP-002`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 3. KB-GAP-003 — Duplicate a task to another project

- **Target Novelty Class:** `NOVEL_CROSS_PROJECT_OPERATION`
- **Actor:** Project Manager (Manager with permissions across source and target projects)
- **Preconditions:** Source project 'Project Alpha' with task 'Task to Clone' and target project 'Project Beta' exist.
- **Test Data:** `{"sourceProject": "Project Alpha", "targetProject": "Project Beta", "taskTitle": "Task to Clone"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** New task record created in project Beta with copied title/description; source task record in project Alpha remains unmodified.
- **Negative Control:** Attempting to duplicate to a project where actor has no write access fails with authorization error.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create two projects and one task. Teardown: Remove both projects and tasks.

#### Source Code Anchors
- **File:** `app/Controller/TaskDuplicationController.php` (Lines: `45-90`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *duplicate() across projects handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline covers local task creation (KB-003) but no inter-project duplication.

#### Review Ledger Entry Template
- **Candidate ID:** `KB-GAP-003`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 4. KB-GAP-004 — Move a task to another project

- **Target Novelty Class:** `NOVEL_WORKFLOW_MIGRATION`
- **Actor:** Project Manager (Manager with permissions across both projects)
- **Preconditions:** Project A with task 'Task to Move' and Project B exist.
- **Test Data:** `{"sourceProject": "Project A", "targetProject": "Project B", "taskTitle": "Task to Move"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** Task project_id is updated to Project B; task disappears from Project A board and appears in Project B first column.
- **Negative Control:** Selecting destination project without required column mapping displays column assignment error.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create two projects and task. Teardown: Clean up tasks and projects.

#### Source Code Anchors
- **File:** `app/Controller/TaskDuplicationController.php` (Lines: `95-140`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *move() across projects handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline has no task move tests across projects.

#### Review Ledger Entry Template
- **Candidate ID:** `KB-GAP-004`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
### 5. KB-GAP-008 — Add an internal subtask to a task

- **Target Novelty Class:** `NOVEL_HIERARCHICAL_DECOMPOSITION`
- **Actor:** Project Member (Authenticated task editor)
- **Preconditions:** Parent task 'Master Feature' exists in 'Test Project'.
- **Test Data:** `{"parentTask": "Master Feature", "subtaskTitle": "Subtask Unit 1"}`

#### Gherkin Specification
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

#### Observable Business Oracle
- **Positive Oracle:** Subtask row inserted into subtasks table with task_id FK; subtask table renders item with default status 'Todo'.
- **Negative Control:** Submitting empty subtask title fails with 'The title is required'.

#### Fixture & Lifecycle
- **Setup & Teardown:** Setup: Create task. Teardown: Remove subtask and task.

#### Source Code Anchors
- **File:** `app/Controller/SubtaskController.php` (Lines: `30-70`) @ commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` — *create/save subtask handler*

#### Baseline Traceability & Novelty Justification
- **Baseline Overlap Analysis:** Baseline tests tasks, columns, swimlanes, and categories, but zero subtask coverage.

#### Review Ledger Entry Template
- **Candidate ID:** `KB-GAP-008`
- **Status:** `PENDING_HUMAN_APPROVAL`
- **Reviewer Signature:** `[ PENDING TEAM LEAD REVIEW ]`
- **Decision:** `[ ] ACCEPTED_FOR_IMPLEMENTATION   [ ] REVISE   [ ] REJECTED   [ ] BLOCKED`
- **Conditions / Notes:** __________________________________________________

---
