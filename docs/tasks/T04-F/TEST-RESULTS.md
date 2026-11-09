# T04-F Static Validation Results

Environment: Windows 11; PowerShell; Python 3 (standard library only); branch `feature/t04f-seven-app-novelty-oracle-review`; base commit `bd9b3b15fca28419ada9862b8a65bac910edf169`.

| Check | Command | Result |
|---|---|---|
| Candidate/schema/scope validator | `python docs/tasks/T04-F/tools/validate_t04f.py` | PASS — 27 records, 27 unique IDs, 20 shortlist IDs, valid source-reference links, no human decision/status escalation, changed path confined to T04-F. Exit 0. |
| Whitespace | `git diff --check` | PASS — exit 0, no output. |
| Artifact inventory | standard-library Python JSON count | PASS — 27 packets, 20 shortlisted, 42 baseline case comparisons, 33 source-reference records. |
| Credential marker scan | validator's regex scan over T04-F text artifacts | PASS — no GitHub token/AWS key/private-key markers found. Exit 0. |

Validator stdout: `Candidates: 27; unique: 27; shortlisted input: 20; source ref links: valid; candidate status: unapproved/NOT_RUN` and `PASS`.

Validator scope stdout: `Changed paths: 1 (all T04-F)` (the directory is untracked before commit).

Runtime, Docker, Selenium/E2E, Gemini, and application tests were not run by task constraint. RQ2 remains NOT_EVALUATED. Commit SHA will be recorded after commit; results above are against the pre-commit worktree based on `bd9b3b15fca28419ada9862b8a65bac910edf169`.
