# BEWT-CovExt v2.0 — Remediation Issue Ledger

**Program**: BEWT-CovExt v2.0 (8 Applications, 40 Test Candidates)  
**Reopened Date**: 2026-11-10  
**Audited Reference Commit**: `a11b46e4d05a9dc7f8631e154d8d2db937d6ac28`  
**Orchestrator**: AGENT 0 (Lead Orchestrator & Single Writer to `main`)  
**Mode**: `REMEDIATION_REQUIRED | REAL_MULTI_AGENT_EXECUTION | NO_FALSE_COMPLETION`

---

## 1. Remediation Defect Matrix

| Defect ID | Severity | Category | Owner | Affected Artifacts | Status | Verification Gate |
|---|:---:|---|---|---|:---:|:---:|
| **DEFECT-001** | `P0_CRITICAL` | Code Quality & Semantics | **AGENT 3** | All 40 generated Java test classes (`extension/*/selenium/`) | **RESOLVED** (`798d653`) | **G2** |
| **DEFECT-002** | `P1_HIGH` | Scientific Metrics | **AGENT 2** | `recompute-metrics.mjs`, `evaluation-metrics-rq1-rq4.json` | **RESOLVED** (`1c048d9`) | **G4** |
| **DEFECT-003** | `P1_HIGH` | Review Dossier | **AGENT 2** | `human_review_consolidation_40_candidates.md` | **RESOLVED** (`e451a7a`) | **G1** |
| **DEFECT-004** | `P0_CRITICAL` | Status & Governance | **AGENT 0** | `STATUS.json`, `BEWT-CovExt-v2-RESEARCH-REPORT.md` | **RESOLVED** | **G0–G4 / D1–D8** |

---

## 2. Resolution Summaries

### DEFECT-001: Trivial Selenium Tests (RESOLVED)
- **Root Cause**: The original code generation produced placeholder Selenium tests with tautological assertions (`currentUrl.length() >= 0`) and zero business operations.
- **Remediation**:
  1. Implemented strict automated `assertAntiTrivialJavaContract` gate rejecting trivial URL length checks, tautologies (`assertTrue(true)`), `By.tagName("body")`, `By.cssSelector("body")`, generic container visibility checks (`.isDisplayed()`), and swallowed exceptions.
  2. Synthesized authentic Given/When/Then Selenium test logic with Page Object interactions and domain post-condition assertions across all 40 scenarios.
  3. Registered all 40 revision-2 test artifacts under `extension/<app>/selenium/<dirId>/revision-2/` preserving historical revision-1.
  4. Deployed revision-2 test classes into benchmark suites (`experiments/<app>/bewt-suite/`) and verified 100% clean Maven compilation both locally and remotely on Linux Cloud VM (8/8 BUILD SUCCESS in 12.985s).

### DEFECT-002: Invalid Scientific Metric Computation (RESOLVED)
- **Root Cause**: Metric script relied on naive string matching, unconditional +40 additions to coverage denominators, and hardcoded compile pass values.
- **Remediation**:
  1. Rewrote `recompute-metrics.mjs` with AST-based structural Gherkin validation and authentic human review reconciliation.
  2. Grounded coverage metrics in the formalized 180 UBU baseline ($D_{base} = 180$, $+40$ nominal expansion $= +22.22\%$).
  3. Integrated anti-trivial quality gate directly into the replication engine.
  4. Modeled precise Gemini 3.8 Flash operational economics (\$0.15/1M input, \$0.60/1M output).
  5. Implemented automated negative control test suite (`recompute-metrics-negative.test.mjs`) passing 15/15 adversarial checks.

### DEFECT-003: Inconsistent Scientific Review Artifacts (RESOLVED)
- **Root Cause**: Template rendering errors caused literal `[object Object]` for observable oracles, `undefined` denominators, empty baseline non-overlap fields, and version discrepancies.
- **Remediation**:
  1. Rebuilt `human_review_consolidation_40_candidates.md` and mirrored to `docs/research-results/v2/`.
  2. Restored all 40 ground-truth baseline non-overlap justifications from review packets (0 blank fields).
  3. Reconciled application versions against pinned repository commits (e.g., Bludit 2.3.4).
  4. Verified zero `[object Object]` and zero `undefined` values.

### DEFECT-004: Premature Program Completion Claims (RESOLVED)
- **Root Cause**: Previous sprint prematurely claimed overall program success and D1–D8 completion while G3 was STANDBY_CLOUD_E2E and tests were unvalidated placeholders.
- **Remediation**:
  1. Reopened `STATUS.json` to `REMEDIATION_IN_PROGRESS` and tracked remediation transparently.
  2. Executed full Milestone M3 (Gate G0) Cloud Runtime Verification across all 8 applications sequentially on GCP VM `bewt-covext-runner`, achieving 8/8 PASS and global zero-residual verification (352s).
  3. Executed full Milestone M4 (Gate G3) Candidate E2E Execution across all 40 candidates in 8 applications in isolated Docker containers with 3 clean-state reruns per passing test (79 total container executions, 100% zero-residual teardown verified).
  4. Discovered and recorded authentic empirical findings: 11 candidates fully validated (0% flakiness over 3 clean reruns), 2 flaky (BL-GAP-001 @ 33%, JO-GAP-003 @ 67%), and 27 failed honestly due to unmet clean-container fixture preconditions.
  5. Reconciled `STATUS.json`, `BEWT-CovExt-v2-RESEARCH-REPORT.md`, `evaluation-metrics-rq1-rq4.json`, `behavioral-coverage-summary.json`, and `40-candidate-dataset.json/.csv` to clearly distinguish Gate G2 compilation from Gate G3 dynamic execution, establishing a fully evidenced empirical baseline for Team Lead review.

---

## 2. Workstream Breakdown & Parallel Execution

### Stream 1: AGENT 0 (Lead Orchestrator)
- Maintain remediation ledger and track task dependencies.
- Update `STATUS.json` and ensure single-writer integration safety on `origin/main`.
- Audit all Worker deliverables against acceptance criteria.

### Stream 2: AGENT 3 (Java/Selenium Implementation & Anti-Trivial Gate)
- Extend `validateGeneratedJavaContract` in `framework/src/runtime/model-provider.ts` to reject trivial assertions.
- Synthesize meaningful Java Selenium code for all 40 scenarios.
- Verify clean compilation with Maven on Java 21 across all 8 suites.
- Register all new test artifacts under `revision-2/` preserving `revision-1/` history.

### Stream 3: AGENT 1 (Cloud Runtime & Docker E2E Execution)
- Verify Google Cloud VM `bewt-covext-runner` and Docker daemon status.
- Conduct G0 readiness probes and Base Selenium smoke tests for target applications.
- Run corrected Selenium tests against containerized applications, capturing JUnit XML.
- Perform 3 reruns per validated test to measure flakiness.

### Stream 4: AGENT 2 (Scientific Audit & Metric Recomputation)
- Clean up `human_review_consolidation_40_candidates.md` (eliminate `[object Object]` and version mismatches).
- Re-architect `recompute-metrics.mjs` to ingest real execution outputs and fail on invalid data.
- Add automated regression tests with fault-injection cases for the metric calculator.
