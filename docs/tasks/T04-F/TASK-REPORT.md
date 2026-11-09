# T04-F — G1 review preparation

- Task scope / acceptance gate: prepare source-pinned review packets for Gherkin, assertion oracle and novelty of seven-app source-backed G1 proposals; no human approval, no G1 PASS.
- Base branch + base SHA: `origin/main` / `bd9b3b15fca28419ada9862b8a65bac910edf169`.
- Working branch: `feature/offline-g1-review-prep`.
- Head commit (review-package/evidence commit): `b430f6af02f64d8e8ada22ffcf87ca7a91482846`; the final PR head is verified from GitHub after the report-only handoff update.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/18 (open against `main`; no merge requested).
- Push status: PUSHED. `origin/feature/offline-g1-review-prep` was verified at `b430f6af02f64d8e8ada22ffcf87ca7a91482846`; a report-only handoff commit is being added to this same PR.
- Runtime/commit/version tested: static data from T04-D and T04-E at this main; pinned app source refs are recorded in `docs/tasks/T04-E/source-reference-index.json`.
- Status proposed by Agent: CODE_READY_FOR_MERGE for the review-preparation artifacts after independent review; all app G1 gates remain NOT_VERIFIED.

## 1. What changed

| File path | Change | Why |
|---|---|---|
| `docs/tasks/T04-F/G1-REVIEW-PACKAGE.md` | Seven-app G1 scope, evidence caveats, review requests and targeted holds | Hand off source-supported candidates without promoting them |
| `docs/tasks/T04-F/review-packets/*.md` | 20 draft-only Gherkin/oracle/novelty review entries across seven apps | Give human reviewers exact source/baseline links and blank decision fields |
| `docs/tasks/T04-F/tools/verify-review-package.mjs` | Offline completeness/provenance/decision-boundary verifier | Ensure all 20 shortlisted candidates are represented and linked |
| `docs/tasks/T04-F/TEST-RESULTS.md` | Exact offline commands and outcomes | Record actual verification and limits |

No T04-D/T04-E input, historical dataset, Kanboard file, or shared program status is edited.

## 2. Actual verification

See `TEST-RESULTS.md` and `evidence/verification/t04f-g1-20261110-r4/`.

## 3. Research impact

- Apps: seven non-Kanboard apps only; Claroline provenance is partial.
- Candidates remain proposals; 20 in technical review order, 7 additional proposals not shortlisted; no quota padding.
- RQ1 novelty/acceptance and RQ2 remain NOT_EVALUATED; no behavioral denominator.
- No Gherkin candidate is accepted, no Java/Selenium candidate implemented, no G1 gate promoted.

## 4. Safety & integrity

- `bewt-original/` touched? NO.
- Docker/project resources touched? NONE.
- Shared `docs/program/STATUS.json` touched? NO.
- Historical T04-D/T04-E data or Kanboard contested material changed? NO.
- Secret scan, diff review and exact test logs: see verification evidence.
- Existing unrelated local dirty files were kept in the original checkout; this task uses a separate worktree from main.

## 5. Evidence and reproduction

- Source and baseline inputs: `data/coverage/<app>/source-backed-gap-{proposals,shortlist}.json`, `baseline-mapping.json`, `docs/tasks/T04-E/source-reference-index.json`.
- Review docs: `G1-REVIEW-PACKAGE.md`, `review-packets/`.
- Offline verification: `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs`; `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs`; `node docs/tasks/T04-D/tools/verify-inventory.mjs`; `node docs/tasks/T04-F/tools/verify-review-package.mjs`.
- Runtime and human review: NOT_RUN.

## 6. Review request

Review the 20 shortlisted packets, resolve targeted holds (especially EC-GAP-003, MB-GAP-003 and MW-GAP-003), and record decisions through the approved human review workflow. No G1 status update is requested or made. PR diff should be checked against only `docs/tasks/T04-F/`.
