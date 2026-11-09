# T05-B Test Results

Date: 2026-11-10. Node `v24.19.0`, npm `11.17.0`. Commands were run from `framework/`. The focused integration command first ran in the managed sandbox and produced 10 PASS / 1 FAIL because Windows denied a test symlink with `EPERM`; the same command was rerun outside the sandbox and passed 11/11. The first attempt is not used as the final focused result.

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| `npm.cmd ci --no-audit --no-fund` | 0 | PASS; 71 packages installed from lockfile. npm reported pending install-script approvals for `better-sqlite3` and `esbuild`; no approval was changed. | `evidence/verification/20261110-offline-01/npm-ci.txt` |
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-offline-01/framework-build.txt` |
| `npm.cmd test` | 0 | PASS, 45/45 | `evidence/verification/20261110-offline-01/framework-unit.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/t01c-offline-approved-java-pipeline.test.ts test/integration/workflow.test.ts test/integration/tool-boundaries.test.ts` | 0 (outside sandbox) | PASS, 11/11 offline integration tests. Includes fake provider, review checkpoint and synthetic Java/Maven paths; not a live provider result. | `evidence/verification/20261110-offline-01/focused-offline-integration.txt` |
| Same focused command in managed sandbox | 1 | Initial attempt: 10 PASS / 1 FAIL; symlink test got `EPERM`. Correctly separated from subsequent outside-sandbox PASS. | `evidence/verification/20261110-correction-02/sandbox-symlink-failure.txt` |
| Full `npm run test:integration` | NOT_RUN | BLOCKED by Agent 1 exclusive Docker ownership; intentionally not invoked. | — |
| Gemini live Gherkin generation | NOT_RUN | BLOCKED_AUTHORIZATION; no new request made | — |

The focused test run created three offline Maven result directories under `docs/tasks/T01-C/evidence/` (IDs `t01c-offline-approved-5ab89cc3-40c7-4ad8-b239-b967a679a213`, `t01c-offline-approved-63a0eedd-d5fc-45af-86f0-c20ab456e263`, and `t01c-offline-approved-ab51c2cd-0404-44e5-ab37-9ef7eb45c596`). They are untracked, outside T05-B scope, preserved, and excluded from the commit. No Docker runtime or provider was used.

## Correction verification

The cost-telemetry correction was applied to the T05-B worktree after the original integration run. Logs below correspond to the corrected workspace at local base HEAD `6c7a0a84dc7625c66f33f8ce00ada44399f43588` plus the task-scoped diff that is included in the follow-up commit. `correction-03` repeated lockfile installation and the focused regression suite from a fresh dependency install.

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-correction-02/framework-build.txt` |
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 10/10; includes estimate naming and invalid token-count regression | `evidence/verification/20261110-correction-02/provider-unit.txt` |
| `npm.cmd test` | 0 | PASS, 46/46 | `evidence/verification/20261110-correction-02/framework-unit.txt` |
| `npx.cmd tsx ..\docs\tasks\T05-B\tools\verify-expresscart-source-identity.mts` | 0 | PASS; package/version/blob pins, 197-file build-context digest and Dockerfile digest match the approved manifest | `evidence/verification/20261110-correction-02/expresscart-source-identity.json` |
| First one-off `tsx -e` source identity attempt | 1 | Harness quoting/transformation error (`Expected string but found "node"`); no application/provider execution. Replaced by the `.mts` verifier above. | `evidence/verification/20261110-correction-02/failed-source-identity-eval.txt` |
The initial correction run above was followed by a clean `npm ci` and a repeat regression run, including a focused LangGraph checkpoint integration (offline fake provider only):

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| `npm.cmd ci --no-audit --no-fund` | 0 | PASS; 71 lockfile packages installed. npm reported `better-sqlite3` and `esbuild` install scripts still pending approval; no approval was changed. | `evidence/verification/20261110-correction-03/npm-ci.txt` |
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-correction-03/framework-build.txt` |
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 10/10 | `evidence/verification/20261110-correction-03/provider-unit.txt` |
| `npm.cmd test` | 0 | PASS, 46/46 | `evidence/verification/20261110-correction-03/framework-unit.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/workflow.test.ts` | 0 | PASS, 7/7; offline fake-provider/checkpoint behavior only | `evidence/verification/20261110-correction-03/focused-workflow-integration.txt` |

The route-oracle proposal and CLI claim were then narrowed to the source-established redirect destination; the new regression assertion is included in this final offline run:

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-correction-04/framework-build.txt` |
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 11/11 | `evidence/verification/20261110-correction-04/provider-unit.txt` |
| `npm.cmd test` | 0 | PASS, 47/47 | `evidence/verification/20261110-correction-04/framework-unit.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/workflow.test.ts` | 0 | PASS, 7/7; offline fake-provider/checkpoint behavior only | `evidence/verification/20261110-correction-04/focused-workflow-integration.txt` |

The original sandbox symlink failure is retained with private absolute paths redacted; command exit 1, 10 PASS / 1 FAIL, `EPERM` in `tool-boundaries.test.ts`. The justified outside-sandbox retry passed 11/11. Full Docker integration remains NOT_RUN while Agent 1 owns the runtime.
