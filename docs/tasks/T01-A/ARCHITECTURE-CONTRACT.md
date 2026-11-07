# T01-A — Reusable Framework Architecture and Contracts

## Scope

This task adds app-neutral TypeScript contracts and pure policy checks under `framework/`. It does not wire a LangGraph runtime, invoke Gemini, execute tools, persist checkpoints, or claim a full vertical slice. Those runtime responsibilities belong to T01-B after this contract is reviewed.

## Package boundaries

- `framework/src/contracts.ts`: application records, workflow state, fixed tool request/result types, runtime parsers, source/path pin checks, outcome and evidence schemas.
- `framework/src/policy.ts`: legal state transitions, human-review checkpoint policy, candidate revision policy, Java-generation approval gate, repair limit and tool authorization.
- `framework/test/contracts.test.ts`: Node test-runner tests over valid and adversarial values.
- `framework/` has no dependency on ExpressCart source, Gemini, LangGraph, Maven or Selenium. It currently borrows the repository's installed TypeScript/tsx toolchain for local validation; T01-B should give the extracted framework a first-class toolchain if needed.

## Four logical roles

| Role | Contract responsibility | T01-A boundary |
|---|---|---|
| `coverage_analysis` | Read the pinned baseline inventory; emit `CoverageGap` records whose claims link to evidence. | Data contract only; no inventory adapter or LLM call. |
| `gherkin_generation` | Turn grounded gaps into versioned `CandidateScenario` records and validate syntax before review. | Candidate contract and review-state policy; no generator graph. |
| `selenium_implementation` | Generate Java only from the exact accepted candidate revision and app/source pin. | `assertCanGenerateJava` enforces the logical gate; no Java generation side effect. |
| `validation_repair` | Carry fixture, compile, E2E, oracle, cleanup, repeat and bounded-repair outcomes with provenance. | `ValidationResult` and `researchStatus` checks; no runtime tool execution. |

Roles are responsibilities, not separate models or processes. A future graph may use role-specific nodes/services while sharing typed state and one Gemini adapter.

## Traceability and status separation

- Every manifest and candidate is tied to a full source commit and version.
- Baseline inventory distinguishes declared business-case count from measured Gherkin scenario count; they are never forced to agree.
- Evidence references carry repository commit, source version, run ID and normalized repository-relative artifact path.
- Workflow statuses exclude `VALIDATED`. Only `ValidationResult.researchStatus` can carry `VALIDATED`, and its parser requires novelty/oracle approval, successful compile/fixture/E2E/oracle/cleanup, three passing repeats and evidence on the pinned source/version.

## Extension seam

The application adapter is described in `APP-ADAPTER-CONTRACT.md`. Runtime graph composition, persistent checkpointer selection, model providers and concrete side-effect implementations are deferred to T01-B.
