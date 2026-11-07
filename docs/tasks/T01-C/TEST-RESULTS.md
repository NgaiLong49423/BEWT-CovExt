# Test Results

| Check | Result | Evidence |
|---|---:|---|
| Framework `npm ci` | PASS | `evidence/verification/rerun-20261108-final/framework-npm-ci.txt` |
| Framework TypeScript build | PASS | `evidence/verification/rerun-20261108-final/framework-build.txt` |
| Framework unit tests | PASS, 31/31 | `evidence/verification/rerun-20261108-final/framework-unit.txt` |
| Offline approved Java pipeline | PASS, 1/1 | `evidence/verification/rerun-20261108-final/t01c-offline-pipeline.txt`; latest Maven compile detail: `evidence/t01c-offline-approved-5b8cef71-c34e-45c0-a7fe-403fbe46a406/isolated-maven-compile.json` |
| ExpressCart Agent unit tests | PASS, 5/5 | `evidence/verification/rerun-20261108-final/expresscart-agent-unit.txt` |
| Full framework integration suite | FAIL in managed sandbox, 12 passed / 4 failed / 1 skipped (last captured run) | `evidence/verification/rerun-20261108/framework-integration.txt`; symlink creation `EPERM`, adapter lifecycle BLOCKED on unavailable Docker/runtime; crash/replay skipped |
| Gemini Gherkin request | FAIL, 1 request, no retry | `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/run-result.json`; HTTP 400 `API_KEY_INVALID` |
| Live Maven fixture / Selenium / cleanup / repeats | NOT_RUN | No live candidate; offline compile is not live validation |

The offline integration proves a synthetic, test-only ACCEPT can traverse the artifact registry and isolated Maven compile path. It does not establish Gemini output, live E2E, oracle/novelty acceptance, or VALIDATED status. No gate is self-accepted.
