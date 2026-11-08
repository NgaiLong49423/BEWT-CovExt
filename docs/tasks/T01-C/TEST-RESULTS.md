# Test Results

| Check | Result | Evidence |
|---|---:|---|
| Framework `npm ci` | PASS | `evidence/verification/rerun-20261108-final/framework-npm-ci.txt` |
| Framework TypeScript build | PASS | `evidence/verification/rerun-20261108-final/framework-build.txt` |
| Framework unit tests | PASS, 37/37 | `evidence/verification/rerun-20261108-final-audit-5/framework-unit.txt` |
| Historical candidate index validation | PASS, included in framework tests | `framework/test/historical-behavior-index.test.ts`; validates five Sprint 01–05 candidate maps and source provenance |
| Focused T01-C/workflow integration | PASS, 7/7 | `evidence/verification/rerun-20261108-final-audit-5/t01c-workflow-integration.txt`; includes revision, reject, replay, 2-repair limit, restart, fake Java and actual Maven compile |
| Offline approved Java pipeline | PASS, 1/1 within focused integration run | Latest Maven compile detail: `evidence/t01c-offline-approved-7ee36e93-3bfa-4258-9954-275c51ccbbc9/isolated-maven-compile.json` |
| ExpressCart Agent unit tests | PASS, 5/5 | `evidence/verification/rerun-20261108-final-audit-4/expresscart-agent-unit.txt` |
| Filesystem safety integration outside sandbox | PASS, 3/3 | `evidence/verification/rerun-20261108-final-audit-5/tool-boundaries-outside-sandbox.txt`; `evidence/verification/rerun-20261108-final-audit-5/evidence-discovery-outside-sandbox.txt` |
| Full framework integration suite | FAIL in managed sandbox, 12 passed / 4 failed / 1 skipped (last captured run) | `evidence/verification/rerun-20261108/framework-integration.txt`; symlink creation `EPERM`, adapter lifecycle BLOCKED on unavailable Docker/runtime; crash/replay skipped |
| Gemini Gherkin request | FAIL, 1 request, no retry | `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/run-result.json`; HTTP 400 `API_KEY_INVALID` |
| Live Maven fixture / Selenium / cleanup / repeats | NOT_RUN | No live candidate; offline compile is not live validation |

The offline integration proves a synthetic, test-only ACCEPT can traverse the artifact registry and isolated Maven compile path. It does not establish Gemini output, live E2E, oracle/novelty acceptance, or VALIDATED status. No gate is self-accepted. The full framework integration suite remains non-green at its last complete run (12 pass / 4 fail / 1 skip); three filesystem-only tests from that run were rerun outside the sandbox and passed. The adapter lifecycle remains unverified because Docker is unavailable; see `evidence/verification/rerun-20261108/framework-integration.txt` and the two isolated logs above.
