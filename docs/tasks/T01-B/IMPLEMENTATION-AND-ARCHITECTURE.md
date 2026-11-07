# T01-B Implementation and Architecture

## Shared runtime

- [`framework/src/runtime/workflow.ts`](../../../framework/src/runtime/workflow.ts) builds the reusable LangGraph graph with `coverage_analysis`, `gherkin_generation`, `human_review`, `selenium_implementation`, `validation_repair`, and `evidence_recording` nodes. Typed `RuntimeServices` isolate application effects from shared orchestration.
- [`framework/src/cli.ts`](../../../framework/src/cli.ts) starts a thread, prints the candidate/review packet, and resumes through a checkpoint-bound command. `trustedReviewerId` is derived from the OS principal; callers cannot provide the reviewer ID.
- [`@langchain/langgraph-checkpoint-sqlite`](../../../framework/package.json) stores local checkpoints under ignored `.local-state/`; the subprocess restart test proves a second Node process resumes a real interrupted graph.
- [`framework/src/runtime/gemini-candidate-provider.ts`](../../../framework/src/runtime/gemini-candidate-provider.ts) provides opt-in structured Gemini candidate generation. This task made 0 live model calls; historical candidate and Java artifacts were reused.

## Tool boundary and ExpressCart adapter

- [`framework/src/runtime/tool-dispatcher.ts`](../../../framework/src/runtime/tool-dispatcher.ts) validates each fixed tool request, app manifest/source pin, workflow authorization and candidate/artifact binding before dispatch.
- [`framework/src/runtime/safe-path.ts`](../../../framework/src/runtime/safe-path.ts) performs realpath containment checks and rejects traversal/junction escapes before filesystem access.
- [`framework/src/runtime/maven-command.ts`](../../../framework/src/runtime/maven-command.ts) builds fixed Maven argument arrays and pins the selected browser/driver into the Maven test JVM environment. No model-provided shell command or Maven selector is accepted.
- [`adapters/expresscart/experiment.ts`](../../../adapters/expresscart/experiment.ts) supplies baseline mapping, source/context/image checks, local Compose fixture setup, absent-customer preflight, Maven/JUnit invocation, version-matched browser/driver selection, and exact Compose-label cleanup. The adapter returns stage outcomes and references; it does not create repeat runs or research approval.
- [`config/apps/expresscart.json`](../../../config/apps/expresscart.json) binds app ID, pinned suite, source context and observed local image IDs. Those IDs are not registry digests.
- [`framework/src/runtime/gherkin.ts`](../../../framework/src/runtime/gherkin.ts) parses candidates and compares normalized Gherkin while ignoring comment-only review annotations; behavior steps remain exact.

## Known limits

The successful EC-C04 class is a reused artifact (`REUSED`, SHA-256 `931f410f43dbca59cd7d341ea3822c70124dd8ad2b00ea3377c45dfb9c7a7b80`), not generated/repaired output. The actual run has 0/3 repeats, oracle and novelty `UNVERIFIED`, research acceptance `NOT_REVIEWED`, so technical eligibility is also `UNVERIFIED`. No live Gemini tokens/model ID are available because no Gemini call occurred.

The run-specific Compose project was cleaned by ownership labels. A read-only host listing confirmed the separate pre-existing project remained running. No Docker/app source/Java test/POM/original BEWT/historical evidence was changed.
