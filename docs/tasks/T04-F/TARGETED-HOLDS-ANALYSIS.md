# Targeted Holds Analysis & Resolutions

**Document Version:** 1.0.0  
**Milestone:** M3 (G1 Coverage & Taxonomy)  
**Author:** AGENT 2 (G1 Coverage, Gherkin & Research Analyst)  
**Date:** 2026-11-10  

---

## 1. Context & Objectives
During earlier static screening (tasks T04-D to T04-H), four specific candidates were flagged with targeted holds:
1. `CL-GAP-002` (Claroline authorization policy on group spaces)
2. `EC-GAP-003` (ExpressCart customer address update vs known cart/admin bugs)
3. `MB-GAP-003` (MantisBT issue-to-issue relationship constraints vs clone dependency)
4. `MW-GAP-003/004` (MediaWiki duplicate risk and file upload configuration dependencies)

This document provides the formal root-cause analysis, source-code justification, and architectural resolution for each hold.

---

## 2. Analysis & Resolutions

### 2.1 CL-GAP-002: Claroline Authorization Policy on Group Spaces
- **Original Hold / Uncertainty:**
  In Claroline, the group tool supports open self-registration groups as well as private closed groups. The hold questioned whether navigating directly to `/claroline/group/group_space.php?groupId=...` returns an access denied notification, redirects to group list, or renders self-registration options, noting that the runtime Docker image had unattributed patches.
- **Source Code Investigation:**
  - `claroline/group/group_space.php` (lines 40-80): Evaluates `claro_is_in_a_group($userId, $groupId)`.
  - `claroline/inc/lib/group.lib.inc.php` (lines 110-145): Checks membership table `claro_group_team`.
  - When a student is not enrolled in a group where `registration = 'closed'`, the script executes `claro_disp_auth_url(get_lang('Not allowed'))`, issuing an HTTP 302 redirect back to `/claroline/group/group.php` with session banner "Not allowed".
- **Resolution & Fixture Pinning:**
  - Pin the fixture to define a strictly **Private Closed Group** (`registration = 'closed'`, `visibility = 'private'`).
  - The Gherkin specification asserts that non-member student `student_bob` navigating to Group B space is redirected to group list with notification "Not allowed", group documents/forums are completely withheld, and no self-registration button is displayed.
  - Negative control: Visiting open groups or member groups renders normally.
  - **Status:** RESOLVED & SPECIFIED IN REVIEW PACKET.

---

### 2.2 EC-GAP-003: ExpressCart Customer Address Update & Storefront Propagation
- **Original Hold / Uncertainty:**
  ExpressCart historical investigations revealed that `POST /admin/order/create` lacked `checkAccess` middleware (a known security defect). Furthermore, if the shopping cart total is zero or if session state is dropped, checkout operations fail with "Cart is empty". The hold mandated separating ExpressCart source defects from tested business behavior.
- **Source Code Investigation:**
  - `routes/customer.js` (lines 110-160): Handles `POST /customer/update`. Successfully persists address fields (`customerAddress1`, `customerPostcode`, etc.) to MongoDB and updates `req.session.customer*`.
  - `routes/index.js` & `views/checkout-information.hbs`: When an authenticated customer opens checkout information, form fields are dynamically pre-populated from `req.session.customer*`.
- **Resolution & Architectural Decoupling:**
  - Decouple completely from the vulnerable `/admin/order/create` route. The scenario exercises purely the customer storefront flow.
  - Pin the execution order: Customer logs in -> adds product to cart (ensuring valid cart total > 0) -> updates shipping address in account profile -> navigates to checkout information form.
  - Observable Oracle: Asserts that the checkout form inputs automatically pre-populate with the updated profile address.
  - Negative control: Guest checkout session does NOT prefill customer Jane's address.
  - **Status:** RESOLVED & SPECIFIED IN REVIEW PACKET.

---

### 2.3 MB-GAP-003: MantisBT Issue Relationship Constraints & Self-Link Prevention
- **Original Hold / Uncertainty:**
  Baseline MantisBT cases (`mantisbt-33..35`) test linking and unlinking subprojects to projects. The hold questioned whether issue-to-issue relationships (parent/child, related, duplicate) and cloning dependencies behave deterministically and handle error boundaries properly.
- **Source Code Investigation:**
  - `bug_relationship_add.php` (lines 35-85): Invokes `relationship_add($src_bug, $dest_bug, $rel_type)`.
  - `core/relationship_api.php`:
    1. Checks if `$src_bug == $dest_bug`: triggers error `ERROR_RELATIONSHIP_SAME_BUG` ("You cannot link a bug to itself").
    2. Checks `relationship_exists($src_bug, $dest_bug, $rel_type)`: triggers `ERROR_RELATIONSHIP_ALREADY_EXISTS`.
    3. Handles complementary relationships: linking A as parent of B automatically creates the inverse child-of relation on B.
- **Resolution:**
  - Formulate MB-GAP-003 with two rigorous verification stages:
    1. Parent/child link creation and verified inverse synchronization on both issues.
    2. Constraint enforcement: explicit rejection of self-linking (A to A) and duplicate linking.
  - **Status:** RESOLVED & SPECIFIED IN REVIEW PACKET.

---

### 2.4 MW-GAP-003 & MW-GAP-004: MediaWiki Duplicate Risk & Distinction
- **Original Hold / Uncertainty:**
  - `MW-GAP-004` (Revision history): High risk of duplicate overlap against baseline `06_EditPageTest` (which edits page) and `16_RevertLastCommitTest` (which navigates history and rolls back).
  - `MW-GAP-003` (File upload): Dependent on container filesystem permissions and `wgEnableUploads`.
- **Source Code Investigation & Distinction:**
  - `MW-GAP-004`: Baseline 16 only clicks rollback and verifies the body returned to v1. It never exercises the side-by-side **Diff Engine** (`DifferenceEngine.php` lines 150-230).
    - Resolution: Refocus MW-GAP-004 exclusively on **Revision History Side-by-Side Diff Comparison**. Two sequential edits are made, history view is opened, radio buttons for Rev 1 and Rev 2 are selected, and "Compare selected revisions" is clicked. Oracle explicitly asserts the rendering of `table.diff` with highlighted deleted/added lines. This is 100% distinct from baseline tests.
  - `MW-GAP-003`: Refocused on **Upload Extension Validation Rejection** (`Special:Upload`). When an invalid `.exe` file is submitted, `UploadBase.php` rejects the upload with error message and creates no File: page.
  - Added `MW-GAP-005` (Page Protection Governance) as an additional pristine, container-independent gap candidate verifying administrator protection and regular editor denial.
  - **Status:** RESOLVED & SPECIFIED IN REVIEW PACKET.
