# KB-GAP-001 Revision 5 — Task Report

## Scope

This task adds an immutable Revision 5 implementation of the Kanboard `KB-GAP-001` closed-task revival scenario and integrates it into the pinned Kanboard Maven suite. It remains preliminary engineering work pending independent human oracle and novelty review.

## Changes

- Preserved Revision 4 unchanged and created Revision 5 with its own source hash and parent provenance.
- Added the `Test Project` fixture setup through the application's project creation UI before creating and closing the task. This removes the assumption that G0 pre-seeded the project.
- Added the Revision 5 class to `experiments/kanboard/bewt-suite/src/test/java/tests/`.
- Retained the business assertions for the reopened status badge and exact task result from the `status:open` search.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Maven test compilation | PASS; 38 test sources compiled with Java 21 | Local command: `mvn -B -DskipTests test-compile` in `experiments/kanboard/bewt-suite`; exit 0 on 2026-11-12 |
| G3 Docker/Selenium execution | NOT_RUN at report creation; awaiting VM run | — |
| Clean-state reruns | NOT_RUN | — |
| Human oracle/novelty approval | PENDING | Existing decision records remain unsigned/unapproved for research acceptance |

## Acceptance boundary

Compilation does not establish runtime behavior or scientific validation. Revision 5 cannot be marked `VALIDATED` until the exact business oracle passes the approved runtime protocol, the required three clean-state reruns pass, provenance is complete, and human oracle/novelty decisions are evidenced.
