# ACTIVE-R3-SUITE-INTEGRATION — Maven active revision integration

- Task scope / acceptance gate: P0-B follow-up for Claroline and Kanboard active Maven test sources; preserve immutable registered R3 artifacts and make the actual `-Dtest` execution classes revision-correct.
- Base branch + base SHA: `task/final-remediation-audit` / `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00` (verified current PR #27 head).
- Working branch: `task/active-suite-r3-remediation`
- Implementation commit (full SHA): `a6c44a30ad8c66337f1195f7c566ba0ce8797ffb`.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/27 (updated through a fast-forward push).
- Push status: PUSHED — verified GitHub PR #27 head and remote branch at `a6c44a30ad8c66337f1195f7c566ba0ce8797ffb`.
- Runtime/commit/version tested: Claroline `1.11.10` at `22d852f93081bc36b1d08b93f5e0c14b49a573f6`; Kanboard `1.2.15` at `0501249ff3e9a5ea83a06155cd2971dc36197056`; Maven 3.9.16; Java 21.0.12; Selenium 4.35.0. Compile only; no application runtime.
- Status proposed by Agent: PARTIAL (active revision integration compiled; no G3 behavior execution in this task).

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `experiments/claroline/bewt-suite/src/test/java/test/*_R3.java` (5 files) | Added active Maven execution mirrors for CL-GAP-001…005; corrected stale generated comment from Revision 2 to Revision 3 | Existing execution entrypoints invoke a named test class directly; R3 credential-safe code otherwise was not in the active suite source root. |
| `experiments/kanboard/bewt-suite/src/test/java/tests/*_R3.java` (5 files) | Added active Maven execution mirrors for KB-GAP-001…004 and KB-GAP-008; corrected stale generated comments | Same active-source integration for the R3 credential remediation. A later R10 for KB-GAP-001 exists on the child candidate branch and should supersede R3 there. |
| `experiments/{claroline,kanboard}/bewt-suite/ACTIVE-CANDIDATE-MAPPING.json` | Added 5 candidate-to-active-class mappings per suite, exact extension artifact SHA, active source SHA, and reproducible `mvn -Dtest=<class>` command | Makes build/execution entrypoints and source provenance explicit without mutating registered historical revision artifacts. |
| `docs/program/STATUS.json` | Appended a factual engineering-remediation evidence note; no gate or candidate state changed | Records the compile-only outcome and G3 limitation. |
| `docs/tasks/ACTIVE-R3-SUITE-INTEGRATION/TASK-REPORT.md` | Task evidence and handoff | Provides scoped review instructions and reproduction commands. |

The original registered extension R3 source and registration JSON remain unchanged. The active execution copies differ only in the stale revision comment; their SHA-256 is recorded separately from the immutable extension artifact SHA in the new mapping manifests.

## 2. Actual verification

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `mvn -B -ntp -f experiments/claroline/bewt-suite/pom.xml -DskipTests test` | 0 | PASS — compiled 22 main and 52 test sources; Surefire intentionally skipped | Console output from task run; compiled classes under `experiments/claroline/bewt-suite/target/test-classes/` (ignored build output) |
| `mvn -B -ntp -f experiments/kanboard/bewt-suite/pom.xml -DskipTests test` | 0 | PASS — compiled 27 main and 42 test sources; Surefire intentionally skipped | Console output from task run; compiled classes under `experiments/kanboard/bewt-suite/target/test-classes/` (ignored build output) |
| Mapping verification: 10 registrations compared with exact Git blob SHA-256; 10 active source SHA-256 values checked as canonical UTF-8/LF; corrected revision headers and compiled class files verified | 0 | PASS | `experiments/claroline/bewt-suite/ACTIVE-CANDIDATE-MAPPING.json`; `experiments/kanboard/bewt-suite/ACTIVE-CANDIDATE-MAPPING.json` |
| Targeted hardcoded credential assignment scan on 10 active R3 classes | 0 | PASS — no literal credential assignments found | Active R3 Java source paths above |
| Trailing whitespace check on new files | 0 | PASS | Active mapping and R3 Java source paths above |

G3 Selenium execution was `NOT_RUN`: this task does not have the user's explicit “ready for G0” signal, and no Docker/application runtime was started. Compilation does not establish runtime credential injection, scenario correctness, oracle validity, cleanup, or acceptance.

## 3. Research impact

- Apps/source pins: Claroline 1.11.10 (`22d852f…`); Kanboard 1.2.15 (`0501249…`).
- Candidate mappings: 10 R3 active Maven classes compiled. No candidate status changed; all retain existing human oracle/novelty and semantic review state.
- RQ1/RQ2/RQ3/RQ4 measurable changes: none. The work establishes active source integration and compilation only; it does not increase validated count or measured coverage.
- Gate status before → proposed after: unchanged. No G0/G1/G2/G3/G4 gate is self-accepted.
- Dataset/metrics artifacts: no candidate outcome, RQ metric, or final acceptance result changed.
- Denominator caveat: 10 credential-safe revision mappings are engineering artifacts, not 10 validated cases or independent experimental samples.

## 4. Safety & integrity

- `bewt-original/` touched? NO.
- Docker/project resources touched? NONE.
- Existing unrelated local dirty files preserved? YES; work was isolated in a new worktree and only scoped files were added.
- Secret scan / staged diff review result: targeted scan found no literal credential assignments; full repository scan was not performed by this scoped task.
- Failed/blocked tasks: first sandboxed Maven attempt could not write `target/`; rerun with permitted worktree build-output access succeeded. No application runtime was attempted.

## 5. Evidence and reproduction

- Source/test paths: ten extension registrations under `extension/claroline/selenium/*/revision-3/` and `extension/kanboard/selenium/*/revision-3/`; active Maven copies under the corresponding `experiments/<app>/bewt-suite/src/test/java/` paths.
- Raw run/log/XML/screenshot paths: none produced by this task (compile only).
- Fixture/cleanup: not run.
- Exact reproducible compile commands: those listed in Section 2.
- Known limitations/risks: G3 must invoke each class named by the active mapping with isolated valid credentials and pinned fixtures. Existing R2 historical results are not evidence for R3. The newer KB-GAP-001 R10 candidate branch must carry its own active map update before its R10 mapping can be called current.

## 6. Review request

- Team Lead decisions still required: human oracle/novelty review for affected candidates; separate G0 authorization/runtime evidence; later acceptance review.
- Suggested next task: inherit these active R3 mappings into the latest candidate integration branch, retain R10 for KB-GAP-001, compile the updated child branch, then run only after the VM credential-injection signal.
- GitHub review paths: both `ACTIVE-CANDIDATE-MAPPING.json` files, the ten active R3 classes, and this report. PR diff: https://github.com/NgaiLong49423/BEWT-CovExt/pull/27/files.

