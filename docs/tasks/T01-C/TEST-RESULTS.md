# Test Results

| Check | Result | Evidence |
|---|---|---|
| `npm ci` (`framework`) | PASS | `evidence/verification/framework-npm-ci.txt` |
| `npm run build` (`framework`) | PASS | `evidence/verification/framework-build.txt` |
| `npm test` (`framework`) | PASS, 27/27 | `evidence/verification/framework-unit-summary.json` |
| `npm ci` (ExpressCart Agent) | PASS | `evidence/verification/expresscart-agent-npm-ci.txt` |
| `npm test` (ExpressCart Agent) | PASS, 5/5 | `evidence/verification/expresscart-agent-unit-summary.json` |
| `npm run test:integration` (`framework`) | PASS, 16 passed / 1 skipped | `evidence/verification/framework-integration.txt` |
| Gemini / Maven / Selenium | NOT_RUN | Live call unauthorized; no T01-C candidate or Java artifact exists |

The new tests cover provider output pinning, refusal to construct Gemini without explicit authorization, source-backed coverage dispositions, Java class/BaseTest/JUnit shape, and the offline LangGraph pause before Java side effects. The broader T01-C acceptance suite is not complete.
