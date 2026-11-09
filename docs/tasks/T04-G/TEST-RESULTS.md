# T04-G Independent Review Correction — Test Results

## Reproducible source extraction

- Python: 3.12.10. Git: 2.55.0.windows.3.
- Read-only baseline checkout: HEAD `0501249ff3e9a5ea83a06155cd2971dc36197056`; tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`.
- Source is read from the checkout's files. Builder verifies HEAD and tree, lists Git tree blob IDs, recomputes Git blob SHA-1 from file bytes, and checks T04-D paths, source hashes, scenario/Then anchors, Java method anchors, and assertion anchors before writing.
- The checkout is local at `docs/tasks/T04-G/evidence/baseline-checkout/`, ignored by the task .gitignore, and was not modified.

Reproduce from a fresh checkout:

```powershell
git init BEWT-CHECKOUT
git -C BEWT-CHECKOUT remote add origin https://github.com/OlianasD/BEWT.git
git -C BEWT-CHECKOUT fetch --depth=1 origin 0501249ff3e9a5ea83a06155cd2971dc36197056
git -C BEWT-CHECKOUT checkout --detach 0501249ff3e9a5ea83a06155cd2971dc36197056
python docs/tasks/T04-G/tools/build_t04g.py --baseline-checkout BEWT-CHECKOUT --check-determinism
python docs/tasks/T04-G/tools/validate_t04g.py --baseline-checkout BEWT-CHECKOUT --negative-tests
```

## Exact test commands and results

Tested code/data commit: `326d37e45deaab4a4cfcb673555cad0e28d2555e`.

Command: `python docs/tasks/T04-G/tools/build_t04g.py --baseline-checkout docs/tasks/T04-G/evidence/baseline-checkout --check-determinism`

- Exit code: 0
- Stdout: `{"status": "PASS", "sourceCommit": "0501249ff3e9a5ea83a06155cd2971dc36197056", "sourceTree": "d38fcc0eae8073023c48bb46998741c8c19d4d06", "featureCases": 227, "candidateCount": 27, "directLinks": 46, "nearbyLinks": 19, "determinism": "PASS"}`
- Stderr: empty

Command: `python docs/tasks/T04-G/tools/validate_t04g.py --baseline-checkout docs/tasks/T04-G/evidence/baseline-checkout --negative-tests`

- Exit code: 0
- Stdout:

```json
{"status": "PASS", "sourceCommit": "0501249ff3e9a5ea83a06155cd2971dc36197056", "sourceTree": "d38fcc0eae8073023c48bb46998741c8c19d4d06", "units": 227, "candidates": 27, "shortlist": 20, "directLinks": 46, "distinctBaselineCases": 35, "nearbyLinks": 19, "officialBehavioralDenominator": null, "negativeTests": [{"test": "remove-unreferenced-unit", "result": "PASS"}, {"test": "duplicate-unit-id", "result": "PASS"}, {"test": "duplicate-case-id", "result": "PASS"}, {"test": "feature-blob-sha", "result": "PASS"}, {"test": "java-assertion-anchor", "result": "PASS"}, {"test": "aggregate-count", "result": "PASS"}, {"test": "queue-priority-order", "result": "PASS"}, {"test": "candidate-baseline-link", "result": "PASS"}, {"test": "nearby-link", "result": "PASS"}, {"test": "human-decision", "result": "PASS"}, {"test": "shortlist-membership", "result": "PASS"}, {"test": "replacement-character", "result": "PASS"}, {"test": "credential-redaction", "result": "PASS"}, {"test": "missing-baseline-mapping", "result": "PASS"}, {"test": "then-anchor", "result": "PASS"}, {"test": "mismatched-output", "result": "PASS"}, {"test": "incorrect-blob-sha", "result": "PASS"}, {"test": "truncated-source", "result": "PASS"}, {"test": "quoted-string-redaction-and-syntax", "result": "PASS"}]}
```

- Stderr: empty

Command: `git diff --check`

- Exit code: 0
- Stdout: empty
- Stderr (informational only; no whitespace errors):

  ```text
  warning: in the working copy of 'docs/tasks/T04-G/BEHAVIORAL-BASELINE-CATALOG.json', LF will be replaced by CRLF the next time Git touches it
  warning: in the working copy of 'docs/tasks/T04-G/CANDIDATE-BASELINE-DELTA.json', LF will be replaced by CRLF the next time Git touches it
  warning: in the working copy of 'docs/tasks/T04-G/HUMAN-REVIEW-QUEUE.json', LF will be replaced by CRLF the next time Git touches it
  warning: in the working copy of 'docs/tasks/T04-G/evidence/cands.json', LF will be replaced by CRLF the next time Git touches it
  warning: in the working copy of 'docs/tasks/T04-G/evidence/cat.json', LF will be replaced by CRLF the next time Git touches it
  warning: in the working copy of 'docs/tasks/T04-G/evidence/comps.json', LF will be replaced by CRLF the next time Git touches it
  warning: in the working copy of 'docs/tasks/T04-G/evidence/near.json', LF will be replaced by CRLF the next time Git touches it
  ```

## Corrected evidence and integrity

- T04-D completeness: 227 feature records; 204 scenario headers; 226 feature-to-Java mappings; one feature-only MantisBT case; two Java-only PrestaShop tests; 290 Then references; 316 Java assertion lines.
- Candidate links: 27 candidates, 20 shortlisted, 46 direct links over 35 distinct baseline cases, and 19 separately validated nearby links. Queue order groups applications in the documented stable order, then shortlisted by ascending per-app priority, followed by non-shortlisted candidates in T04-F source order.
- F01: safe quoted labels, expected messages, test data and Java assertion literals are preserved. The rebuilt corpus masks 470 credential-field values with quoted markers; other quoted excerpts are not broadly redacted.
- F03: BL-GAP-002 and MB-GAP-001 reviewer questions exactly match T04-F; their curly apostrophes are U+2019. UTF-8 scan found 0 U+FFFD characters. Secret scan found 0 credential-assignment matches in JSON/Markdown evidence.
- ORACLE-SIM-004 remains a hypothesis with explicit high false-positive risk for opposite enrollment/add and remove transitions; no automatic merge or denominator change.
- Task-local Git scope check uses the merge-base of `origin/main`; only `docs/tasks/T04-G/**` is modified. Shared STATUS, T04-D/E/F, coverage inputs and application code are unchanged.
- No Docker, Cloud VM, Selenium, Gemini, or application runtime was used.

## PR state and handoff

- PR #20 was already MERGED before these corrections: reviewed head `0870f4c2a3ba93137c5908f78dcb8c8464ed58cc`, merge commit `3687c015bf06c6e05a2e15ac2ef91bbaafa2c541`.
- PR #20's merged head is `0870f4c2a3ba93137c5908f78dcb8c8464ed58cc`; it cannot be reopened. After the user's later authorization, PR #21 was created from the correction branch to `main`; it is OPEN and is the current independent review gate. Its final head SHA is supplied in the task handoff.
- T04-G remains `PARTIAL_WITH_LIMITATIONS`; no candidate approval, G1 PASS, confirmed semantic consolidation, official denominator, or RQ2 result is claimed.
