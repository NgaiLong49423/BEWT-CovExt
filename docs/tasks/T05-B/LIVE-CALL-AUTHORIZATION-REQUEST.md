# T05-B — Gemini Live Call Authorization Request

**Current state:** The Team Lead's D-C1 approval for one bounded Gemini Gherkin API request was used. That request failed with HTTP 400 `API_KEY_INVALID`; the authorization is consumed and no further invocation is authorized.

## Proposed bounded request

| Limit | Proposal |
|---|---|
| Provider/model | Google Gemini Developer API, `gemini-3.1-flash-lite` (the model already pinned in `framework/src/runtime/model-provider.ts`) |
| Purpose | Generate exactly one ExpressCart Gherkin candidate from the source-backed invalid/expired reset-token gap; stop at the human review checkpoint |
| Maximum API invocations | 1 total; no Java generation or repair calls included |
| Retries | 0, including automatic provider retries |
| Timeout | 60 seconds |
| Maximum output | 2,000 tokens |
| Configured per-call / task preflight limit | USD 0.02 estimated cost limit; this is not an independently enforced provider billing ceiling |
| Input bound | 8,000 Unicode characters; local preflight rejects requests beyond the provider's existing limit |
| Expiry | 2026-11-11 23:59 Asia/Saigon; approval expires sooner if revoked or source/request changes |
| Credential channel | Existing local process secret binding `GEMINI_API_KEY`; the value must never be displayed, copied into artifacts, or committed. Its presence is not evidence of validity. |
| Allowed effects | Record sanitized request evidence and model telemetry; if successful, persist one PROPOSED candidate and the actual review packet/checkpoint |
| Forbidden effects | No Java generation, candidate acceptance, Docker/Selenium, repair, or any second provider request |

## Cost preflight

As of 2026-11-10, Google's model documentation lists `gemini-3.1-flash-lite` as an available stable model. Its Developer API pricing page lists Free Tier input/output as free of charge and Paid Tier Standard text input/output at $0.25/$1.50 per million tokens. Assuming the Paid Tier Standard rate, 8,000 prompt characters × the code's 4-token-per-character estimate (32,000 input tokens), and the full 2,000-token output allowance, the **preflight estimate** is USD 0.011. The code's USD 0.02 threshold is a conservative request budget estimate, not a provider-enforced hard billing cap; account tier, actual invoice, and billing guarantees were not independently checked. No grounding or other billed tools are requested. Recheck availability and prices immediately before any later authorized call.

Pricing source: [Google Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing), accessed 2026-11-10.
Model source: [Google Gemini 3.1 Flash-Lite model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), accessed 2026-11-10.

## Approval record

- Team Lead / approver: Team Lead, as identified in the user-provided D-C1 approval text attached to this task. No signature or separate external approval artifact was supplied.
- Approval decision and receipt timestamp: `APPROVED`; received and recorded at `2026-11-10 02:52:59 Asia/Ho_Chi_Minh` (`2026-11-09 19:52:59 UTC`). This is the agent's actual receipt/recording time, not an asserted Team Lead signing time.
- Approved model and exact call limit: Google Gemini Developer API `gemini-3.1-flash-lite`; maximum one live invocation total; automatic/manual retries zero; 60-second timeout; 2,000 generated output-token cap; 8,000 Unicode-character prompt cap.
- Approved cost ceiling and expiry: USD 0.02 configured preflight estimate, explicitly not a provider-enforced billing ceiling; expires `2026-11-11 23:59 Asia/Ho_Chi_Minh` or earlier on revocation or an approved source/request/model/limit change.
- Credential channel confirmed without sharing its value: `GEMINI_API_KEY` was present in the current local process environment. Its value was not displayed or read, and no provider validation/probe was made; validity remains unknown until the single authorized generation request.
- Approval source: the user-provided D-C1 approval text in this task. No signature, provider response, credential-verification result, or external approval artifact is claimed.

The live request remains contingent on successful offline preflight below. D-C1 approval does not approve candidate novelty, oracle validity beyond the source-backed redirect, or a human review decision.

## Offline preflight — 2026-11-10 02:57 Asia/Ho_Chi_Minh

