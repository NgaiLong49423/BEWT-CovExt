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
| Gemini live Gherkin generation in initial task execution | NOT_RUN | Historical result before fresh D-C1 authorization; current authorized invocation and outcome are recorded in the section below. | — |

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
| live-01 | D-C1 approval receipt, offline preflight, one authorized live request, native ledger/failure evidence and persisted workflow status. | `evidence/verification/20261110-live-01/` and additive native run directory under `docs/tasks/T01-C/evidence/` |
| final-preflight-01 | Exact-current-source offline build/tests, current-main/T04-F/G reconciliation, exact-head Sonar check, redacted Gitleaks scans and blocked read-only GCE preflight. | `evidence/verification/20261110-final-preflight-01/` |

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

D-C1 was explicitly approved for one bounded invocation and recorded at receipt time. Exactly one production CLI/LangGraph Gemini request was made; it returned HTTP 400 `API_KEY_INVALID`, with telemetry `calls=1`, `attempts=1`, `errorCategory=AUTHORIZATION`, provider status `BLOCKED`, and workflow status `FAILED`. The one-call authorization is consumed; no retry or separate credential probe occurred. No candidate or human-review checkpoint was produced, so the status is `LIVE_GENERATION_FAILED`, not `HUMAN_REVIEW_PENDING`. Java/Selenium/Docker were not run; `docs/program/STATUS.json` and historical evidence were not modified. Full Docker integration remains `NOT_RUN`.

## D-C1 preflight and single live invocation

Offline preflight ran on execution HEAD `367de0545221d8521e5bd49e5cb8a6bb5d99a932` with Node `v24.19.0` / npm `11.17.0`, current `origin/main` `bd9b3b15fca28419ada9862b8a65bac910edf169`, and PR #15 OPEN/DRAFT/MERGEABLE. The key-presence check returned true without reading or displaying its value; no separate provider validation was performed. Official Google docs listed stable model `gemini-3.1-flash-lite` at Standard Paid Tier text rates $0.25/M input and $1.50/M output. The source identity verifier passed for pinned ExpressCart commit `b31302f4e99c3293bd742c6d076a721e168118b0` / package `1.1.19`; the route assertion remains redirect-only and novelty `UNVERIFIED`.

