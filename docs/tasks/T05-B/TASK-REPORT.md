# T05-B — ExpressCart Live Gemini Generation and Human Review Checkpoint

- Task scope / acceptance gate: one bounded Gemini Gherkin request through the shared LangGraph to the real review checkpoint; stop before Java until a reviewer accepts the exact revision.
- Base branch + base SHA: `origin/main`, `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb` (fetched and verified 2026-11-10).
- Working branch: `feature/t05b-expresscart-live-generation`.
- Head commit (full 40-char SHA, task content commit): `048f9830616565358ea82d181cb276374a7ce537`.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/15 (draft; review gate only).
- Push status: PUSHED; remote branch matched `048f9830616565358ea82d181cb276374a7ce537` before PR creation. See current PR head after handoff metadata update.
- Runtime/commit/version tested: offline framework at T05-B task head; ExpressCart source pin `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19` (benchmark label `1.19`). No app runtime used.
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

## 2. Actual verification

Baseline verification at `6c7a0a84dc7625c66f33f8ce00ada44399f43588`: `npm ci` exit 0; build exit 0; unit tests 45/45 PASS; focused offline integration 11/11 PASS outside sandbox. After the T05-B-only telemetry and source-claim corrections, build PASS, provider unit 11/11, framework unit 47/47, and focused workflow integration 7/7 all passed; exact logs are indexed in `TEST-RESULTS.md`. The initial sandbox attempt had 10 PASS / 1 EPERM symlink failure. Full integration was intentionally not invoked while Agent 1 holds the Docker lease. Gemini was not called.

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
- Secret-pattern scan: to be repeated for this follow-up commit. No secret value was read or written; environment variable presence does not establish credential validity.
- Failed/blocked tasks and honest reasons: live provider call blocked pending fresh approval. `/forgot` page existence and visible-message behavior remain unverified and are excluded from the redirect-only proposal. No Gemini retry/probe. Full Docker integration not run because Agent 1 owns the runtime lease.

## 5. Evidence and reproduction

- Source/test paths: `framework/src/t01c-cli.ts`, `framework/src/runtime/model-provider.ts`, `framework/src/runtime/model-call-ledger.ts`, `framework/src/runtime/workflow.ts`, `framework/test/model-provider.test.ts`.
- Raw run/log/XML/screenshot paths: sanitized offline command logs at `docs/tasks/T05-B/evidence/verification/20261110-offline-01/`.
- Input data fixture and cleanup: no runtime fixture created.
- Exact reproducible commands and actual exits: see `TEST-RESULTS.md`.
- Known limitations/risks: credential validity, provider connectivity/quota/billing, successful generation and actual human review remain unverified. The route redirects to `/forgot`; the generic route requires an enabled DB page slug and no fixture establishes it, so the proposal does not assert page/message visibility. Do not infer current errors from historical T01-C failures.

## 6. Review request

- What the Team Lead needs to decide: approve or deny the one bounded live call using the redirect-only assertion. Novelty and the behavior's research value still require review. The USD 0.02 limit is a preflight estimate, not a guaranteed billed maximum.
- Suggested next task if accepted: provide fresh D-C1 authorization; if one real call succeeds, stop at the durable human review checkpoint and await a revision-bound reviewer decision.
- GitHub PR diff URL and file paths: https://github.com/NgaiLong49423/BEWT-CovExt/pull/15/files; inspect the six task docs and four verification logs under `docs/tasks/T05-B/`.
