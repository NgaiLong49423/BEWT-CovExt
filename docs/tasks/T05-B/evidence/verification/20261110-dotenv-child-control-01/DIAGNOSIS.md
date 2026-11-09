# G2-ENV-DIAGNOSIS — Gemini credential-source mismatch

## Outcome

`ROOT_CAUSE_IDENTIFIED` for the current configuration mismatch; original failing LangGraph workflow remains unverified with the intended credential. No claim of FIXED AND VERIFIED.

On 2026-11-10 Asia/Ho_Chi_Minh, the Team Lead identified `experiments/expresscart/.env` as the source of a credential independently verified through REST. Read-only, in-memory inspection found that file present with exactly one nonempty `GEMINI_API_KEY` assignment, no enclosing quotes or leading/trailing whitespace. The PR #15 process environment also had a nonempty key, and a Node child inherited it, but the process value compared unequal to the `.env` value. No key value, prefix, length or fingerprint was recorded. This is direct evidence of a mismatch at the time of the check; it does not prove what credential was used by any historical run.

PR #15 execution source `370bad8cee3a7b78ea134e465b6b20b444355452` has `framework/src/runtime/model-provider.ts` resolve `options.apiKey ?? process.env.GEMINI_API_KEY`, then trim it. `framework/src/t01c-cli.ts` does not load `experiments/expresscart/.env`; the command ran from `framework/`, and the Node child inherited the parent process variable. The framework package has no dotenv dependency; the separately scoped ExpressCart pilot package does. Therefore the failing workflow did not automatically use the file identified by the Team Lead, and its current process variable resolves to a different value. No claim is made that another environment variable overrode the file inside this framework process; the file was not loaded there at all.

## Controlled checks

| Check | Result | Scope |
|---|---|---|
| Direct REST `POST` to Gemini Developer API `v1beta/models/gemini-3.8-flash:generateContent`, header `x-goog-api-key`, `.env` value only in memory, synthetic `Reply OK`, max output 128, no retry | HTTP 200; candidate and usage metadata present | Confirms the file credential worked for this request, not the complete application workflow. |
| `@langchain/google-genai` 2.3.4 `ChatGoogleGenerativeAI`, `gemini-3.8-flash`, same `.env` credential in one child-process environment, synthetic `Reply OK`, max output 128, maxRetries 0 | PASS, response content and usage metadata present | Confirms basic SDK/model/credential interaction, not T01-C orchestration or human checkpoint. |
| Existing T01-C live runs, source model `gemini-3.1-flash-lite` | HTTP 400 `API_KEY_INVALID`, three separately authorized attempts, zero retries each | Older records retain their own evidence; their process credential identity relative to the `.env` value was not established. |

Exactly two new synthetic control requests were made during this diagnosis. Token telemetry existed but counts and account billing were not retained; billed cost is UNKNOWN. No Docker, Java generation, Selenium, `.env` modification or persistent host environment modification occurred. Provider response body and secret values were not logged. A controlled run of the original LangGraph workflow with the intended credential remains necessary to establish the complete causal path and verify any fix.

## Decision boundary

Do not silently prefer `.env` over an existing process environment variable or alter persistent authentication precedence. A configuration change that changes credential loading/precedence requires an explicit, reviewable decision. An isolated comparison can set only a child process's `GEMINI_API_KEY` from the designated `.env` in memory, run one authorized source-backed workflow request, and discard the child environment afterward; this does not itself establish a durable application fix. If it reaches a checkpoint, preserve the candidate as PROPOSED and require real revision-bound review before Java.

## End-to-end control after diagnosis

The Team Lead authorized one original source-backed T01-C workflow request using the file credential only in the child process. On execution source HEAD `370bad8cee3a7b78ea134e465b6b20b444355452`, the existing 3.1 Flash-Lite CLI exited 0 and reached `AWAITING_HUMAN_REVIEW`; a separate local `status` command exited 0 and read back the same checkpoint. This controlled comparison confirms the current process/file credential mismatch was the cause of the observed failure under this setup. It does not identify the credential of historical runs. This is still not a durable configuration fix: normal CLI startup still does not load the file unless explicitly supplied to its environment.
