# T01-A — Reusable Framework Architecture and Contracts

## Scope

This task adds app-neutral TypeScript contracts and pure policy checks under `framework/`. It does not wire a LangGraph runtime, invoke Gemini, execute tools, persist checkpoints, or claim a full vertical slice. Those runtime responsibilities belong to T01-B after this contract is reviewed.

## Package boundaries

- `framework/src/contracts.ts`: application records, workflow state, fixed tool request/result types, per-run validation references, structured decisions, source/path pin checks and evidence schemas.
- `framework/src/policy.ts`: legal state transitions, human-review checkpoint policy, candidate revision policy, Java-generation approval gate, repair limit and tool authorization.
- `framework/test/contracts.test.ts`: Node test-runner tests over valid and adversarial values.
- `framework/` has no dependency on ExpressCart source, Gemini, LangGraph, Maven or Selenium. It has its own pinned TypeScript/tsx/@types tooling, build/test scripts and package lock; those versions match the existing ExpressCart agent toolchain without changing that pilot.

## Four logical roles

| Role | Contract responsibility | T01-A boundary |
|---|---|---|
| `coverage_analysis` | Read the pinned baseline inventory; emit `CoverageGap` records whose claims link to evidence. | Data contract only; no inventory adapter or LLM call. |
| `gherkin_generation` | Turn grounded gaps into versioned `CandidateScenario` records and validate syntax before review. | Candidate contract and review-state policy; no generator graph. |
| `selenium_implementation` | Generate Java only from the exact accepted candidate revision and app/source pin. | `assertCanGenerateJava` enforces the logical gate; no Java generation side effect. |
| `validation_repair` | Carry fixture, compile, E2E, oracle, cleanup, repeat and bounded-repair outcomes with provenance. | `ValidationResult` derives technical eligibility from run records and separates research acceptance; no runtime tool execution. |

Roles are responsibilities, not separate models or processes. A future graph may use role-specific nodes/services while sharing typed state and one Gemini adapter.

## Traceability and status separation

- Every manifest, candidate, validation run and decision is tied to the app/candidate revision and full source commit/version needed to compare its evidence.
- Baseline inventory distinguishes declared business-case count from measured Gherkin scenario count; they are never forced to agree.
- Evidence references carry repository commit, source version, run ID and normalized repository-relative artifact path.
- Workflow statuses exclude `VALIDATED`. `ValidationResult` identifies one overall validation `invocationId`; compile, fixture, E2E and cleanup stage records link to it and may carry a separate `stageRunId` when execution occurred. Each stage carries source commit/version pins. Executed PASS/FAIL/INCONCLUSIVE stages require stage IDs and source-pinned evidence; `NOT_RUN` carries neither, while a pre-execution `BLOCKED` stage may also have no execution evidence. These outcomes remain distinct.
- Repeat records are zero to three distinct E2E validation invocations, each with its own `invocationId` and linked compile/fixture/E2E/cleanup stages. Stages within one repeat are not counted as separate repeats. Partial records are valid and preserve the observed stopping point; only all required stages PASS across the primary invocation and exactly three complete PASS repeats can derive `technicalEligibility: ELIGIBLE`. FAIL derives `INELIGIBLE`; BLOCKED, NOT_RUN, INCONCLUSIVE, or fewer than three repeats remain `UNVERIFIED`. No synthetic run or evidence is required for unexecuted stages.
- Oracle, novelty and research acceptance are separate structured, revision-bound decisions. An ACCEPTED research decision requires technical eligibility and approved oracle/novelty decisions. The parser checks references and consistency, but evidence authenticity and reviewer identity remain runtime/research governance responsibilities; technical eligibility is not research acceptance.

## T01-A review fixes

- Root cause: `parseWorkflowState` required every ledger entry to match only the active revision, while `reviseCandidate` erased the ledger and kept the old checkpoint. The parser now accepts earlier revisions of the same run/candidate, the revision function preserves both append-only ledgers and removes the old checkpoint, and each new review must use an unused checkpoint ID.
- Root cause: the prior `ValidationResult` accepted booleans and outcome strings without run provenance. It now requires stage references, source pins, evidence paths, distinct rerun IDs, per-rerun cleanup evidence and revision-bound decisions; technical eligibility is derived independently from research acceptance.
- Final correction: requiring exactly three rerun records made it impossible to record a legitimate early stop or a partial run. `parseValidationResult` now accepts 0–3 repeat invocations and explicit `NOT_RUN`, `BLOCKED`, `FAIL`, and `INCONCLUSIVE` stage outcomes without fabricating stage evidence. A shared invocation ID groups stages; optional stage IDs/evidence identify executed stages. Duplicate repeat invocation IDs and mismatched invocation/source/evidence pins are rejected. Only three distinct complete PASS repeats plus all primary PASS stages derive eligibility. Tests cover partial runs, E2E failure without synthetic repeats, one/two-repeat ineligibility, three-repeat source/evidence pins, duplicate invocations, stage linkage, and acceptance separation.
- Root cause: `run-selenium-test` accepted an unbound class string. Its request now names the generated artifact path and class and policy checks an exact `generated_java` artifact record for the approved candidate revision.
- Root cause: TypeScript commands depended on ExpressCart's installed `node_modules`. `framework/package.json` now owns pinned build/test tools and scripts, with `framework/package-lock.json` and isolated local type resolution.

## Extension seam

The application adapter is described in `APP-ADAPTER-CONTRACT.md`. Runtime graph composition, persistent checkpointer selection, model providers and concrete side-effect implementations are deferred to T01-B.
