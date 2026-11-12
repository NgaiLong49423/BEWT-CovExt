# Final Acceptance Audit Package

This package reconciles the checked-in BEWT-CovExt claims with primary source, review, and execution artifacts. The audit baseline is `da6399536ff75a1edf4417819eb4d166cc1d781c` (`origin/main` at fetch time). The current findings do not authorize a change to the approved research scope of eight applications and 40 target cases.

The central result is that the current repository does not support final acceptance. The baseline audit found all 40 registered Revision 2 Java tests diverged from their embedded Gherkin behavior or oracle; all 40 primary review records remained unsigned and pending; runtime records did not bind results to source/test/image identities; and the historical metrics engine reported false PASS states from defaults and status strings. The current metrics revision removes those false PASS paths, but its RQ2/RQ3 evidence-computation paths remain incomplete and it does not establish acceptance.

## Contents

- `BASELINE-AUDIT.md` — repository, source, and evidence baseline.
- `40-CASE-TRACEABILITY.json` — per-candidate source, hash, semantic, review, and runtime-provenance audit.
- `SEMANTIC-ORACLE-AUDIT.md` — mapping findings and required remediation boundary.
- `HUMAN-REVIEW-STATUS.md` — distinction between implementation authorization and human acceptance.
- `G0-G4-ACCEPTANCE-MATRIX.md` and `D1-D8-ACCEPTANCE-MATRIX.md` — evidence-based gate and deliverable states.
- `RQ1-RQ4-RESULTS.md` and `METRICS-RECOMPUTATION.md` — what can and cannot currently be recomputed.
- `TEST-EXECUTION-SUMMARY.md` — checks run in this audit and their limits.
- `SONARCLOUD-REVIEW.md` — exact PR #27 findings and local remediation awaiting hosted rerun.
- `G3-RAW-RUN-ACCOUNTING.md` and `G3-RAW-RUN-ACCOUNTING.json` — reproducible distinction between primary summary IDs and supplementary/orphan execution artifacts.
- `SCIENTIFIC-CLAIM-AUDIT.md` and `SECURITY-AND-PROVENANCE-AUDIT.md` — material contradictions and exposure checks.
- `OPEN-BLOCKERS.md`, `FINAL-ACCEPTANCE-REPORT.md`, and `USER-ACCEPTANCE-CHECKLIST.md` — remaining work and decision points.

This package preserves historical run outcomes as reported. It does not relabel old raw JUnit passes as correct scenario validation, and it does not overwrite historical research artifacts.
