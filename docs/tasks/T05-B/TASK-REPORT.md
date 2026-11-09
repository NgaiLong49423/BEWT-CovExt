# T05-B — ExpressCart Live Gemini Generation and Human Review Checkpoint

- Task scope / acceptance gate: one bounded Gemini Gherkin request through the shared LangGraph to the real review checkpoint; stop before Java until a reviewer accepts the exact revision.
- Base branch + base SHA: `origin/main`, `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb` (fetched and verified 2026-11-10).
- Working branch: `feature/t05b-expresscart-live-generation`.
- Execution commit (source fix; exact local tests ran against this commit): `ffa19f6f1d890269cd20397fbaa66ba1ed66963e`.
- Reviewed PR HEAD at the start of this correction round: `72103d17bc4005a661d6fa03d862e1364c283a88` (Sonar duplication analysis).
- Evidence commit: `06c163b747efebd1ce4cfc5f509b2012d132586c` (`docs(t05b): record independent correction verification`), containing correction-05 test logs, provenance, Sonar results and secret-scan outputs.
- Latest completed Sonar analysis at final verification: `ba71058b9b277497e67393d4ab4904b3c3c10e26`, Quality Gate PASS (check run `129371637876`). The subsequent current PR HEAD is documentation-only; exact-head Sonar status is `NOT_VERIFIED`. The final local/origin/PR HEAD is reported in the handoff.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/15 (draft; review gate only).
- Push status: source fix and evidence/report follow-ups pushed to existing branch PR #15. No new PR was created.
- Runtime/commit/version tested: offline framework at execution commit `ffa19f6f1d890269cd20397fbaa66ba1ed66963e`; ExpressCart source pin `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19` (benchmark label `1.19`). No app runtime used.
- Status proposed by Agent: `BLOCKED_AUTHORIZATION`. The proposed assertion is limited to the source-backed `/forgot` redirect; page/message visibility and research novelty remain unverified. No Gemini candidate was generated.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/tasks/T05-B/LIVE-CALL-AUTHORIZATION-REQUEST.md` | Bounded request and explicit approval record | Fresh approval must specify model, call count, retries, timeout, token cap, cost ceiling, expiry and secret channel |
| `docs/tasks/T05-B/GENERATION-REQUEST-PROPOSAL.md` | Source-pinned minimal Gherkin request proposal | Makes the intended single call and source provenance reviewable offline |
| `docs/tasks/T05-B/SOURCE-AND-SECURITY-AUDIT.md` | Offline workflow/provider/ledger/HITL/security findings and source audit | Demonstrates the shared path and distinguishes the proven redirect from unverified page/message visibility |
| `docs/tasks/T05-B/PROPOSED-STATUS-UPDATE.json` | Task-scoped proposed status only | Preserve the explicitly protected global status file |
| `docs/tasks/T05-B/TEST-RESULTS.md` | Commands, outcomes and evidence index | Separate offline, live-provider and Docker runtime claims |
| `docs/tasks/T05-B/TASK-REPORT.md` | Team Lead handoff | Report scope, results, limits and review decision needed |
| `framework/src/runtime/model-provider.ts`, `framework/test/model-provider.test.ts` | Renamed token-derived `actualCostUsd` telemetry to `estimatedCostUsd`; added numeric estimate guard and regression test | Token usage × list price is not independent billing evidence |
| `framework/src/t01c-cli.ts` | Clarified that the configured USD limit is a preflight estimate, not a verified provider cost ceiling | Avoids overstating the budget guarantee |
| `docs/tasks/T05-B/tools/verify-expresscart-source-identity.mts` | Reproducible offline source pin/build-context verifier | Captures independently rerun source identity evidence without Docker |
| `framework/src/runtime/model-provider.ts` | Shared `successfulGeminiTelemetry` for both Gemini providers | Removes Sonar-confirmed duplicated token-usage and success telemetry mapping without changing thresholds or exclusions |
| `docs/tasks/T05-B/evidence/verification/20261110-correction-05/**` | Execution provenance, sanitized command logs, SHA-256 digests and Sonar analysis record | Ties local verification and the Quality Gate result to exact commits |

## 2. Actual verification

The independent review identified 9.8% new-code duplication on commit `72103d17bc4005a661d6fa03d862e1364c283a88`, from two production-code blocks in `model-provider.ts` (Sonar lines 406–416 and 467–477). A shared helper removed the duplication. SonarCloud reported Quality Gate PASS and 0.0% new-code duplication on execution commit `ffa19f6f1d890269cd20397fbaa66ba1ed66963e`, and again on subsequent docs/evidence commits including latest completed analysis commit `ba71058b9b277497e67393d4ab4904b3c3c10e26` (check run `129371637876`). The current PR HEAD is a still-later documentation-only update; no Sonar run was attached to that exact HEAD at final verification, so its exact-head analysis status is `NOT_VERIFIED`. Production source is unchanged since the passing analyses. On execution commit `ffa19f6f1d890269cd20397fbaa66ba1ed66963e`, build PASS (exit 0), provider unit 11/11, framework unit 47/47, and focused offline workflow integration 7/7. Node/npm versions, commit/tree/source hashes, exact commands/exits, status snapshots, and per-log SHA-256 digests are in correction-05 evidence. This is local evidence, not CI. Earlier correction-02/03/04 results and the original sandbox symlink failure remain recorded in `TEST-RESULTS.md` and their evidence folders. Full integration was intentionally not invoked while Agent 1 holds the Docker lease. Gemini was not called.

## 3. Research impact

- Apps affected, source/version pins: ExpressCart only for this task, upstream commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19`; no change to the 8-app / 40-case program scope.
- Candidate IDs and statuses before → after: no T05-B candidate → not generated; proposed scope is redirect-only and source-backed, while research novelty remains unverified.
- RQ1/RQ2/RQ3/RQ4 measurable changes: none. RQ1/RQ2/RQ3 unchanged; no new live model usage to add to RQ4.
- Gate status before → proposed after: no program gate update proposed. T05-B live call is `BLOCKED_AUTHORIZATION`; generation and human review are `NOT_RUN`.
- Dataset/metrics artifacts updated: none.
- Denominator and sampling caveats: zero live invocations, zero candidates; offline/fake tests are implementation checks only.

## 4. Safety & integrity

- `bewt-original/` touched? NO.
- Docker/project resources touched? NONE; no Docker commands were run.
- Existing unrelated local dirty files preserved? YES. Eleven pre-existing modified files under `experiments/expresscart/agent/dist/` were left untouched and excluded.
- Secret scan: Gitleaks `8.30.1`, official release archive checksum verified; committed PR history and staged T05-B correction docs/evidence both scanned with `--redact=100`, exit 0, no leaks. Together these scans covered the complete proposed PR diff at evidence preparation. Scan command/version/scope/checksum, redacted logs and empty reports are under `docs/tasks/T05-B/evidence/verification/20261110-correction-05/`. Scanner did not inspect process environment; no credential value was read or written. No false positives required justification.
- Failed/blocked tasks and honest reasons: live provider call blocked pending fresh approval. `/forgot` page existence and visible-message behavior remain unverified and are excluded from the redirect-only proposal. No Gemini retry/probe. Full Docker integration not run because Agent 1 owns the runtime lease.

## 5. Evidence and reproduction

- Source/test paths: `framework/src/t01c-cli.ts`, `framework/src/runtime/model-provider.ts`, `framework/src/runtime/model-call-ledger.ts`, `framework/src/runtime/workflow.ts`, `framework/test/model-provider.test.ts`.
- Raw run/log/XML/screenshot paths: earlier logs at `docs/tasks/T05-B/evidence/verification/20261110-offline-01/` and correction-02/03/04; exact final-source execution logs, provenance, and digests at `docs/tasks/T05-B/evidence/verification/20261110-correction-05/`.
- Input data fixture and cleanup: no runtime fixture created.
- Exact reproducible commands and actual exits: see `TEST-RESULTS.md`.
- Known limitations/risks: credential validity, provider connectivity/quota/billing, successful generation and actual human review remain unverified. The route redirects to `/forgot`; the generic route requires an enabled DB page slug and no fixture establishes it, so the proposal does not assert page/message visibility. Do not infer current errors from historical T01-C failures.

## 6. Review request

- What the Team Lead needs to decide: approve or deny the one bounded live call using the redirect-only assertion. Novelty and the behavior's research value still require review. The USD 0.02 limit is a preflight estimate, not a guaranteed billed maximum.
- Suggested next task if accepted: provide fresh D-C1 authorization; if one real call succeeds, stop at the durable human review checkpoint and await a revision-bound reviewer decision.
- GitHub PR diff URL and file paths: https://github.com/NgaiLong49423/BEWT-CovExt/pull/15/files; inspect task-scoped docs/evidence and the focused production change in `framework/src/runtime/model-provider.ts`. No unrelated dirty files are included.
