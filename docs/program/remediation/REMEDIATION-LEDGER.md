# BEWT-CovExt v2.0 — Remediation Issue Ledger

**Program**: BEWT-CovExt v2.0 (8 Applications, 40 Test Candidates)  
**Reopened Date**: 2026-11-10  
**Audited Reference Commit**: `a11b46e4d05a9dc7f8631e154d8d2db937d6ac28`  
**Orchestrator**: AGENT 0 (Lead Orchestrator & Single Writer to `main`)  
**Mode**: `REMEDIATION_REQUIRED | REAL_MULTI_AGENT_EXECUTION | NO_FALSE_COMPLETION`

---

## 1. Remediation Defect Matrix

| Defect ID | Severity | Category | Owner | Affected Artifacts | Required Fix | Verification Gate |
|---|:---:|---|---|---|---|:---:|
| **DEFECT-001** | `P0_CRITICAL` | Code Quality & Semantics | **AGENT 3** | All 40 generated Java test classes (`extension/*/selenium/`) | 1. Implement anti-trivial static gate rejecting `currentUrl.length() >= 0`, `driver != null`, generic body checks.<br/>2. Re-implement all 40 tests with actual Given/When/Then Selenium interactions and domain assertions.<br/>3. Register as immutable `revision-2`. | **G2** |
| **DEFECT-002** | `P1_HIGH` | Scientific Metrics | **AGENT 2** | `recompute-metrics.mjs`, `evaluation-metrics-rq1-rq4.json` | 1. Parse Gherkin AST.<br/>2. Separate baseline (180), proposed (40), approved (40), implemented, and E2E-validated units.<br/>3. Parse real JUnit XML/logs.<br/>4. Use measured model token telemetry.<br/>5. Build negative-control fault injection tests. | **G4** |
| **DEFECT-003** | `P1_HIGH` | Review Dossier | **AGENT 2** | `human_review_consolidation_40_candidates.md` | Reconcile all 40 candidates against pinned benchmark sources, fix `[object Object]` oracles, correct application versions (e.g. Bludit 2.3.4) and baseline UBU counts. | **G1** |
| **DEFECT-004** | `P0_CRITICAL` | Status & Governance | **AGENT 0** | `STATUS.json`, `BEWT-CovExt-v2-RESEARCH-REPORT.md` | Reopen `STATUS.json` to `REMEDIATION_IN_PROGRESS`, distinguish compile success from E2E validation, and state limitations honestly. | **G0–G4 / D1–D8** |

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
