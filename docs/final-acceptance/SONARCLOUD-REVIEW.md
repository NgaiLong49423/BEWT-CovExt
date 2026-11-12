# SonarCloud Review — PR #27

## Observed hosted check

- Pull request: `https://github.com/NgaiLong49423/BEWT-CovExt/pull/27`
- Latest analyzed head: `e32b25e027573a63de3da8dbb3d89ee135517cc2`
- Check run: `131077184684` (`SonarCloud Code Analysis`, completed successfully)
- Quality Gate: **PASS**; 0 new issues, 0 accepted issues, 0 security hotspots, and 0.0% duplication on new code. Reported new-code coverage is 0.0% because no coverage report was uploaded.
- Earlier failed analyses exposed PATH-resolved `git` execution, `NaN`, pointer-regex backtracking, a missing sort comparator, and duplicate parser-rejection tests. These findings were corrected in successive commits.
- The preceding failed analysis annotated:

| Rule | Type/severity | Analyzed line | Finding | Remediation in this revision |
|---|---|---:|---|---|
| `javascript:S5852` | `CODE_SMELL` / `MAJOR` | `recompute-metrics.mjs:109` | Regex used to parse a `.git` worktree pointer may have super-linear backtracking. | Replaced the regex with bounded prefix validation and direct slicing. |
| `javascript:S2871` | `CODE_SMELL` / `MINOR` | `audit-g3-run-accounting.mjs:127` | Sort call should provide a comparator. | Added a deterministic code-unit comparator for run IDs. |

## Local verification

After the local fixes, the focused metrics/accounting suite passed 20/20; both scripts passed `node --check`, and `git diff --check` passed. The latest hosted quality gate is green. The 0.0% coverage measure reflects the absence of an uploaded coverage report, not measured test coverage. No issue was suppressed or marked false positive.
