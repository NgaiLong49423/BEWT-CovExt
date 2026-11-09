# T05-B — Source-Pinned Generation Request Proposal

This is an offline proposal only. It is not a Gemini invocation or a generated candidate.

## Provenance

- App: ExpressCart, BEWT benchmark label `1.19`; pinned upstream npm package version `1.1.19`.
- ExpressCart source commit: `b31302f4e99c3293bd742c6d076a721e168118b0`.
- Source artifact: `experiments/expresscart/source/routes/customer.js`, the `GET /customer/reset/:token` form route and its reset-token validity/expiry branch.
- Baseline input: ExpressCart Base inventory pinned by `config/apps/expresscart.json`; current proposed gap concerns invalid or expired reset-token behavior.
- Coverage and provenance workflow: `framework/src/t01c-cli.ts`, `framework/src/runtime/coverage-analysis.ts`, and `adapters/expresscart/source-identity.ts`.
- Historical overlap input: `data/coverage/expresscart/historical-candidate-behavior-index.json`; no historical reviewer decision is reused.
- Research status: source-backed candidate gap only. Novelty and oracle correctness remain unverified until human review.

## Minimal prompt shape proposed for the one authorized request

The production CLI will construct and hash its request itself. This compact outline records the intended bounds and source context without hand-editing the provider payload:

```text
Generate exactly one Gherkin browser-test candidate using only the supplied
source-backed gap and baseline summary. Target ExpressCart source commit
b31302f4e99c3293bd742c6d076a721e168118b0, package version 1.1.19, route
experiments/expresscart/source/routes/customer.js. Proposed behavior: a reset
token that is invalid or expired is rejected and the user is redirected to the
forgot-password page with the source-observed message. Treat this as a proposal,
not a verified oracle or novelty claim. Do not invent selectors, routes, data,
or behavior. Do not generate Java. Return only the provider's required
structured candidate fields, with concise Gherkin, preconditions, expected
behavior, and evidence-linked rationale.
```

The actual production prompt additionally carries a compact baseline case summary and serialized gap references, and is capped at 8,000 characters by the provider. Exact request identity is SHA-256; stored request evidence uses the repository redaction helper. No request hash is claimed for this proposal because the production prompt has not been built for a run.

## Expected control path

Pinned source identity and baseline → source-backed coverage analysis → one Gemini Gherkin call → durable LangGraph SQLite checkpoint / human review interruption → stop. The Java node is downstream of an explicit revision-bound reviewer decision, so it must not run while the candidate is awaiting review.
