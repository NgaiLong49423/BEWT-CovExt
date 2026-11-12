# PAPER-PROVENANCE-20261113 — Reconcile source and metrics revisions

- Task scope / acceptance gate: Correct revision attribution in the paper, v2 research report, and replication runbook; G4 documentation integrity only.
- Base branch + base SHA: `task/final-remediation-audit` / `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00`.
- Working branch: `task/paper-provenance-correction`.
- Head commit (full 40-char SHA): pending commit.
- PR: `PR_NOT_CREATED: commit and verify task branch first`.
- Push status: `PUSH_BLOCKED: pending commit`.
- Runtime/commit/version tested: repository history through PR #27 head; metrics revision `569ca47d40dcc8dd8d5138718078c5f4ec7217bc`.
- Status proposed by Agent: `PARTIAL`.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/paper/bewt-covext-paper.tex` | Separates the source/data snapshot `da639...`, metrics computation revision `569ca...`, and failed Gemini evidence revision `3c6ca...`. | The paper previously pointed to `e32b25e...` for later recomputation evidence. |
| `docs/research-results/v2/BEWT-CovExt-v2-RESEARCH-REPORT.md` | Synchronizes the audit and reproduction references to the revision recorded in the checked-in RQ artifact. | Keep the report consistent with the source-bound metric output. |
| `docs/research-results/v2/replication/REPLICATION-RUNBOOK.md` | Pins offline metrics reproduction to `569ca...` and identifies the separate data baseline. | Make the documented reproduction revision match the RQ artifact. |
| `docs/program/STATUS.json` | Adds this partial task milestone and records the unresolved test-count mismatch. | Preserve a machine-readable state without advancing acceptance. |
| `docs/tasks/PAPER-PROVENANCE-20261113/TASK-REPORT.md` | Adds this evidence-linked handoff. | Meet the repository task-report requirement. |

## 2. Actual verification

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `git merge-base --is-ancestor 569ca47d40dcc8dd8d5138718078c5f4ec7217bc HEAD` | 0 | PASS | Current branch history |
| `git diff --check` | 0 | PASS | Local diff |
| `node --test docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs` | 1 | FAIL: 2 passed; assertion expected 84 records but observed 85 | Test output; local attempt6 evidence adds one record |
| `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | 1 | FAIL: 27 passed; assertion expected 84 records but observed 85; 1 Windows symlink test skipped | Test output; same supplementary attempt6 evidence |
| Paper/PDF compilation | — | NOT_RUN: no `tectonic`, `latexmk`, or `pdflatex` executable found; `sn-jnl.cls` and `sn-mathphys-num.bst` are absent | `docs/paper/bewt-covext-paper.tex` |

The extra attempt6 record is preserved supplementary evidence and is not part of the canonical 79-run sample. The test failure is reported as observed; metrics output and test expectations need reconciliation after the evidence is committed. No evidence was removed to force a pass.

## 3. Research impact

- Apps affected, source/version pins: None; this task changes revision attribution only.
- Candidate IDs and statuses before → after: No change; no candidate was advanced.
- RQ1/RQ2/RQ3/RQ4 measurable changes: None; this task did not recompute metrics.
- Gate status before → proposed after: G4 remains `NOT_VERIFIED`; attribution is corrected, while the metrics test mismatch and final review remain.
- Dataset/metrics artifacts updated: None; `docs/final-acceptance/RQ1-RQ4-results.json` remains the source for the recorded computation revision.
- Denominator and sampling caveats: The current filesystem contains 85 run records and 86 JUnit XML files after adding supplementary attempt6 evidence; the historical test fixture expected 84 and 85. The canonical sample remains 79 runs.

## 4. Safety & integrity

- `bewt-original/` touched? NO.
- Docker/project resources touched? NONE.
- Existing unrelated local dirty files preserved? YES; the local attempt6 evidence remains untracked and unstaged.
- Secret scan / staged diff review result: Documentation-only changes; staged diff review pending.
- Failed/blocked tasks and honest reasons: Metrics tests report the 84→85 local evidence-count mismatch; paper PDF compilation was unavailable because the TeX toolchain and Springer class files are absent.

## 5. Evidence and reproduction

- Source/test paths: `docs/final-acceptance/RQ1-RQ4-results.json`, `docs/research-results/v2/replication/recompute-metrics.mjs`, and `docs/tasks/CONTINUOUS-REMEDIATION/PROGRESS.md`.
- Raw run/log/XML/screenshot paths: No raw runtime logs added. Attempt6 structured evidence is preserved locally and on PR #33.
- Input data fixture path and cleanup evidence: Not applicable to this documentation task.
- Exact reproducible commands: See verification table; rerun the Node tests after G3 evidence and metrics are reconciled.
- Known limitations/risks: This task corrects revision attribution only; it does not independently validate metrics, candidate behavior, or PDF layout.

## 6. Review request

- What the Team Lead needs to decide: Review the provenance wording and the follow-on reconciliation of counts after attempt6 evidence is integrated.
- Suggested next task if accepted: Recompute RQ1–RQ4 from the committed evidence set, update run-count controls, then rebuild and visually inspect the manuscript PDF.
- GitHub PR diff URL and file paths to inspect: Pending PR creation; see the three source documents in the change table.
