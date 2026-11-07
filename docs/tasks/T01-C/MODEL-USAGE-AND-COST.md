# Model Usage and Cost

| Provider | Requests | Tokens | Cost | Result |
|---|---:|---:|---:|---|
| Gemini | 0 (command blocked before start) | NOT_APPLICABLE | NOT_APPLICABLE | `BLOCKED_BY_AUTO_REVIEW` |
| Fake test double | Unit-test calls only | NOT_APPLICABLE | NOT_APPLICABLE | Synthetic contract test, excluded from study metrics |

The user authorized one request with model `gemini-3.1-flash-lite`, zero retries, output cap 2,000 tokens, prompt cap 8,000 characters, and a conservative estimated ceiling of USD 0.02. Google currently lists Standard text rates of USD 0.25/1M input tokens and USD 1.50/1M output tokens [official pricing](https://ai.google.dev/gemini-api/docs/pricing). The ceiling estimates at most four input tokens per prompt character plus the 2,000-token output cap. Automatic review blocked the launch command before it started because sending pinned source excerpts, baseline metadata and research context to Google was not considered explicitly authorized. Request count remains zero; see `evidence/verification/live-model-authorization.json`.
