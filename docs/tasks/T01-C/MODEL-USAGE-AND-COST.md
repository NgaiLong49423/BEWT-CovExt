# Model Usage and Cost

## Observed live usage

| Provider/model | Calls / attempts | Prompt | Token usage | Actual cost | Outcome |
|---|---:|---:|---:|---:|---|
| Gemini `gemini-3.1-flash-lite` | 1 / 1 | 7,412 characters | NOT_RETURNED | UNKNOWN | HTTP 400 `API_KEY_INVALID` |
| Fake test providers | Offline tests only | Synthetic | NOT_APPLICABLE | NOT_APPLICABLE | Excluded from study/model metrics |

The one user-authorized Gherkin request failed before returning structured content, candidate, or review checkpoint. It consumed the authorized request allowance; there was no retry and no Java Gemini call. Evidence: `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/run-result.json`, `model-generation-failure.json`, and `model-error-classification-correction.json`. The original evidence remains unchanged; the appended correction explains that a classifier incorrectly matched `rate` inside `generateContent`, not that the provider returned a rate-limit error.

## Approved limit versus observed spend

The authorization was capped at one request, zero retries, 60 seconds, 2,000 output tokens, and a maximum USD 0.02 cost ceiling. That is a limit, **not** evidence of actual spend. The failed provider response included no usage or billing metadata, so actual input/output tokens and cost remain UNKNOWN.

For context only, the official [Gemini Developer API pricing page](https://ai.google.dev/gemini-api/docs/pricing) currently lists Standard paid text input at USD 0.25 / 1M tokens and output at USD 1.50 / 1M tokens for Gemini 3.1 Flash-Lite. The CLI uses these published rates only for a conservative preflight estimate based on a deliberately high token-per-character factor and the maximum output allowance; the estimate is not a quote, provider billing record, or measured spend. Re-check rates and billing tier before any newly authorized run. The provider records usage metadata and estimated/actual cost only when available; missing values remain absent rather than fabricated.

## Implemented call controls

`framework/src/runtime/model-provider.ts` pins `gemini-3.1-flash-lite`, requires explicit authorization, bounds each provider instance to one call, sets `maxRetries: 0`, limits output tokens and timeout, preflights prompt size/cost, and records attempts, latency, status, token metadata and bounded error category. `framework/src/t01c-cli.ts` requires `--live-authorized`, validates run-level request count/cost ceilings, and reserves calls in append-only files before invocation so failed/crashed reservations are not replayed. Evidence for the failed request and model authorization is retained under `evidence/`.

No further external model request is authorized by the exhausted one-call allowance. A later live run needs a valid local credential and fresh explicit authorization with limits. Never commit credentials or local environment files.
