# T04-E Round 2 correction verification

## Revision and environment

- Repository: `NgaiLong49423/BEWT-CovExt`
- Branch: `feature/t04e-seven-app-source-gaps`
- Corrected validator/data/docs HEAD tested: `69f93dd91f04aa9cb31e266e8c9f4f14ab4a6123`
- Base main: `af4dc6f212074c2ec2ced8ebb7d0a8adc83819eb`
- Node.js: `v24.19.0`
- OS: `Microsoft Windows 10.0.26300`
- Shell: PowerShell
- Test runner: Node built-in `node:test`; 14 tests.

## Raw verification results

Commands were run from the repository root at the corrected source/data HEAD above.

### CLI validator

- Command: `node docs/tasks/T04-E/tools/verify-source-backed-gaps.mjs`
- Exit code: `0`
- stdout:

```text
PASS: seven pinned app datasets, source references, ranges, oracle links, counts, duplicates, novelty and shortlist consistency.
```

- stderr: empty.

### Full focused test suite

- Command: `node --test docs/tasks/T04-E/tools/test/verify-source-backed-gaps.test.mjs`
- Exit code: `0`
- stdout (raw):

```text
✔ all seven app bundles are internally consistent (2.1148ms)
✔ mixed application source pin is rejected (0.5198ms)
✔ duplicate candidate IDs are rejected (0.4103ms)
✔ invalid source blob or permalink is rejected (0.3537ms)
✔ false novelty verification is rejected (0.4638ms)
✔ insufficient candidate fields are rejected (0.4373ms)
✔ shortlist cannot exceed five or imply human approval (0.322ms)
✔ unknown source reference ID is rejected (0.4798ms)
✔ source reference path, tree and line ranges must match the pinned repository (0.3942ms)
✔ oracle source references must be a nonempty subset of candidate references (0.7308ms)
✔ shortlist count and unique ordered priorities must be consistent (0.6045ms)
✔ proposal and shortlist counts must equal prioritized candidate count (0.7355ms)
✔ shortlist IDs must match proposal priority order exactly (0.3186ms)
✔ CLI validates fixture data, prints PASS, and rejects invalid data with nonzero exit (152.3558ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 246.572
```

- stderr: empty.

The focused negative tests mutate the proposal shortlist count and prioritized-candidate count; both are rejected. A separate test swaps a shortlist ID and confirms proposal/shortlist ID-order inconsistency is rejected. The subprocess test changes `shortlistCount` in a valid fixture and verifies the CLI exits nonzero, reports `shortlist count mismatch`, and does not print PASS.

### Whitespace check

- Command: `git diff --check`
- Exit code: `0`
- stdout: empty.
- stderr: empty.

## Dataset and source-pin consistency

The validator passed all seven bundles. Independent count inspection and validator checks found:

| Application | Proposals | Dataset shortlistCount | Shortlist shortlistCount | Items | Non-null proposal priorities | Pinned commit | Indexed refs |
|---|---:|---:|---:|---:|---:|---|---:|
| Bludit | 4 | 3 | 3 | 3 | 3 | `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` | 9 |
| Claroline | 4 | 3 | 3 | 3 | 3 | `22d852f93081bc36b1d08b93f5e0c14b49a573f6` | 3 |
| ExpressCart | 3 | 2 | 2 | 2 | 2 | `b31302f4e99c3293bd742c6d076a721e168118b0` | 7 |
| Joomla | 4 | 3 | 3 | 3 | 3 | `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` | 3 |
| MantisBT | 4 | 3 | 3 | 3 | 3 | `d06bf60f5ed9f96029bb830a005d4819a4f87b45` | 5 |
| MediaWiki | 4 | 3 | 3 | 3 | 3 | `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` | 5 |
| PrestaShop | 4 | 3 | 3 | 3 | 3 | `475d65fbda93403cd1afde0db09764c5295e952c` | 4 |
| **Total** | **27** | **20** | **20** | **20** | **20** | **7 pins** | **36 refs** |

Each indexed reference retains its prior repository/commit/tree/blob SHA and immutable GitHub permalink. Only `EC-S01.lineRanges` changed, from `124-190,286-304` to `110-190,286-304`, covering the cited `routes/order.js` lines 110–125 and 128–163. No ExpressCart source pin or blob SHA changed. Validator checks exact pin relationships, safe source paths, numeric line ranges, blob hash shape, and immutable permalink construction. The preceding verification round separately retrieved all seven source commits/trees and all 36 blobs from pinned GitHub API refs; this Round 2 did not change those source objects.

The final pushed HEAD additionally contains this verification record and task-report references; source/data/test files are unchanged from the tested HEAD above.

No Docker, Gemini or Selenium was used. No app runtime/E2E was run. No approval, G1 promotion, or RQ2 claim was added.
