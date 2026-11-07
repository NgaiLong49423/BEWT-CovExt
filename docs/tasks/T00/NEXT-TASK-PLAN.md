# T00 — Proposed Next-Task Plan

This plan preserves the proposal's full scope: eight BEWT applications, five new Gherkin and five Java/Selenium targets per application (40 total), LangGraph/Gemini Agent workflow, HITL, and the complete evaluation protocol. Targets are not a quota for acceptance; every measured count must reflect reviewed evidence.

## Recommended first task: T01 — Framework extraction design and vertical slice

**Objective:** turn the existing ExpressCart pilot into a reusable framework slice while preserving the historical pilot and its evidence. Do not start seven new runtimes as part of T01.

**Bounded scope:** inspect `experiments/expresscart/agent/src/{workflow,collector,schema,validate,sprint03-generator,sprint03-repair,sprint03-repair2,sprint03-langgraph-repair,sprint03-langgraph-repair2}.ts`, define typed framework/app/candidate/run contracts and role boundaries, identify the smallest extraction, and implement one tested end-to-end graph vertical slice only after Team Lead review of this T00 PR. Keep existing ExpressCart workflow available until parity is demonstrated. No Docker reset or broad dependency upgrade.

**Acceptance evidence:** (1) explicit Coverage, Gherkin, Selenium, Validation role contracts and state transitions; (2) fixed allowlisted tool dispatcher, no model-supplied shell; (3) checkpoint-backed review pause/resume and maximum two repairs; (4) tests for routing, approval/rejection, failure classification, repair bound, and traceability; (5) one ExpressCart vertical slice with preserved candidate IDs and evidence; (6) diff proving no historical raw evidence or `bewt-original/` changes. Resolve the POM compiler `1.8` versus Java 21 property conflict with a reviewed compatibility decision before relying on Java build claims.

**Review gate:** Team Lead approves role/state/tool contracts and the vertical-slice implementation before T02/T03 rollout expands runtime work. This report does not approve or start T01.

## Work packages and dependencies

| Task | Scope and sequence | Exit evidence / review gate |
|---|---|---|
| **T01 Framework extraction** | ExpressCart pilot to reusable graph and contracts. First task after T00 review. | G2 vertical slice evidence, role/tool/checkpoint/HITL/repair tests, parity and no historical evidence rewrite. |
| **T02 Eight-app source/environment audit** | Static inventory, source/version/provenance and original Gherkin/Base mismatch audit for all eight; draft manifests and risk/reset plans. Can overlap T01 only if files/resources do not collide. | Eight reviewed manifests/inventory records; unresolved source/version/license/runtime blockers explicit. No runtime PASS inferred. |
| **T03 G0 environment rollout** | App-by-app isolated containers, readiness, Base smoke, scoped seed/reset/cleanup, starting with a reviewed pilot and proceeding serially. | Per-app source/image pin, ownership and reset checks, HTTP/DB readiness, Base test assertion and captured logs; only measured apps receive G0 proposal. |
| **T04 Coverage inventory / G1** | Behavioral taxonomy and exact original Gherkin/Base mapping for all apps; candidate proposals and reviewer rubric/decisions. Static inventory may start earlier, but runtime behavior claims depend on G0. | Eight coverage matrices, explicit denominators/mismatches, novelty/oracle decisions, accepted candidates only when reviewer approves. |
| **T05 Generation and validation / G2–G3** | Generate revised Gherkin and Java/Selenium for approved cases; compile, fixture, oracle, bounded repair, E2E, reset/cleanup and three reruns. | Per-case immutable first/revised artifacts, run evidence and classified outcome. Do not force 40 PASS. |
| **T06 Evaluation / G4** | Build normalized dataset and reproducible metrics for RQ1–RQ4, threats, protocol and evidence index across all apps. | Correct candidate/invocation denominators, per-app coverage-gain inventory, provenance and reviewer sign-off. |
| **T07 Research synthesis / D8** | Report the full program and achieved vs target outcomes, including non-passing/unevaluated cases. | RQ1–RQ4 answerable from T06 data, replication package and Team Lead review. |

## Decision points for Team Lead

1. Approve T01 as the next task and review the proposed four-role contracts, checkpoint semantics, tool allowlist, and repair bound before implementation.
2. Confirm how the ignored `bewt-original/` benchmark will be provisioned and version-locked for repeatable audits without adding it to the public outer repository.
3. Decide whether the Java 21 property / compiler plugin `1.8` discrepancy should be corrected in T01 or handled as a separately scoped compatibility decision; require parity evidence.
4. Confirm the human-review arrangement and whether a second reviewer is available where feasible, as described by the acceptance matrix.
