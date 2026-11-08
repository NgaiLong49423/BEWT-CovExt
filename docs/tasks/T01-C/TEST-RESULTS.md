# Test Results

| Check | Result | Evidence |
|---|---:|---|
| Framework `npm ci` | PASS | `evidence/verification/rerun-20261108-final/framework-npm-ci.txt` |
| Framework TypeScript build | PASS | `evidence/verification/rerun-20261108-final/framework-build.txt` |
| Framework unit tests | PASS, 37/37 | `evidence/verification/rerun-20261108-final-audit-5/framework-unit.txt` |
| Framework build after bounded prompt compaction | PASS | `evidence/verification/rerun-20261108-prompt-budget-fix/framework-build.txt` |
| Framework unit tests after bounded prompt compaction | PASS, 37/37 | `evidence/verification/rerun-20261108-prompt-budget-fix/framework-unit.txt` |
| Framework build with sanitized request evidence | PASS | `evidence/verification/rerun-20261108-request-evidence/framework-build.txt` |
| Framework unit tests with sanitized request evidence | PASS, 38/38 | `evidence/verification/rerun-20261108-request-evidence/framework-unit.txt` |
| Focused workflow + offline Java pipeline with sanitized request evidence | PASS, 6/6 | `evidence/verification/rerun-20261108-request-evidence/t01c-workflow-integration.txt` |
| No-application-repair workflow regression | PASS, included in focused integration 7/7 | `evidence/verification/rerun-20261108-no-application-repair/t01c-workflow-integration.txt` |
| Framework build/unit and focused integration after repair classification | PASS / PASS, 38/38 / PASS, 7/7 | `evidence/verification/rerun-20261108-no-application-repair/` |
| ExpressCart Agent unit tests after repair classification | PASS, 5/5 | `evidence/verification/rerun-20261108-no-application-repair/expresscart-agent-unit.txt` |
| Final prompt compaction build/unit | PASS / PASS, 37/37 | `evidence/verification/rerun-20261108-final-prompt-budget/{framework-build.txt,framework-unit.txt}` |
| Focused workflow + offline Java pipeline after final prompt compaction | PASS, 6/6 | `evidence/verification/rerun-20261108-final-prompt-budget/t01c-workflow-integration.txt` |
| Targeted model-provider regression tests after final test-fixture cleanup | PASS, 7/7 | Command: `npx tsx --test test/model-provider.test.ts` (final source state) |
| Historical candidate index validation | PASS, included in framework tests | `framework/test/historical-behavior-index.test.ts`; validates five Sprint 01–05 candidate maps and source provenance |
| Focused T01-C/workflow integration | PASS, 7/7 | `evidence/verification/rerun-20261108-final-audit-5/t01c-workflow-integration.txt`; includes revision, reject, replay, 2-repair limit, restart, fake Java and actual Maven compile |
| Offline approved Java pipeline | PASS, 1/1 within focused integration run | Latest Maven compile detail: `evidence/t01c-offline-approved-7ee36e93-3bfa-4258-9954-275c51ccbbc9/isolated-maven-compile.json` |
| ExpressCart Agent unit tests | PASS, 5/5 | `evidence/verification/rerun-20261108-final-audit-4/expresscart-agent-unit.txt` |
| Filesystem safety integration outside sandbox | PASS, 3/3 | `evidence/verification/rerun-20261108-final-audit-5/tool-boundaries-outside-sandbox.txt`; `evidence/verification/rerun-20261108-final-audit-5/evidence-discovery-outside-sandbox.txt` |
| Earlier managed-sandbox integration run | FAIL, 12 passed / 4 failed / 1 skipped; superseded by the current outside-sandbox full run below | `evidence/verification/rerun-20261108/framework-integration.txt`; symlink creation `EPERM`; Docker access blocked; crash/replay skipped |
| Gemini Gherkin requests | FAIL, 4 authorized provider invocations, no retries; three `API_KEY_INVALID`, one fetch failure | `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/`, `evidence/t01c-36e40937-21b7-4f57-a8c3-5d24a2c10aca/`, `evidence/t01c-4b3cc521-40ae-4f76-bd06-e4828390d83e/`, and `evidence/t01c-e792fc58-00e8-4c39-ab4a-2fcc8e20b452/`; three budget rejects recorded separately with `calls=0` |
| Live Maven fixture / Selenium / cleanup / repeats | NOT_RUN | No live candidate; offline compile is not live validation |

