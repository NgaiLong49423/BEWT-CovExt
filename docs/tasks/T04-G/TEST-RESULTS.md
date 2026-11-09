# T04-G Independent Review Correction — Test Results

## Source and tool versions

- Python: 3.12.10
- Git: 2.55.0.windows.3
- BEWT checkout: read-only sparse checkout at commit `0501249ff3e9a5ea83a06155cd2971dc36197056`; verified tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`.
- The checkout is local-only under `docs/tasks/T04-G/evidence/baseline-checkout/`, excluded from Git by the task-local .gitignore. No source files were changed.

Recreate a checkout and regenerate:

```powershell
git init BEWT-CHECKOUT
git -C BEWT-CHECKOUT remote add origin https://github.com/OlianasD/BEWT.git
git -C BEWT-CHECKOUT fetch --depth=1 origin 0501249ff3e9a5ea83a06155cd2971dc36197056
git -C BEWT-CHECKOUT checkout --detach 0501249ff3e9a5ea83a06155cd2971dc36197056
python docs/tasks/T04-G/tools/build_t04g.py --baseline-checkout BEWT-CHECKOUT --check-determinism
python docs/tasks/T04-G/tools/validate_t04g.py --baseline-checkout BEWT-CHECKOUT --negative-tests
```

The builder verifies checkout HEAD/tree, obtains the pinned Git tree's blob IDs, recomputes Git blob hashes from checked-out bytes, and matches all T04-D paths, blob hashes, and line anchors before writing outputs. Missing or mismatched source returns NOT_VERIFIED and a nonzero exit.

## Commands and results

- `python docs/tasks/T04-G/tools/build_t04g.py --baseline-checkout docs/tasks/T04-G/evidence/baseline-checkout --check-determinism` — exit 0. Stdout: `{"status":"PASS","sourceCommit":"0501249ff3e9a5ea83a06155cd2971dc36197056","sourceTree":"d38fcc0eae8073023c48bb46998741c8c19d4d06","featureCases":227,"candidateCount":27,"directLinks":46,"nearbyLinks":19,"determinism":"PASS"}`. Stderr: empty.
- `python docs/tasks/T04-G/tools/validate_t04g.py --baseline-checkout docs/tasks/T04-G/evidence/baseline-checkout --negative-tests` — exit 0; all negative tests PASS. Exact output is recorded at final tested code/data SHA after commit.
- `git diff --check` — exit 0; no whitespace errors. Informational Git line-ending notices, if present, are recorded separately from errors.
- Catalog/T04-D comparison: 227 feature cases, 204 Scenario headers, 226 feature-to-Java matches, one feature-only MantisBT case, two Java-only PrestaShop tests; 290 Then refs and 316 assertion lines.
- Candidate/T04-F comparison: 27 candidates, 20 shortlisted, 46 direct links over 35 distinct baseline cases, 19 separate nearby links. Queue is grouped by app, shortlisted-first, with per-app priorities ascending.

## Correction checks

- F01: safe quoted labels, expected messages, test values, and Java assertion literals remain intact. Only credential-field values or explicit secret assignments are replaced, with quotes and syntax retained. Synthetic redaction/syntax tests are automated.
- F02: builder output is regenerated directly from the pinned Git checkout and read-only T04-D/T04-F inputs; repeated generation is byte-deterministic.
- F03: candidate questions in cands, queue, and delta are regenerated from T04-F; BL-GAP-002 and MB-GAP-001 curly apostrophes are U+2019. U+FFFD is rejected throughout text artifacts.
- Completeness/negative checks cover unreferenced-unit removal, duplicate unit IDs/case IDs, feature SHA, Java assertion anchor, aggregate counts, priority order, candidate/nearby links, approval state, shortlist membership, U+FFFD, missing mapping, Then anchor, mismatched output, incorrect SHA, truncated bytes, and quote-preserving redaction.
- ORACLE-SIM-004 remains a hypothesis; opposite enrollment/add versus remove transitions carry an explicit high false-positive risk.

## Scope, policy, and status

- Changed Git paths are restricted to `docs/tasks/T04-G/**`; merge-base check uses `origin/main`. Shared STATUS, T04-D/E/F, coverage data, and application code are unchanged.
- Secret scan and UTF-8 scan must pass on the final diff.
- Static task only: no Docker, Cloud VM, Selenium, Gemini, or application runtime.
- Task status remains `PARTIAL_WITH_LIMITATIONS`; no human approval, G1 PASS, confirmed semantic consolidation, official behavioral denominator, or RQ2 result is claimed.

## SHA handoff

- Exact tested code/data commit SHA: recorded after the final code/data commit.
- Final PR #20 HEAD and URL: supplied by GitHub PR metadata and final task handoff; a containing commit cannot store its own SHA.
