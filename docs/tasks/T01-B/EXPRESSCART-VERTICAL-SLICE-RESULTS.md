# ExpressCart Vertical-Slice Results

## Pins and scope

[`config/apps/expresscart.json`](../../../config/apps/expresscart.json) binds ExpressCart source commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package version `1.1.19`, suite path, source build-context/Dockerfile hashes and locally observed app/Mongo image IDs. The values are local image IDs, not registry digests. Historical source lock still records registry digests as not verified.

Candidate EC-C04 uses [`EC-C04-forgotten-password.feature`](../../research-results/sprint-02/revised/EC-C04-forgotten-password.feature). The reviewed Java class is [`ForgottenPasswordTest.java`](../../../experiments/expresscart/bewt-suite/src/test/java/tests/ForgottenPasswordTest.java), class `tests.ForgottenPasswordTest`; it asserts the generic success notification for a newly generated `example.invalid` address. Artifact origin is `REUSED`, SHA-256 `931f410f43dbca59cd7d341ea3822c70124dd8ad2b00ea3377c45dfb9c7a7b80`. It is not model-generated or repaired Java.

## Successful run

Run `t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf`, invocation `inv-7a4232bb-6f44-4698-ba1d-533c711191b7`, accepted for implementation at checkpoint `7e6e17b3-d963-4437-a1d0-99b19fe19639`:

- Maven compile: PASS — [`compile.log`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/compile.log).
- Fixture: PASS — isolated Compose project, email preflight count zero and only an email hash recorded: [`fixture-preflight.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/fixture-preflight.json).
- Selenium/JUnit: PASS — one test, zero failures/errors: [`TEST-tests.ForgottenPasswordTest.xml`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/junit/TEST-tests.ForgottenPasswordTest.xml); sanitized console: [`selenium-console.log`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/selenium-console.log).
- Browser/driver: both `156.0.8078.80`; driver hash and browser path hash only: [`webdriver-pin.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/webdriver-pin.json).
- Cleanup: PASS with exact run ownership evidence: [`cleanup.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/cleanup.json).
- Full structured state: [`validation-result.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/validation-result.json).

The run has zero repeats (required 3), oracle and novelty decisions `UNVERIFIED`, and research acceptance `NOT_REVIEWED`; `technicalEligibility` is `UNVERIFIED`. No `VALIDATED` case is claimed. Gemini was not called (0 calls).

## Preserved environment and history

Read-only Docker inspection found the pre-existing project `bewt-covext-expresscart-b31302f` still running; adapter cleanup removed only the run-owned project. No ExpressCart application/test/POM, Docker config, `bewt-original/`, or historical Sprint 01–05 evidence changed. Earlier browser mismatch runs remain as separate evidence; see [`GRAPH-EXECUTION-TRACE.md`](GRAPH-EXECUTION-TRACE.md).
