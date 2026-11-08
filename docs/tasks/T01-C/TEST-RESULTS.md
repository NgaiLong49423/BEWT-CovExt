# Test Results

## Main integration follow-up (2026-11-08)

| Check | Result | Evidence |
|---|---:|---|
| `npm ci` | PASS; 71 packages installed, 0 vulnerabilities | `evidence/verification/main-integration-20261108-01/npm-ci.txt` |
| Framework TypeScript build | PASS | `evidence/verification/main-integration-20261108-01/framework-build.txt` |
| Framework unit suite | PASS, 45/45 | `evidence/verification/main-integration-20261108-01/framework-unit.txt` |
| Framework integration in sandbox | 16 passed / 3 failed / 1 opt-in skip; two failures were symlink `EPERM`, adapter result was BLOCKED | `evidence/verification/main-integration-20261108-01/framework-integration.txt` |
| Framework integration outside sandbox | PASS, 19 passed / 0 failed / 1 opt-in process-crash-recovery test skipped | `evidence/verification/main-integration-20261108-01/framework-integration-outside-sandbox.txt` |
| ExpressCart Agent regression | PASS, 5/5 | `evidence/verification/main-integration-20261108-01/expresscart-agent.txt` |
| SonarCloud for the post-merge integration commit | PENDING; the previous PASS is for pre-merge code commit `4b033778a13e989a063cc0f0c7be318de3dfbae5` | To be checked against the pushed merge commit |

The sandbox failures are retained as diagnostic evidence; the full integration suite was rerun outside the sandbox and passed. No Gemini request or Docker reset was run. Live model output and generated-candidate Selenium remain blocked/unverified; offline acceptance does not accept G2 or D1.

## Final offline assertion-preservation review (2026-11-08)

| Check | Result | Evidence |
|---|---:|---|
| Framework TypeScript build | PASS | `evidence/verification/rerun-20261108-assertion-preservation-03/framework-build.txt` |
| Framework unit suite | PASS, 45/45 | `evidence/verification/rerun-20261108-assertion-preservation-03/framework-unit.txt` |
| Focused Java artifact registry tests | PASS, 5/5 (included in the 45 unit tests) | Same unit log; source: `framework/test/java-artifact-registry.test.ts` |
| Framework integration suite | PASS, 19 passed / 0 failed / 1 opt-in process-crash-recovery test skipped | `evidence/verification/rerun-20261108-assertion-preservation-03/framework-integration.txt` |
| ExpressCart Agent regression | PASS, 5/5 | `evidence/verification/rerun-20261108-assertion-preservation-03/expresscart-agent-unit.txt` |
| Initial full unit run before updating legacy Java fixtures | 43 passed / 2 failed; both failures were old generated-Java fixtures without assertions and were updated to comply with the new contract | `evidence/verification/rerun-20261108-assertion-preservation-02/framework-unit-initial-fixture-fail.txt` |
| SonarCloud Quality Gate on final head `4b033778a13e989a063cc0f0c7be318de3dfbae5` | PASS; 0 new issues, 0 hotspots, 0.9% new-code duplication; coverage 0.0% because no coverage report was uploaded | `evidence/verification/rerun-20261108-assertion-preservation-03/github-check-status.txt` |

No Gemini request was made. Integration's single skip is the separately opt-in OS-process crash-recovery E2E. The static assertion scan does not prove semantic oracle correctness. Live generated-candidate Selenium remains unverified and T01-C remains partial.

SonarCloud on intermediate commit `2a61b0125e09eb77e243ea540517ca3b9ba5b6fa` reported four Reliability issues in the new scanner (cursor-index assignments and locale-dependent array sorting). The scanner was simplified to one ordered lexical pass and assertion order is now compared directly, avoiding locale-dependent sorting. The final check on `4b033778a13e989a063cc0f0c7be318de3dfbae5` passed.

## T01-C offline review-fix verification (2026-11-08)

| Check | Result | Evidence |
|---|---:|---|
| Framework `npm ci` | PASS | `evidence/verification/rerun-20261108-offline-review-fixes/framework-npm-ci.txt` |
| Framework TypeScript build | PASS | `evidence/verification/rerun-20261108-offline-review-fixes-03/framework-build.txt` |
| Framework unit tests | PASS, 42/42 | `evidence/verification/rerun-20261108-offline-review-fixes-03/framework-unit.txt` |
| Full framework integration outside sandbox | PASS, 19 passed / 0 failed / 1 opt-in crash-recovery skipped | `evidence/verification/rerun-20261108-offline-review-fixes-03/framework-integration-outside-sandbox.txt` |
| Focused fake-provider generation and bounded repair with isolated Maven | PASS, 2/2; first compile FAIL classified GENERATED_TEST_DEFECT, repaired compile PASS | `evidence/verification/rerun-20261108-offline-review-fixes-03/offline-generation-repair-integration.txt`; run record: `evidence/verification/rerun-20261108-offline-review-fixes-03/offline-repair-loop.json` |
| ExpressCart Agent regression | PASS, 5/5 | `evidence/verification/rerun-20261108-offline-review-fixes-03/expresscart-agent-unit.txt` |

