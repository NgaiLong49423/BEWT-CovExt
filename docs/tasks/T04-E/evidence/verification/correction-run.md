# T04-E correction verification record

## Revision and environment

- Branch: `feature/t04e-seven-app-source-gaps`
- Tested source-code/test HEAD: `80c9a748d50e8fa1ef7ddb171681c70bdd849fef` (the evidence/report-only follow-up is committed afterward; final HEAD is independently re-run before handoff).
- Base: `main` at `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`.
- Node.js: `v24.19.0`.
- OS: `Microsoft Windows 10.0.26300`.
- Shell: PowerShell.

## Executed verification

Commands were run from the repository root at the source-code/test HEAD above.

| Command | Exit | stdout | stderr |
|---|---:|---|---|
| `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs` | 0 | `PASS: seven pinned app datasets, source references, ranges, oracle links, counts, duplicates, novelty and shortlist consistency.` | empty |
| `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs` | 0 | Node test runner reported 12 tests, 12 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo. | empty |
| `git diff --check` | 0 | empty | empty |

The 12 tests include an actual child-process CLI invocation using a temporary fixture root. Valid input exited 0, emitted the PASS marker, and had empty stderr. A candidate-count-invalid fixture exited 1, emitted empty stdout and `bludit: candidate count mismatch` on stderr. The temporary fixture was created under the system temp directory and removed after the test.

These are tests actually executed in this worktree. Earlier test results are not treated as a substitute for these runs.

## Source verification method and result

For each app pin in `docs/tasks/T04-E/source-reference-index.json`, the pinned commit was inspected via GitHub's repository Git commit API and its returned root tree SHA was compared with the recorded tree SHA. Each indexed source file was then fetched from the exact repository and immutable commit path; its GitHub-reported blob object SHA and immutable permalink were compared with the index.

Result: 7/7 pinned commits had matching root tree IDs; 36/36 indexed file objects had matching blob IDs and immutable permalinks. This external check verifies the recorded source objects. The local validator enforces exact repository/commit/tree relationships, safe paths, numeric ordered line ranges, blob-ID and immutable-permalink shape/consistency, candidate/oracle references and shortlist constraints. It does not fetch upstream source or independently recompute upstream Git object hashes. Formatting checks do not establish upstream hash correctness.

## Dataset counts and boundaries

| Application | proposals | technical shortlist |
|---|---:|---:|
| Bludit | 4 | 3 |
| Claroline | 4 | 3 |
| ExpressCart | 3 | 2 |
| Joomla | 4 | 3 |
| MantisBT | 4 | 3 |
| MediaWiki | 4 | 3 |
| PrestaShop | 4 | 3 |
| **Total** | **27** | **20** |

Counts are source-supported proposals, not a quota. No human review decision is recorded. Claroline source availability is partial and that limitation is documented; runtime execution of the seven target applications and E2E scenarios is `NOT_RUN`. No candidate has been behaviorally validated by these static checks. G1 is not promoted and RQ2 remains `NOT_EVALUATED`.

## SHA-256 fingerprints

Calculated with PowerShell `Get-FileHash -Algorithm SHA256` on the tested revision:

| File | SHA-256 |
|---|---|
| `docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs` | `90CF5CB0B1A6927E088BDB975B2D9A2B1CD9E545C52D57783A17B12F1623CCD1` |
| `docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs` | `838B296F91E9CEFD5C264DD86F4498637B6CBC2FF3897901DC218517DA7D7337` |
| `docs/tasks/T04-E/source-reference-index.json` | `F18A2F5DE61193C76F3CBC8C6CDB065ADE2F254205625EEBB394932C01014EE9` |
| `data/coverage/expresscart/source-backed-gap-proposals.json` | `19D4B839A463800F3204418708463E4C0E5A5E1827333DB3A6488D043C80BF83` |
| `data/coverage/expresscart/source-backed-gap-shortlist.json` | `1936F087C3109F2E6DD8B3B73CE5C441C097B09CAD34952EA8B6F2B90FED90D8` |
| `docs/tasks/T04-E/EXPRESSCART-SOURCE-DEFECT-FINDINGS.md` | `2199D288D7E231AA0ADE41C2D2D96E8EC2A454F378A3C230670980FCEFA37498` |
| `docs/tasks/T04-E/TASK-REPORT.md` | `91DA448AB3EDFB7654657A4F959B44D4E32FB38A7CA338022393567A696A83AD` |

The report, source verification and fingerprints refer to different layers of evidence; a matching local file hash alone does not prove upstream behavior.
