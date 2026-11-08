# Generated Java Results

## Result

The T01-C code now has a candidate-bound Java generation contract, an explicitly synthetic Java provider for offline verification, an opt-in Gemini Java provider, an immutable generated-artifact registry, and an isolated ExpressCart Maven harness. These are implementation capabilities; they do not establish a live model-generated study artifact or research acceptance.

`framework/src/runtime/java-class.ts` derives the class identity from candidate ID/revision. `framework/src/runtime/java-artifact-registry.ts` validates current ACCEPT, candidate/revision/source binding, package `tests`, `BaseTest`/JUnit shape, source-specific Page Object use and artifact hash, and writes artifact/registration with exclusive-create semantics. `framework/src/runtime/model-provider.ts` contains `FakeJavaGenerationProvider` and the explicit-authorized `GeminiJavaGenerationProvider`. `adapters/expresscart/generated-test-harness.ts` stages the POM, existing `PageObject` base, source-grounded `CustomerPasswordResetPage`, `BaseTest`, and exact registered class into an isolated workspace; `adapters/expresscart/experiment.ts` exposes generated compile and Selenium operations.

The latest offline approved-pipeline integration test used a test-only ACCEPT and fake Java output, then ran Maven `test-compile` in a temporary isolated workspace including the approved page-object files. Evidence: `evidence/t01c-offline-approved-7ee36e93-3bfa-4258-9954-275c51ccbbc9/isolated-maven-compile.json`. This establishes offline harness compilation only. The temporary artifact was not a Gemini output and was not retained as a study candidate.

Two explicitly authorized Gemini requests were attempted for Gherkin generation and returned no content: one returned HTTP 400 `API_KEY_INVALID`; a later request passed preflight but failed at fetch (`PROVIDER_ERROR`). Neither was retried. No live candidate or review checkpoint exists. No Java Gemini call, live fixture, Selenium run, cleanup validation, or research acceptance has occurred. The request allowance is exhausted; any later externally transmitted model run requires fresh authorization and a verified provider/network path.

## Verification

- `framework/test/java-artifact-registry.test.ts`: immutable registration, candidate/revision binding and approval policy.
- `framework/test/expresscart-generated-harness.test.ts`: isolated workspace contents and selector binding.
- `framework/test/integration/t01c-offline-approved-java-pipeline.test.ts`: offline graph-to-compile path, plus NOT_RUN/research-not-reviewed states.
- Latest observed framework unit run: 38/38 PASS; build PASS. Focused workflow/offline integration: 6/6 PASS; the earlier broader focused suite was 7/7 PASS, including actual Maven `test-compile` PASS. Logs: `evidence/verification/rerun-20261108-request-evidence/` and `evidence/verification/rerun-20261108-final-audit-5/`; latest compile evidence: `evidence/t01c-offline-approved-7ee36e93-3bfa-4258-9954-275c51ccbbc9/isolated-maven-compile.json`.

The full framework integration suite remains non-green (12 pass / 4 fail / 1 skip in its last captured managed-sandbox run). The three filesystem-only symlink checks were rerun outside the sandbox and passed 3/3; the Docker-backed lifecycle remains BLOCKED because Docker Desktop's daemon is unavailable. See `evidence/verification/rerun-20261108/framework-integration.txt` and the two focused logs in `evidence/verification/rerun-20261108-final-audit-5/`. This does not prove live Selenium operation.
