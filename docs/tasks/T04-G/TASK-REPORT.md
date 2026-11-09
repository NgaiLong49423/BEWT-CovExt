# T04-G Task Handoff

## Part A — PR #17 merge verification

- Approved PR #17 (`feature/t04f-seven-app-novelty-oracle-review`) was merged as a merge commit after verifying its reviewed HEAD `cb9dc62493e7553b33dd0ad510e0e089b79f2af9`, reviewed base `bd9b3b15fca28419ada9862b8a65bac910edf169`, base branch `main`, and nine-file T04-F-only scope.
- Merge commit and resulting `origin/main`: `0cba0eaf0fa416e90a5ac766bc604ee71d43818e`.
- PR state: MERGED at `2026-11-09T20:38:04Z`.
- Post-merge T04-F validator: PASS — `records=27; shortlist=20; baseline_links=46; distinct_cases=35; screened_nearby_links=19`; 14/14 negative cases and secret scan passed.
- T04-G branch was based on that updated main. During the original implementation, PR #17 was the only PR this agent merged; this correction task did not merge a PR.

## Part B — T04-G implementation

- Branch: `feature/t04g-g1-review-baseline`.
- Scope: seven applications; no Kanboard; no edits outside `docs/tasks/T04-G/**`.
- Behavioral baseline: 227 provisional feature-level records, 204 explicit Scenario headers, 226 feature-to-Java mappings, one feature-only record, 228 Java test suite entries including two Java-only; 316 assertion-call lines. This is not a count of unique behavior and is not an official denominator.
- Candidate mapping: all 27 T04-F candidates have a queue and delta record; 20 shortlist entries are prioritized within each application. There are 46 direct candidate-baseline links over 35 distinct baseline cases and 19 separately labeled nearby screening links.
- Human readiness: decision protocol, blank template, candidate-specific questions, fixture/oracle context and evidence links are present. No human decision or approval was created. `CL-GAP-002` remains blocked on authoritative authorization policy; Claroline runtime-image/source provenance is incomplete. Eight per-application quota shortfalls remain open.
- Outcome: `PARTIAL_WITH_LIMITATIONS`. No candidate implementation, G1 PASS, runtime/E2E result, novelty validation, or RQ2 result is claimed. `docs/program/STATUS.json` remains unchanged.
- Validator and negative-test evidence: see `TEST-RESULTS.md`.
- Exact tested code/data SHA is recorded in `TEST-RESULTS.md` after this correction commit.
- Final PR #20 URL: https://github.com/NgaiLong49423/BEWT-CovExt/pull/20; the final head SHA is verified from PR metadata at handoff.

## Changed files

All task artifacts, pinned-source excerpts, builder, validator, and handoff documents are under `docs/tasks/T04-G/`. No source application code or shared program status was changed.

## Independent review gate

At the start of this correction task, GitHub reported PR #20 already MERGED at `2026-11-09T21:53:52Z`, head `0870f4c2a3ba93137c5908f78dcb8c8464ed58cc`, merge commit `3687c015bf06c6e05a2e15ac2ef91bbaafa2c541`. This agent did not merge it. A merged PR cannot be returned to OPEN; no replacement PR is created under the current instruction. Corrections are pushed to the original branch for inspection, but the independent review gate cannot be restored through PR #20. No candidate approval or implementation is inferred from that prior merge.

## Independent review corrections

- F01: rebuilt all 227 case records from pinned Gherkin and Java Git blobs. Ordinary quoted UI labels, expected messages, test values, and Java assertion literals are preserved. Only credential-field values and explicit secret-like assignments are replaced with quoted redaction markers. Catalog text is no longer broadly redacted.
- F02: `build_t04g.py` now requires the pinned BEWT checkout and regenerates outputs from source plus read-only T04-D/T04-F inputs. It verifies commit, tree, Git blob IDs, mapping paths, Then anchors, scenario anchors, Java method anchors, and Java assertion anchors. Output is deterministic for the same source and tool versions.
- F03: candidate questions are regenerated directly from T04-F JSON. BL-GAP-002 and MB-GAP-001 retain the source's U+2019 curly apostrophes; no U+FFFD replacement character is permitted in text artifacts.
- Catalog completeness is checked against all T04-D feature case IDs, including cases with no candidate links. One feature-only MantisBT record and two Java-only PrestaShop tests remain distinct. Records remain provisional case-level drafts, with no semantic consolidation or official denominator.
- Review queue order is stable by application, shortlisted-first, then per-app priority, followed by remaining candidates in T04-F source order.
- ORACLE-SIM-004 remains a NEEDS_REVIEW hypothesis. It combines enrollment/add and removal transitions; the catalog explicitly flags a high false-positive risk and prohibits automatic merging or denominator change.

## Cloud-only policy acknowledgement

- Agent / Task: Agent 2 / T04-G
- Docker target: GOOGLE_CLOUD_ONLY
- Local Docker allowed: NO
- Cloud VM verified: NO — this static task does not need VM access.
- Runtime lease owner: Agent 1, per Team Lead instruction (including Claroline default ownership).
- Runtime performed: NO
- Changes required: apply this policy to future runtime tasks.
- Blockers: none for the static corrections; runtime tasks must verify VM state, authorization, and exclusive lease first.
- Next action: complete static correction and return PR #20 to independent review.