## Current revalidation after Docker access was restored outside the sandbox

| Check | Result | Evidence |
|---|---:|---|
| Framework TypeScript build | PASS | `evidence/verification/rerun-20261108-full-verification-01/framework-build.txt` |
| Framework unit tests | PASS, 38/38 | `evidence/verification/rerun-20261108-full-verification-01/framework-unit.txt` |
| Framework build after deterministic Java contract scanner | PASS | `evidence/verification/rerun-20261108-sonar-regex-fix-7/build.txt` |
| Framework unit tests after deterministic Java contract scanner | PASS, 39/39 | `evidence/verification/rerun-20261108-sonar-regex-fix-7/unit-tests.txt` |
| Offline approved Java pipeline after deterministic Java contract scanner | PASS, 1/1 | `evidence/verification/rerun-20261108-sonar-regex-fix-7/t01c-offline-approved-java-pipeline.txt` |
| Synthetic generated Java isolated Maven `test-compile` from the same integration | PASS; synthetic Fake-provider artifact only | `evidence/t01c-offline-approved-23a0681e-cb66-4fc9-94f3-a783a2905f0a/isolated-maven-compile.json` |
| SonarCloud analysis for previous PR SHA | PASS, but `typescript:S8786` remained on SHA `8d4cafa9559e3015f7f7e380ee7979f6fcfbc20c` | Snapshot: `evidence/verification/rerun-20261108-sonar-regex-fix-2/github-check-status.txt`; latest local correction replaces regex-based package/class checks. Fresh analysis is required before declaring the issue resolved |
| ExpressCart Agent unit tests | PASS, 5/5 | `evidence/verification/rerun-20261108-full-verification-01/expresscart-agent-unit.txt` |
| Full framework integration outside sandbox | PASS, 18 passed / 0 failed / 1 skipped | `evidence/verification/rerun-20261108-full-verification-01/framework-integration-outside-sandbox.txt` |
| ExpressCart adapter lifecycle integration | PASS, 1/1, included in the full integration run | Same full integration log; standalone rerun at `evidence/verification/rerun-20261108-full-verification-01/adapter-lifecycle-outside-sandbox.txt` |
| Latest bounded Gemini Gherkin call | BLOCKED, 1/1 attempt, `API_KEY_INVALID`; no retry or response | `evidence/t01c-e792fc58-00e8-4c39-ab4a-2fcc8e20b452/` and `evidence/verification/rerun-20261108-live-call-04/cli-output.txt` |

The lifecycle regression exposed a test-fixture error: `recoveryState` used a different workflow `runId` while carrying the original run-bound human approval. The adapter correctly rejected that state. The test now models a process restart by retaining the workflow run ID and assigning only a fresh `validationInvocationId`; the standalone lifecycle test and full integration suite then passed. This did not change adapter behavior. The lifecycle test verifies run-scoped compile/fixture/cleanup and that Selenium is refused for an unregistered artifact; it is not a live Selenium success. The one skipped case is the separately opt-in OS-process crash-recovery E2E. Docker Compose state after the run contained only the pre-existing ExpressCart and unrelated pre-existing projects; no test project remained.

The offline integration proves a synthetic, test-only ACCEPT can traverse the artifact registry and isolated Maven compile path. It does not establish Gemini output, live E2E, oracle/novelty acceptance, or VALIDATED status. No gate is self-accepted. The full framework integration suite now passes outside the sandbox; the separate crash-recovery E2E remains opt-in and was skipped. Live generated-candidate execution remains unverified.
