# G0 Cloud Runtime Acceptance — 2026-11-12

## Outcome

A new run of the original BEWT base smoke class completed for all eight applications on the existing research VM. Each Maven run produced one passing test, zero failures/errors/skips, and the runner's cleanup report verified no run-owned container, network, or volume remained.

**Per-application smoke execution: PASS (8/8). Overall G0 acceptance: PARTIALLY_VERIFIED_PROVENANCE_GAPS.** The execution result is real, but the current runner does not bind every created container ID and resolved image digest into the run record. The Bludit Gherkin source is also version 3.13.1 while the exercised app/suite are 2.3.4. These gaps remain open; this report does not mark the program accepted.

## VM and Docker

- Project: `gen-lang-client-0311012609`
- VM: `bewt-covext-runner`, instance ID `3042402845209891905`
- Zone: `asia-southeast1-a`; machine type: `c4d-highmem-8`; state after run: `RUNNING`
- OS/kernel: Ubuntu 24.04 LTS, `7.0.0-1017-gcp`
- Resources observed: 8 vCPU, 61 GiB RAM (60 GiB available before runs), 200 GiB boot disk (193 GiB filesystem, 174 GiB available)
- Docker Engine: 29.9.3, active; Node 20.20.2; Java 21.0.13.0.3; Maven 3.8.7
- Selenium image: `selenium/standalone-chrome:latest`, observed RepoDigest `sha256:3fa985d1a73d1a3ae43c758d546b505b9d73e31ecaffd7a77725f19d1a70edec`; Chrome and ChromeDriver 157.0.8103.38
- The SSH connection caused gcloud to add its SSH principal to project-level SSH metadata. No key material was included in repository evidence.
- Public NAT was assigned on VM start; its address is deliberately omitted from this public repository.

The historical VM checkout contained tracked modifications and substantial untracked evidence. It was left untouched. Runs used a separate, clean detached worktree at repository commit `da6399536ff75a1edf4417819eb4d166cc1d781c`. The BEWT source checkout was clean and read-only at `0501249ff3e9a5ea83a06155cd2971dc36197056`.

## Results

| Application | Smoke class | App readiness | JUnit | Cleanup |
| --- | --- | ---: | --- | --- |
| Bludit 2.3.4 | `tests.AddContentTest` | HTTP 302 | 1/1 PASS | PASS, zero residual |
| Claroline 1.11.10 | `test.Claroline_AddUserTest` | HTTP 302 | 1/1 PASS | PASS, zero residual |
| ExpressCart 1.1.19 | `tests.AddUserTest` | HTTP 200 | 1/1 PASS | PASS, zero residual |
| Joomla 3.10.11 | `base.AdminLoginTest` | HTTP 302 | 1/1 PASS | PASS, zero residual |
| Kanboard 1.2.15 | `tests.AddNewProject` | HTTP 302 | 1/1 PASS | PASS, zero residual |
| MantisBT 1.2.0 | `base.AddUser` | HTTP 200 | 1/1 PASS | PASS, zero residual |
| MediaWiki 1.40.0 | `mediawiki.CreateUserTest` | HTTP 200 | 1/1 PASS | PASS, zero residual |
| PrestaShop 1.6.1.23 | `tests.AddNewCategory` | HTTP 302 | 1/1 PASS | PASS, zero residual |

Each test source and corresponding baseline feature hash is recorded in the runtime manifest. Three active suite classes match the pinned BEWT Java source hash exactly; five are source adaptations. Their actions and outcomes need a further semantic review before these smoke results can be treated as exact source-level reproductions. No new extension candidate was executed here.

## Provenance and limitations

- All eight application versions, source commits, app image RepoDigests, dependency image RepoDigests, baseline Java/feature hashes, run IDs, UTC start times, JUnit XML hashes, Maven exits, pre-run inventory counts, and cleanup results are in `evidence/g0-runtime-manifest.json`.
- Sanitized JUnit XML, pre-run Docker inventories, run records, and cleanup records are in `docs/tasks/g0-evidence/<app>/<run-id>/`; the same 56 files are packaged in `evidence/g0-safe-evidence.tgz`.
- Raw Maven stdout/stderr was excluded from the public bundle to avoid publishing fixture credentials. The run directories on the VM contain the runner-sanitized logs.
- The runner's `maven-exit.json` text omits the `clean` goal even though the source at the recorded commit invokes `clean test`. The recorded exit code and JUnit XML are direct run outputs.
- The runner did not persist per-container IDs or resolved app/database/browser image IDs. App image digests are recorded from the runner's configured references and VM image inventory; database and Selenium image references are tag-based. This prevents full per-container image binding.
- The runner does not persist installer Maven exit codes. App readiness and the later successful base smoke show the app was usable, but do not independently establish each installer process exit status.
- Bludit's only baseline Gherkin file is pinned under 3.13.1; this does not match its 2.3.4 application and Java suite.
- Cleanup reports and a final Docker inventory show no containers, custom networks, or `bewt-covext` volumes remained. The VM itself remains running for the authorized continuation of G3 work.

## G0/G3 status

- G0 base smoke execution: **8/8 PASS**.
- G0 acceptance gate: **PARTIALLY_VERIFIED_PROVENANCE_GAPS**.
- G3 corrected extension cases: **NOT_RUN in this task**.
- Scientific validation: **BLOCKED** by semantic review, human oracle/novelty approvals, and per-run provenance requirements.
- GCP VM creation, machine resizing, disk expansion, global Docker cleanup, and changes to `bewt-original/` were not performed.
## Artifact checksums

- evidence/g0-runtime-manifest.json: fa25a74ee67a3261f3bc231698589d886f01b1161401fdfbddd71c0c45f29f42
- evidence/g0-safe-evidence.tgz: 93d3ceea89c01efeff01efe221b68046059d2a98c4520e56910f13445a0cd150
- Secret-pattern scan of included text artifacts: 0 hits.
