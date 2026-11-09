# T04-E — Source-backed gap analysis for seven apps

- Task scope / acceptance gate: Static source-backed gap proposals for Bludit, Claroline, ExpressCart, Joomla, MantisBT, MediaWiki and PrestaShop; no shared status update or G1 acceptance.
- Base branch + base SHA: `origin/main`, `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`.
- Working branch: `feature/t04e-seven-app-source-gaps`.
- Head commit (full SHA): final full SHA is reported after remote verification in the task handoff response.
- PR: to be recorded after creation; no merge requested or performed.
- Push status: pending remote verification.
- Runtime/commit/version tested: static application source pins listed in `SOURCE-AVAILABILITY.md`; BEWT baseline `0501249ff3e9a5ea83a06155cd2971dc36197056`. Runtime NOT_RUN.
- Status proposed by Agent: READY_FOR_REVIEW_WITH_LIMITATIONS. All G1 gates remain NOT_VERIFIED.

## 1. What changed

| Path | Change |
|---|---|
| `data/coverage/<app>/source-backed-gap-proposals.json` (7) | Four proposals/app; actor, role, fixture, operation, oracle, source refs, novelty, baseline overlap, negative control, risks and uncertainty |
| `data/coverage/<app>/source-backed-gap-shortlist.json` (7) | Three-item technical review order/app; no human decision |
| `docs/tasks/T04-E/source-reference-index.json` | Pinned source commit/tree, file Git blob SHA, line ranges and permalink |
| `docs/tasks/T04-E/{SOURCE-AVAILABILITY,BEHAVIOR-MAPPING-REVIEW,CANDIDATE-EVIDENCE-INDEX,TEST-RESULTS}.md` | Provenance, mapping, review and test handoff |
| `docs/tasks/T04-E/PROPOSED-STATUS-UPDATE.json` | Proposed-only status; shared `docs/program/STATUS.json` untouched |
| `docs/tasks/T04-E/tools/` | Reusable consistency validator and focused Node tests |

No source code was copied. T04-D historical files, `bewt-original/`, Kanboard files, decision ledgers, and shared status were untouched.

## 2. Actual verification

See `TEST-RESULTS.md`. Bundle validation PASS; Node tests 8/8 PASS; T04-D counts cross-checked. No live app, runtime, Selenium, Docker or Gemini execution.

## 3. Research impact

- Counts: Bludit 4, Claroline 4, ExpressCart 4, Joomla 4, MantisBT 4, MediaWiki 4, PrestaShop 4 (28 total); proposed technical review order 3/app (21 total).
- The directional 8–12/app target was not met. Only four directly supported proposals per app are included; no padding or exhaustive source-coverage claim.
- All candidate statuses remain PROPOSED; novelty NOT_VERIFIED; human decisions none.
- RQ1: proposals only; acceptance NOT_EVALUATED. RQ2: NOT_EVALUATED. RQ3: NOT_RUN. RQ4: NOT_EVALUATED.
- G1 remains NOT_VERIFIED for all apps; no VALIDATED case proposed.

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
