# T05-B — Targeted cross-project Gemini authentication investigation

Date: 2026-11-10
Previous PR HEAD inspected: `7cefafd1b7f9c562c977f3af28d82503ce5b56e7`
Overall historical root-cause classification: `UNDETERMINED`

## Scope and restrictions

Offline source/runtime-environment checks only. No Gemini requests, credential probes, Mâm Xanh runtime credential reads, Docker commands, Java generation, Selenium, or environment changes were performed. No key content, length, prefix, suffix, hash, encoding, or fingerprint was emitted or persisted. The consumed D-C1 remains consumed.

## Key-handling comparison

| Layer | Mâm Xanh | BEWT-CovExt |
|---|---|---|
| Configuration source | Spring `@Value("${GEMINI_API_KEY:}")`; if configured value is blank, fallback to `System.getenv("GEMINI_API_KEY")`. Docker Compose source maps `${GEMINI_API_KEY:-}` into the service environment. | `options.apiKey ?? process.env.GEMINI_API_KEY` in both `GeminiGenerationProvider` and `GeminiJavaGenerationProvider`. |
| Normalization before SDK | Calls `.strip()` in `Client.builder().apiKey(apiKey.strip())`. | Before this correction, passed the selected string unchanged. Added a shared provider-boundary trim and synthetic-key unit regression test. |
| Downstream SDK behavior | Declared Java SDK dependency `com.google.genai:google-genai:1.76.0`; the app already strips before the SDK receives the key. No runtime secret or container process was inspected. | Installed `@langchain/google-genai` 2.3.4 assigns the explicit `fields.apiKey` directly. Its downstream `@google/generative-ai` 0.24.1 stores that value and appends it directly as `x-goog-api-key`; no key trim/strip was found in the inspected auth path. |
| Model | `gemini-3.8-flash` (`AiTokenUsage.MODEL`). | `gemini-3.1-flash-lite` for the single historical request. |
| Endpoint/provider configuration | Source supplies an API key and no custom `baseUrl` or Vertex-AI flag; actual runtime endpoint was not inspected. | Historical sanitized error names `https://generativelanguage.googleapis.com/v1beta/...`; no app `baseUrl` is set. SDK may route through LangSmith gateway if `LANGSMITH_GATEWAY` is configured in that execution environment. It was absent in the current investigation Process; historical state is unknown. |
| Runtime environment | Compose configuration demonstrates environment injection at container creation. A running container may retain an earlier environment snapshot, but no container or runtime environment was inspected. | Current PowerShell Process has a key with no surrounding whitespace; current Windows User and Process values compare equal. A harmless Node child reports presence and no surrounding whitespace. This is not the historical elevated process snapshot. |

## Offline diagnostics

The current PowerShell Process result was `KEY_PRESENT`, `SURROUNDING_WHITESPACE_ABSENT`; current Windows User versus Process result was `CONTEXT_EQUAL`. The harmless Node child result was `KEY_PRESENT`, `SURROUNDING_WHITESPACE_ABSENT`. The checked SDK gateway variable `LANGSMITH_GATEWAY` was `NOT_COMPARABLE` (absent in current Process). Full safe output tokens are in `environment-status.txt`.

These results show the current Windows/Node launch context is consistent on presence and surrounding whitespace. They do not reconstruct the environment of the earlier authorized outside-sandbox process. They also do not show the effective bytes in Mâm Xanh's running application/container. Team Lead confirmation that both projects are configured for the same intended key is accepted; it does not prove byte-for-byte equality after Spring/Compose resolution or container creation.

## Root-cause matrix

| Hypothesis | Evidence | Assessment |
|---|---|---|
| BEWT passed accidental whitespace to the SDK during the historical failure | BEWT source did not trim; both inspected JS SDK layers preserve the key. Current Process/User/Node values have no surrounding whitespace. The old elevated process's credential state is unavailable. | A concrete latent normalization defect was reproduced with synthetic input and corrected. Historical causality remains unproven. |
| Current Windows versus Node environment mismatch | Current Process and User values compare equal; Node child inherited the variable and reported matching presence/whitespace state. | No mismatch observed in the current context. Historical execution remains unknown. |
| Mâm Xanh uses a different runtime snapshot | Compose injects host environment at container creation; a running container can retain the value from its creation. | Plausible context difference; cannot inspect container/runtime under this task's restriction. |
| SDK strips the BEWT key automatically | LangChain 2.3.4 passes explicit API key through; downstream JS SDK 0.24.1 stores it and writes it to `x-goog-api-key` without normalization in the inspected path. | Ruled out for the inspected BEWT SDK path. |
| Model/provider configuration differs | Mâm uses `gemini-3.8-flash`; BEWT used `gemini-3.1-flash-lite`. Mâm source configures API-key auth without explicit Vertex or base URL; BEWT recorded the Developer API URL. | Confirmed configuration difference, but it does not by itself explain `API_KEY_INVALID`. No live comparison authorized. |
| Gateway/proxy or endpoint differs | BEWT can use optional LangSmith gateway configuration if present; it is absent in the current Process. Mâm source has no custom base URL. Historical proxy/gateway state and Mâm runtime endpoint are unavailable. | Unresolved. No network/routing probes performed. |

## Corrective change

`normalizeGeminiApiKey()` now trims surrounding whitespace and maps whitespace-only input to `undefined`. Both BEWT Gemini providers use it before SDK construction. This aligns the provider boundary with Mâm Xanh's `.strip()` behavior and prevents a whitespace-only credential from reaching SDK construction. A unit regression test uses only a synthetic dummy key and verifies trimming/rejection; it performs no request. No key is logged. This is a defensive correction for a confirmed source-level normalization gap, not proof that it caused the prior 400.

## Verification and limits

The focused provider unit suite, complete framework unit suite, and TypeScript build were run offline. Sanitized outputs, exit codes, Node/npm versions, and staged source-tree provenance are recorded beside this report. No integration/provider-live tests were run. No Docker command was run. The previous live result, reservation, and failure evidence were preserved.

Before another live invocation, the Team Lead must separately decide on a fresh D-C1 authorization. If desired, they can compare the known-working process/container and the BEWT launch context locally using only in-memory boolean checks for presence, surrounding whitespace, and equality; do not print or persist values. The container and past elevated process cannot be reconstructed after the fact.
