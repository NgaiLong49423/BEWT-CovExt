# T01-B Test Results

| Check | Result | Evidence |
|---|---:|---|
| Framework `npm ci` | PASS, exit 0; install summary and notices are in the latest log | [`verification-final-20261107/npm-ci.log`](evidence/verification-final-20261107/npm-ci.log) |
| Framework `npm run build` | PASS, exit 0 | [`verification-final-20261107/framework-build.log`](evidence/verification-final-20261107/framework-build.log) |
| Framework unit tests | PASS, 21/21 | [`verification-final-20261107/framework-unit.log`](evidence/verification-final-20261107/framework-unit.log) |
| Framework integration tests | PASS, 13/13 (including restart, replay, dispatcher/path boundaries and comment-only Gherkin revision) | [`verification-final-20261107/framework-integration.log`](evidence/verification-final-20261107/framework-integration.log) |
| Legacy ExpressCart Agent tests | PASS, 5/5 | [`verification-final-20261107/expresscart-agent-unit.log`](evidence/verification-final-20261107/expresscart-agent-unit.log) |
| ExpressCart Maven compile in runtime | PASS | [`t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/compile.log`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/compile.log) |
| EC-C04 fixture preflight | PASS; unique unregistered fixture absent before E2E | [`t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/fixture-preflight.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/fixture-preflight.json) |
| EC-C04 Selenium/JUnit E2E | PASS, one test | [`t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/junit/TEST-tests.ForgottenPasswordTest.xml`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/junit/TEST-tests.ForgottenPasswordTest.xml) |
| Run-scoped Compose cleanup | PASS | [`t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/cleanup.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/cleanup.json) |
| Gemini live invocation | NOT_RUN, 0 calls; no generated model artifact is claimed | [`t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/validation-result.json`](evidence/t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf/validation-result.json) |

The earlier Chrome mismatch attempts remain in their own run directories with BLOCKED/FAIL evidence and were not overwritten. No historical Sprint 01–05 artifacts were changed. Full CLI stdout has not been committed where it would duplicate structured evidence; the authoritative run JSON, sanitized console output, fixture record, JUnit output and cleanup record are linked above.
