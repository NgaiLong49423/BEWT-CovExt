# T01-C — Model-Backed Gherkin and Generated Java Pipeline

## Status

**BLOCKED: live model credential and runtime verification are unresolved.** The one explicitly authorized Gemini Gherkin request returned HTTP 400 `API_KEY_INVALID`; the request allowance was consumed, with no retry. A code-backed offline path now reaches actual isolated Maven compilation using synthetic test output. This is implementation evidence, not a live study result. No G2, D1, or VALIDATED claim is made, and T02 has not started.

## Implemented

- LangGraph T01-C CLI wires pinned coverage analysis, Gemini Gherkin generation, human review, post-ACCEPT Java generation, registry, adapter compile/fixture/Selenium/cleanup, and structured validation: `framework/src/t01c-cli.ts`, `framework/src/runtime/workflow.ts`, `framework/src/runtime/model-provider.ts`. Review packets include persisted coverage gaps; REVISE emits a fresh packet bound to the new revision/checkpoint.
- Source-backed coverage analysis is in `framework/src/runtime/coverage-analysis.ts`; ExpressCart pinned-source identity is checked through `adapters/expresscart/source-identity.ts` and manifest `config/apps/expresscart.json`.
- Historical overlap inputs are indexed in `data/coverage/expresscart/` and source-linked to Sprint 02–05 records; `framework/test/historical-behavior-index.test.ts` verifies all five mappings, source existence and rejection of duplicate IDs/out-of-sprint paths. Baseline comparison remains exact-tag only and does not prove novelty.
- Coverage evidence now records behavioral category, exact-tag baseline comparison, conservative candidate confidence, uncertainty, source references and rationale. The review CLI includes that persisted evidence, and emits a fresh revision/checkpoint-bound packet after REVISE.
- Generated class identity and immutable registration are implemented in `framework/src/runtime/java-class.ts` and `framework/src/runtime/java-artifact-registry.ts`. Registration is tied to current accepted candidate/revision/source and uses exclusive creation.
- The generated-test harness (`adapters/expresscart/generated-test-harness.ts`) copies the Maven manifest, existing `PageObject` base, source-grounded `CustomerPasswordResetPage`, approved `BaseTest`, and exact registered generated class into an isolated workspace. Adapter compile and Selenium methods are in `adapters/expresscart/experiment.ts`.
- Validation distinctions and provenance are represented by `parseValidationResult` in `framework/src/contracts.ts`; technical eligibility is separate from oracle/novelty and research acceptance.
- The model run ledger in `framework/src/runtime/model-call-ledger.ts` is append-only and fail-closed across retries/restarts; unit tests verify exhausted budgets remain consumed after restart. The CLI requires explicit live authorization flags. No model API was called in this continuation.

## Root cause and live request

The initial live attempt was rejected before invocation by automatic review. The user then explicitly authorized one bounded request with pinned source/baseline/research payload (8,000 prompt characters, 2,000 output tokens, <=60 seconds, <=$0.02, no retries). Gemini returned `API_KEY_INVALID`; original evidence remains at `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/`. A later classifier regression had mistaken `generateContent` for rate limiting; `framework/src/runtime/model-provider.ts` now uses bounded patterns and `framework/test/model-provider.test.ts` covers this. No live Java request was made. Any further external model request requires fresh authorization and a valid local credential.

## Verification and limits

- `npm ci`: PASS; `npm run build`: PASS; `npm test`: PASS, 37/37. Latest build/unit logs: `evidence/verification/rerun-20261108-final-audit-5/`.
- ExpressCart Agent `npm test`: PASS, 5/5 (`evidence/verification/rerun-20261108-final-audit-4/expresscart-agent-unit.txt`).
- Focused offline T01-C and shared workflow integration: PASS, 7/7, covering pause-before-effects, fake Java after test approval, actual Maven compile, REVISE/new checkpoint/ACCEPT, REJECT, replay protection, two repairs, and process restart. Log: `evidence/verification/rerun-20261108-final-audit-5/t01c-workflow-integration.txt`; latest Maven compile: `evidence/t01c-offline-approved-e95ab9ae-40bc-4ff6-8d4e-cb895614e362/isolated-maven-compile.json`.
- Full framework integration suite last captured 12 PASS / 4 FAIL / 1 SKIP: three symlink tests hit sandbox `EPERM`; ExpressCart lifecycle was BLOCKED on unavailable Docker/runtime; crash/replay remained skipped. Evidence: `evidence/verification/rerun-20261108/framework-integration.txt`.


No live candidate/checkpoint, Selenium, fixture mutation, cleanup proof, live bounded repair, three-repeat validation, or research decision exists. Offline bounded repair and revision/reject/replay behaviors pass in shared-workflow tests. No baseline reset-token Page Object existed; a source-grounded adapter Page Object is now staged by the isolated harness and still awaits a real Gemini Java call and Selenium run. Runtime filesystem adversarial realpath/symlink behavior remains unverified under this sandbox. Historical EC-C04 reuse remains separate from the generated-artifact path. See `SOURCE-REUSE-AND-GAPS.md`, `COVERAGE-AND-CANDIDATE-RESULTS.md`, `HUMAN-REVIEW-RESULTS.md`, `GENERATED-JAVA-RESULTS.md`, `VALIDATION-AND-REPAIR-RESULTS.md`, and `TEST-RESULTS.md`.

## Scope and handoff

Program scope remains eight applications and target 40 new test cases. `bewt-original/`, Docker files, ExpressCart application source, and historical Sprint 01–05 raw evidence were not intentionally modified. T01-B evidence directories were preserved and not staged. The existing draft PR #4 remains the handoff target; this task does not self-accept gates or start T02.
