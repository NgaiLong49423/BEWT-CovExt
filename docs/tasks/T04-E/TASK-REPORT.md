# T04-E — Source-backed gap analysis for seven apps

- Task scope / acceptance gate: Static source-backed gap proposals for Bludit, Claroline, ExpressCart, Joomla, MantisBT, MediaWiki and PrestaShop; no shared status update or G1 acceptance.
- Base branch + base SHA: `origin/main`, `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`.
- Working branch: `feature/t04e-seven-app-source-gaps`.
- Head commit (full SHA): Round 2 corrected source/data HEAD is verified and recorded in `evidence/verification/round-2-correction-run.md` after push.
- PR: [#16](https://github.com/NgaiLong49423/BEWT-CovExt/pull/16), same branch/PR, open against `main`; no merge requested or performed.
- Push status: Round 2 changes are pushed to the existing PR; the exact remote HEAD is recorded in `evidence/verification/round-2-correction-run.md`.
- Runtime/commit/version tested: static application source pins listed in `SOURCE-AVAILABILITY.md`; BEWT baseline `0501249ff3e9a5ea83a06155cd2971dc36197056`. Runtime NOT_RUN.
- Status proposed by Agent: READY_FOR_REVIEW_WITH_LIMITATIONS. All G1 gates remain NOT_VERIFIED.

## 1. What changed

| Path | Change |
|---|---|
| `data/coverage/<app>/source-backed-gap-proposals.json` (7) | 27 evidence-supported proposals total; ExpressCart has 3 after EC-GAP-001 was removed |
| `data/coverage/<app>/source-backed-gap-shortlist.json` (7) | 20-item technical review order total; no human decision |
| `docs/tasks/T04-E/source-reference-index.json` | Pinned source commit/tree, file Git blob SHA, numeric line ranges and immutable permalink |
| `docs/tasks/T04-E/{SOURCE-AVAILABILITY,BEHAVIOR-MAPPING-REVIEW,CANDIDATE-EVIDENCE-INDEX,TEST-RESULTS,EXPRESSCART-SOURCE-DEFECT-FINDINGS}.md` | Provenance, oracle mapping, corrections, defects and verification handoff |
| `docs/tasks/T04-E/evidence/verification/correction-run.md` | Runtime versions, exact command/output records, pinned API verification and file hashes |
| `docs/tasks/T04-E/PROPOSED-STATUS-UPDATE.json` | Proposed-only status; shared `docs/program/STATUS.json` untouched |
| `docs/tasks/T04-E/tools/` | Reusable consistency validator and focused Node tests |

No source code was copied. T04-D historical files, `bewt-original/`, Kanboard files, decision ledgers, and shared status were untouched.

## 2. Actual verification

See `TEST-RESULTS.md` and `evidence/verification/round-2-correction-run.md` for Round 2. The corrected CLI and 14 focused tests run on the corrected source/data HEAD; all 36 indexed source files and seven commit/tree links were previously checked against exact pinned GitHub API refs. No live app, runtime, Selenium, Docker or Gemini execution.

## 3. Research impact

- Counts: Bludit 4, Claroline 4, ExpressCart 3, Joomla 4, MantisBT 4, MediaWiki 4, PrestaShop 4 (27 total); technical review order is 20 total.
- EC-GAP-001 was removed, not renumbered or reused. Static findings are separately documented; no runtime impact is asserted.
- The directional 8–12/app target was not met. No padding or exhaustive source-coverage claim.
- All candidate statuses remain PROPOSED; novelty NOT_VERIFIED; human decisions none.
- RQ1: proposals only; acceptance NOT_EVALUATED. RQ2: NOT_EVALUATED. RQ3: NOT_RUN. RQ4: NOT_EVALUATED.
- G1 remains NOT_VERIFIED for all apps; no VALIDATED case proposed.

## 7. Correction outcomes

- Engineering: validator entrypoint uses `fileURLToPath`; subprocess CLI tests prove valid data prints PASS and invalid candidate/shortlist counts exit nonzero. Source path/pin/tree/range, shortlist counts and order, duplicate and oracle-reference consistency checks are deterministic; upstream object existence is confirmed separately by pinned GitHub API retrieval.
- Research: 27 candidate proposals, novelty NOT_VERIFIED, behavioral denominator NOT_ESTABLISHED, RQ2 NOT_EVALUATED. ExpressCart stock rejection is present in source; the missing-cart/auth concerns are separate unconfirmed defect findings.
- Merge readiness: STOPPED at independent review gate; no merge, G1 promotion or acceptance claim.

## 4. Safety & integrity

- `bewt-original/` touched? NO.
- Docker/project resources touched? NONE.
- Existing unrelated local dirty files preserved? YES; original checkout's pre-existing `experiments/expresscart/bewt-suite/docs/` was preserved.
- Secret/scope scan and final diff review: recorded in `evidence/verification/scope-and-secret-review.txt`.
- Claroline: source release is partial and runtime image has an unattributed patch; see `SOURCE-AVAILABILITY.md`.

## 5. Evidence and reproduction

- Source pins/per-file hashes/permalinks: `source-reference-index.json`.
- T04-D input summary: `evidence/verification/t04d-input-summary.txt`.
- Commands: `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs`; `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs`.
- Runtime evidence/fixtures: none; no app execution occurred.

## 6. Review request

Review source-to-oracle fit, semantic overlap with all baseline Gherkin/Java, Claroline's partial provenance, and whether further analysis is needed to reach the directional 8–12 range. The shortlist is only a technical review order. Stop at review gate; no merge or G1 promotion requested.
