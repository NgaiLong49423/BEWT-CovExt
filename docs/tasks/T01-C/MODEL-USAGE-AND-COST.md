# Model Usage and Cost

## Observed live usage

| Provider/model | Calls / attempts | Prompt | Token usage | Actual cost | Outcome |
|---|---:|---:|---:|---:|---|
| Gemini `gemini-3.1-flash-lite` | 2 / 2 actual invocations | 7,412 and 7,841 characters | NOT_RETURNED | UNKNOWN | HTTP 400 `API_KEY_INVALID`; later `fetch failed` |
| Fake test providers | Offline tests only | Synthetic | NOT_APPLICABLE | NOT_APPLICABLE | Excluded from study/model metrics |

The original explicitly authorized Gherkin request failed with `API_KEY_INVALID` before returning structured content, candidate, or review checkpoint: `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/`. A later fresh, bounded authorization permitted one call using the pinned source excerpt, baseline metadata, and historical topics. Three attempts stopped locally at `MODEL_INPUT_BUDGET_EXCEEDED` with `calls=0` (8,756, 9,054, and 9,851 characters); the passing preflight was 7,841 characters, after which exactly one provider invocation failed with `fetch failed` (`PROVIDER_ERROR`) in `evidence/t01c-36e40937-21b7-4f57-a8c3-5d24a2c10aca/`. There was no retry, structured response, candidate, checkpoint, or Java request. Actual token usage and cost are UNKNOWN. An intermediate regression test used its literal test-only key after its oversized-prompt fixture became too small; that fetch failed, and the fixture was corrected to remain over budget and pass without a provider invocation. No credential value was recorded. Budget-blocked attempts are preserved in `evidence/t01c-4bd373f5-66a7-4e83-b812-303f2518e4e9/`, `evidence/t01c-32ef186a-d9a0-47ba-a50e-23eb9e66b67f/`, and `evidence/t01c-d12c5162-e913-45d4-95bb-31e73d732d24/`.

## Approved limit versus observed spend

The authorization was capped at one request, zero retries, 60 seconds, 2,000 output tokens, and a maximum USD 0.02 cost ceiling. That is a limit, **not** evidence of actual spend. The failed provider response included no usage or billing metadata, so actual input/output tokens and cost remain UNKNOWN.

For context only, the official [Gemini Developer API pricing page](https://ai.google.dev/gemini-api/docs/pricing) currently lists Standard paid text input at USD 0.25 / 1M tokens and output at USD 1.50 / 1M tokens for Gemini 3.1 Flash-Lite. The CLI uses these published rates only for a conservative preflight estimate based on a deliberately high token-per-character factor and the maximum output allowance; the estimate is not a quote, provider billing record, or measured spend. Re-check rates and billing tier before any newly authorized run. The provider records usage metadata and estimated/actual cost only when available; missing values remain absent rather than fabricated.

## Implemented call controls

`framework/src/runtime/model-provider.ts` pins `gemini-3.1-flash-lite`, requires explicit authorization, bounds each provider instance to one call, sets `maxRetries: 0`, limits output tokens and timeout, preflights prompt size/cost, and records attempts, latency, status, token metadata and bounded error category. Baseline scenario metadata is compacted and source context is bounded before the 8,000-character preflight; oversized prompts are rejected before network invocation. `framework/src/t01c-cli.ts` requires `--live-authorized`, validates run-level request count/cost ceilings, and reserves calls in append-only files before invocation so failed/crashed reservations are not replayed. Provider telemetry now stores the SHA-256 of the exact prompt and a sanitized prompt; `framework/test/model-provider.test.ts` verifies redaction. Structured output is stored in the candidate artifact only when a valid response returns; raw provider responses are not persisted. The two historical failed requests predate this capture feature, so their exact prompts cannot be reconstructed. The latest request returned no response body. Request evidence behavior is locally tested, but no live request has verified these fields end-to-end.

No further external model request is authorized by the exhausted one-call allowance. A later live run needs a valid local credential and fresh explicit authorization with limits. Never commit credentials or local environment files.
