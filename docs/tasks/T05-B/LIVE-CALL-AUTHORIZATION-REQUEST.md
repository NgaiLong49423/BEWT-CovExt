# T05-B — Gemini Live Call Authorization Request

**Decision required:** Team Lead approval for one new Gemini Gherkin API request. This proposal is not authorization and no request has been made.

## Proposed bounded request

| Limit | Proposal |
|---|---|
| Provider/model | Google Gemini Developer API, `gemini-3.1-flash-lite` (the model already pinned in `framework/src/runtime/model-provider.ts`) |
| Purpose | Generate exactly one ExpressCart Gherkin candidate from the source-backed invalid/expired reset-token gap; stop at the human review checkpoint |
| Maximum API invocations | 1 total; no Java generation or repair calls included |
| Retries | 0, including automatic provider retries |
| Timeout | 60 seconds |
| Maximum output | 2,000 tokens |
| Per-call / task ceiling | USD 0.02 maximum for this request |
| Input bound | 8,000 Unicode characters; local preflight rejects requests beyond the provider's existing limit |
| Expiry | 2026-11-11 23:59 Asia/Saigon; approval expires sooner if revoked or source/request changes |
| Credential channel | Existing local process secret binding `GEMINI_API_KEY`; the value must never be displayed, copied into artifacts, or committed. Its presence is not evidence of validity. |
| Allowed effects | Record sanitized request evidence and model telemetry; if successful, persist one PROPOSED candidate and the actual review packet/checkpoint |
| Forbidden effects | No Java generation, candidate acceptance, Docker/Selenium, repair, or any second provider request |

## Cost preflight

At the 8,000-character input limit, existing code conservatively budgets four input tokens per character (32,000 tokens). At the current Google published standard rates for Gemini 3.1 Flash-Lite ($0.25 per million input tokens and $1.50 per million output tokens), plus the full 2,000-token output allowance, the estimated ceiling is **USD 0.011**. The proposed USD 0.02 cap leaves headroom while remaining an absolute per-call ceiling. No grounding or other billed tools are requested. Prices must be rechecked immediately before any later authorized call; this snapshot is not a quote or proof of billing configuration.

Pricing source: [Google Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing), accessed 2026-11-10.

## Approval record — intentionally blank

- Team Lead / approver:
- Approval decision and timestamp:
- Approved model and exact call limit:
- Approved cost ceiling and expiry:
- Credential channel confirmed without sharing its value:

Unless this record is completed with a fresh Team Lead decision, the required result is `MODEL_AUTHORIZATION_REQUIRED`; do not probe the credential or provider.
