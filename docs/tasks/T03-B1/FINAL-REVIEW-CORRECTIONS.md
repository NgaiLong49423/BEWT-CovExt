# T03-B1 — Final Review Corrections

- Reviewed submission HEAD: `687c94aec828c8f8f898c16bc809658ae2b70c50`.
- Branch / PR: `feature/t03b1-bludit-g0` / [PR #7](https://github.com/NgaiLong49423/BEWT-CovExt/pull/7).
- Correction implementation commit: `9c1c2138a3e66ac397d13e12cc052b91b7fa4df2` (filled after commit).
- Scope: only G0 runner evidence consistency, partial-startup cleanup, fault-injection coverage, and new Run C evidence. Historical Run A/B evidence and original test assertions were not edited.

## Corrections

1. `run-bludit-g0.ps1` reads class-specific Surefire XML from Maven's actual `experiments/bludit/bewt-suite/target/surefire-reports` directory. It requires one testcase for each original class, zero failures/errors/skips, and Maven exit code 0 before recording the class as PASS. Missing XML is `BLOCKED`. Sentinel state is recorded as a boolean and asserted absent before `AddContentTest` and present afterward. The runner only writes PASS after both classes and cleanup pass.
2. The runner refuses an existing evidence directory for a run ID. It creates containers with `docker create`, saves each returned full ID/name/image reference immediately, then starts it. Cleanup accepts a created network with zero, one, or two recorded containers. It verifies ownership labels, names, image references, IDs and exact network endpoints before any mutation; unknown ownership blocks without deletion. Residual full-label resources and recorded resources are checked afterward. No global prune is used.
3. New public Surefire XML removes machine/environment `<properties>` and process output streams while preserving testcase names/classes and result counters. Original XML SHA-256 values are captured before sanitization. `git check-ignore -v` showed `*.log` ignores Maven logs (logs are explicitly force-added) and sanitized XML is not ignored. No historical A/B XML, hashes or outcomes were changed.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Node manifest + cleanup/fault-injection suite | PASS, 17/17, exit 0 | [Final Node output](evidence/final-review-fixes-20261109/node-tests-final-after-fixture-fix.txt) |
| Active T02 manifest-isolation test | PASS, 3/3, exit 0 | [T02 output](evidence/final-review-fixes-20261109/active-t02-isolation-after-corrections.txt) |
| Maven `clean test-compile` | PASS, exit 0; 17 production and 26 test sources compiled | [Maven output](evidence/final-review-fixes-20261109/maven-clean-test-compile-final.log) |
| PowerShell and Node syntax checks | PASS | [Verification summary](evidence/final-review-fixes-20261109/final-verification-after-network-partial-fix.json) |
| Ignore policy | Maven `.log` ignored; sanitized XML not ignored | [Ignore check](evidence/final-review-fixes-20261109/git-ignore-check.json) |

## Run C history and final result

| Run ID | Result | Details |
|---|---|---|
| `t03b1-c-20261109-r1` | BLOCKED / cleanup PASS | Installer Maven exit 0 and 1/1 JUnit PASS. Runner stopped while hashing/sanitizing XML because the PowerShell runtime lacks `SHA256.HashData`; business test and sentinel phase did not run. No resources remained. [Run evidence](evidence/t03b1-c-20261109-r1/); supplemental original XML hash and failure analysis: [R1 analysis](evidence/final-review-fixes-20261109/run-c-r1-failure-analysis.json). |
| `t03b1-c-20261109-r2` | PASS | Completed both tests and cleanup before the final network-create partial-record ordering fix. Retained as a separate successful intermediate run; it is not the final-current-code proof. [Run evidence](evidence/t03b1-c-20261109-r2/). |
| `t03b1-c-20261109-r3` | **PASS — final corrected runner** | Runner exit 0; Installer and AddContentTest each Maven exit 0 and JUnit 1/1 with zero failures/errors/skips; sentinel `false` before and `true` after; cleanup PASS; zero residual resources; pre-existing inventories preserved with no added/removed containers, networks, volumes or images. [Run verification](evidence/t03b1-c-20261109-r3/run-c-verification.json). |

Run C r3 artifacts: [Maven commands and original XML hashes](evidence/t03b1-c-20261109-r3/maven-command-results.json), [Installer log](evidence/t03b1-c-20261109-r3/maven-installer.log), [business log](evidence/t03b1-c-20261109-r3/maven-business.log), [sanitized Installer XML](evidence/t03b1-c-20261109-r3/surefire-public/TEST-tests.Installer.sanitized.xml), [sanitized AddContentTest XML](evidence/t03b1-c-20261109-r3/surefire-public/TEST-tests.AddContentTest.sanitized.xml), [sentinel before](evidence/t03b1-c-20261109-r3/sentinel-state-before-test.json), [sentinel after](evidence/t03b1-c-20261109-r3/sentinel-state-after-test.json), [Docker before](evidence/t03b1-c-20261109-r3/docker-before.json), [Docker after](evidence/t03b1-c-20261109-r3/docker-after.json), [reset comparison](evidence/t03b1-c-20261109-r3/docker-reset-comparison.json), and [cleanup result](evidence/t03b1-c-20261109-r3/cleanup-result.json).

## Safety and remaining limits

- Final cleanup removed only the two containers and network created for Run C r3 after exact ownership verification. It preserved the pre-run Docker inventories. No Docker resources were modified after Run C verification.
- No changes to `bewt-original/`, T01-C, framework, ExpressCart, Kanboard historical G0 evidence, baseline business test assertions, `docs/program/STATUS.json`, or `docs/program/IMPLEMENTATION-ROADMAP.md`.
- Public XML is sanitized; original Run C XML SHA-256 values are retained in Maven metadata. Original Run A/B evidence remains byte-for-byte unchanged.
- G0 remains proposed for Team Lead review; no `ACCEPTED`/`VALIDATED` claim, no merge, and no Claroline runtime work.