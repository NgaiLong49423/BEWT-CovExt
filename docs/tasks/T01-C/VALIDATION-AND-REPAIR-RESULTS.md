# Validation and Repair Results

## Current evidence

The generated-test path is wired in `framework/src/t01c-cli.ts`: after current-revision human ACCEPT it requests Java generation, registers the artifact, then invokes the ExpressCart adapter's isolated compile, candidate-specific fixture, Selenium, and cleanup operations. Validation records use invocation/stage references and preserve `NOT_RUN`, `BLOCKED`, `FAIL`, and `INCONCLUSIVE` distinctly through `parseValidationResult` in `framework/src/contracts.ts`. Oracle/novelty remain `UNVERIFIED`; research acceptance remains `NOT_REVIEWED`.

An offline test-only approved path ran actual Maven `test-compile` with fake Java in a temporary isolated workspace. Evidence: `evidence/t01c-offline-approved-2156c0a6-fe0b-456a-be0a-b6df2b2a25eb/isolated-maven-compile.json`. It is not live study evidence. No live fixture, Selenium, cleanup, repair, or three-repeat execution has been performed. The Gemini Gherkin request failed with `API_KEY_INVALID`; no candidate reached a live human-review checkpoint.

The workflow retains a maximum of two repair attempts; the actual T01-C live repair loop has not been exercised. No result is VALIDATED and no G2/D1 gate is accepted.

## Runtime boundaries and T01-B impact

The offline harness verifies the copied-file allowlist and obtains the test selector only from the validated registration. Runtime filesystem realpath/symlink adversarial checks and actual Docker/Selenium execution remain unverified here; the full integration suite's symlink cases are blocked by Windows sandbox `EPERM`. T01-B adapter behavior and historical EC-C04 artifacts were not changed. T01-B evidence directories remain untouched.
