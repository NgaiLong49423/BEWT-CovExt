# Model Usage and Cost

## Observed live usage

| Provider/model | Calls / attempts | Prompt | Token usage | Actual cost | Outcome |
|---|---:|---:|---:|---:|---|
| Gemini `gemini-3.1-flash-lite` | 3 / 3 authorized invocations | 7,412; 7,841; 7,690 characters | NOT_RETURNED | UNKNOWN | Two HTTP 400 `API_KEY_INVALID`; one `fetch failed` |
| Fake test providers | Offline tests only | Synthetic | NOT_APPLICABLE | NOT_APPLICABLE | Excluded from study/model metrics |

The first explicitly authorized Gherkin request failed with `API_KEY_INVALID`: `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/`. A later bounded authorization permitted one provider call after three local `MODEL_INPUT_BUDGET_EXCEEDED` rejections (8,756, 9,054, and 9,851 characters); the 7,841-character invocation failed with `fetch failed` (`PROVIDER_ERROR`): `evidence/t01c-36e40937-21b7-4f57-a8c3-5d24a2c10aca/`. A subsequent fresh authorization permitted one outside-sandbox invocation at 7,690 characters; Gemini returned HTTP 400 `API_KEY_INVALID`, with no retry. This latest run retains sanitized prompt/hash evidence at `evidence/t01c-4b3cc521-40ae-4f76-bd06-e4828390d83e/`. No invocation returned structured content, candidate, or checkpoint; Java generation did not run. Actual token usage and cost are UNKNOWN. A regression test briefly fetched using a literal test-only key after prompt compaction made its oversized fixture too small; it failed before authentication and was corrected to remain over budget. No credential value was recorded. The one-call authorization is consumed.

## Approved limit versus observed spend

The authorization was capped at one request, zero retries, 60 seconds, 2,000 output tokens, and a maximum USD 0.02 cost ceiling. That is a limit, **not** evidence of actual spend. The failed provider response included no usage or billing metadata, so actual input/output tokens and cost remain UNKNOWN.

For context only, the official [Gemini Developer API pricing page](https://ai.google.dev/gemini-api/docs/pricing) currently lists Standard paid text input at USD 0.25 / 1M tokens and output at USD 1.50 / 1M tokens for Gemini 3.1 Flash-Lite. The CLI uses these published rates only for a conservative preflight estimate based on a deliberately high token-per-character factor and the maximum output allowance; the estimate is not a quote, provider billing record, or measured spend. Re-check rates and billing tier before any newly authorized run. The provider records usage metadata and estimated/actual cost only when available; missing values remain absent rather than fabricated.

## Implemented call controls

`framework/src/runtime/model-provider.ts` pins `gemini-3.1-flash-lite`, requires explicit authorization, bounds each provider instance to one call, sets `maxRetries: 0`, limits output tokens and timeout, preflights prompt size/cost, and records attempts, latency, status, token metadata and bounded error category. Baseline scenario metadata is compacted and source context is bounded before the 8,000-character preflight; oversized prompts are rejected before network invocation. `framework/src/t01c-cli.ts` requires `--live-authorized`, validates run-level request count/cost ceilings, and reserves calls in append-only files before invocation so failed/crashed reservations are not replayed. Provider telemetry now stores the SHA-256 of the exact prompt and a sanitized prompt; `framework/test/model-provider.test.ts` verifies redaction. Structured output is stored in the candidate artifact only when a valid response returns; raw provider responses are not persisted. The first two failed requests predate this capture feature, so their exact prompts cannot be reconstructed. The latest live failure stored its sanitized prompt/hash but returned no response body. Failure-path request evidence is now verified in a live run; a successful response and candidate artifact are still unverified.

No further external model request is authorized by the exhausted one-call allowance. A later live run needs a valid local credential and fresh explicit authorization with limits. Never commit credentials or local environment files.
