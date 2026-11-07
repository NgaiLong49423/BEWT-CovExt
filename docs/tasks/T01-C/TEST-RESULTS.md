# Test Results

| Check | Result | Evidence |
|---|---|---|
| `npm ci` (`framework`) | PASS | `evidence/verification/framework-npm-ci.txt` |
| `npm run build` (`framework`) | PASS | `evidence/verification/after-live-20261108/framework-build.txt` |
| `npm test` (`framework`) | PASS, 28/28 | `evidence/verification/after-live-20261108/framework-unit.txt` |
| `npm ci` (ExpressCart Agent) | PASS | `evidence/verification/expresscart-agent-npm-ci.txt` |
| `npm test` (ExpressCart Agent) | PASS, 5/5 | `evidence/verification/rerun-20261108/expresscart-agent-unit.txt` |
| `npm run test:integration` (`framework`) | FAIL in sandbox, 12 passed / 4 failed / 1 skipped | `evidence/verification/rerun-20261108/framework-integration.txt` |
| Gemini | FAIL, 1 request | `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/run-result.json` (`API_KEY_INVALID`, no candidate/checkpoint; no retry) |
| Maven / Selenium | NOT_RUN | No candidate reached human review and no Java artifact exists |

The 28 framework unit tests cover provider output pinning, refusal to construct Gemini without explicit authorization, source-backed coverage dispositions, Java class/BaseTest/JUnit shape, review contracts, validation contracts, repair bounds and regression checks for Gemini error classification. The offline LangGraph integration reaches a fresh review checkpoint. The latest full integration run is **not green**: three symlink tests could not create symlinks (`EPERM` in the managed Windows sandbox), and the actual ExpressCart adapter lifecycle expected PASS but received BLOCKED (Docker/runtime prerequisites were unavailable); 12 passed, 4 failed, 1 skipped. The crash/replay Docker+Selenium test remains skipped. This environment failure is not reported as a product-code regression or as a pass. See the raw rerun log for exact outcomes.
