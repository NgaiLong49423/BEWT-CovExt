# T04-A Final Main Integration

**Disposition:** Static Inventory remains accepted at the Team Lead reviewed commit; this final main-integration revision awaits final review. This report does not accept G1 or change candidate dispositions.

## Git integration

- Branch: `feature/t04a-kanboard-coverage-inventory`
- Pull request: https://github.com/NgaiLong49423/BEWT-CovExt/pull/8
- Accepted Static Inventory commit: `87c56c6b1bee2c6b550fbb0ce3f002bd18027f18`
- Fetched `origin/main`: `464d9e2fb5d1a3705d1d7d6f4dc9a2782bde4a1d`
- Integration: ordinary merge, no conflicts
- Merge commit: `24d6ce3a20d0df1eafd3020a6492cd3cb207731a`

The merge preserves T04-A's 30 baseline mappings, six behavior groups, ten proposed gaps, five-item shortlist, and review-fix evidence. It also retains the T03-B1/Bludit changes merged to main by PR #7: `config/apps/bludit.json`, `experiments/bludit/`, `docs/tasks/T03-B1/`, and its evidence. The T02 manifest-isolation regression remains present and was rerun. `docs/program/STATUS.json` records the fetched main SHA and merged T03-B1; per-app G1 remains `NOT_VERIFIED`.

## Verification

Results are from the integration checkout and logs are retained in [`evidence/main-integration-20261109-24d6ce3/`](evidence/main-integration-20261109-24d6ce3/).

| Check | Result |
|---|---|
| T04-A coverage inventory utility | 15 PASS, 0 FAIL, 1 SKIP. The source-to-output comparison is skipped because a fresh pinned BEWT clone was not supplied. Dirty input, wrong pin/hash, and symlink tests passed on the elevated rerun. |
| Kanboard helper and cleanup regressions | 20/20 PASS |
| T03-B1 Bludit and cleanup regressions | 17/17 PASS |
| T02 active manifest isolation | 3/3 PASS |
| Node syntax | 6 files PASS |
| Bludit Maven `test-compile` | PASS, exit 0 |
| JSON/data consistency | PASS; STATUS, inventory, taxonomy, candidate data, and Bludit manifest parse; 30/6/10 T04-A invariants hold |
| SonarCloud | Dynamic GitHub evidence; verify the completed SonarCloud check against the current exact PR #8 HEAD. The check result is not copied into this immutable report. |

The first in-sandbox T04-A test attempt was blocked by Windows `EPERM` on symlink creation and Git temp-config writes; the full runnable set passed when rerun with workspace temp and permitted filesystem access. The single skipped test needs an external pinned-source clone via `BEWT_T04A_SOURCE_ROOT`. Previously committed source-to-Git-object checks (113/113) and deterministic regeneration evidence remain unchanged; regeneration was not repeated in this checkout.

No Gemini, Docker, Selenium, application runtime, or research run was invoked. No ExpressCart, `bewt-original/`, or historical Sprint 01–05 evidence was changed. Sonar and local checks do not accept G1, and the agent does not merge PR #8.
