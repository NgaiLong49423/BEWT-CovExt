# FINAL-PROJECT-ACCEPTANCE-20261113 — Project Closure

- Task scope / acceptance gate: Final project acceptance and development-phase closure; all gates reported from evidence without promoting unverified candidates.
- Acceptance window: 2026-11-13 05:00:04–05:17:03 Asia/Ho_Chi_Minh (UTC+07:00); closure record prepared at 05:19 Asia/Ho_Chi_Minh.
- Repository: `NgaiLong49423/BEWT-CovExt` (`https://github.com/NgaiLong49423/BEWT-CovExt`).
- Acceptance branch: `main`.
- Main commit tested: `55a3a3a6c3ea9fbffa72e773aaab57496e84a93f`.
- Working branch for this closure record: `codex/final-project-acceptance`.
- Closure PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/37 (head `7ad67c9ce2b3c17ad49632c12f1370e833774f2a`; final merge SHA is recorded in GitHub and the completion notice).
- Proposed status: `PARTIAL`; Development Phase `CLOSED` by Project Owner decision.

## 1. GitHub finalization

Merged by PR into `main` before acceptance:

| PR | Result | Merge SHA | Scope |
|---|---|---|---|
| [#27](https://github.com/NgaiLong49423/BEWT-CovExt/pull/27) | Merged | `fd6627f4a73bffd43b2c31d5b89cb3afe9d86094` | Claroline/Kanboard active R3 suite integration; compile-only evidence, no G3 claim |
| [#32](https://github.com/NgaiLong49423/BEWT-CovExt/pull/32) | Merged | `5ef684c1abcaff78622e330e27a983979a18e526` | EC-GAP-002 R6 compile-only candidate; human oracle/novelty review remains pending |
| [#35](https://github.com/NgaiLong49423/BEWT-CovExt/pull/35) | Merged | `55a3a3a6c3ea9fbffa72e773aaab57496e84a93f` | PS-GAP-003 source feasibility; remains `WRONG_BEHAVIOR`, no gate promotion |

At the finalization snapshot, eight PRs remained open and were not merged:

| PR | Reason not merged |
|---|---|
| #15 | SonarCloud failed; generated candidate still lacks human oracle/novelty approval and Java/G3 validation. |
| #28 | `DIRTY` conflict against its non-main base; credential/G0 validation is not established. |
| #29 | `DIRTY` conflict; its cloud G0 evidence is not accepted as a fresh, independently verified final run. |
| #30 | Draft against `task/final-remediation-audit`, not `main`; human approval and G3 acceptance are absent. |
| #31 | Draft against a non-main base and changes metrics/research/paper artifacts; those results were not reconciled on the acceptance main commit. |
| #33 | `DIRTY` conflict on `main`; a semantic mapping audit does not substitute for signed human oracle/novelty decisions. |
| #34 | Draft against a non-main base and edits the scientific manuscript; Scientific Report Writing was explicitly not started. |
| #36 | `DIRTY` conflict on `main`; compile evidence alone does not establish human approval or G3 behavior. |

No conflict resolution was attempted for these PRs because no exact safe resolution could be established within final acceptance. No branch protection or review requirement was bypassed.

## 2. Build and test results on `main`

Commands ran in the clean detached checkout at `55a3a3a6c3ea9fbffa72e773aaab57496e84a93f`:

| Command / check | Result | Evidence / limits |
|---|---|---|
| `npm ci --no-audit --no-fund` (`framework`) | PASS | Lockfile install completed; `node_modules` is local/ignored. |
| `npm run build` (`framework`) | PASS | TypeScript build. |
| `npm run test:unit` (`framework`) | PASS — 23/23 | No failures or skips. |
| `npm run test:integration` (`framework`) | FAIL — 18 pass, 1 fail, 1 skip | `t01c-offline-approved-java-pipeline.test.ts:237`: expected `repairCalls === 1`, got `0`; SQLite replay test was skipped. No repair was made during acceptance. |
| `mvn -B -ntp -f experiments/<app>/bewt-suite/pom.xml -DskipTests test` for Bludit, Claroline, ExpressCart, Joomla, Kanboard, MantisBT, MediaWiki, PrestaShop | PASS — 8/8 BUILD SUCCESS | Test sources compiled; Surefire execution was skipped. This is not Java unit or application E2E evidence. Structured Maven output: `evidence/2026-11-13-main-acceptance/maven-test-compile-results.json`. |
| `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` | PASS — 29/29 | Parser, signatures, hashes, denominator, runtime evidence, and gate-classification negative controls. |
| `node --test docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs` | PASS — 3/3 | Existing 79 canonical IDs remain separate from supplementary/orphan artifacts. |
| `node --check docs/research-results/v2/replication/recompute-metrics.mjs` | PASS | Syntax check only. The metric recomputation command was not run to avoid generating/revising scientific result tables during closure. |
| SonarCloud check on current `main` | FAIL | GitHub check `SonarCloud Code Analysis`, completed 2026-11-12 22:05:25Z: new-code duplication 6.3% (limit 3%); new-code Security Rating D and Reliability Rating D (required A). [Main branch analysis](https://sonarcloud.io/dashboard?id=NgaiLong49423_BEWT-CovExt&branch=main). |
| Live app, Selenium, Docker, G0/G3, and three clean-state reruns | NOT VERIFIED / NOT RUN | No G0-ready signal followed the Project Owner's earlier note that test variables would be injected on the VM. No credentials were accessed or exposed and no cloud/Docker experiment was started. |

The Gherkin-dependent negative test initially could not import `@cucumber/gherkin/dist/index.js`; after the locked dependency install and framework build, the final 29/29 run passed.

## 3. Research goals and acceptance

- Approved scope remains **8 applications / up to 40 target cases**.
- Source, registered artifacts, and current main evidence do not establish 40 semantically correct and human-approved candidates.
- `VALIDATED` cases: **0/40**. Signed human oracle/novelty approvals: **0/40** in the final acceptance package.
- The main-branch acceptance evidence supports a **PARTIAL** project result: framework and all eight Maven test-source compilations passed, but an integration test and main Sonar gate failed, and research/runtime gates remain incomplete.
- G0/G3, live application behavior, clean-state reruns, and the committed application integrations were **not verified** by this acceptance run. Historical run summaries are not substituted for exact-source/runtime final acceptance.
- Existing documented blocker list: `docs/final-acceptance/OPEN-BLOCKERS.md` (10 items). Two additional failures were observed in this acceptance run: the framework integration assertion and main Sonar gate. Remaining issues: **12** under this counting rule. G0/G3 and unverified human decisions are already represented in the existing blocker list.

## 4. Risks and limits

- The main Sonar quality gate is failing on duplication, security rating, and reliability rating.
- A framework integration test does not reach the expected single Java repair call.
- Maven used `-DskipTests`; Selenium and application behavior were not executed.
- Cloud credentials/readiness were not supplied in-session; live acceptance and resource cleanup were not verified.
- Current historical G3 accounting identifies 79 primary run IDs, 84 run records, and 85 JUnit artifacts, including supplementary/unregistered records and cleanup concerns; see `docs/final-acceptance/G3-RAW-RUN-ACCOUNTING.md`.
- Closure does not mark any research gate `ACCEPTED` or candidate `VALIDATED`.

## 5. Safety and closure

- `bewt-original/` touched: **No**.
- Docker/cloud resources touched: **None**.
- Source code changed for this acceptance: **No**.
- Untracked test-created evidence directories in the acceptance worktree were preserved and excluded from the closure PR.
- Development Phase: **CLOSED** by Project Owner decision, with PARTIAL result and outstanding issues recorded.
- Scientific Report Phase: **READY TO START** after this task.
- Scientific Report Writing: **NOT STARTED**.
- Current task: **CLOSED** when PR #37 integrates this record; the final main SHA is verified in the completion notice.