# T05-B — Gemini authentication root-cause investigation

Date: 2026-11-10
Classification: `UNDETERMINED`
Scope: offline inspection only; zero Gemini requests, credential probes, Java/Selenium/Docker execution, or environment changes.

## Executive finding

The single previously authorized request returned HTTP 400 `API_KEY_INVALID`. That proves the request reached an HTTP responder, but the saved evidence has no response headers, TLS peer identity, or proxy trace. It therefore does not prove whether the response came directly from Google's Gemini Developer API or an intermediary. The request used the credential supplied to the failing execution context, but the evidence does not establish that it was the same credential that works in the Team Lead's other application.

Current offline inspection confirms that the application explicitly supplies `options.apiKey ?? process.env.GEMINI_API_KEY` to `ChatGoogleGenerativeAI`. The installed SDK is `@langchain/google-genai` 2.3.4. With this exact call, the explicit `apiKey` takes precedence over SDK environment defaults, so `GOOGLE_API_KEY` cannot replace it. The SDK resolves a LangSmith gateway base URL from gateway configuration when present; no custom `baseUrl` is supplied by this application. The historical request error names the public `generativelanguage.googleapis.com` endpoint, while no response-level routing evidence was retained.

The current PowerShell process has `GEMINI_API_KEY`; the Windows User value is also present and an in-process ordinal comparison returned `EQUAL`. A harmless Node child inherited the variable. This is a snapshot of today's investigation shell, not proof of the credential used by the earlier request or the known-working application. No secret content, length, prefix, suffix, digest, or fingerprint was read, printed, or stored.

The historical invocation used the authorized outside-sandbox execution path (`require_escalated`), according to the execution record. The result was HTTP 400 rather than a DNS, connection, or TLS error, so a sandbox network denial is not supported by the observed result. The actual endpoint peer and any transparent intermediary remain unverified. No additional network test was performed.

## Execution chain and provenance

| Stage | Evidence / finding |
|---|---|
| Codex tool to shell | Historical request was launched through the authorized outside-sandbox execution path. That path may have a different process environment from the current restricted shell. |
| PowerShell working directory | Historical command ran from `framework/`; this investigation runs from the repository root. |
| PowerShell to npm | `npm.cmd run agent:t01c -- start expresscart --live-authorized --max-api-requests=1 --max-cost-usd=0.02`; npm runs the `tsx src/t01c-cli.ts` package script. |
| Node / application | Historical runtime was Node `v24.19.0`, npm `11.17.0`. T01-C constructs `GeminiGenerationProvider`, which reads `process.env.GEMINI_API_KEY` unless an explicit `apiKey` option is supplied. |
| Provider to SDK | `GeminiGenerationProvider` passes the resolved key explicitly to `ChatGoogleGenerativeAI`. The installed SDK is 2.3.4, pinned in `framework/package.json` and `framework/package-lock.json`. |
| SDK to endpoint | The SDK creates `GoogleGenerativeAI(apiKey)` and supplies its resolved `baseUrl`. No application `baseUrl` override exists. Its optional LangSmith gateway configuration can set a base URL and a separate gateway API key if configured in that execution context. |
| Prior result | One request, one attempt, no retry; HTTP 400 `API_KEY_INVALID`; CLI exit 1; no token usage, candidate, or review checkpoint. Existing immutable failure evidence remains under `../20261110-live-01/`. |

## Competing-hypothesis matrix

