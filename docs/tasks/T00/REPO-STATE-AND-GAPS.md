# T00 — Repository State and Gap Analysis

## Audit basis

- Remote: `origin` = `https://github.com/NgaiLong49423/BEWT-CovExt.git`.
- Base: `origin/main` at `44bd7c4d7de683afbf1b14ac65c0b43db5950d8c` after fetch on 2026-11-07.
- Working tree before task: clean; branch created as `docs/t00-program-contract` from that SHA.
- Research scope source: `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` v2.0 (20/10/2026). It sets 8 apps, 5 candidate Gherkin plus 5 Java/Selenium targets per app (40 total), LangGraph JS + Gemini, HITL, and evaluation. These are targets, not achieved results.
- Original-data boundary: `.gitignore` excludes `/bewt-original/`. `experiments/expresscart/agent/src/collector.ts` reads original Gherkin from `../../bewt-original/expresscart/gherkin`; that input is not part of the tracked outer repository. No files there were modified.

## Overall finding

The tracked implementation and evidence are an ExpressCart feasibility pilot. They do not establish an eight-application implementation or the 40-case target. The pilot has real LangGraph and Gemini calls, sanitized baseline collection, schema and Gherkin parsing, a human review record, Java/Selenium generation, two bounded repair iterations, and archived run evidence. It is not yet the reusable four-role, checkpointed, tool-allowlisted workflow in the proposal.

## Implementation inventory

| Area | Actual source / evidence | Finding and classification |
|---|---|---|
| LangGraph orchestration | `experiments/expresscart/agent/src/workflow.ts`, `RunState`, `State`, `graph` | A real `StateGraph` with `collect → propose → record`; calls `graph.invoke`. **Implemented, ExpressCart-specific.** No checkpointer, resume/pause node, or role-level nodes are wired here. |
| Coverage analysis / Gherkin proposal | `workflow.ts`, `CandidateSetSchema` in `schema.ts`, `collector.ts`, `validate.ts` | Gemini proposes exactly five ExpressCart candidates from summarized tests, routes, and features. Gherkin parser checks syntax; duplication is a token-overlap hint and evidence verification is string-overlap. These checks do not prove semantic novelty, oracle validity, or behavioral coverage. **Implemented with limits; evidence in S01–S02.** |
| Human review | `workflow.ts` writes `human-review.json`; `docs/research-results/sprint-02/human-review-decisions.json` | The first workflow persists `PENDING` and finishes; reviewer approval is recorded in a separate artifact and generation checks that record. This is an artifact gate, not an interactive graph pause/resume. Four candidates accepted for implementation, not validation. **Partially implemented/evidenced for pilot.** |
| Selenium generation | `experiments/expresscart/agent/src/sprint03-generator.ts`; output under `docs/research-results/sprint-03/generation/langgraph-run/`; Java under `experiments/expresscart/bewt-suite/src/test/java/tests/` | A LangGraph node calls structured-output Gemini and writes four Java classes. `BaseTest.java` and `po.*` provide existing Selenium support. **Implemented/evidenced for four ExpressCart candidates.** |
| Validation and repair | `agent/src/validate.ts`, `sprint03-repair.ts`, `sprint03-repair2.ts`, `sprint03-langgraph-repair.ts`, `sprint03-langgraph-repair2.ts`; `agent/test/validate.test.ts` | Syntax/schema checks and two repair rounds exist in pilot scripts. Generated Java build/E2E outcomes are documented in Sprint 03–05; module compile is not per-class compile. No shared validation role/dispatcher is connected end-to-end to the proposal graph. **Partially implemented; reuse after extraction.** |
| ExpressCart application and source pin | `experiments/expresscart/SOURCE-LOCK.json`, `experiments/expresscart/compose.yaml`, `experiments/expresscart/source/package.json`, `experiments/expresscart/evidence/runtime-manifest.json` | Lock/evidence identify upstream source `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19` (benchmark label `1.19`), scoped Compose project and captured runtime. Historical runtime evidence is not a fresh T00 run. **Pilot implementation/evidence exists.** |
| ExpressCart Base and generated suite | `experiments/expresscart/bewt-suite/pom.xml`, `src/test/java/tests/BaseTest.java`, existing `tests/*.java`, `src/main/java/po/` | Copied/extended Maven Selenium suite and Page Objects exist. POM declares Java 21 properties but compiler plugin config explicitly sets source/target `1.8`; reconcile with recorded Java 21 workflow before relying on the declared properties. **Reuse candidate and compatibility risk.** |
| Eight-app configuration/adapters | Roadmap proposes `config/apps/`, `adapters/<app>/`, `extension/<app>/`; repository inventory has no tracked such directories or per-app configs | No config/adapter evidence for Bludit, Claroline, Joomla, Kanboard, MantisBT, MediaWiki, or PrestaShop was found. **Not implemented in tracked repo.** |
| Dataset/evaluation protocol | `docs/research-results/sprint-01/` through `sprint-05/`, `docs/research-results/final/` | Extensive ExpressCart pilot provenance and evaluation drafts exist. The final evidence index points to raw runs, reports run denominators, and cautions that novelty and coverage gain are not evaluated. No complete eight-app dataset or measured RQ2 exists. **Reusable protocol/evidence patterns; program results incomplete.** |