| Command (from `framework/`) | Exit | Result | Sanitized evidence |
|---|---:|---|---|
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-live-01/framework-build-02.txt` |
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 11/11 | `evidence/verification/20261110-live-01/provider-unit-02.txt` |
| `npm.cmd test` | 0 | PASS, 47/47 | `evidence/verification/20261110-live-01/framework-unit-02.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/workflow.test.ts` | 0 | PASS, 7/7; offline fake provider plus real LangGraph checkpoint behavior | `evidence/verification/20261110-live-01/focused-workflow-integration-02.txt` |
| `npx.cmd tsx ../docs/tasks/T05-B/tools/verify-expresscart-source-identity.mts` | 0 | PASS; 197 source files and pinned build-context digest | `evidence/verification/20261110-live-01/source-identity-02.txt` |
| `npx.cmd tsx ../docs/tasks/T05-B/evidence/verification/20261110-live-01/prompt-preflight.mts` | 0 | Offline exact prompt-structure reproduction using a same-length placeholder run UUID; 7,900 chars, SHA-256 `ee28b2bfd6511190eec2b2fb70d14204894141664be538fe0834c74b5c85abc6`, estimated maximum USD 0.0109 | `evidence/verification/20261110-live-01/prompt-preflight-output-02.txt` |

The production provider enforces 8,000 input characters, max 2,000 output tokens, 60-second timeout and `maxRetries: 0`; CLI budget was explicitly set to 1 request / USD 0.02. The actual invocation command was `npm.cmd run agent:t01c -- start expresscart --live-authorized --max-api-requests=1 --max-cost-usd=0.02`. It began `2026-11-09T19:59:54.5011168Z` and completed `2026-11-09T19:59:59.3203601Z`; execution commit was `367de0545221d8521e5bd49e5cb8a6bb5d99a932`. Actual prompt was 7,900 characters, SHA-256 `b558e0640e0003de25e136075aabd73bca3b45da01356e5d4095f9e3afad0fbc`; telemetry estimated maximum cost USD 0.0109. Google returned HTTP 400 `API_KEY_INVALID`. No input/output token usage was reported and actual billed cost is unknown. A 60-second timeout did not occur.

The append-only ledger reserved `call-01` before the provider request and recorded one terminal result; retries allowed were zero. CLI exited 1 because the graph finished `FAILED` before the review interruption. No `model-generation.json`, candidate ID, Gherkin candidate, human-review request/checkpoint, review decision, or Java output exists. Read-only CLI status returned `FAILED` with no checkpoint and no decisions. Native run ID `t01c-866fcff6-aca1-4110-8ad6-bff250d9c521` is recorded under `docs/tasks/T01-C/evidence/`; this is a new additive run directory. Its failure and reservation are not retried or rewritten. Full result and hashes: `evidence/verification/20261110-live-01/live-call-outcome.md` and `live-call-provenance.txt`.

Disposition is `LIVE_GENERATION_FAILED`. The approved call is consumed. Any future attempt requires fresh explicit Team Lead authorization. This is a live provider failure, not an offline fake-provider result and not CI.

## Post-failure credential remediation review

Offline inspection confirms the production provider reads `options.apiKey ?? process.env.GEMINI_API_KEY` and passes it explicitly to installed `@langchain/google-genai` 2.3.4. In the current investigation shell, `GEMINI_API_KEY` is present in Process and User scope and compares equal in memory; a harmless Node child inherited its presence. These facts do not establish the credential used by the earlier outside-sandbox request or the Team Lead's other application. No secret content or metadata was read, displayed, copied, fingerprinted, or validated.

Google's current [Gemini API key migration guidance](https://ai.google.dev/gemini-api/docs/api-key) says Standard keys are scheduled for rejection starting September 2026 and new AI Studio keys are Auth keys by default. A Standard key is one possible explanation for the error, not a confirmed root cause; key type, project state, revocation status, working-context equality, and historical proxy/gateway state were not inspected. The root cause is **UNDETERMINED**. Do not replace the key unless private review demonstrates it is needed. Full hypothesis matrix and safe comparison procedure: `evidence/verification/20261110-auth-investigation-01/root-cause-investigation.md`. No credential validation request or new live invocation was made. Any future attempt requires a separate fresh D-C1 authorization.

## Deep authentication investigation — 2026-11-10

Offline only; zero Gemini requests, probes, Java/Selenium/Docker execution, or environment changes. The historical D-C1 remains consumed by exactly one call. The request received HTTP 400 `API_KEY_INVALID`, proving an HTTP responder answered but not whether it was Google or an intermediary; response headers and TLS peer evidence were not retained. The historical invocation used the authorized outside-sandbox execution path, so sandbox network denial is not supported by that HTTP response.

The exact BEWT path passes `options.apiKey ?? process.env.GEMINI_API_KEY` explicitly to the SDK, so `GOOGLE_API_KEY` cannot override it. The optional SDK LangSmith gateway base URL and the historical proxy route are not established for the old execution context. Current Process/User equality and Node inheritance do not prove equality with either historical or known-working credentials. Root cause: `UNDETERMINED`; Standard-key cutoff remains a possible explanation only.

Evidence: `evidence/verification/20261110-auth-investigation-01/`. No source change is indicated. A new live request requires a separate fresh explicit Team Lead D-C1 decision.

## Targeted cross-project auth correction — 2026-11-10

Mâm Xanh source resolves its key from Spring configuration with environment fallback and invokes `.strip()` before `Client.builder().apiKey(...)`. Its Docker Compose source injects `${GEMINI_API_KEY:-}` into the service environment; no Docker command or container inspection was done. Mâm Xanh's configured model is `gemini-3.8-flash`, compared with BEWT's historical `gemini-3.1-flash-lite`. The Mâm Xanh source configures API-key auth and no explicit base URL/Vertex flag; its actual runtime endpoint is not observed.

Installed BEWT `@langchain/google-genai` 2.3.4 passes the explicit API key unchanged to `@google/generative-ai` 0.24.1, whose inspected request path adds it as `x-goog-api-key` without trimming. Current PowerShell Process and Windows User values compare `CONTEXT_EQUAL`; current PowerShell and a harmless Node child report `KEY_PRESENT` and `SURROUNDING_WHITESPACE_ABSENT`. These are current context findings only. Historical elevated-process and Mâm Xanh container values were not read. Accordingly, the latent normalization mismatch is confirmed and fixed, but its role in the historical HTTP 400 remains unproven; overall root cause stays `UNDETERMINED`.

| Command (from `framework/`) | Exit | Result | Sanitized evidence |
|---|---:|---|---|
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 12/12; synthetic dummy key only | `evidence/verification/20261110-auth-investigation-02/provider-unit.txt` and `provider-unit-exit.txt` |
| `npm.cmd run build` | 0 | PASS, TypeScript build | `evidence/verification/20261110-auth-investigation-02/framework-build.txt` and `framework-build-exit.txt` |
| `npm.cmd test` | 0 | PASS, 48/48 | `evidence/verification/20261110-auth-investigation-02/framework-unit.txt` and `framework-unit-exit.txt` |

Node `v24.19.0`, npm `11.17.0`. Changed source SHA-256 values and command provenance are in `execution-provenance.txt`. These are offline local results, not provider results or CI. No Gemini request, probe, Docker, Java generation, or Selenium action occurred. The one-call D-C1 remains consumed.

## Final offline verification and PR preflight — 2026-11-10

The following checks were re-executed against exact source execution commit `5d16df06bac66f9f6ecb651f89ad4e3a0ae345e9` (tree `3a4bc8a80213f8a775f2ef76ac18f5cdfed455c7`), before adding this round's evidence-only documentation. Node `v24.19.0`, npm `11.17.0`, Git `2.55.0.windows.3`.

| Command (from `framework/`) | Exit | Result | Immutable sanitized evidence |
|---|---:|---|---|
| `npm.cmd run build` | 0 | PASS | `evidence/verification/20261110-final-preflight-01/framework-build.txt` and `framework-build-exit.txt` |
| `npx.cmd tsx --test test/model-provider.test.ts` | 0 | PASS, 12/12 | `evidence/verification/20261110-final-preflight-01/provider-unit.txt` and `provider-unit-exit.txt` |
| `npm.cmd test` | 0 | PASS, 48/48 | `evidence/verification/20261110-final-preflight-01/framework-unit.txt` and `framework-unit-exit.txt` |
| `npx.cmd tsx --test test/integration/t01c-model-generation.test.ts test/integration/workflow.test.ts` | 0 | PASS, 7/7; offline fake provider and real LangGraph checkpoint behavior | `evidence/verification/20261110-final-preflight-01/focused-workflow-integration.txt` and `focused-workflow-integration-exit.txt` |
| `npx.cmd tsx ../docs/tasks/T05-B/tools/verify-expresscart-source-identity.mts` | 0 | PASS; pinned ExpressCart commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package 1.1.19, 197 files | `evidence/verification/20261110-final-preflight-01/expresscart-source-identity.txt` and `expresscart-source-identity-exit.txt` |

Exact execution provenance, relevant source Git blob IDs/SHA-256 values, per-log SHA-256, and worktree caveat are in `evidence/verification/20261110-final-preflight-01/execution-provenance.txt`. Eleven pre-existing modified files under `experiments/expresscart/agent/dist/**` and three untracked offline T01-C evidence directories were left untouched and excluded. These are local checks, not CI. No live Gemini request, credential probe, Java, Selenium, or Docker was run.

### Current PR quality/security checks

- SonarCloud check run `129441487395` is success / Quality Gate PASS for exact PR HEAD `5d16df06bac66f9f6ecb651f89ad4e3a0ae345e9` (0.0% new-code duplication). It must be rechecked for any later final pushed SHA. Details: `evidence/verification/20261110-final-preflight-01/sonarqube-current-head.md`.
- Gitleaks 8.30.1, `--redact=100`: complete committed PR history `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb..5d16df06bac66f9f6ecb651f89ad4e3a0ae345e9` (21 commits; exit 0; no leaks), plus final pre-push T05-B working-tree directory scan after report/index/hash-manifest additions (exit 0; no leaks). Logs, empty JSON reports, exits and checksums are under `evidence/verification/20261110-final-preflight-01/`; final docs scan outputs are `gitleaks-prepush-docs.txt`, `gitleaks-prepush-docs-exit.txt`, and `gitleaks-prepush-docs-report.json`.
- Full framework integration remains NOT_RUN. The `npm test` suite and focused integration above are offline. The prescribed Compute Engine read-only preflight could not run because `gcloud` is unavailable; VM status is NOT_VERIFIED. No Docker command was attempted, and no runtime lease was transferred.

### Current-main and live authorization status

Fetched `origin/main` is `ef8e5597c4ca7359ccd0e1241d079832024048a9`; PR #15 is OPEN/DRAFT/MERGEABLE and GitHub `mergeStateStatus=CLEAN`. The merge base is `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`. The latest T04-F/G/C and PR #18 review-package changes have no overlapping T05-B source/data/schema/task paths. `EC-GAP-002/003/004` remain proposals, not decisions; the T05-B redirect-only proposal remains distinct, with historical `EC-C04` still an unresolved novelty cue. See `evidence/verification/20261110-final-preflight-01/current-main-reconciliation.md`.

The prior single live attempt remains failed with HTTP 400 `API_KEY_INVALID`; its D-C1 was consumed, retry count is zero, candidate count is zero, no human-review checkpoint exists, and billed cost remains unknown. Current retry state is `BLOCKED_AUTHORIZATION`; no additional call is authorized. Historical provider failure is not reclassified as a successful live result.

## New bounded invocation

PR #15 source HEAD `036e3d4ce6b6bf583e479fb1177ffe9943cdff0a`: offline provider/ledger tests 15/15 PASS, build and source identity exit 0, prompt preflight exit 0. One newly approved live request exited 1 with HTTP 400 `API_KEY_INVALID`; no retry, candidate, checkpoint or token usage. See `evidence/verification/20261110-new-authorized-attempt-01/OUTCOME.md` and its native ledger. No Docker or Java/Selenium ran. Billed cost unknown.
