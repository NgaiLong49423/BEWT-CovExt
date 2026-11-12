# KB-GAP-001 Revisions 5–6 — Task Report

## Scope

This task integrates successive immutable technical revisions of the Kanboard `KB-GAP-001` closed-task revival scenario. The work is preliminary engineering only; independent human oracle and novelty review remain pending.

## Changes

- Preserved Revision 4 unchanged. Revision 5 and Revision 6 each have separate source hashes, registrations, and parent provenance.
- Added the `Test Project` fixture through the application UI; this removes dependence on preseeded project state.
- Integrated each candidate revision into the pinned Kanboard Maven suite.
- Revision 6 returns to the app dashboard after creating the fixture before opening the project. This addresses the navigation defect observed in Revision 5.
- The test uses a unique task title, closes and reopens that task through the UI, asserts the `open` status badge, then asserts that `status:open` search returns that exact task.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Revision 5 Maven test compilation | PASS; Java 21, 38 test sources compiled | `mvn -B -DskipTests test-compile`, exit 0, 2026-11-12 |
| Revision 5 preliminary Cloud G3 run | FAIL; 1 test error | Run `g3-kb-gap001-r5-20261112-prelim-a`; app readiness HTTP 302; sanitized JUnit reports `NoSuchElementException` at `KanboardHomePage.goToProject` because the driver remained on the project summary page after fixture creation |
| Revision 5 cleanup | PASS; zero residual containers, networks, and volumes | `docs/tasks/g3-evidence/kanboard/KB-GAP-001/revision-5/g3-kb-gap001-r5-20261112-prelim-a/cleanup-result.json` on runner VM |
| Revision 6 Maven test compilation | PASS; Java 21, 39 test sources compiled | `mvn -B -DskipTests test-compile`, exit 0, 2026-11-12 |
| Revision 6 preliminary Cloud G3 run and reruns | NOT_RUN yet | — |
| Human oracle/novelty approval | PENDING | No signed decision is evidenced; research acceptance remains blocked |

## Acceptance boundary

Revision 5's FAIL is retained and is not counted as a candidate PASS. Revision 6 is not `VALIDATED` based on compile success. It requires live execution, three additional clean-state passes after an initial pass, complete source/runtime provenance, and actual human oracle/novelty decisions.

### Revision 6 preliminary run

- Outcome: **FAIL**; one test error, zero JUnit assertion failures; run `g3-kb-gap001-r6-20261112-prelim-a`.
- Root cause: the pinned Kanboard source renders **“Open this task”** for closed tasks; the Gherkin literal “Reopen this task” did not match the UI label. The action maps to `TaskStatusController::open` in the pinned upstream source.
- Cleanup: **PASS**, zero residual containers, networks, and volumes.
- The Gherkin remains unchanged. Revision 7 targets the observed source-backed UI label. See `HUMAN-DECISION-PACKET.md`; reviewer decision remains pending.
- Revision 7 Maven test compilation: **PASS**, 40 test sources compiled; `mvn -B -DskipTests test-compile`, exit 0, 2026-11-12.
- Revision 7 preliminary Cloud G3 and reruns: **NOT_RUN yet**.
