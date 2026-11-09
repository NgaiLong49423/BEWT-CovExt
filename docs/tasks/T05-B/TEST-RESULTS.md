# T05-B Test Results

Date: 2026-11-10. Node `v24.19.0`, npm `11.17.0`. Commands were run from `framework/`. The focused integration command first ran in the managed sandbox and produced 10 PASS / 1 FAIL because Windows denied a test symlink with `EPERM`; the same command was rerun outside the sandbox and passed 11/11. The first attempt is not used as the final focused result.

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| `npm.cmd ci --no-audit --no-fund` | 0 | PASS; 71 packages installed from lockfile. npm reported pending install-script approvals for `better-sqlite3` and `esbuild`; no approval was changed. | `evidence/verification/20261110-offline-01/npm-ci.txt` |
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-offline-01/framework-build.txt` |
| `npm.cmd test` | 0 | PASS, 45/45 | `evidence/verification/20261110-offline-01/framework-unit.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/t01c-offline-approved-java-pipeline.test.ts test/integration/workflow.test.ts test/integration/tool-boundaries.test.ts` | 0 (outside sandbox) | PASS, 11/11 offline integration tests. Includes fake provider, review checkpoint and synthetic Java/Maven paths; not a live provider result. | `evidence/verification/20261110-offline-01/focused-offline-integration.txt` |
| Same focused command in managed sandbox | 1 | Initial attempt: 10 PASS / 1 FAIL; symlink test got `EPERM`. Correctly separated from subsequent outside-sandbox PASS. | Console output from the sandbox attempt; no extra evidence file retained. |
| Full `npm run test:integration` | NOT_RUN | BLOCKED by Agent 1 exclusive Docker ownership; intentionally not invoked. | — |
| Gemini live Gherkin generation | NOT_RUN | BLOCKED_AUTHORIZATION; no new request made | — |

The focused test run created three offline Maven result directories under `docs/tasks/T01-C/evidence/` (IDs `t01c-offline-approved-5ab89cc3-40c7-4ad8-b239-b967a679a213`, `t01c-offline-approved-63a0eedd-d5fc-45af-86f0-c20ab456e263`, and `t01c-offline-approved-ab51c2cd-0404-44e5-ab37-9ef7eb45c596`). They are untracked, outside T05-B scope, preserved, and excluded from the commit. No Docker runtime or provider was used.
