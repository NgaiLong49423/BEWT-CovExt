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

## Independent review correction round 2

SonarCloud's PR API and GitHub check-run API were inspected read-only. The failed analysis was for PR commit `72103d17bc4005a661d6fa03d862e1364c283a88` (check completed 2026-11-09 18:39:06Z): 9.7561% new-code duplication, 4 duplicated lines in 2 blocks. Sonar reported the blocks only in production file `framework/src/runtime/model-provider.ts`, at lines 406–416 and 467–477 in that analyzed revision. These were duplicate token-usage extraction and successful telemetry construction; no tests, documentation, or analysis configuration were implicated. `successfulGeminiTelemetry` now centralizes that repeated behavior. Thresholds and exclusions were not changed.

The follow-up SonarCloud check analyzed execution commit `ffa19f6f1d890269cd20397fbaa66ba1ed66963e` and completed successfully: Quality Gate PASS, 0.0% duplication on new code, 0 new issues, and 0 security hotspots. The latest completed analysis observed before this report update passed on docs/evidence commit `696659818f7947eddaf8e6a54f9ce08f830a1384` (check run `129375200727`) with 0.0% duplication. The check details are at [SonarCloud PR analysis](https://sonarcloud.io/dashboard?id=NgaiLong49423_BEWT-CovExt&pullRequest=15); the sanitized API/check evidence is `evidence/verification/20261110-correction-05/sonarqube-analysis.json`. The current PR HEAD is a still-later documentation-only update. SonarCloud and GitHub did not show a new analysis/check for that exact HEAD at final verification, so its exact-head status is `NOT_VERIFIED`; the analyzed production source is unchanged from the passing source analysis.

All four requested commands were re-executed after the source fix was committed, against execution commit `ffa19f6f1d890269cd20397fbaa66ba1ed66963e`. Node `v24.19.0`, npm `11.17.0`; commit tree `810ebbe42cdc123c908cd2e422badfad13ffef1f`; `framework/src/runtime/model-provider.ts` Git blob `f21f66bf244bca23f954f6d2960cf456d0c22bc9`, SHA-256 `24506406ea30be0fd51af381041a3c9b75a7ae99e4a5e0d9b504cb452fe28f0a`. The exact pre/post test `git status` is recorded in `execution-provenance.txt`; only previously existing ExpressCart dist edits and offline T01-C test artifacts were outside the task. Per-log SHA-256 digests make the sanitized logs tamper-evident.

| Command (from `framework/`) | Exit | Result | Evidence |
|---|---:|---|---|
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-correction-05/framework-build.txt`; exit and SHA-256 in `execution-provenance.txt` |
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 11/11 | `evidence/verification/20261110-correction-05/provider-unit.txt`; exit and SHA-256 in `execution-provenance.txt` |
| `npm.cmd test` | 0 | PASS, 47/47 | `evidence/verification/20261110-correction-05/framework-unit.txt`; exit and SHA-256 in `execution-provenance.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/workflow.test.ts` | 0 | PASS, 7/7; offline fake-provider/checkpoint only | `evidence/verification/20261110-correction-05/focused-workflow-integration.txt`; exit and SHA-256 in `execution-provenance.txt` |

These are local results, not CI results. Full Docker integration remains NOT_RUN because Agent 1 owns the runtime.

Secret scan: official Gitleaks `8.30.1`, release archive checksum verified against the publisher's checksums file. The committed PR history and staged T05-B report/evidence were scanned with 100% redaction; both commands exited 0 with no leaks. Together these scans covered the complete proposed PR diff at evidence preparation. Exact commands, scope, scanner hash, logs and empty JSON reports are in `evidence/verification/20261110-correction-05/secret-scan-provenance.txt` and the adjacent `gitleaks-*` files. No findings or justified false positives were reported.

## Correction evidence index (rounds 02–04 retained)

| Round | Preserved result / purpose | Evidence directory |
|---|---|---|
| correction-02 | Initial source/cost correction verification; includes the sandbox symlink `EPERM` attempt and successful outside-sandbox retry, source-pin verifier, and earlier Sonar duplication investigation. | `evidence/verification/20261110-correction-02/` |
| correction-03 | Clean install and repeat build/provider/framework/focused offline workflow tests; fake provider only. | `evidence/verification/20261110-correction-03/` |
| correction-04 | Redirect-only oracle narrowing and its build/provider/framework/focused offline workflow regression results. | `evidence/verification/20261110-correction-04/` |
| correction-05 | Provenance for execution commit `ffa19f6f1d890269cd20397fbaa66ba1ed66963e`; sanitized logs and earlier Sonar/secret-scan records. | `evidence/verification/20261110-correction-05/` |
| correction-06 | Exact Git-blob versus local SHA-256 audit; reviewed-HEAD secret scan; current-main/T04-E reconciliation. | `evidence/verification/20261110-correction-06/` |

## Independent review correction round 3

### SonarCloud

The reviewer verified successful SonarCloud check run `129377220205` on exact reviewed HEAD `0b6e9803acfd8c70ce252fd6a1fc798e77dc8b9c`; latest PR Quality Gate is PASS. This supersedes the prior observation that exact-head status was `NOT_VERIFIED` for this SHA. No production refactor was made in this correction round. A later documentation/evidence commit has a distinct SHA and is not claimed to have the same exact-HEAD check. See `sonarqube-reviewed-head-verification.md` in correction-06.

### Committed evidence byte audit

`execution-provenance.txt` in correction-05 recorded local pre-commit SHA-256 values. The new audit independently hashes raw bytes from `git cat-file blob` at reviewed HEAD and the local files. The provider, framework, and focused integration logs match exactly. Each of four exit files is `0\r\n` locally (3 bytes) and `0\n` in the Git blob (2 bytes); LF-normalized contents match, consistent with checkout line-ending conversion (`core.autocrlf=true`). The committed build log is 31 bytes with SHA-256 `89336c295edb42c283e07259c89c63e294a1d6b535d32bf952935c821ae73220`. The previously recorded digest `34fc8f532e8455212c5eeba2f44af8dd0d5a13e2138025e81ecd8272dd2f48fa` is reproducible by appending two LF bytes to that blob; the prior digest was captured before trailing-blank trimming. No original log or test result was rewritten. Raw blob IDs, lengths, local hashes, committed blob hashes, and reproduction are in `committed-evidence-hash-audit.json`.

### Final reviewed-HEAD Gitleaks scan

Gitleaks `8.30.1` was run with `--redact=100` over all committed PR history in `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb..0b6e9803acfd8c70ce252fd6a1fc798e77dc8b9c`. It scanned 13 commits / approximately 106,186 bytes, exited 0, and reported no leaks. Official archive and executable SHA-256 values, full command, scope, exact HEAD, sanitized log and empty JSON report are in correction-06 `gitleaks-reviewed-head-*` files. This is not a scan of environment variables; no credential was probed or printed.

### Current-main reconciliation

Fetched `origin/main` at `bd9b3b15fca28419ada9862b8a65bac910edf169` (merge-base `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`). T04-E introduces `EC-GAP-002` over-stock cart rejection, `EC-GAP-003` customer address persistence/order snapshot fallback, and `EC-GAP-004` invalid discount date-window rejection; all remain proposals with novelty `NOT_VERIFIED`, and only the first two are shortlisted. T05-B's invalid/expired reset token redirect to `/forgot` is behaviorally distinct from these three recorded oracles; `EC-GAP-003` is adjacent in customer domain but addresses a different route and data flow. Historical `EC-C04` remains an overlap cue, so T05-B novelty stays unverified. No proposal was substituted, T04-E data changed, or novelty approved. PR #15 was reported mergeable/clean; no synchronization or rebase was needed. Full details: `current-main-and-t04e-reconciliation.md` in correction-06.

### Live-generation and scope gate

D-C1 remains `NOT_APPROVED`; live generation stays `BLOCKED_AUTHORIZATION`. No Gemini invocation, credential probe, candidate fabrication, human decision, Java/Selenium/Docker run, `docs/program/STATUS.json` edit, or historical evidence rewrite occurred. No CI PASS is claimed. Full Docker integration remains `NOT_RUN` because the runtime is not to be started for this task.
