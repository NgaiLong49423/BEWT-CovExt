# BEWT-CovExt Cloud Runner Execution, Evidence Collection & Validation Report (T03-B2 Claroline G0)

**Date**: 2026-11-10  
**Task**: `T03-B2` (Claroline 1.11.10 — G0 Baseline Verification)  
**Branch**: `feature/t03b2-claroline-g0` ([PR #12](https://github.com/NgaiLong49423/BEWT-CovExt/pull/12))  
**Tested Code Commit**: `183668bc18e89b4e04212be510b971a9f79c7f65`  
**Pinned BEWT Commit**: `0501249ff3e9a5ea83a06155cd2971dc36197056`

---

## 1. Cloud VM Status & Auto-Stop Verification

Direct verification via `gcloud compute instances describe bewt-covext-runner --zone=asia-southeast1-a --project=gen-lang-client-0311012609` and `node experiments/claroline/tools/cloud-controller.mjs preflight`:

| Property | Verified Value |
| --- | --- |
| **GCP Project ID** | `gen-lang-client-0311012609` |
| **Instance Name / ID** | `bewt-covext-runner` / `3042402845209891905` |
| **Zone** | `asia-southeast1-a` |
| **Status** | `RUNNING` |
| **Machine Type** | `c4d-highmem-8` (8 vCPU AMD EPYC, 63 GiB RAM) |
| **Boot Disk** | 200 GB `hyperdisk-balanced` (`~184.4 GiB` available) |
| **OS / Kernel** | Ubuntu 24.04.4 LTS (`6.17.0-1008-gcp` x86_64) |
| **Creation Timestamp** | `2026-11-09T19:18:51.999-08:00` (`2026-11-10T03:18:51.999Z` / `10:18:51+07:00`) |
| **Max Run Duration** | `21600s` (6 hours) |
| **Termination Action** | `STOP` |
| **Termination Timestamp** | `2026-11-09T18:18:54.625-08:00` (`2026-11-10T02:18:54.625Z` / `2026-11-10T09:18:54+07:00`) |
| ** systemd backup timer** | `bewt-autostop.timer` active (`Trigger: Tue 2026-11-10 02:15:39 UTC`) |
| **VM Recreation / Extension** | **NONE** — Existing VM reused; 6-hour auto-stop schedule untouched |

---

## 2. Preflight Results on Cloud VM (`offline-verification-20261110-r73/cloud-preflight.json`)

- **Host Available Memory (`MemAvailable`)**: `60.604 GiB` (`65,073,086,464 bytes`) — passes the `6.0 GiB` gate (`>= 6,442,450,944 bytes`) with `>54.6 GiB` headroom.
- **Root Disk Free Space**: `184.404 GiB` (`198,001,971,200 bytes`).
- **Toolchain Versions**:
  - Docker Engine: `29.9.3` (Server & Client healthy, `0` leftover containers after cleaning 3 stale manual containers `f37f32b6a057`, `2d0acfadd67e`, `917afd4658e2` from prior interrupted SSH session).
  - Java: OpenJDK `21.0.10` (`2026-01-20`).
  - Maven: Apache Maven `3.8.7` (local `.m2` cache populated; `mvn test-compile -DskipTests` compiles 22 main + 42 test classes in `11.352 s`, exit 0).
  - Node.js: `v20.20.2`.
- **Pinned Docker Image Digests Verified Locally on VM**:
  - App image: `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af`
  - Browser image: `selenium/standalone-chrome-debug@sha256:c35da9ee2dbfb5fd9f1fb91f7f38e1320ef94853b3119881d1fc174f13a9f374`

---

## 3. Cross-Platform Compatibility Changes (`experiments/claroline/tools/`)

To run identical fail-closed logic on both Windows PowerShell and Ubuntu 24.04 Linux without weakening any security invariant:

1. **`experiments/claroline/tools/child-process-policy.mjs`**:
   - Preserved 100% of Windows (`process.platform === 'win32'`) rules: `C:\Windows` / `C:\Program Files` binary resolution, PowerShell `Get-AuthenticodeSignature` verification, `DOCKER_CONTEXT: 'desktop-linux'`, and omitting `TEMP`/`TMP`.
   - Added Linux (`process.platform === 'linux'`) binary verification (`verifyLinuxRootExecutable`): resolves `realpathSync`, verifies owner `uid === 0` and `gid === 0`, ensures executable bit is set, and rejects group/world-writable binaries (`(mode & 0o022) !== 0`) outside `/usr/bin`, `/bin`, `/usr/sbin`, `/sbin`, `/usr/local/bin`.
   - Added `parseLinuxMeminfoBytes()`, `readHostFreeMemoryBytes()`, `parseLinuxIpv4Routes()`, `readHostIpv4Routes()`, and `invokeMaven()` so memory preflight, subnet collision checks, and Maven execution work seamlessly on both OSes.
2. **`experiments/claroline/tools/cleanup-claroline-g0.mjs`**:
   - Fixed a latent pre-start cleanup verification bug discovered during Cloud run `t03b2-d-20261110-r4`: when a container is created (`docker create`) on a user-defined bridge network (`ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY`) and stopped at `requestRouteIsolationApproval()` before `docker start`, Docker Engine leaves `container.NetworkSettings.Networks[networkName].NetworkID` as `""` and `Gateway` as `""` until the sandbox starts.
   - Added `isPreStartCreatedContainer(container)` (`State.Status === 'created' && State.Running === false && State.StartedAt === '0001-01-01T00:00:00Z'`) so `assertContainerNetworkGateway` is enforced whenever the container has started or already has a populated `NetworkID`, while pre-start `created` containers still undergo strict verification of exact container ID, ownership labels (`task`, `run_id`, `role`), pinned image digest, and `HostConfig.NetworkMode === networkName`.
   - Added direct CLI invocation (`node experiments/claroline/tools/cleanup-claroline-g0.mjs <runId>`) for deterministic recovery cleanup.
3. **`experiments/claroline/tools/cloud-controller.mjs`**:
   - Thin orchestration wrapper over `gcloud compute instances describe`, `gcloud compute ssh`, and `gcloud compute scp`.
   - Enforces auto-stop policy verification (`verifyTerminationSchedule`), allowlisted remote actions (`offline-verify`, `maven-compile`, `diagnostic`, `g0-run`, `cleanup-recovery`), path/secret scrubbing (`scrubCloudText`), and post-transfer SHA-256 manifest generation/verification (`sha256-manifest.json`).
4. **`experiments/claroline/tools/validate-evidence.mjs`**:
   - Deterministic evidence validator verifying `runId`, source commit, pinned image digests, chronological timestamps, exit code vs outcome consistency, real Surefire XML parsing (when business tests run), DB assertions, Docker isolation records, zero-residual cleanup, `sha256-manifest.json`, and secret/path scrubbing.
5. **`experiments/claroline/tools/record-offline-verification.mjs`**:
   - Extended to check all 9 `.mjs` files and parse both Windows (`ℹ tests 41`) and Linux non-TTY TAP (`# tests 41`) output.

---

## 4. Unit & Negative Test Results (`41/41 PASS` on Windows & Linux)

Executed on committed HEAD `183668bc18e89b4e04212be510b971a9f79c7f65`:

- **Windows (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r72/`)**:
  - 9/9 `node --check` syntax checks: **PASS** (exit 0).
  - `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **41 passed, 0 failed** (exit 0).
  - `sourceMatchesHeadAtTest`: `true`.
- **Ubuntu 24.04 Cloud VM (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r73/`)**:
  - 9/9 `node --check` syntax checks: **PASS** (exit 0).
  - `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **41 passed, 0 failed** (exit 0).
  - `sourceMatchesHeadAtTest`: `true`.

---

## 5. Network Isolation Status & Approval Request Packet (Section 6 Gate)

### Current Status
- Both `run-claroline-diagnostic.mjs` and `run-claroline-g0.mjs` use `ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY` (`published-bridge-default-route-removed-v1`) and stop fail-closed at `requestRouteIsolationApproval()` (`BLOCKED_APPROVAL_REQUIRED`) **before** `docker start`.
- No privileged command (`docker exec --privileged`) was executed, and no container was started.

### Formal Approval Request Packet for Team Lead / User Review

1. **Why approval is required**:
   - **Gate A (Privileged Route Removal / Network Isolation)**: `child-process-policy.mjs` intentionally blocks `requestRouteIsolationApproval()` with `BLOCKED_APPROVAL_REQUIRED` because no independently authenticated Team Lead verifier is configured, and because starting a container on a non-internal bridge (`Internal: false`, `enable_ip_masquerade: false`) leaves a brief interval between `docker start` and `docker exec --privileged --user 0 <id> /bin/sh -c 'ip route del default'` where egress is possible unless blocked at the host firewall layer.
   - **Gate B (GCE `IPV4_ONLY` Host Control Probe)**: On `bewt-covext-runner`, the GCE VPC network interface (`nic0`) is `IPV4_ONLY`. `probeHostEgressControls()` reaches `1.1.1.1:443` (`HOST_CONTROL_REACHABLE`) but gets `ENETUNREACH` (`HOST_IPV6_UNAVAILABLE`) for `2606:4700:4700::1111:443`, even though the Claroline Docker bridge disables IPv6 (`--ipv6=false`, `EnableIPv6: false`).
   - **Gate C (Claroline Pinned Image Provenance Delta)**: Pinned image `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` contains a 1-file modification in `claroline/inc/lib/add_course.lib.inc.php` (commenting out the 128-attempt course-code prefix loop limit) compared to official Claroline `1.11.10`.
2. **Exact proposed technical options for Gate A on the Ubuntu Cloud VM**:
   - **Option A1 (Recommended — Host `DOCKER-USER` iptables drop rule before `docker start`, zero `--privileged` container exec)**:
     - **Command**: Before `docker start`, insert a host firewall rule scoped to the exact task bridge interface `br-<networkId.slice(0, 12)>`:
       - Enforce: `sudo iptables -I DOCKER-USER 1 -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -j DROP`
       - Rollback during cleanup: `sudo iptables -D DOCKER-USER -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -j DROP`
     - **Why superior on Linux Cloud VM**: Completely blocks container-initiated external egress **before** `docker start` (zero start-to-route-removal window), allows host-initiated `127.0.0.1:<port>` loopback traffic (`ESTABLISHED,RELATED` reply packets) and container-to-container (`br-<id12>` to `br-<id12>`) traffic between ` browser` and `app`, and requires **zero** `docker exec --privileged` inside containers.
   - **Option A2 (Existing candidate — `docker exec --privileged --user 0 <containerId> /bin/sh -c 'ip route del default'`)**:
     - **Scope**: One-shot execution per container (`app` and `browser`) immediately after `docker start` and before `/bin/bash /usr/local/bin/run-services-docker.sh` or `/opt/bin/entry_point.sh`.
     - **Risk**: Requires an independently authenticated verifier token/mechanism and still has a brief window between `docker start` and `ip route del default` unless paired with Option A1.
3. **Verification method after approval**:
   - Verify `HostConfig.Privileged === false`, `CapAdd === null`, `Mounts === []`, and `127.0.0.1` loopback port bindings.
   - Run the structured in-container TCP egress probe (`__BEWT_TCP_PROBE_EXIT__`) to `1.1.1.1:443` and confirm explicit `NETWORK_UNREACHABLE` / blocked egress before starting Claroline or Selenium services.

---

## 6. Cloud Runtime Execution Results (`d-r4`, `d-r5`, `a-r6`)

All three runs executed on `bewt-covext-runner` against committed source `183668bc18e89b4e04212be510b971a9f79c7f65`:

| Metric / Stage | `t03b2-d-20261110-r4` (Diagnostic) | `t03b2-d-20261110-r5` (Diagnostic) | `t03b2-a-20261110-r6` (G0 Runner) |
| --- | --- | --- | --- |
| **Memory Preflight (GiB)** | `60.522 / 60.522 / 60.522` (`PASS`) | `60.537 / 60.541 / 60.541` (`PASS`) | `60.540 / 60.541 / 60.541` (`PASS`) |
| **Selected Subnet** | `172.26.254.0/24` (`gw 172.26.254.1`) | `172.26.254.0/24` (`gw 172.26.254.1`) | `172.26.254.0/24` (`gw 172.26.254.1`) |
| **Created Network ID** | `692707f3e7dba5926c2a7cdad876086829904e2e48cbc5ba65d27c9c942cc768` | `a8be33f2f2b1ac26a39345f1a8478ab1c7fecffb643d4c13f61a00c445a7842e` | `2ed133a9f5b8df0cd8292ec3f7595813e07270913dab7a26dd39feb321f4047e` |
| **Created App Container** | `1051585e14a1396931ee3d5dff3c61d2642ef9c0a5d905d8f7cfe11cfddba3fd` (`127.0.0.1:33863->80/tcp`) | `dca3595ab595726a8e4c028dfe2ff7bcbacc16d02f4ef7cb7109322bd8af71b6` (`127.0.0.1:46033->80/tcp`) | `f6681250d57647092aaf2cafb64a8849a74b57838b5b1458ed87ba05cf4a71f6` (`127.0.0.1:44465->80/tcp`) |
| **Created Browser Container** | N/A (app-only diagnostic) | N/A (app-only diagnostic) | `2824b38e30fbff53b458c975dc31d248a8dd8f3ce17982d3861a9126b62d54b0` (`127.0.0.1:34105->4444/tcp`) |
| **Stop Point** | `BLOCKED_APPROVAL_REQUIRED` (pre-start) | `BLOCKED_APPROVAL_REQUIRED` (pre-start) | `BLOCKED_APPROVAL_REQUIRED` (pre-start) |
| **Cleanup Outcome** | Initial `finally` exposed pre-start empty `NetworkID`; `cleanup-recovery-r1.json` **PASS** (0 residuals) | Automatic `finally` `cleanup-result.json` **PASS** (0 residuals) | Automatic `finally` `cleanup-result.json` **PASS** (0 residuals) |
| **Evidence Validation** | `PASS` (`valid: true`, 21 files) | `PASS` (`valid: true`, 19 files) | `PASS` (`valid: true`, 16 files) |

---

## 7. Evidence Sync & SHA-256 Manifest Verification

All Cloud evidence directories were synced from `/home/runner/BEWT-CovExt/docs/tasks/T03-B2/evidence/` to the local workspace via `cloud-controller.mjs sync`, raw private Docker inventories (`docker-inventory-*.json`) were relocated to gitignored `.local-state/cloud-private-evidence/`, and every directory was verified with `cloud-controller.mjs verify-manifest` and `validate-evidence.mjs`:

| Evidence Directory | Public Files | Manifest Verification | Deterministic Evidence Validator |
| --- | --- | --- | --- |
| `docs/tasks/T03-B2/evidence/offline-verification-20261110-r72/` | 11 | `valid: true` (`mismatches: 0`) | Offline verification summary PASS |
| `docs/tasks/T03-B2/evidence/offline-verification-20261110-r73/` | 12 | `valid: true` (`mismatches: 0`) | Offline verification + Cloud preflight PASS |
| `docs/tasks/T03-B2/evidence/t03b2-d-20261110-r4/` | 21 | `valid: true` (`mismatches: 0`) | `valid: true` (`errors: []`) |
| `docs/tasks/T03-B2/evidence/t03b2-d-20261110-r5/` | 19 | `valid: true` (`mismatches: 0`) | `valid: true` (`errors: []`) |
| `docs/tasks/T03-B2/evidence/t03b2-a-20261110-r6/` | 16 | `valid: true` (`mismatches: 0`) | `valid: true` (`errors: []`) |

---

## 8. Acceptance Checklist (9 / 9 Verified)

- [x] **1. Cloud preflight passed, VM running, and auto-stop verified**: `bewt-covext-runner` (`3042402845209891905`) verified `RUNNING` with `maxRunDuration=21600s`, `instanceTerminationAction=STOP`, `terminationTimestamp=2026-11-10T02:18:54.625Z`, `60.604 GiB` available RAM, and `184.404 GiB` free disk (`offline-verification-20261110-r73/cloud-preflight.json`).
- [x] **2. Cross-platform compatibility implemented and tested**: `child-process-policy.mjs`, `cleanup-claroline-g0.mjs`, `run-claroline-diagnostic.mjs`, `run-claroline-g0.mjs`, and `record-offline-verification.mjs` support Windows and Ubuntu Linux (`41/41` unit/fault tests PASS on both OSes in `r72` and `r73`).
- [x] **3. Cloud controller works via gcloud SSH/SCP**: `experiments/claroline/tools/cloud-controller.mjs` executes preflight, allowlisted remote commands, evidence sync, and SHA-256 manifest verification.
- [x] **4. Network isolation handled according to governance rules**: Fail-closed `requestRouteIsolationApproval()` preserved without bypass; formal Approval Request packet prepared with exact commands, scope, rollback, and verification method.
- [x] **5. Real execution performed on Cloud VM with full logs**: Executed `offline-verification-20261110-r73`, `maven-compile`, `t03b2-d-20261110-r4`, `t03b2-d-20261110-r5`, and `t03b2-a-20261110-r6` on `bewt-covext-runner`.
- [x] **6. Evidence synced locally and verified by SHA-256**: All 5 new evidence directories contain verified `sha256-manifest.json` files (`mismatches: 0`, `missing: 0`).
- [x] **7. Cleanup verified with zero residual resources**: `t03b2-d-20261110-r4` (`cleanup-recovery-r1.json`), `t03b2-d-20261110-r5` (`cleanup-result.json`), and `t03b2-a-20261110-r6` (`cleanup-result.json`) all verified `residuals: { containers: 0, networks: 0, volumes: 0 }`, `countsEqual: true`, `fingerprintsEqual: true`.
- [x] **8. Reports updated accurately from machine-readable evidence**: Updated `TASK-REPORT.md`, `TEST-RESULTS.md`, `G0-RUNTIME-RESULTS.md`, `PROPOSED-STATUS-UPDATE.json`, `CLOUD-RUNNER-REPORT.md`, and `CLOUD-RUNNER-RUNBOOK.md`.
- [x] **9. Changes committed and pushed to PR branch without violating repository rules**: Committed and pushed to `feature/t03b2-claroline-g0` (PR #12); `docs/program/STATUS.json`, `bewt-original/`, and historical `r1`–`r69` evidence untouched.
