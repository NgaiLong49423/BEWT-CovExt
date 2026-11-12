# FINAL-REMEDIATION-AUDIT — Evidence reconciliation and metrics hardening

- Task scope / acceptance gate: baseline reconciliation; 40-case semantic audit; human-review, runtime, model, metrics, and credential provenance; G0–G4/D1–D8 acceptance readiness.
- Base branch + base SHA: `main` / `da6399536ff75a1edf4417819eb4d166cc1d781c` (`origin/main` matched at fetch time).
- Working branch: `task/final-remediation-audit`.
- Task implementation commit: `34b923ff778d4b8cd25a9b1bde23ae1d9c37c77f` on `task/final-remediation-audit`.
- PR: [#27](https://github.com/NgaiLong49423/BEWT-CovExt/pull/27) (draft; review requested, not merged).
- Push status: `PUSHED`; branch tracks `origin/task/final-remediation-audit`.
- Runtime/commit/version tested: audit baseline and pinned R2 artifacts; no app runtime, browser, Maven, Docker, Cloud, or live model execution in this task.
- Status proposed by Agent: `PARTIAL / ACCEPTANCE_BLOCKED`.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/final-acceptance/` | Added baseline, 40-case traceability, semantic and review audits, gate/deliverable matrices, metrics/claim/security reconciliation, blockers, and final handoff. | Record only what primary evidence supports. |
| `docs/research-results/v2/replication/recompute-metrics.mjs` | Replaced regex parsing/default PASS logic with Cucumber parser, signed review-field checks, traceability/hash verification, and raw-outcome labeling; generates JSON/CSV. | Prevent implementation authorization and missing/fabricated measurements from becoming PASS. |
| `docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | Replaced and expanded controls to 15 tests. | Cover malformed Gherkin, review boundaries, missing evidence, stale hashes, and deterministic output. |
| Ten `extension/{claroline,kanboard}/.../revision-3/` artifacts | Added immutable security-only copies sourcing credentials from required system properties/environment variables; included registrations. | Remove literal login credentials while preserving R2 history. |
| `docs/program/STATUS.json` | Reopened prior acceptance states as evidence-blocked/partial and linked this audit. | Correct unsupported gate and deliverable PASS claims. |

## 2. Actual verification

| Exact command/action | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `git fetch origin main` | 0 | PASS | Remote main matched baseline SHA at fetch. |
| `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | 0 | PASS (15/15) | Command output; reproducible from repository root. |
| `node --check docs/research-results/v2/replication/recompute-metrics.mjs` | 0 | PASS | Command output. |
| `node docs/research-results/v2/replication/recompute-metrics.mjs` | 0 | PASS as an audit run | `docs/final-acceptance/RQ1-RQ4-results.json` and `.csv`; RQ1 BLOCKED, RQ2/RQ3 NOT_EVALUATED, RQ4 PARTIALLY_VERIFIED. |
| Secret-safe R3 registration/hash and login-literal check | 0 | PASS (10/10) | `docs/final-acceptance/SECURITY-AND-PROVENANCE-AUDIT.md`; raw credential values were not emitted. |
| `git diff --check` | 0 | PASS | No whitespace errors; Git reports LF-to-CRLF normalization notices for Node files. |
| Java/Maven compile, app E2E, Docker/Cloud, model calls | — | NOT_RUN | Runtime credentials/identity and human oracle decisions remain blockers. |

## 3. Research impact

- Apps affected: all eight; target remains 5 candidates per app / 40 total.
- Candidate semantic status: 22 `WRONG_BEHAVIOR`, 14 `PARTIALLY_IMPLEMENTED`, 4 `WEAK_ORACLE`, 0 `MATCHED`.
- Human oracle/novelty approval: 0/40 evidenced; all primary records remain unsigned/pending.
- Runtime: historical summary reports 13 initial pass candidates, 11 three-rerun passes, 2 flaky, 27 failed, and 79 invocations. These remain raw reported outcomes; 84 run records and 85 JUnit XML files exist, zero run records carry the full required runtime identity, and one cleanup check failed.
- Current cases meeting `VALIDATED`: 0/40.
- RQ1: `BLOCKED`; RQ2: `NOT_EVALUATED`; RQ3: raw runs partially inspectable but semantic validation 0/40; RQ4: five failed Gemini 3.1 Flash-Lite attempts, usage/cost unknown, no savings comparison.
- G0–G4 and D1–D8: see `docs/final-acceptance/G0-G4-ACCEPTANCE-MATRIX.md` and `D1-D8-ACCEPTANCE-MATRIX.md`.

## 4. Safety and integrity

- `bewt-original/` touched? **NO**. Its pre-existing generated Gradle/build artifacts remain dirty and untouched.
- Docker/cloud resources touched? **NONE**.
- Existing untracked/worktree files preserved? **YES**; existing active worktrees were inspected and left unchanged.
- Secret review: 10 R2 login calls had literals; values omitted. Security-only R3 uses required runtime config. Whether any prior value was reused outside test fixtures is unknown; assess privately for rotation.
- No merge action has occurred. The audit branch and draft PR are published for Team Lead review.

## 5. Evidence and reproduction

- Case-level source paths, hashes, line ranges, review state, raw outcome, and semantic finding: `docs/final-acceptance/40-CASE-TRACEABILITY.json`.
- Metrics: `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs`; then `node docs/research-results/v2/replication/recompute-metrics.mjs`.
- Baseline and primary contradictions: `docs/final-acceptance/BASELINE-AUDIT.md` and `SCIENTIFIC-CLAIM-AUDIT.md`.
- Known limitations: no human oracle/novelty decision, no corrected semantic Java implementations, no source-bound runtime rerun, no proven UBU denominator, no live successful model generation, no actual cost telemetry.

## 6. Review request

- Team Lead decisions: review/approve/reject each oracle and novelty packet; determine which unsupported scenarios need revision; confirm whether prior test credentials are fixture-only or need rotation.
- After these decisions: implement corrected immutable Java revisions, bind manifests/run records to exact commit/hash/image/runtime, resolve cleanup/attempt-count discrepancies, rerun approved tests from clean states, and independently recalculate RQ1–RQ4.
- Suggested next task: human review of the consolidated 40-case semantic/oracle dossier, followed by app-specific corrected test tasks. No candidate is ready for research acceptance now.
