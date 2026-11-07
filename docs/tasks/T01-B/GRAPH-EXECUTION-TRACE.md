# Graph Execution Trace

The shared graph is constructed in [`framework/src/runtime/workflow.ts`](../../../framework/src/runtime/workflow.ts). Deterministic integration tests exercise node ordering, conditional routing, review gates, repair bounds, and process restart in [`workflow.test.ts`](../../../framework/test/integration/workflow.test.ts). The real CLI evidence is run `t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf`.

## Runtime route

`coverage_analysis → gherkin_generation → prepare_review → human_review (interrupt)`

`REVISE → gherkin_generation → prepare_review → human_review (fresh checkpoint)`

`ACCEPT → selenium_implementation → validation_repair → evidence_recording → EXECUTION_COMPLETED`

`REJECT → END`; acceptance is tied to the pending run/thread/checkpoint/candidate revision and is single-use. The accepted final invocation recorded `coverage_analysis` and `gherkin_generation` PASS, then reused the mapped Java class only after current checkpoint approval. Compile, fixture, Selenium and cleanup all passed.

## Actual run and prior attempts

- `t01b-c70f61b1-c399-49fe-bf57-095569f5d52d`: failed closed before Java due newline-only Gherkin comparison.
- `t01b-08ed746f-a703-4ba5-be89-83c2aaa348e3`: reviewer chose REVISE for revision 1; append-only ledger created revision 2 and checkpoint `0e67f0bf-7629-4c1f-9a90-7f17a57b94d4`. Its later ACCEPT was bound to that new checkpoint, then failed closed because review-only comment text differed from historical source. No compile/fixture/Selenium ran.
- `t01b-f1ea3e1d-2e6a-4e63-b93f-cdc7ac2a85ce`: earlier runtime attempt compiled but Docker fixture was blocked in sandbox.
- `t01b-5b08bbdc-185f-4b14-ace5-aca2067f17c0`: fixture passed, Selenium session setup was blocked by Chrome/driver mismatch; cleanup passed.
- `t01b-e673523b-e845-4fe4-8d32-7c8d766ec70f`: fixture passed, driver 127 was selected while ChromeDriver launched installed Chrome 156; E2E correctly classified BLOCKED and cleanup passed.
- `t01b-c2e4e180-091b-440f-a85f-ee3996237e8d`: same mismatch after first browser pin attempt; E2E BLOCKED; cleanup passed.
- Final successful run `t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf` used matching installed Chrome 156 and cached ChromeDriver 156. Its structured timeline and evidence are in that run folder.

The successful workflow records no repeat invocations and no Gemini invocation. It does not claim `VALIDATED` or research acceptance.
