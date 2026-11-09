# T04-G Task Handoff

## Part A — PR #17 merge verification

- Approved PR #17 (`feature/t04f-seven-app-novelty-oracle-review`) was merged as a merge commit after verifying its reviewed HEAD `cb9dc62493e7553b33dd0ad510e0e089b79f2af9`, reviewed base `bd9b3b15fca28419ada9862b8a65bac910edf169`, base branch `main`, and nine-file T04-F-only scope.
- Merge commit and resulting `origin/main`: `0cba0eaf0fa416e90a5ac766bc604ee71d43818e`.
- PR state: MERGED at `2026-11-09T20:38:04Z`.
- Post-merge T04-F validator: PASS — `records=27; shortlist=20; baseline_links=46; distinct_cases=35; screened_nearby_links=19`; 14/14 negative cases and secret scan passed.
- T04-G branch was based on that updated main. PR #17 was the only PR merged in this task.

## Part B — T04-G implementation

- Branch: `feature/t04g-g1-review-baseline`.
- Scope: seven applications; no Kanboard; no edits outside `docs/tasks/T04-G/**`.
- Behavioral baseline: 227 provisional feature-level records, 204 explicit Scenario headers, 226 feature-to-Java mappings, one feature-only record, 228 Java test suite entries including two Java-only; 316 assertion-call lines. This is not a count of unique behavior and is not an official denominator.
- Candidate mapping: all 27 T04-F candidates have a queue and delta record; 20 shortlist entries are prioritized within each application. There are 46 direct candidate-baseline links over 35 distinct baseline cases and 19 separately labeled nearby screening links.
- Human readiness: decision protocol, blank template, candidate-specific questions, fixture/oracle context and evidence links are present. No human decision or approval was created. `CL-GAP-002` remains blocked on authoritative authorization policy; Claroline runtime-image/source provenance is incomplete. Eight per-application quota shortfalls remain open.
- Outcome: `PARTIAL_WITH_LIMITATIONS`. No candidate implementation, G1 PASS, runtime/E2E result, novelty validation, or RQ2 result is claimed. `docs/program/STATUS.json` remains unchanged.
- Validator and negative-test evidence: see `TEST-RESULTS.md`.
- Code/data tested SHA: recorded in `TEST-RESULTS.md` after verification. Final PR SHA and URL will be recorded here after publication.

## Changed files

All task artifacts, sanitized pinned-source extracts, builder, validator, and handoff documents are under `docs/tasks/T04-G/`. No source application code or shared program status was changed.

## Independent review gate

The T04-G PR is to remain OPEN for independent review. Do not merge it or implement Gherkin/Java/Selenium candidates until human approval is recorded through the authorized process.
