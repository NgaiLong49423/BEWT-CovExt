# T01-B — Reviewed Vertical-Slice Implementation Plan

T01-B must not start until Team Lead/ChatGPT reviews the T01-A PR and approves the architecture decisions below.

## Scope and sequence

Implement one reusable LangGraph workflow instance for one ExpressCart candidate, using framework contracts and a thin ExpressCart adapter. Do not implement all eight runtimes or generate all 40 target cases in T01-B.

1. Confirm checkpoint backend/storage; use the installed LangGraph 1.6 API. Tests may use `MemorySaver`; any crash-recovery claim requires a durable backend and restart test.
2. Wire four logical roles (coverage, Gherkin, Selenium, validation/repair) into one graph with typed state and conditional transitions.
3. Add one fixed tool dispatcher with reviewed manifest, approved app root, real-path containment and experiment ownership checks. Never expose arbitrary shell execution to a model.
4. Implement interrupt/resume at the human decision gate. Verify run/thread/checkpoint/candidate/revision binding and idempotent decision consumption.
5. Wrap existing ExpressCart collectors, Maven suite, fixture and evidence paths as one app adapter; preserve legacy pilot entrypoints until parity is shown.
6. Select one already approved candidate only after reviewer/source/oracle decisions are checked; preserve first Java source immutably.
7. Run bounded validation with at most two repairs, classify setup/compile/E2E/oracle/cleanup separately, capture run evidence, and repeat only when reset/cleanup ownership is verified.
8. Compare with historical ExpressCart pilot without rewriting Sprint 01–05 artifacts.

## Exit evidence and risks

- Tests for graph routing, checkpoint pause/resume, wrong-thread/replay rejection, tool allowlist, approval, repair bound and adapter traceability.
- One run trace with app/source pin, reviewer decision, first/repaired artifact hashes, tool requests/results and sanitized evidence.
- Durable restart test before any crash-recovery claim.
- Resolve Java compatibility per `JAVA-COMPATIBILITY-DECISION.md` without silent dependency/toolchain upgrades.
- Obtain ignored original BEWT inputs and verify integrity before coverage/novelty claims.
- Team Lead reviews before T02/T03 multi-app environment work.
