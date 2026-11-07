# T01-A — Reusable Framework Contracts

- Task scope / acceptance gate: implement app-neutral TypeScript contracts and tested pure policies; document architecture, checkpoint/tool security and T01-B handoff. No LangGraph runtime workflow. Proposed status: `READY_FOR_REVIEW`; Team Lead decision pending.
- Base branch + base SHA: `main` / `a5d8c5f0a812c7be1e458da7a192a5de31821898` (T00 PR #1 merge commit).
- Working branch: `feature/t01a-framework-contract`.
- Initial implementation commit (full SHA): `6586476a8eb9d0b22cb942dccbed22b070a891b5`.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/2 (open, awaiting review).
- Push status: initial branch push succeeded; this report records the T01-A review-fix update for the same PR #2.
- Runtime/commit/version tested: Node `v24.19.0`; framework-local TypeScript `7.0.2`, tsx `4.23.15`, @types/node `26.6.6`; LangGraph `1.6.0` declaration inspection; Maven `3.9.16` / Java `21.0.12` effective-POM query. No app runtime, Gemini call, Docker, or Maven build run.
- Status proposed by Agent: `READY_FOR_REVIEW`; no G2 or D1 acceptance claimed.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `framework/package.json` | Added ESM package boundary without new runtime dependencies | Keep shared contracts outside the ExpressCart pilot. |
| `framework/tsconfig.json` | Added strict no-emit type-check configuration | Type-check shared source/tests against framework-local Node types. |
| `framework/src/contracts.ts` | Added runtime contracts/parsers for app manifests, inventories, gaps, candidates, review decisions, workflow state, tool requests/results, evidence and validation | Preserve source pins, provenance and app-neutral boundaries. |
| `framework/src/policy.ts` | Added transition, checkpoint reference, revision, review gate, repair limit and tool authorization policies | Make critical decisions executable and testable before runtime wiring. |
| `framework/test/contracts.test.ts` | Initially added 15 tests; expanded to 18 after review | Cover contracts, approval history, artifact binding, validation provenance, repair limits and sanitization. |
| `docs/tasks/T01-A/ARCHITECTURE-CONTRACT.md` | Documented roles and architecture boundary | Make the contract reviewable. |
| `docs/tasks/T01-A/EXISTING-CODE-REUSE-MATRIX.md` | Classified current code using all five required categories | Map reuse/adaptation and missing capabilities to actual symbols/files. |
| `docs/tasks/T01-A/STATE-AND-CHECKPOINT-DESIGN.md` | Documented transitions and LangGraph checkpoint design/limits | Distinguish design from tested crash recovery. |
| `docs/tasks/T01-A/TOOL-ALLOWLIST-AND-SECURITY.md` | Documented fixed tools and enforcement | Define the T01-B execution boundary. |
| `docs/tasks/T01-A/APP-ADAPTER-CONTRACT.md` | Added generic adapter interface and invariants | Avoid ExpressCart-specific framework logic. |
| `docs/tasks/T01-A/JAVA-COMPATIBILITY-DECISION.md` | Recorded effective Maven compiler config and no-change decision | Resolve Java 21 vs 1.8 precedence with evidence. |
| `docs/tasks/T01-A/T01-B-IMPLEMENTATION-PLAN.md` | Added a bounded vertical-slice sequence and exit evidence | Define next work while stopping at review gate. |
| `docs/tasks/T01-A/TEST-RESULTS.md` | Recorded commands/results/limits | Make verification reproducible and scoped. |
| `docs/tasks/T01-A/evidence/typescript-build.log` | Typecheck command/version/exit evidence | Build evidence. |
| `docs/tasks/T01-A/evidence/contracts-tests.tap` | Node TAP output for all 15 tests | Unit-test evidence. |
| `docs/tasks/T01-A/evidence/maven-effective-compiler-plugin.xml` | Valid XML with effective compiler plugin configuration | Java compatibility evidence. |
| `docs/tasks/T01-A/evidence/maven-effective-pom-command.txt` | Maven/JDK versions and exact effective-POM command | Reproduction metadata. |
| `docs/program/STATUS.json` | Refreshed merge SHA and recorded locally tested contracts, without accepting gates | Reflect new verified progress. |
| `docs/tasks/T00/REPO-STATE-AND-GAPS.md` | Removed stray literal `\n` at EOF | Fix a formatting artifact still on merged `main`. |
| `docs/tasks/T00/NEXT-TASK-PLAN.md` | Removed the second stray literal `\n` at EOF | Fix the other T00 formatting artifact on merged `main`. |

## 2. Actual verification

The initial T01-A baseline passed its TypeScript build and 15/15 focused tests. Current review-fix verification, including the complete 18-test framework suite and five existing ExpressCart Agent tests, is recorded in `TEST-RESULTS.md` and the new `evidence/review-fixes-*` files. The effective Maven POM reports compiler plugin source/target 1.8 for both main and test compilation. No Maven build was run; the POM was not changed.

## 3. Research impact

- The scope remains all eight BEWT apps and the 40-case target. T01-A adds contracts/policies only.
- No candidate, runtime, RQ measurement, G0–G4 gate or D1–D8 acceptance changed.
- The reusable graph, checkpoint/resume and runtime dispatcher remain `NOT_VERIFIED`; contract/policy code is `IMPLEMENTED_LOCAL_TESTED_NOT_REVIEWED`.
- RQ1–RQ4 and ExpressCart evidence remain unchanged. No full E2E or crash-recovery claim is made.

## 4. Safety and integrity

- `bewt-original/` touched: NO.
- Docker/application resources touched: NONE.
- Sprint 01–05 raw evidence touched: NO.
- ExpressCart pilot source, tests and manifests: unchanged.
- POM: unchanged.
- Secret scan and staged diff review: PASS; only Task T01-A paths plus the two T00 EOF corrections were staged. The unrelated untracked `experiments/expresscart/bewt-suite/docs/` directory was preserved and excluded.

## 5. Evidence and limitations

- Existing source map: `EXISTING-CODE-REUSE-MATRIX.md` (includes `workflow.ts`, `collector.ts`, `schema.ts`, `validate.ts`, `sprint03-generator.ts` and four repair scripts).
- New implementation/test: `framework/src/contracts.ts`, `framework/src/policy.ts`, `framework/test/contracts.test.ts`.
- LangGraph declarations inspected: installed 1.6.0 `interrupt.d.ts` and `graph/state.d.ts`. T01-A did not run a graph/saver.
- Reviewer ID authentication is not implemented; host review service authentication and durable storage are T01-B requirements.
- Tool path checks are lexical; actual dispatcher must resolve real paths immediately before filesystem access.

## 6. Review request

- Review contract types, state/review gates and app adapter boundary.
- Approve checkpoint backend, particularly durable production storage versus test-only `MemorySaver`.
- Decide Java compatibility as recorded in `JAVA-COMPATIBILITY-DECISION.md`.
- Review T01-B scope in `T01-B-IMPLEMENTATION-PLAN.md`. Do not start T01-B or T02 before this PR is reviewed.
- Remote verification snapshot: branch and PR head matched `b96e28abe7414da274a4150028d8e8eeb8439c99` before this final report metadata update; the final head after it is verified in the task handoff.

## 7. T01-A review fixes (REQUEST CHANGES)

Review was against HEAD `7072ec772b7bec68cb4c92b0d50e6b712bf53b6b`. The fixes stay on `feature/t01a-framework-contract` and update PR #2; they do not start T01-B.

| Root cause | Corrected behavior | Verification |
|---|---|---|
| `parseWorkflowState` rejected historical decisions for older revisions; `reviseCandidate` cleared decision history and retained the old checkpoint. | Preserve append-only decisions/applied IDs, accept only ledger entries for this run/app/candidate and revisions up to current; clear checkpoint during revision; require a fresh checkpoint and prevent an earlier revision's checkpoint from being reused; only current revision ACCEPT authorizes Java generation. | Tests execute two REVISE rounds then ACCEPT, assert all three decisions survive, reject stale revision/checkpoint/replay, and reject generation using an older revision. |
| `parseValidationResult` trusted `noveltyAndOracleApproved`, flat PASS values and three PASS strings without provenance. | Replace with stage `ExecutionReference`s, revision-bound reviewer decision records, distinct run IDs, source pins, per-stage evidence paths, three distinct rerun records, and per-rerun fixture-reset and cleanup evidence. Derive `technicalEligibility` separately from `researchAcceptance`, including `UNVERIFIED`; remove caller-settable `researchStatus: VALIDATED`. | Tests reject missing, duplicate, stale, wrong-source/run, mismatched-decision and missing reset/cleanup evidence; accept only a structured research approval when technical/oracle/novelty criteria are eligible. |
| Selenium tool request accepted a free-form class string not tied to generated output. | Validate fully qualified Java class syntax; require request class/path to match a host-registered generated artifact bound to the approved candidate ID/revision. Compile/Selenium project path must equal manifest `baseSuitePath`; no shell command or Maven selector is accepted. | Tests cover invalid class strings, unregistered classes/paths, mismatched artifact/project/revisions and request revision mismatch. |
| Framework typecheck/tests reached into ExpressCart's `node_modules`. | Add framework-local scripts and pinned dev dependencies matching the existing agent versions, a lockfile, and framework-local type roots. | `npm ci`, `npm run build`, and `npm test` from `framework/`; all prior ExpressCart Agent unit tests also pass. |

Additional review-fix files: `framework/package-lock.json`; evidence in `docs/tasks/T01-A/evidence/review-fixes-npm-ci.log`, `review-fixes-build.log`, `review-fixes-tests.log`, and `review-fixes-existing-agent-tests.log`. Original T01-A evidence files were not overwritten.

Runtime limits remain: reviewer authentication, evidence file/content verification, class-to-source correspondence, filesystem realpath/symlink containment, actual dispatcher, LangGraph durable checkpoint/resume, Docker ownership and E2E were not executed. These are explicit T01-B acceptance blockers. No `bewt-original/`, pilot source, Sprint 01–05 evidence or Docker resources were changed; G2 and D1 remain unaccepted.

## 8. Final ValidationResult contract correction (REQUEST CHANGES follow-up)

The review found that requiring exactly three repeat records prevented honest records for runs that had not reached E2E, failed compilation, blocked fixture setup, failed E2E, or stopped after one/two repeats. It also left invocation grouping ambiguous when a single run has compile, fixture, E2E and cleanup stages. `framework/src/contracts.ts` now groups each stage under an `invocationId`, optionally identifies executed stages with `stageRunId`, permits zero to three distinct repeat invocations, and preserves NOT_RUN/BLOCKED/FAIL/INCONCLUSIVE distinctly. NOT_RUN cannot carry fabricated execution IDs/evidence. Eligibility is derived only when primary stages and three distinct repeat invocations all pass with consistent source pins and evidence. Research acceptance still requires technical eligibility and cannot override it.

Regression coverage is in `framework/test/contracts.test.ts`: partial NOT_RUN/BLOCKED, compile and E2E FAIL, INCONCLUSIVE, 0/1/2 repeat non-eligibility, valid 3/3 source-pinned repeats, duplicate invocation rejection, grouped stage IDs, evidence binding, and research acceptance guard. Verification: framework build PASS; framework suite 20/20 PASS (prior 18 retained); existing ExpressCart Agent suite 5/5 PASS. New logs are `evidence/final-corrections-npm-ci.log` (sandbox network failure, retained as an attempt record), `evidence/final-corrections-npm-ci-retry.log`, `evidence/final-corrections-build.log`, `evidence/final-corrections-tests.log`, and `evidence/final-corrections-existing-agent-tests.log`.

Runtime execution, evidence authenticity/content validation, reset/cleanup behavior, and real E2E remain unproven; these corrections define the runtime record contract only and feed directly into T01-B. This follow-up does not self-accept G2 or D1, does not modify Docker, ExpressCart pilot source, `bewt-original/`, or historical Sprint 01–05 evidence, and stops at the T01-A review gate.
