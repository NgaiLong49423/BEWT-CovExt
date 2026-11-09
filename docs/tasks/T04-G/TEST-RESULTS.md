# T04-G Test Results

## Static evidence and validator

- Runtime: Python 3.12.10 (Windows).
- Command: `python docs/tasks/T04-G/tools/build_t04g.py` — exit 0; output `{"candidates": 27, "links": 46, "nearby": 19}`.
- Command: `python docs/tasks/T04-G/tools/validate_t04g.py --negative-tests` — exit 0; output `negative_tests=6/6 detected` and `PASS: units=227 candidates=27 shortlist=20 links=46 distinct_baseline_cases=35 nearby=19 official_denominator=null`.
- Negative mutations covered candidate ID, candidate-baseline link, source pin, Gherkin anchor, elevated human status, and shortlist membership. All six were rejected.
- Command: `git diff --check` — exit 0; no whitespace errors.
- Pinned source extraction: 227 feature blobs and 226 mapped Java blobs matched expected SHA; one feature-only record; two Java-only files also matched pinned SHA. Expected Then anchors from T04-D were cross-checked against extracted Gherkin lines. 290 mapped Then line references and 314 assertions are in feature-mapped units; two Java-only assertion lines bring the total to 316.

## Scope and secret scan

- Expected changed scope: `docs/tasks/T04-G/**` only. `docs/program/STATUS.json`, T04-D/E/F, `data/coverage/**`, and `bewt-original/**` were not edited.
- No application runtime, Docker, Selenium, or Gemini was used.
- Secret review: source excerpts redact quoted literal values; candidate files were checked for credential-shaped assignments. Final Git diff and changed-file inventory must be rechecked after commit.

## Reproducibility identifiers

- Code/data and final validator tested commit SHA: `cbe7edce0ec3ffcafebf919838567b07632792d5`.
- Final PR head SHA: reported from the pushed branch after publication; it includes this handoff-only update.
- T04-G validator checks artifact structure and mappings; it does not establish application runtime behavior, candidate novelty, human approval, G1 PASS, or RQ2 gain.
