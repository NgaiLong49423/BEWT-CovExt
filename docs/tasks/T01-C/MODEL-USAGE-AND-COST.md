# Model Usage and Cost

| Provider | Requests | Tokens | Cost | Result |
|---|---:|---:|---:|---|
| Gemini | 1 request / 1 attempt | NOT_RETURNED | UNKNOWN (no usage metadata) | `FAIL: API_KEY_INVALID (HTTP 400)` |
| Fake test double | Unit-test calls only | NOT_APPLICABLE | NOT_APPLICABLE | Synthetic contract test, excluded from study metrics |

The user explicitly authorized transmission of the pinned source excerpt, baseline scenario metadata and historical research topics for one bounded request. The single `gemini-3.1-flash-lite` request used 7,412 prompt characters, zero retries and a 2,000-token output cap; estimated maximum cost was USD 0.010412 under the USD 0.02 ceiling. Google returned HTTP 400 `API_KEY_INVALID`; no candidate or review checkpoint was produced. Actual token usage and billing are unknown because the provider returned no usage metadata. No retry was made. See `evidence/t01c-bba25b8c-7363-4056-b210-c5dd72eeb7df/run-result.json`, `model-generation-failure.json`, and `model-error-classification-correction.json`. The correction preserves the original telemetry and records that its original `RATE_LIMIT` label was a classifier bug (`rate` matched inside `generateContent`); the corrected category is `AUTHORIZATION`.
