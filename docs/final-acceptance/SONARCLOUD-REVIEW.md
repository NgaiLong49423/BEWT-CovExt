# SonarCloud Review — PR #27

## Observed hosted check

- Pull request: `https://github.com/NgaiLong49423/BEWT-CovExt/pull/27`
- Analyzed head: `acfe1272b3af00350ca929a4e4b69aa97c7c7508`
- Check run: `131053449920` (`SonarCloud Code Analysis`, completed with failure)
- Quality gate: `B Security Rating on New Code`; required rating is `A` or better.
- SonarCloud issue endpoint returned two new-code findings in `docs/research-results/v2/replication/recompute-metrics.mjs`:

| Rule | Type/severity | Analyzed line | Finding | Remediation in this revision |
|---|---|---:|---|---|
| `javascript:S4036` | `VULNERABILITY` / `MINOR` | 349 | `execFileSync('git', ...)` resolves an executable through inherited `PATH`; Sonar flags that PATH may include writable directories. | Removed the child process and read `.git/HEAD`, linked-worktree `commondir`, loose refs, and packed refs directly. No command is resolved or launched through PATH. |
| `javascript:S7773` | `CODE_SMELL` / `MINOR` | 229 | Prefer `Number.NaN` over `NaN`. | Changed the parser fallback to `Number.NaN`. |

## Local verification and remaining gate

The metrics negative-control suite passes 17/17, including detached-HEAD and linked-worktree ref fixtures. The metrics script and `node --check` pass. The corrected revision has not yet been analyzed by hosted SonarCloud, so the `A` Security Rating requirement remains **pending verification** until the PR check reruns successfully. No issue was suppressed or marked false positive.