| Hypothesis | Supporting evidence | Contradicting evidence / limits | Verification performed | Confidence | Minimal next step |
|---|---|---|---|---|---|
| Sandbox environment isolation or network block | The current shell is restricted and the historical request ran outside it; the two process contexts are not directly comparable. | Historical request returned HTTP 400, not a connection-denied error. Historical command used the authorized outside-sandbox path. | Compared only current PowerShell and Windows User/System presence/equality; reviewed historical execution provenance. No sandbox logs or historical process snapshot were available. | Low as cause of this failure; historical request was not blocked before HTTP response. | No sandbox change. If another attempt is ever separately authorized, capture non-secret variable-presence and route configuration in that same invocation before the call. |
| Parent/child environment mismatch | A child can inherit or alter environment; previous elevated process details are unavailable now. | Current Node child inherited `GEMINI_API_KEY`; no repository `.env` loader was found in the inspected framework source/package path. | Current PowerShell-to-Node inheritance checked using presence booleans only; no request. | Low for current shell; unknown for historical context. | Compare presence and safe equality inside the actual future launch chain before any fresh approval is considered. |
| Windows User/System/Process precedence | Current User and Process `GEMINI_API_KEY` are both present and locally compare equal; Machine value is absent. | That is current state only, not historical state. A separate application can inherit a different process override. | Locally compared current Process and User values without outputting them; System presence checked. | Low / not established. | Team Lead can compare the known-working application's effective context locally using the procedure below. |
| Different key in the working and failing applications | Team Lead reports the key works in another context, but no app/process identifiers or equality evidence were provided. | No evidence establishes whether the working app uses the same effective secret. | No unrelated app or credential store was inspected. | Plausible, unverified. | Locally compare equality between the two process contexts; output only `EQUAL`, `UNEQUAL`, or `NOT_COMPARABLE`. |
| `GOOGLE_API_KEY` versus `GEMINI_API_KEY` resolution | SDK supports both names as fallbacks. | BEWT passes `apiKey` explicitly from `GEMINI_API_KEY`, which takes precedence; current `GOOGLE_API_KEY` is absent. | Traced production constructor and installed SDK source. | Ruled out as an SDK fallback override on this exact path. | No code change indicated. |
| SDK credential or endpoint configuration | SDK has optional gateway base URL handling, and its installed implementation is available for inspection. | Application passes an explicit key; no custom base URL is supplied. Historical error text names `generativelanguage.googleapis.com`, but lacks headers and peer identity. | Inspected SDK 2.3.4 constructor and request options; no application gateway/base URL option found. | Low as a demonstrated cause; historical gateway environment remains unknown. | Team Lead may check the presence of LangSmith gateway variables in the failing launch context without revealing values. |
| Proxy, VPN, gateway, or response interception | An HTTP error alone does not authenticate the responder; no headers or TLS peer details were retained. | Current inspected shell has no standard proxy variables; this does not describe the historical elevated process or transparent network routing. | Checked standard proxy variable presence in current Process/User/System; did not make network requests. | Unknown. | Compare proxy/VPN route configuration locally in the two known contexts; do not test with Gemini. |
| Credential revoked, restricted, malformed, wrong project, or wrong key type | `API_KEY_INVALID` is consistent with an unusable credential in the request. Google documents a Standard-key migration cutoff beginning September 2026. | Same credential's identity, type, project, restrictions, and historical value were not inspected; user reports successful use elsewhere. | Reviewed official migration documentation; did not inspect AI Studio or credential metadata. | Possible, unconfirmed. | Team Lead privately check key type and project/restrictions in AI Studio; replace only if that review demonstrates it is necessary. |
| Developer API versus Vertex AI mismatch | SDK supports Gemini Developer API configuration; separate Vertex AI auth uses different setup. | BEWT's recorded request targeted the Gemini Developer API endpoint. Current Vertex-specific environment variables are absent. The working app's provider is unknown. | Inspected recorded URL and current non-secret variable presence. | Possible difference between contexts; not established as cause. | Identify provider/auth mode in the known-working app without sharing credentials. |

## Environment comparison

The companion `environment-comparison.txt` contains only variable names and presence/equality outcomes for the current investigation shell and a harmless Node child. It does not represent the historical outside-sandbox invocation or the Team Lead's working application. Their process state, secret equality, project, provider, proxy/VPN route, SDK, and auth mode are unknown.

No `.env` value or file contents were read. Framework source/package inspection found no dotenv loader in the inspected execution path. No profile or unrelated application was inspected. A current process snapshot cannot reconstruct the prior process's parent environment, sandbox injection, or launch-time overrides.

## Safe comparison procedure for the Team Lead

Run the comparison locally in both the known-working application context and the BEWT launch context, without sending any request. Within one trusted local script, read the two effective secret values in memory and print only `EQUAL`, `UNEQUAL`, or `NOT_COMPARABLE`; never put values in arguments, logs, clipboard, files, chat, or shell history. Also compare only presence/selection facts for `GEMINI_API_KEY` and `GOOGLE_API_KEY`, provider mode, project identifier, SDK version, and proxy/gateway configuration. Do not print proxy URLs because they may contain credentials. If the contexts cannot safely be compared, report them as not comparable.

The Team Lead may privately review the key's type and associated project/restrictions in Google AI Studio. Google's published Standard-key cutoff is a possible explanation only; it does not justify replacing this credential without confirming its type/state. The prior D-C1 authorization is consumed, and this investigation grants no new call.

## Sources and exact references

- Application provider: `framework/src/runtime/model-provider.ts` (`GeminiGenerationProvider`, explicit API key construction).
- CLI chain: `framework/package.json` (`agent:t01c`) and `framework/src/t01c-cli.ts`.
- Installed SDK: `framework/node_modules/@langchain/google-genai/package.json` (2.3.4); constructor and endpoint resolution in `framework/node_modules/@langchain/google-genai/dist/chat_models.js`.
- Prior immutable run: `docs/tasks/T05-B/evidence/verification/20261110-live-01/live-call-provenance.txt`, `live-call-outcome.md`, and `live-cli-output-sanitized.txt`; native reservation/failure evidence is linked there.
- Official migration guidance: [Google Gemini API key guidance](https://ai.google.dev/gemini-api/docs/api-key), checked 2026-11-10. It describes Standard-key rejection starting September 2026 and Auth keys as the default for newly created AI Studio keys.

## Conclusion

`UNDETERMINED`. No demonstrated environment, credential-selection, SDK, proxy, or network root cause explains the difference between the failing and known-working contexts. The code path's explicit `GEMINI_API_KEY` selection is understood; the key's identity/type and the two contexts' equality remain unknown. No source change is indicated. Do not call Gemini or validate credentials. A new live request requires a separate fresh explicit Team Lead D-C1 decision.