## Research evidence snapshot (not gate acceptance)

The governance materials and historical reports consistently state: five ExpressCart Gherkin candidates; four accepted for implementation and one revise; four generated Java candidates; two final E2E-passing candidates (C04/C05) with three repeats each; C02 observed UI behavior defect; C01 inconclusive; C03 remains revise. Sprint 04's official invocation aggregate is 14 invocations: 8 PASS, 3 FAIL, 3 BLOCKED, with 11 reaching the behavior oracle. Invocation counts and reruns are not candidate counts. Coverage gain (RQ2) and empirical novelty remain `NOT_EVALUATED`; these two E2E-passing cases are not automatically `VALIDATED` under the contract.

Primary paths: `docs/research-results/sprint-01/SPRINT-01-RESULTS.md`; `docs/research-results/sprint-02/CANDIDATE-REVIEW.md`; `docs/research-results/sprint-02/human-review-decisions.json`; `docs/research-results/sprint-03/SPRINT-03-RESULTS.md`; `docs/research-results/sprint-03/langgraph-repair-history.json`; `docs/research-results/sprint-04/SPRINT-04-RESULTS.md`; `docs/research-results/sprint-04/metrics.json`; `docs/research-results/sprint-04/surefire-index.json`; `docs/research-results/sprint-05/SPRINT-05-RESULTS.md`; `docs/research-results/final/EVIDENCE-INDEX.md`; `docs/research-results/final/FINAL-READINESS-REVIEW.md`.

## Reuse, refactor, and safety risks

- Reuse sanitized source/test/route collection, candidate schema, Gherkin parser, Gemini adapter usage, structured-output patterns, Java BaseTest/Page Objects, run manifests, repair telemetry, and evidence indexing.
- Refactor the pilot into app-independent typed contracts, app adapters/manifests, explicit role nodes, a fixed command/tool dispatcher, checkpointed human pause/resume, shared bounded repair policy, and normalized per-candidate result schema. Preserve current ExpressCart IDs and evidence; do not rewrite raw historical records.
- Do not edit/reset the ignored `bewt-original/` nested benchmark. Its absence from a fresh outer clone means original inventories and version fidelity must be separately provisioned and verified before G0/G1 claims.
- Do not rerun the historical Compose stack as part of this static audit. Existing Docker/evidence files describe an experiment-specific project and data. Any future runtime/reset action must first verify ownership and follow the task's isolated reset contract.
- Preserve ExpressCart as the vertical slice and as historical research. Do not use it as proof that seven other applications are configured or that the target 40 cases are complete.

## Gap register

| Gap | State | Required evidence / dependency |
|---|---|---|
| Reusable four-role LangGraph with checkpoint/resume, allowlisted tools, HITL and bounded repair | `NOT_VERIFIED` beyond pilot components | T01 architecture extraction, tests, traceable full vertical slice; review before broad rollout |
| Eight pinned app environments and Base smoke/reset | No tracked manifests for seven apps; ExpressCart historical evidence only | T02 source/BEWT audit then T03 app-by-app G0, ownership and reset proof |
| Original Gherkin/Base inventory and mismatch mapping | Tracked outer repo excludes `bewt-original/`; proposal notes count mismatch risk | Provision/lock original inputs; T02/T04 create exact inventory and mapping without forcing counts to agree |
| Coverage matrices, proposals, reviewer decisions for all apps | No complete eight-app matrices found | T04 after source inventories; retain actual candidate/reviewer denominators |
| 40 new Gherkin and Java/Selenium candidates | ExpressCart pilot only; no seven-app implementations | T05 generation/implementation after per-app review and approved oracle/fixture |
| Validated cases under 3 clean-state reruns | Contract-compliant validated count is null; 2 pilot candidates have repeat evidence but not full program acceptance | Case-level provenance, oracle/novelty review, fixture/reset, first run and 3/3 reruns |
| RQ1–RQ4 and D1–D8 across eight apps | Partial ExpressCart-only work; RQ2 not evaluated | T06 dataset/metrics with denominators and evidence; T07 synthesis after review |\n