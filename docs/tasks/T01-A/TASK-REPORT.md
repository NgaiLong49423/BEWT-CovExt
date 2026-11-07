# T01-A — Reusable Framework Contracts

- Task scope / acceptance gate: implement app-neutral TypeScript contracts and tested pure policies; document architecture, checkpoint/tool security and T01-B handoff. No LangGraph runtime workflow. Proposed status: `READY_FOR_REVIEW`; Team Lead decision pending.
- Base branch + base SHA: `main` / `a5d8c5f0a812c7be1e458da7a192a5de31821898` (T00 PR #1 merge commit).
- Working branch: `feature/t01a-framework-contract`.
- Implementation commit (full SHA): `6586476a8eb9d0b22cb942dccbed22b070a891b5`.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/2 (open, awaiting review).
- Push status: branch push succeeded; remote verification pending.
- Runtime/commit/version tested: Node `v24.19.0`, existing TypeScript/tsx toolchain, LangGraph `1.6.0` declaration inspection, Maven `3.9.16` / Java `21.0.12` effective-POM query. No app runtime, Gemini call, Docker, or Maven build run.
- Status proposed by Agent: `READY_FOR_REVIEW`; no G2 or D1 acceptance claimed.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `framework/package.json` | Added ESM package boundary without new runtime dependencies | Keep shared contracts outside the ExpressCart pilot. |
| `framework/tsconfig.json` | Added strict no-emit type-check configuration | Type-check shared source/tests with the existing toolchain. |
| `framework/src/contracts.ts` | Added runtime contracts/parsers for app manifests, inventories, gaps, candidates, review decisions, workflow state, tool requests/results, evidence and validation | Preserve source pins, provenance and app-neutral boundaries. |
| `framework/src/policy.ts` | Added transition, checkpoint reference, revision, review gate, repair limit and tool authorization policies | Make critical decisions executable and testable before runtime wiring. |
| `framework/test/contracts.test.ts` | Added 15 Node unit tests | Cover schemas, adapter contract, gates, replay/session binding, allowlist/path/ownership, repair limits, evidence and sanitization. |
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

See `TEST-RESULTS.md` and `evidence/`. TypeScript build passed and 15/15 focused unit tests passed. Effective Maven POM reports compiler plugin source/target 1.8 for both main and test compilation. No Maven build was run; the POM was not changed.

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
- Final PR head SHA: pending remote verification.
