# FINAL-REMEDIATION-AUDIT — Evidence reconciliation and metrics hardening

- Task scope / acceptance gate: baseline reconciliation; 40-case semantic audit; human-review, runtime, model, metrics, and credential provenance; G0–G4/D1–D8 acceptance readiness.
- Base branch + base SHA: `main` / `da6399536ff75a1edf4417819eb4d166cc1d781c` (`origin/main` matched at fetch time).
- Working branch: `task/final-remediation-audit`.
- Task implementation commits: `34b923ff778d4b8cd25a9b1bde23ae1d9c37c77f` (initial audit), `6e5e0c51a48e5ced5465aa28f42830e3ebea4c40` (evidence-aligned report/PDF), `a27d093fd33b6a43260aba130aa839784a5b42d2` (evidence-based RQ2/RQ3), `569ca47d40dcc8dd8d5138718078c5f4ec7217bc` (metrics hardening), and `3bfee33aa40a5adc760fb87a2ee9999b06f5d347` (metrics output/status/handoff sync). Published branch head verified at `3bfee33aa40a5adc760fb87a2ee9999b06f5d347` before this report-only metadata sync.
- PR: [#27](https://github.com/NgaiLong49423/BEWT-CovExt/pull/27) (draft and open; no reviewer requested in the latest GitHub snapshot; not merged).
- Push status: `PUSHED`; `git ls-remote`, GitHub PR #27, and local branch all reported `3bfee33aa40a5adc760fb87a2ee9999b06f5d347` before this report-only metadata sync.
- Runtime/commit/version tested: audit baseline and pinned R2 artifacts; no app runtime, browser, Maven, Docker, Cloud, or live model execution in this task.
- Status proposed by Agent: `PARTIAL / ACCEPTANCE_BLOCKED`.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/final-acceptance/` | Added baseline, 40-case traceability, semantic and review audits, gate/deliverable matrices, metrics/claim/security reconciliation, blockers, and final handoff. | Record only what primary evidence supports. |
| `docs/research-results/v2/replication/recompute-metrics.mjs` | Uses Cucumber parsing, externally pinned Ed25519 reviewer trust, signed source inventory, evidence artifact hashes, source-bound 1+3 runs, path containment, protocol-only RQ3 slots, per-app RQ2, and explicit ExpressCart digest gaps. | Prevent status strings, untrusted keys, missing evidence, and unbound or extra runs from becoming acceptance. |
| `docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | Expanded negative and positive-transition controls; 29 total. | Test valid RQ2/RQ3 evidence paths and reject malformed, missing, mismatched, replayed, or escaped evidence. |
| `docs/paper/bewt-covext-paper.tex`, `.pdf`, bibliography and replication runbook | Corrected claims and rebuilt a 33-page A4 draft PDF using Tectonic 0.17.0 and temporary Springer template files. | Keep the manuscript synchronized to the current audit; author/affiliation placeholders remain. |
| Ten `extension/{claroline,kanboard}/.../revision-3/` artifacts | Added immutable security-only copies sourcing credentials from required system properties/environment variables; included registrations. | Remove literal login credentials while preserving R2 history. |
| `docs/program/STATUS.json` | Reopened prior acceptance states as evidence-blocked/partial and linked this audit. | Correct unsupported gate and deliverable PASS claims. |

## 2. Actual verification

| Exact command/action | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `git fetch origin main` | 0 | PASS | Remote main matched baseline SHA at fetch. |
| `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs` | 0 | PASS (31 passed, 1 skipped, 0 failed; 32 total) | Symlink/junction test skipped because creation is unavailable in this execution context. |
| `node --check docs/research-results/v2/replication/recompute-metrics.mjs` | 0 | PASS | Command output. |
| `node docs/research-results/v2/replication/recompute-metrics.mjs` | 0 | PASS as an audit run | `docs/final-acceptance/RQ1-RQ4-results.json` and `.csv`; baseline `569ca47`, RQ1 BLOCKED, RQ2 NOT_EVALUATED, RQ3/RQ4 PARTIALLY_VERIFIED. |
| Secret-safe R3 registration/hash and login-literal check | 0 | PASS (10/10) | `docs/final-acceptance/SECURITY-AND-PROVENANCE-AUDIT.md`; raw credential values were not emitted. |
| `git diff --check` | 0 | PASS | No whitespace errors; Git reports LF-to-CRLF normalization notices for Node files. |
| `pdfinfo docs/paper/bewt-covext-paper.pdf` | 0 | PASS; compiled draft only | 33 pages, A4; selected pages visually inspected. Temporary external Springer class/style files were used; author/affiliation placeholders and nonfatal warnings remain. |
| Java/Maven compile, app E2E, Docker/Cloud, additional model calls | — | NOT_RUN | Runtime identity/ownership and human oracle decisions remain blockers. One separately approved model call failed schema validation and was not retried. |

## 3. Research impact

- Apps affected: all eight; target remains 5 candidates per app / 40 total.
- Candidate semantic status: 22 `WRONG_BEHAVIOR`, 14 `PARTIALLY_IMPLEMENTED`, 4 `WEAK_ORACLE`, 0 `MATCHED`.
- Human oracle/novelty approval: 0/40 evidenced; all primary records remain unsigned/pending.
- Runtime: historical summary reports 13 initial pass candidates, 11 three-rerun passes, 2 flaky, 27 failed, and 79 invocations. These remain raw reported outcomes; 84 run records and 85 JUnit XML files exist, zero run records carry the full required runtime identity, and one cleanup check failed.
- Current cases meeting `VALIDATED`: 0/40.
- RQ1: `BLOCKED`; RQ2: `NOT_EVALUATED` with null per-app baseline/gain for all eight apps; RQ3: `PARTIALLY_VERIFIED`, 0 validated and all 40 candidates `BLOCKED`; RQ4: `PARTIALLY_VERIFIED`, five historical Gemini 3.1 Flash-Lite failures and one authorized Gemini 3.8 Flash schema failure, usage/cost unknown, no savings comparison.
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
