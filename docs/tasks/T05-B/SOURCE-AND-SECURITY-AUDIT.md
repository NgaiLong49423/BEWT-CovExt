# T05-B — Offline Workflow, Provider and Safety Audit

Audit date: 2026-11-10. No provider request or Docker action was performed.

| Area | Offline finding | Evidence/source |
|---|---|---|
| Shared workflow | Shared LangGraph includes source-backed coverage, Gherkin proposal, durable review checkpoint, post-review Java implementation and validation nodes. The `human_review` node uses `interrupt`; only `ACCEPTED_FOR_IMPLEMENTATION` routes to Java. | `framework/src/runtime/workflow.ts`; `framework/src/t01c-cli.ts` |
| ExpressCart source pin | CLI pins upstream commit `b31302f4e99c3293bd742c6d076a721e168118b0` and package `1.1.19`, validates manifest/source identity, and records source references. | `framework/src/t01c-cli.ts`; `config/apps/expresscart.json`; `adapters/expresscart/source-identity.ts` |
| Prompt construction | One structured Gherkin candidate, source/gap and baseline context, no Java instruction, 8,000-character bound, cost preflight, SHA-256 identity, sanitized request evidence. | `framework/src/runtime/model-provider.ts` |
| Model configuration | Model is fixed to `gemini-3.1-flash-lite`; Gherkin max output is 2,000 tokens; timeout max/default is 60 seconds; `maxRetries: 0`; provider instance allows one call. | `framework/src/runtime/model-provider.ts` |
| Cost guard | Existing guard uses $0.25/M input and $1.50/M output; at 8,000 chars × 4 tokens/char and 2,000 output tokens it estimates USD 0.011. Independent task proposal caps at USD 0.02. | `framework/src/runtime/model-provider.ts`; official pricing linked in `LIVE-CALL-AUTHORIZATION-REQUEST.md` |
| Request ledger | Exclusive call reservation is written before provider invocation. Per-run budget and append-only reservation prevent retry/restart from silently issuing another request; failed reservation remains consumed. | `framework/src/runtime/model-call-ledger.ts`; `framework/src/t01c-cli.ts` |
| Secret handling | Provider accepts `GEMINI_API_KEY` from process environment or explicit injection, never writes it to telemetry; error/request evidence passes through redaction. The environment variable was present in the audit process, but its value was withheld and validity was not tested. A secret binding is not Team Lead permission. | `framework/src/runtime/model-provider.ts`; `framework/test/model-provider.test.ts` |
| Human review | Candidate is PROPOSED. Checkpoint binds run/thread/checkpoint; review decision binds candidate ID and revision. Java is routed only after fresh ACCEPT. No candidate or real reviewer decision exists for T05-B. | `framework/src/runtime/workflow.ts`; `framework/src/policy.ts`; `docs/tasks/T05-A/HUMAN-REVIEW-BOUNDARY.md` |
| Historical provider events | T01-C's five authorized invocations are historical: four `API_KEY_INVALID`, one `fetch failed`; none produced output. These are not new T05-B results and were not repeated. | `docs/tasks/T01-C/MODEL-USAGE-AND-COST.md`; `docs/tasks/T05-A/PROVIDER-READINESS.md` |
| Runtime ownership | No Docker commands or app runtime actions were run; Agent 1 owns Docker for this sprint. | T05-B task instructions / `00-QUY-TAC-CHUNG.md` |

## Current gate

`MODEL_AUTHORIZATION_REQUIRED`. A fresh D-C1 Team Lead approval and valid configured credential are required before exactly one Gherkin call. Credential validity, provider connectivity, quota, and billing are `NOT_RUN`. No output means no candidate and no human review checkpoint; do not label this `HUMAN_REVIEW_PENDING`.