The synthetic Maven compilation uses a fake Java provider and does not count as Gemini-generated success. The adapter integration includes an ownership-scoped Docker fixture/cleanup path but intentionally refuses Selenium for its unregistered artifact; the synthetic repair run marks fixture, E2E and cleanup `NOT_RUN`. OS process crash-recovery E2E remains skipped. No historical Sprint 01–05 metrics were changed.

## SonarCloud follow-up

| Check | Result | Evidence |
|---|---:|---|
| SonarCloud Quality Gate on preceding commit `cfac8d322d73a6f6cd95e954fd328e62217eeace` | FAIL, 4.2% duplication (limit 3%) | PR #4 SonarCloud check; public duplication detail API identified repeated code in the registry loader, Gemini Java request path, and offline Maven setup. |
| SonarCloud Quality Gate on `6779e636bf981011f47e7985a78f6aee2389b0b5` | PASS, 1.0% duplication, 0 new issues, 0 hotspots; coverage 0.0% | `evidence/verification/rerun-20261108-sonar-duplication-fix-02/github-check-status.txt` |
| Source duplication refactor | IMPLEMENTED and verified on SonarCloud | `framework/src/runtime/java-artifact-registry.ts`, `framework/src/runtime/model-provider.ts`, `framework/test/integration/t01c-offline-approved-java-pipeline.test.ts`; build/unit/integration logs at `evidence/verification/rerun-20261108-sonar-duplication-fix-02/` |
| Build, framework unit tests, and full integration after duplication refactor | PASS / 42/42 PASS / 19 PASS, 0 FAIL, 1 opt-in SKIP | `evidence/verification/rerun-20261108-sonar-duplication-fix-02/` |

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
| Gemini Gherkin requests | FAIL, 5 authorized provider invocations, 0 model outputs, no retries; four `API_KEY_INVALID`, one fetch failure | Five run directories are listed in `COVERAGE-AND-CANDIDATE-RESULTS.md`; latest CLI evidence: `evidence/verification/rerun-20261108-live-call-05/cli-output.txt`; three budget rejects were local preflight only (`calls=0`) |
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
| SonarCloud analysis for previous PR SHA | PASS, but `typescript:S8786` remained on SHA `8d4cafa9559e3015f7f7e380ee7979f6fcfbc20c` | Snapshot: `evidence/verification/rerun-20261108-sonar-regex-fix-2/github-check-status.txt`; corrected in the next commit |
| SonarCloud analysis after deterministic scanner correction | PASS, 0 new issues, 0 hotspots; new-code coverage metric 0.0% | SHA `3b3fb29b15d1563de049ca05fdeea88d939d97e7`; `evidence/verification/rerun-20261108-sonar-regex-fix-7/github-check-status.txt` |
| ExpressCart Agent unit tests | PASS, 5/5 | `evidence/verification/rerun-20261108-full-verification-01/expresscart-agent-unit.txt` |
| ExpressCart Agent unit tests on final T01-C worktree | PASS, 5/5 | `evidence/verification/rerun-20261108-final-expresscart-agent/expresscart-agent-unit.txt` |
| Full framework integration outside sandbox | PASS, 18 passed / 0 failed / 1 skipped | `evidence/verification/rerun-20261108-full-verification-01/framework-integration-outside-sandbox.txt` |
| ExpressCart adapter lifecycle integration | PASS, 1/1, included in the full integration run | Same full integration log; standalone rerun at `evidence/verification/rerun-20261108-full-verification-01/adapter-lifecycle-outside-sandbox.txt` |
| Latest bounded Gemini Gherkin call | BLOCKED, 1/1 attempt, `API_KEY_INVALID`; no retry or response | `evidence/t01c-41392a3d-d991-433b-84c9-97ad1af1ec86/` and `evidence/verification/rerun-20261108-live-call-05/cli-output.txt` |

The lifecycle regression exposed a test-fixture error: `recoveryState` used a different workflow `runId` while carrying the original run-bound human approval. The adapter correctly rejected that state. The test now models a process restart by retaining the workflow run ID and assigning only a fresh `validationInvocationId`; the standalone lifecycle test and full integration suite then passed. This did not change adapter behavior. The lifecycle test verifies run-scoped compile/fixture/cleanup and that Selenium is refused for an unregistered artifact; it is not a live Selenium success. The one skipped case is the separately opt-in OS-process crash-recovery E2E. Docker Compose state after the run contained only the pre-existing ExpressCart and unrelated pre-existing projects; no test project remained.

The offline integration proves a synthetic, test-only ACCEPT can traverse the artifact registry and isolated Maven compile path. It does not establish Gemini output, live E2E, oracle/novelty acceptance, or VALIDATED status. No gate is self-accepted. The full framework integration suite now passes outside the sandbox; the separate crash-recovery E2E remains opt-in and was skipped. Live generated-candidate execution remains unverified.
