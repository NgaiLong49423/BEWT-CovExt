# T04-A Review Fixes - Task Report

- Scope / gate: Focused corrections to Kanboard T04-A inventory and candidate review data; G1 remains NOT_ACCEPTED.
- Reviewed base commit: `6e8033cf2f970857f5fa998641ba05c3e56f6f31`.
- Working branch: `feature/t04a-kanboard-coverage-inventory`.
- Pull request: https://github.com/NgaiLong49423/BEWT-CovExt/pull/8 (same PR; do not merge).
- Source pins: BEWT `0501249ff3e9a5ea83a06155cd2971dc36197056`; Kanboard `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.
- Scope invariant: 30 baseline mappings, 6 behavior groups, 10 `PROPOSED` gaps, 5 shortlisted proposals. No G1/G2/D1 acceptance and T04-B remains NOT_STARTED.

## 1. Root causes and corrections

| Review issue | Root cause | Correction |
|---|---|---|
| Oracle redaction corruption | The earlier line-wide rule redacted the first quoted string on any line mentioning a Password field, including `Then` validation messages. The email rule also replaced quoted literals without retaining Java string syntax or oracle context. | Redaction now targets only password/confirmation values in form-entry steps and email literals in email-field fixture entry or Java `setEmail`/`getEmail` lines. Expected UI messages, public oracles and assertion predicates remain unchanged. Java email literals remain quoted and get a case-scoped `logicalFixtureId`, safe placeholder and occurrence record linking setup and assertion. Inventory/provenance schema is 1.1 and records every transformation. |
| Pinned input integrity | The prior generator trusted pinned HEAD/tree metadata while reading arbitrary current working-tree bytes. | The generator rejects symlinked inputs, checks each tracked input against the pinned commit, reads authoritative bytes through `git cat-file --batch`, verifies Git blob IDs, and records original-byte SHA-256 values. Dirty tracked inputs fail closed before `STATIC_VERIFIED`. |
| SonarCloud annotations | The reviewed generator resolved Git through ambient `PATH`; used default array sorts; and used complex regexes for email literals and Java import parsing. | Git is invoked only through fixed system installation paths with shell disabled. Array ordering uses an explicit lexical comparator. Quoted literals are scanned linearly; imports are parsed from line prefixes rather than a broad import regex. SonarCloud Quality Gate passed on review-fix source commit `0940e3c17c996ca784a36dbc7fca33d6137986a1` (check run `128883189861`): 0 new/accepted issues, 0 hotspots, 0 annotations; the check reported 0.0% new-code coverage and 0.0% duplication. The preceding reviewed head `6e8033c` had failed; its six findings and source-level corrections are indexed in the evidence file. |
| KB-023 / KB-026 presentation | Raw feature titles were treated as behavior summaries despite conflicts with the Java assertions. | Raw titles are preserved. `behaviorInterpretation` and the mapping table separately state the observed required-password validation and user-deletion behavior, with source/Java assertion evidence. Category, taxonomy and denominator remain unchanged. |
| KB-GAP-004 contract | The draft lacked explicit actor-role, target-membership, stable-fixture and permission-boundary controls. | Preconditions and source evidence now cover an active Manager/Member target in the same project, an actor permitted to update/change assignee, a stable pre-seeded fixture and an unauthorized-role negative control. The separate technical recommendation is not a Team Lead decision. Forged non-member `owner_id` rejection remains NOT_VERIFIED. |
| Encoding | Four review packet headings and the earlier offline-check line contained replacement/corrupt characters. | Headings and blocker history are written as UTF-8. The prior source lookup blocker is preserved as RESOLVED and explicitly superseded by source-recovery evidence. |

## 2. Source and test changes

- Generator: [`experiments/kanboard/tools/coverage-inventory.mjs`](../../../experiments/kanboard/tools/coverage-inventory.mjs).
- Focused tests: [`experiments/kanboard/tools/test/coverage-inventory.test.mjs`](../../../experiments/kanboard/tools/test/coverage-inventory.test.mjs).
- Regenerated public data: `data/coverage/kanboard/{inventory.json,provenance-index.json,KANBOARD-BASELINE-MAPPING.md}`.
- Candidate metadata: `data/coverage/kanboard/gap-candidates.json`; KB-GAP-004 review packet: `docs/tasks/T04-A/review-packets/KB-GAP-004.md`.
- Related documentation: `data/coverage/kanboard/README.md`, `docs/tasks/T04-A/{TASK-REPORT.md,TEST-RESULTS.md,KANBOARD-BASELINE-MAPPING.md,CANDIDATE-SHORTLIST.md,COVERAGE-GAP-ANALYSIS.md,T04-B-READINESS.md}` and review packets 001/002/003/008.
- New evidence only: `docs/tasks/T04-A/evidence/review-fixes/`.

## 3. Verification and limits

The new evidence directory records syntax, utility tests, source-to-Git-object integrity, source oracle comparisons, regeneration hashes, JSON/mapping consistency, redaction validation, secret scan, staged diff, and the SonarCloud result for the review-fix source commit. The focused suite covers both positive pinned-file reads and negative dirty source, wrong pin and symlink inputs; it directly compares KB-021, KB-022, KB-023 and KB-025 output against their pinned Gherkin and Java blobs.

No BEWT source, historical Sprint 01-05 evidence, shared `docs/program/STATUS.json`, Docker configuration, runtime environment or candidate research outcome was changed. Gemini, Docker, Selenium and live application behavior were not run. The static oracle parser cannot establish semantic correctness beyond source/Java text comparison. SonarCloud passed for exact source commit `0940e3c17c996ca784a36dbc7fca33d6137986a1`; it does not accept G1 or any program gate. The final documentation-only follow-up commit must be checked separately if SonarCloud schedules a new analysis.

## 4. Review request

Please review the preserved validation oracles, provenance/integrity contract, KB-023/KB-026 interpretation fields, and KB-GAP-004 guards/recommendation. Decide the five shortlist candidate dispositions separately. Do not start T04-B until this review gate is accepted.
