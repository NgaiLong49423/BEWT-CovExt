# Coverage and Candidate Results

## Live research result

T01-C live candidate count: **0**. The single authorized Gemini Gherkin call failed with HTTP 400 `API_KEY_INVALID`, before structured output or a human-review checkpoint. Coverage gain: **NOT_EVALUATED**. Evidence: `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/`.

## Implemented offline/source-backed behavior

`framework/src/runtime/coverage-analysis.ts` compares explicit behavior IDs against baseline tags and historical proposal IDs and returns dispositions including covered, candidate gap, historical overlap, and insufficient evidence. Each result carries a behavioral category, explicit baseline comparison, conservative confidence, uncertainties, source references and rationale. It rejects incorrectly pinned or duplicate claims (`framework/test/coverage-analysis.test.ts`). The T01-C CLI verifies the pinned ExpressCart source inputs, reads the reset-token route and baseline inventory, and identifies `customer.password.reset.invalid-or-expired-token` as one candidate gap before asking Gemini (`framework/src/t01c-cli.ts`). Its source rationale is an input to review, not a novelty decision.

The provider uses a fresh generated candidate ID and requested revision; schema validation, Gherkin parsing, source references and `PROPOSED` status are enforced by `framework/src/runtime/model-provider.ts` and `contracts.ts`. `FakeGenerationProvider` outputs and the offline integration candidate exist solely to test graph behavior. They are not counted as study candidates, model output, or coverage evidence. Offline graph evidence is in `evidence/verification/rerun-20261108-final-audit-4/t01c-workflow-integration.txt`.

## Remaining limits

The current analysis is ExpressCart-only and uses a narrow source-backed claim and an explicit historical-topic list. Full ingestion of all original Gherkin/Base-test mappings and prior candidate datasets is not established. Similar names or missing baseline labels alone do not prove behavioral novelty. No independent oracle/novelty reviewer decision or candidate acceptance has been recorded.
