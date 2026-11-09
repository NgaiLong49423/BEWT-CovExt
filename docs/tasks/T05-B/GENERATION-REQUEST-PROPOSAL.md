# T05-B — Source-Pinned Generation Request Proposal

This is an offline proposal only. It is not a Gemini invocation or a generated candidate.

## Provenance

- App: ExpressCart, BEWT benchmark label `1.19`; pinned upstream npm package version `1.1.19`.
- ExpressCart source commit: `b31302f4e99c3293bd742c6d076a721e168118b0`.
- Source artifact: `experiments/expresscart/source/routes/customer.js` (SHA-256 `74c7ecfdf38e6ad9038ae0f2cc8f89969331f4420bfa491348c5e8b2f6d26abe`), `GET /customer/reset/:token` at lines 546–568.
- The invalid-token branch checks for a customer whose `resetToken` matches and whose `resetTokenExpiry` is greater than `Date.now()`. Otherwise it sets session `message` and `message_type`, then redirects to `/forgot`.
- `/forgot` is handled by the generic `GET /:page?` route, which looks up an enabled DB page with slug `forgot` and renders it if present; otherwise it returns a 404. No pinned fixture establishes that page exists. The reset branch uses `message_type`, while its successful reset form passes `message_type` and the shared layout expects `messageType`. Therefore the previous draft's claim that the invalid-token message is visibly displayed on a forgot-password page is **not source-established**.
- Baseline mapping: `data/coverage/expresscart/baseline-mapping.json` is pinned to BEWT source commit `0501249ff3e9a5ea83a06155cd2971dc36197056` / tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`, distinct from the ExpressCart application source pin above. The local `ForgottenPasswordTest.java` exercises the generic response for an unregistered email, not invalid/expired reset tokens. The historical EC-C04 forgotten-password request is an adjacent overlap cue, not a novelty decision.
- Current source-backed gap list `data/coverage/expresscart/gap-candidates.json` has zero candidates and `NOT_EVALUATED`; the existing T01-C exact-tag analysis was heuristic and did not establish browser-observable oracle validity.
- Coverage and provenance workflow: `framework/src/t01c-cli.ts`, `framework/src/runtime/coverage-analysis.ts`, and `adapters/expresscart/source-identity.ts`.
- Historical overlap input: `data/coverage/expresscart/historical-candidate-behavior-index.json`; no historical reviewer decision is reused.
- Proposed assertion scope: the invalid/expired-token request redirects to `/forgot`. This destination is established by the pinned route source. The destination page's existence and visible message are not established and are deliberately excluded from the assertion. No candidate has been generated; research novelty remains unverified.

## Minimal prompt shape proposed for the one authorized request

The production CLI will construct and hash its request itself. This compact outline records the intended bounds and source context without hand-editing the provider payload:

```text
Generate exactly one Gherkin browser-test candidate using only the supplied
source-backed gap and baseline summary. Target ExpressCart source commit
b31302f4e99c3293bd742c6d076a721e168118b0, package version 1.1.19, route
experiments/expresscart/source/routes/customer.js. The route checks token match
and expiry; on a miss it sets session message keys and redirects to `/forgot`.
Assert only that the response redirects to `/forgot`; do not assert a landing
page, status after following the redirect, or message visibility. The target
page and novelty are unresolved. Do not invent selectors, routes, data, or
behavior. Do not generate Java. Return only the provider's
required structured candidate fields, with concise Gherkin, preconditions,
expected behavior, and evidence-linked rationale.
```

The actual production prompt additionally carries a compact baseline case summary and serialized gap references, and is capped at 8,000 characters by the provider. Exact request identity is SHA-256; stored request evidence uses the repository redaction helper. No request hash is claimed for this proposal because the production prompt has not been built for a run. Do not execute the call until fresh authorization is separately granted.

## Expected control path

Pinned source identity and baseline → source-backed coverage analysis → one Gemini Gherkin call → durable LangGraph SQLite checkpoint / human review interruption → stop. The Java node is downstream of an explicit revision-bound reviewer decision, so it must not run while the candidate is awaiting review.
