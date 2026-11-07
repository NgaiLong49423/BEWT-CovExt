# Source Reuse and Gaps

## Reused

- `framework/src/runtime/workflow.ts`: shared LangGraph role nodes, SQLite checkpointing, human-review interrupt, revision loop, and max-two repair policy.
- `framework/src/policy.ts` and `framework/src/contracts.ts`: candidate/review/source pin validation, registered-artifact tool binding, and validation contracts.
- `framework/src/runtime/tool-dispatcher.ts`, `safe-path.ts`, `maven-command.ts`, and `process.ts`: fixed tool dispatch and path/process boundaries.
- `adapters/expresscart/experiment.ts`: isolated Compose ownership, invocation recovery, fixture preparation/cleanup and run evidence. This remains ExpressCart-specific.
- `experiments/expresscart/agent/src/sprint03-generator.ts` and `sprint03-langgraph-repair.ts`: historical patterns only; not used as a parallel runtime.

## Observed gaps

- `framework/src/cli.ts` still pins `candidateFeaturePath` to Sprint 02 EC-C04, constructs one fixed gap and candidate ID, and labels historical Gherkin as reused.
- `adapters/expresscart/experiment.ts` still maps EC-C04 to `tests.ForgottenPasswordTest`; `prepareJava()` reuses a historical artifact and verifies it against the historic feature.
- `framework/src/runtime/gemini-candidate-provider.ts` only produces candidate metadata and has no Java generation, bounded call policy, or complete telemetry.
- `framework/src/runtime/coverage-analysis.ts` compares explicit source behavior IDs with baseline tags and historical proposal IDs. It is tested but not wired to actual source readers or the shared graph.
- The new `framework/src/runtime/model-provider.ts` defines a provider boundary, structured Gherkin/Java response, deterministic synthetic provider, and explicit authorization guard, but is not yet connected to CLI or artifact registration.

## Evidence limits

Static source inspection supports the findings above. No actual Gemini request or new generated artifact was produced. Historical ExpressCart evidence remains historical and is not evidence for T01-C generation.