- Repository state: fetched `origin/main` at `bd9b3b15fca28419ada9862b8a65bac910edf169`; branch and PR #15 HEAD are the approved `367de0545221d8521e5bd49e5cb8a6bb5d99a932`. PR is OPEN/DRAFT and reported MERGEABLE. No live-run source or request-scope changes are present; prior correction-06 reconciles T04-E and its distinct proposals.
- Model/pricing: Google lists stable model ID `gemini-3.1-flash-lite`. Current official Standard Paid Tier text rates are $0.25/M input and $1.50/M output. Sources: [model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) and [pricing](https://ai.google.dev/gemini-api/docs/pricing), checked 2026-11-10.
- Credential channel: `GEMINI_API_KEY` presence check returned true. Its value was not displayed/read, and no credential/provider probe was made. Validity is unknown before the authorized generation request.
- Source pin/oracle: offline ExpressCart identity verifier passed for source commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19`, 197 source files, build-context digest `3fb02b3a0a0a0bc5f7c507dad4076961d9e1bbc139485e3cc122daa8a135f01a`; reset route SHA-256 `74c7ecfdf38e6ad9038ae0f2cc8f89969331f4420bfa491348c5e8b2f6d26abe`. Claim remains redirect to `/forgot` only; novelty `UNVERIFIED`.
- Offline verification on the source at execution HEAD `367de0545221d8521e5bd49e5cb8a6bb5d99a932`: build exit 0; provider unit 11/11; framework unit 47/47; focused LangGraph workflow/model generation integration 7/7 (offline fake provider/checkpoint); source identity verifier exit 0. Node `v24.19.0`, npm `11.17.0`. Full sanitized logs and exits: `evidence/verification/20261110-live-01/`.
- Exact production prompt construction was reproduced offline with identical pinned baseline/gap/source-context logic and a same-length placeholder run UUID. It measured 7,900 Unicode characters and SHA-256 `ee28b2bfd6511190eec2b2fb70d14204894141664be538fe0834c74b5c85abc6`; actual per-run hash will be recorded by production telemetry because the real run UUID is generated at execution. At the approved 2,000 output-token cap and conservative 4 input tokens/character, estimated maximum is `(7,900 × 4 × $0.25 + 2,000 × $1.50)/1,000,000 = $0.0109`, below $0.02. Prompt-preflight script/output are under the same evidence directory.
- Call controls verified in production code: CLI budget will be explicitly set to one request and USD 0.02; Gherkin provider defaults to 2,000 output tokens, enforces 8,000 prompt characters and 60 seconds, and configures `maxRetries: 0`. The append-only model-call ledger reserves before provider invocation. `start` runs through the actual LangGraph and expects `AWAITING_HUMAN_REVIEW`; Java provider is only constructed in the separate post-review command. The real interrupt/checkpoint path is covered by focused offline integration tests.
- Planned single invocation command (run from `framework/`): `npm.cmd run agent:t01c -- start expresscart --live-authorized --max-api-requests=1 --max-cost-usd=0.02`. If it fails for any reason, the reservation remains consumed and no retry will be made.

## Authorized execution result

The single authorized command was executed at `2026-11-09T19:59:54.5011168Z` on source execution commit `367de0545221d8521e5bd49e5cb8a6bb5d99a932`. It made one Gemini request (`calls=1`, `attempts=1`) and received HTTP 400 `API_KEY_INVALID`. Provider status is `BLOCKED` / `AUTHORIZATION`; LangGraph workflow status is `FAILED`; CLI exit code is 1. The one-call authorization is consumed. No retry or credential probe followed.

Prompt was 7,900 characters; actual prompt SHA-256 `b558e0640e0003de25e136075aabd73bca3b45da01356e5d4095f9e3afad0fbc`; estimated maximum cost USD 0.0109. Token usage was not returned and actual billed cost is unknown. No candidate, candidate ID, human-review interruption/checkpoint or review packet was created; Java/Selenium/Docker were not run. Novelty stays `UNVERIFIED`. Status: `LIVE_GENERATION_FAILED`. Full details and immutable logs/ledger paths are in `evidence/verification/20261110-live-01/live-call-outcome.md` and the native run directory recorded there.

Any further call requires new explicit Team Lead authorization; do not retry this consumed call.

## Post-failure credential setup review — offline only

- Application configuration: `framework/src/runtime/model-provider.ts` passes `options.apiKey ?? process.env.GEMINI_API_KEY` into `ChatGoogleGenerativeAI`; no `.env` file, credential value, key prefix, fingerprint, or key metadata was inspected. The `GEMINI_API_KEY` process variable was present at the time of this review, but the last authorized request returned `API_KEY_INVALID`.
- The credential type and account/project status remain unknown. No provider validation probe was performed.
- Google's [Gemini API key guidance](https://ai.google.dev/gemini-api/docs/api-key) says Gemini API requests from Standard keys will be rejected starting September 2026; new keys created in Google AI Studio are Auth keys by default. Because the failed request occurred after that scheduled cutover, a Standard key is a **possible, unconfirmed cause**. Revocation, a malformed/stale value, project/API configuration, or other key problems are not ruled out by this error.
- Current credential readiness for a fresh authorization decision: **NOT READY** until the Team Lead privately reviews/configures a current Auth key. No new call is authorized by this status update.

### Safe local replacement steps for the Team Lead

1. Open Google AI Studio's API Keys page and check the key's type locally; do not share the key or a screenshot containing it.
2. If needed, create a replacement key there. Google's guidance says newly created AI Studio keys are Auth keys by default; confirm the displayed type is Auth.
3. On Windows, update the user-level `GEMINI_API_KEY` through **System Properties → Advanced → Environment Variables**, using a private local session. Do not put the key in chat, repository files, command-line arguments, shell history, or a committed `.env` file. Restart the terminal/Codex process that launches the agent so it inherits the updated environment.
4. Do not validate the replacement by making an API request now. Any future request requires a separate fresh, explicit D-C1 approval with its own limits. After an authorized successful use, review usage in Google AI Studio/Cloud billing and revoke obsolete keys as appropriate.

This setup guidance is based on official Google documentation and does not identify the rejected key's type or establish the root cause.

The source-backed proposal is deliberately limited to asserting the redirect destination `/forgot`; it does not assert that the destination page exists or that a message is visible. Novelty remains unverified. The one approved call failed before candidate creation; no candidate review decision exists. Cost approval alone does not establish candidate acceptance.
