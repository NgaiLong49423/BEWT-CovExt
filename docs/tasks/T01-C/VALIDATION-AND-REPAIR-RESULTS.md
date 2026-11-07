# Validation and Repair Results

## Current evidence

The generated-test path is wired in `framework/src/t01c-cli.ts`: after current-revision human ACCEPT it requests Java generation, registers the artifact, then invokes the ExpressCart adapter's isolated compile, candidate-specific fixture, Selenium, and cleanup operations. Validation records use invocation/stage references and preserve `NOT_RUN`, `BLOCKED`, `FAIL`, and `INCONCLUSIVE` distinctly through `parseValidationResult` in `framework/src/contracts.ts`. Oracle/novelty remain `UNVERIFIED`; research acceptance remains `NOT_REVIEWED`.

An offline test-only approved path ran actual Maven `test-compile` with fake Java in a temporary isolated workspace. Latest compile evidence: `evidence/t01c-offline-approved-7c20bd27-28ee-409e-896b-b21f0f787c68/isolated-maven-compile.json`. It is not live study evidence. No live fixture, Selenium, cleanup, live repair, or three-repeat execution has been performed. The offline workflow test separately covers at most two synthetic repair attempts; its evidence is `evidence/verification/rerun-20261108-final-audit-3/t01c-workflow-integration.txt`. The Gemini Gherkin request failed with `API_KEY_INVALID`; no candidate reached a live human-review checkpoint.

The workflow retains a maximum of two repair attempts; the actual T01-C live repair loop has not been exercised. No result is VALIDATED and no G2/D1 gate is accepted.

## Runtime boundaries and T01-B impact

The offline harness verifies the copied-file allowlist and obtains the test selector only from the validated registration. Runtime filesystem realpath/symlink adversarial checks and actual Docker/Selenium execution remain unverified here; the last complete full integration suite reported 12 PASS / 4 FAIL / 1 SKIP; symlink cases hit Windows sandbox `EPERM` and adapter lifecycle could not run without Docker/runtime. Its log remains `evidence/verification/rerun-20261108/framework-integration.txt`. T01-B adapter behavior and historical EC-C04 artifacts were not changed. T01-B evidence directories remain untouched.
