# T04-F Task Report

## Outcome

Prepared technical semantic-overlap, oracle, fixture, and gap-sufficiency assessments for all 27 T04-E candidates, including all 20 shortlist entries. Independent-review corrections add explicit candidate-to-baseline traceability, bounded no-relevant-case search scopes, and stronger validation. No human decision or novelty approval was recorded; all runtime statuses remain `NOT_RUN`. Proposed handoff state: `PARTIAL_WITH_LIMITATIONS`.

## Correction results

- Candidate count remains 27; shortlist remains 20.
- Baseline traceability changed from 42 candidate-less rows / 33 distinct cases to 46 candidate–baseline links / 35 distinct cases, plus 19 separately labeled nearby-case screening links that are not counted as comparisons. The four new links associate CL-GAP-003 with CL-08/CL-10 and EC-GAP-003 with EC-15/EC-16.
- Eight candidates have `NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN` from bounded pinned inventory searches; novelty remains unverified.
- Semantic counts: 19 `PARTIAL_SEMANTIC_OVERLAP`, 8 `INSUFFICIENT_EVIDENCE`. Oracle counts: 25 `PARTIALLY_SOURCE_SUPPORTED`, 1 `SOURCE_SUPPORTED`, 1 `INSUFFICIENT_EVIDENCE`. Their set union contains 9 unique candidates. These counts are review bookkeeping, not RQ1/RQ2 outcomes.
- Targeted pinned Gherkin and Java content was directly checked for Claroline cases 08/10 and ExpressCart cases 15/16; other indexed line contents are marked `NOT_VERIFIED` by this validator.

## Evidence and limitations

- Baseline pin: BEWT `0501249ff3e9a5ea83a06155cd2971dc36197056`, tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`.
- See `SOURCE-AND-BASELINE-EVIDENCE-INDEX.json` for 35 distinct baseline evidence records, 46 candidate links, line-anchored permalinks, and eight bounded search scopes.
- Claroline release source is incomplete and runtime image patch provenance is unknown.
- No application runtime, Docker, Selenium/E2E, Gemini, or RQ2 measurement was run; the behavioral denominator is not established.

## Validation and publication

See `TEST-RESULTS.md` for exact commands, outputs, negative tests, and tested content SHA.

- Branch: `feature/t04f-seven-app-novelty-oracle-review`.
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/17 (open; not merged).
- Changed files: only the nine files under `docs/tasks/T04-F/`; shared `docs/program/STATUS.json` was not changed.
