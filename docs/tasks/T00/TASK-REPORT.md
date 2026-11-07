# T00 — Bootstrap and Implementation Audit

- Task scope / acceptance gate: Import governance, audit the current implementation against proposal v2.0, create a gap report and next-task plan. No application or Docker changes. Task review is proposed `READY_FOR_REVIEW`; Team Lead acceptance is pending.
- Base branch + base SHA: `main` / `44bd7c4d7de683afbf1b14ac65c0b43db5950d8c`.
- Working branch: `docs/t00-program-contract`.
- Head commit (full 40-char SHA): pending commit.
- PR: pending creation; target `main`.
- Push status: pending.
- Runtime/commit/version tested: static source/evidence audit only; ExpressCart evidence refers to source commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19`; no runtime started in T00.
- Status proposed by Agent: `READY_FOR_REVIEW` after commit/push/PR checks; this is not a gate acceptance.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `AGENTS.md` | Imported supplied project instructions | Establish research scope, safety and evidence rules. |
| `docs/program/PROGRAM-CONTRACT.md` | Imported supplied contract | Preserve eight-app/40-case target, RQs and status definitions. |
| `docs/program/ACCEPTANCE-MATRIX.md` | Imported supplied matrix | Preserve G0–G4 and D1–D8 acceptance criteria. |
| `docs/program/IMPLEMENTATION-ROADMAP.md` | Imported supplied roadmap | Preserve task dependencies and target architecture. |
| `docs/program/STATUS.json` | Imported supplied initial snapshot, unchanged | It already matches available historical evidence; no gate advanced. |
| `docs/program/TASK-HANDOFF-TEMPLATE.md` | Imported supplied template | Standardize task evidence and GitHub handoff. |
| `docs/program/TASK-00-BOOTSTRAP.md` | Imported supplied bootstrap specification | Record T00 procedure and acceptance criteria. |
| `docs/tasks/T00/REPO-STATE-AND-GAPS.md` | Added source-grounded implementation inventory and gap register | Distinguish pilot evidence from program-level completion. |
| `docs/tasks/T00/NEXT-TASK-PLAN.md` | Added dependencies, bounded T01 scope, exit criteria and decisions | Give Team Lead a concrete reviewable next step. |
| `docs/tasks/T00/TASK-REPORT.md` | Added this handoff | Link results, checks, limitations and review request. |

Governance files came from the seven individual files in `C:\Users\Lenovo\Downloads\doc`, as allowed by `TASK-00-BOOTSTRAP.md` when no patch is present. The requested patch path `C:\Users\Lenovo\Downloads\doc\BEWT-CovExt-T00-Governance.patch` is missing; `git apply --check` reported `can't open patch ... No such file or directory`. No patch contents were inferred or recreated.

## 2. Actual verification

| Exact command / inspection | Result | Status | Evidence |
|---|---|---|---|
| `git remote -v` | origin fetch/push URL matched requested GitHub repository | PASS | command output; see repository metadata |
| `git fetch origin main` (approved outside sandbox after `.git/FETCH_HEAD` permission denial) | fetched `main`; observed SHA `44bd7c4d7de683afbf1b14ac65c0b43db5950d8c` | PASS | Git output; `git rev-parse origin/main` |
| `git status --short --branch` before edits | clean `main...origin/main`; no uncommitted changes | PASS | command output |
| `git switch -c docs/t00-program-contract origin/main` | branch created from fetched remote main | PASS | Git output |
| `git apply --check C:\Users\Lenovo\Downloads\doc\BEWT-CovExt-T00-Governance.patch` | patch file unavailable at exact path | BLOCKED | exact Git error recorded above |
| Read `C:\Users\Lenovo\Downloads\doc\AGENTS.md`, program docs and bootstrap | all seven individual governance files were available and imported | PASS | files listed in change table |
| Proposal `.docx` extraction and source/evidence review | static inspection; Python `python-docx` not installed, used built-in ZIP/XML extraction; no runtime invoked | PASS (static) | `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx`; source/evidence paths in gap report |
| `python -c` JSON parse of `docs/program/STATUS.json` | valid JSON | PASS | command output |
| Relative Markdown link/path check across the 10 task files | no unresolved relative links | PASS | command output |
| Secret-pattern scan of staged scope | no key/token/private-key patterns found | PASS | `rg` scan output (no matches) |
| `git diff --cached --check`, staged names/stat/full diff | whitespace check clean; exactly the ten listed Task T00 files staged and reviewed | PASS | command output; 10 paths, 687 insertions |
| Commit, push, PR and remote SHA | not yet run | NOT_RUN | pending |

No tests were run because T00 changes documentation only. No Docker or application runtime was started.

## 3. Research impact

- Apps affected: governance target is Bludit, Claroline, ExpressCart, Joomla, Kanboard, MantisBT, MediaWiki and PrestaShop; T00 changes no app runtime.
- Candidate IDs and statuses: no candidate status changes. Historical ExpressCart evidence remains 5 proposed / 4 accepted for implementation / 2 final E2E-pass candidates, with C01 inconclusive, C02 app UI defect, C03 revise; no new `VALIDATED` case claim.
- RQ1/RQ2/RQ3/RQ4: no new measurements. Existing evidence is ExpressCart-only and partial; RQ2 coverage gain and empirical novelty remain `NOT_EVALUATED`.
- Gate status: no G0–G4 or D1–D8 gate is accepted or advanced. `docs/program/STATUS.json` remains the supplied initial, non-acceptance snapshot.
- Dataset/metrics: no raw or historical metrics modified.
- Denominator: run invocation counts and repeated runs are not independent candidate counts; details and evidence references are in `REPO-STATE-AND-GAPS.md`.

## 4. Safety and integrity

- `bewt-original/` touched? NO.
- Docker/project resources touched? NONE; no runtime was started.
- Existing unrelated local dirty files preserved? Initial working tree was clean.
- Secret scan / staged diff review: PASS; only ten Task T00 paths staged, no credential-pattern matches, staged whitespace check clean.
- Failed/blocked: requested governance patch path is missing. The fallback individual documents were available. Fetch initially failed in sandbox due `.git/FETCH_HEAD` permission; fetch succeeded through approved scoped execution.

## 5. Evidence and reproduction

- Agent source: `experiments/expresscart/agent/src/workflow.ts`, `collector.ts`, `schema.ts`, `validate.ts`, `sprint03-generator.ts`, and repair scripts; detailed findings in `REPO-STATE-AND-GAPS.md`.
- Tests: `experiments/expresscart/agent/test/validate.test.ts`; Java tests under `experiments/expresscart/bewt-suite/src/test/java/tests/`.
- Runtime/source manifests: `experiments/expresscart/SOURCE-LOCK.json`, `experiments/expresscart/compose.yaml`, `experiments/expresscart/evidence/runtime-manifest.json`.
- Research results: `docs/research-results/sprint-01/` through `sprint-05/`; cross-reference `docs/research-results/final/EVIDENCE-INDEX.md`.
- Risks/limits: static audit only; ignored original BEWT inputs are not included in the outer repo; no current runtime verification; existing ExpressCart pilot does not establish multi-app reusability. Maven compiler setting discrepancy noted in gap report.

## 6. Review request

- Team Lead decisions: approve/revise T01 as next task; decide provisioning/version-lock strategy for ignored `bewt-original/`; settle Java compiler compatibility handling; confirm reviewer availability. Full scope remains eight apps/40 target cases plus full evaluation.
- Suggested next task: T01 framework extraction design and one reviewed ExpressCart vertical slice; do not begin the work before review of this T00 result.
- PR diff URL and changed paths: pending push and PR creation.\n
