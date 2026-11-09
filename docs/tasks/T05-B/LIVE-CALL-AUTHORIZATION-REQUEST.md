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

## Approval record — intentionally blank

- Team Lead / approver:
- Approval decision and timestamp:
- Approved model and exact call limit:
- Approved cost ceiling and expiry:
- Credential channel confirmed without sharing its value:

Unless this record is completed with a fresh Team Lead decision, the required result is `MODEL_AUTHORIZATION_REQUIRED`; do not probe the credential or provider.

The source-backed proposal is deliberately limited to asserting the redirect destination `/forgot`; it does not assert that the destination page exists or that a message is visible. Novelty remains unverified. No fresh D-C1 approval is recorded, so the live call remains blocked. Cost approval alone does not establish a reviewer decision on the candidate.
