# Coverage and Candidate Results

## Live research result

T01-C live candidate count: **0**. Two explicitly authorized Gemini Gherkin invocations returned no structured output: the earlier call failed with HTTP 400 `API_KEY_INVALID`; the later bounded call failed at fetch with `PROVIDER_ERROR`. Three intervening over-budget preflights were rejected locally with zero provider calls. No human-review checkpoint was reached. Coverage gain: **NOT_EVALUATED**. Evidence: `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/` and `evidence/t01c-36e40937-21b7-4f57-a8c3-5d24a2c10aca/`.

## Implemented offline/source-backed behavior

`framework/src/runtime/coverage-analysis.ts` compares explicit behavior IDs against baseline tags and historical proposal IDs and returns dispositions including covered, candidate gap, historical overlap, and insufficient evidence. Each result carries a behavioral category, explicit baseline comparison, conservative confidence, uncertainties, source references and rationale. It rejects incorrectly pinned or duplicate claims (`framework/test/coverage-analysis.test.ts`). Historical candidate behavior IDs and linked Sprint 02–05 sources are loaded and validated from `data/coverage/expresscart/historical-candidate-behavior-index.json` by `adapters/expresscart/historical-behavior-index.ts`; tests confirm all five IDs, source files, duplicate rejection and source-root restrictions. The T01-C CLI verifies the pinned ExpressCart source inputs, reads the reset-token route and baseline inventory, and identifies `customer.password.reset.invalid-or-expired-token` as one candidate gap before asking Gemini (`framework/src/t01c-cli.ts`). Its source rationale is an input to review, not a novelty decision.

The provider uses a fresh generated candidate ID and requested revision; schema validation, Gherkin parsing, source references and `PROPOSED` status are enforced by `framework/src/runtime/model-provider.ts` and `contracts.ts`. `FakeGenerationProvider` outputs and the offline integration candidate exist solely to test graph behavior. They are not counted as study candidates, model output, or coverage evidence. Offline graph evidence is in `evidence/verification/rerun-20261108-final-audit-5/t01c-workflow-integration.txt`.

## Remaining limits

The current analysis is ExpressCart-only and uses one narrow source-backed claim, the pinned Sprint 01 sanitized feature/test inventory, and the five explicit candidate behaviors from Sprints 02–05. The historical index is traceability/overlap input, not full semantic ingestion of every original Gherkin/Base-test relation or proof of behavioral novelty. Similar names or missing baseline labels alone do not establish a gap. No independent oracle/novelty reviewer decision or candidate acceptance has been recorded.
