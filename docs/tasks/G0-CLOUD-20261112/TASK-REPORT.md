# G0 Cloud Runtime Acceptance — 2026-11-12

## Outcome

The latest final4 run executed one original BEWT base smoke class per application against fresh Docker services on the existing Google Cloud VM. All eight Maven invocations exited 0; all eight JUnit XML reports show one test, zero failures, zero errors, and zero skips; and all eight run cleanup records verified zero residual experiment containers, networks, or volumes.

**Engineering smoke result: 8/8 PASS. G0 acceptance: PARTIALLY_VERIFIED_PROVENANCE_GAPS.** This is not G3 evidence: no corrected extension candidate or three-rerun protocol was executed. It is also not scientific validation. Five Java smoke classes differ by SHA-256 from the pinned BEWT Java sources; semantic equivalence has not been established here. Bludit uses a 3.13.1 Gherkin reference with application/suite version 2.3.4. The final4 Kanboard run record has no baseline Gherkin mapping, and the runner records the other Gherkin mappings as Git blob SHA-1 rather than content SHA-256.

## VM and Docker

- Project: `gen-lang-client-0311012609`
- VM: `bewt-covext-runner`, instance ID `3042402845209891905`
- Zone: `asia-southeast1-a`; machine type: `c4d-highmem-8`; state after runs: `RUNNING`
- The VM was started from `TERMINATED` after its identity and zone were reverified. No replacement VM or machine/disk upgrade was created.
- OS/kernel: Ubuntu 24.04 LTS, `7.0.0-1017-gcp`
- Resources observed: 8 vCPU, 61 GiB RAM (60 GiB available before final4), 193 GiB root filesystem (173 GiB available)
- Docker Engine: 29.9.3; Node 20.20.2; Java 21.0.13.0.3; Maven 3.8.7
- Selenium image: `selenium/standalone-chrome:latest`, image ID `sha256:3fa985d1a73d1a3ae43c758d546b505b9d73e31ecaffd7a77725f19d1a70edec`; Chrome and ChromeDriver `157.0.8103.38`
- After final4 cleanup, Docker showed no containers, three default networks, and no experiment volumes. No global prune was used.
- The VM's external address is omitted from this public repository. The gcloud SSH connection added its SSH principal to project-level SSH metadata; no key material was included in repository evidence.

The final4 run used a fresh VM worktree at repository commit `08f3c32ed723f938e351b304859a35c2bdac4f9e`, the then-current head of open PR #28. This is candidate-branch evidence and does not imply that the commit is in `main` or accepted. Each run record reports tracked files clean; generated untracked evidence was excluded from that cleanliness check. The pinned BEWT baseline source commit is `0501249ff3e9a5ea83a06155cd2971dc36197056`.

## Final4 results

| Application | Base smoke class | App readiness | JUnit | Setup | Cleanup |
| --- | --- | --- | --- | --- | --- |
| Bludit 2.3.4 | `tests.AddContentTest` | PASS | 1/1 PASS | Installer PASS | PASS, zero residual |
| Claroline 1.11.10 | `test.Claroline_AddUserTest` | PASS | 1/1 PASS | Not required | PASS, zero residual |
| ExpressCart 1.1.19 (SOURCE-LOCK) | `tests.AddUserTest` | PASS | 1/1 PASS | Not required | PASS, zero residual |
| Joomla 3.10.11 | `base.AdminLoginTest` | PASS | 1/1 PASS | Installer PASS | PASS, zero residual |
| Kanboard 1.2.15 | `tests.AddNewProject` | PASS | 1/1 PASS | Not required | PASS, zero residual |
| MantisBT 1.2.0 | `base.AddUser` | PASS | 1/1 PASS | Not required | PASS, zero residual |
| MediaWiki 1.40.0 | `mediawiki.CreatePageTest` | PASS | 1/1 PASS | Install and extension setup PASS | PASS, zero residual |
| PrestaShop 1.6.1.23 | `tests.AddNewCategory` | PASS | 1/1 PASS | Installer PASS | PASS, zero residual |

Every run record includes the app version/source commit, test-source SHA-256, configured image reference, actual container IDs and image IDs, readiness checks before Maven, Maven exit, JUnit hash metadata, and cleanup details. The run records also capture the exact sanitized Maven argument vector, including `clean test`.

## Evidence and integrity

- Latest run manifest: `evidence/g0-final4-runtime-manifest.json`
- Safe final4 archive: `evidence/g0-final4-safe-evidence.tgz` (56 allowlisted files: structured run/JUnit/cleanup/Maven/Docker records and eight JUnit XML reports; raw logs excluded)
- Archive SHA-256: `EABB14067D6D9C840DC41610D66294A1E3049F62CA8FF2183633D34F4222CB44`
- Manifest SHA-256: `64147C2EFD5858D3988C86E79C00A3C4FE3FC95259BA841B4496DDBE863DC5B2`
- Secret-pattern scan of archive: 0 hits for private-key markers and common Google/GitHub/Slack token patterns
- Run IDs: `g0-<app>-20261112-final4` for all eight applications
- The records classify the Gherkin mapping ID as a Git blob SHA-1. This is not represented as a SHA-256. The Kanboard final4 record has `baselineGherkin.status=NOT_AVAILABLE`. For ExpressCart, the run record uses benchmark shorthand `1.19`; the source lock, package, and image tag identify the exact package version `1.1.19`.
- The public archive excludes raw Maven, setup, and container logs. Structured setup outcomes and exit codes are retained in the manifest/run records.

The earlier `-a` and failed-run evidence remains preserved; this report does not rewrite it as successful. The final4 records supersede earlier attempts for the latest eight-app smoke result.

## G0/G3 and research status

- G0 original base-smoke execution: **8/8 PASS**.
- G0 gate: **PARTIALLY_VERIFIED_PROVENANCE_GAPS** pending Gherkin binding/mapping and Java-to-benchmark semantic review.
- G3 corrected extension candidates: **NOT_RUN** in final4.
- Three-clean-state reruns: **NOT_RUN** in final4.
- Scientifically validated new candidates: **0**; human oracle/novelty approval remains pending.
- Overall program acceptance remains blocked by the independent G1–G4, RQ1–RQ4, human-review, and manuscript limitations recorded in `docs/program/STATUS.json`.
