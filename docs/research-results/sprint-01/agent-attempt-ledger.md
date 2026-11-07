# Gemini Attempt Ledger

No API key values are recorded here.

| Run | Status | Outcome |
|---|---|---|
| `2026-11-02T06-56-39-920Z-5c29278a` | BLOCKED (classified from provider response) | Provider explicitly rejected the configured key as invalid; zero candidates; token usage not reported. |
| `2026-11-02T07-04-08-426Z-eba7724e` | FAIL | Generic model request/output validation failure; zero candidates; no usage metadata. See `agent-failed-run.log` and run manifest. |
| `2026-11-02T07-04-50-486Z-ffa15253` | AWAITING_HUMAN_REVIEW | Five candidates created; no usage metadata captured in this earlier iteration. See `agent-latest-run.log`. |
| `2026-11-02T07-06-24-329Z-b9a90ab1` | AWAITING_HUMAN_REVIEW | Five candidates created and revalidated; usage telemetry captured. See `agent-run-final.log`. |

The latest run is the designated candidate artifact set. The earlier successful run is retained as execution history, not added to candidate counts. Provider-reported cost was not available. The latest token fields are preserved verbatim in its manifest; `total_tokens` does not equal `input_tokens + output_tokens`.
