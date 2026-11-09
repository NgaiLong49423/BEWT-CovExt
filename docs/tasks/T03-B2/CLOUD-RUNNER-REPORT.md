# BEWT-CovExt Cloud Runner Execution, Evidence Collection & Validation Report (T03-B2 Claroline G0)

**Date**: 2026-11-10  
**Task**: `T03-B2` (Claroline 1.11.10 — G0 Baseline Verification)  
**Branch**: `feature/t03b2-claroline-g0` ([PR #12](https://github.com/NgaiLong49423/BEWT-CovExt/pull/12))  
**Tested Code Commit**: `2e31e1a0a2aa6681047817bcee17e25405d5ba84` (Cloud runtime runs `d-r4`, `d-r5`, `a-r6` recorded on `183668bc18e89b4e04212be510b971a9f79c7f65`; post-SonarCloud security hardening verified on `2e31e1a0a2aa6681047817bcee17e25405d5ba84` in `r74`/`r75`)  
**Pinned BEWT Commit**: `0501249ff3e9a5ea83a06155cd2971dc36197056`  
**Current G0 Gate Disposition**: `PARTIAL` / `BLOCKED` (`REQUEST_CHANGES` — **Do NOT merge PR #12** until Team Lead approvals are granted and G0 Run A/B + DB reset pass at runtime)

---

## 1. Cloud VM Status & Auto-Stop Schedule Verification (Corrected & Reconciled)

Direct verification via `gcloud compute instances describe bewt-covext-runner --zone=asia-southeast1-a --project=gen-lang-client-0311012609` and `node experiments/claroline/tools/cloud-controller.mjs preflight offline-verification-20261110-r75` (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r75/cloud-preflight.json`):

| Property | Verified Value |
| --- | --- |
| **GCP Project ID** | `gen-lang-client-0311012609` |
| **Instance Name / ID** | `bewt-covext-runner` / `3042402845209891905` |
| **Zone** | `asia-southeast1-a` |
| **Status** | `RUNNING` |
| **Machine Type** | `c4d-highmem-8` (8 vCPU AMD EPYC, 63 GiB RAM) |
| **Boot Disk** | 200 GB `hyperdisk-balanced` (`184.403 GiB` available) |
| **OS / Kernel** | Ubuntu 24.04.4 LTS (`Linux 7.0.0-1017-gcp x86_64 GNU/Linux`) |
| **Creation Timestamp** | `2026-11-09T12:18:54.625-08:00` (`= 2026-11-09T20:18:54.625Z` UTC `= 2026-11-10T03:18:54.625+07:00` ICT) |
| **Max Run Duration** | `21600s` (6 hours = `21,600,000 ms`) |
| **Termination Action** | `STOP` |
| **Termination Timestamp** | `2026-11-09T18:18:54.625-08:00` (`= 2026-11-10T02:18:54.625Z` UTC `= 2026-11-10T09:18:54.625+07:00` ICT) |
| **Schedule Identity Check** | $\text{creationTimestamp} + 21600\,\text{s} = \text{terminationTimestamp}$ (`2026-11-09T20:18:54.625Z + 06:00:00 = 2026-11-10T02:18:54.625Z`) |
| **OS-level backup timer** | `bewt-autostop.timer` active (`Trigger: Tue 2026-11-10 02:15:39 UTC`) |
| **VM Recreation / Extension** | **NONE** — Existing VM reused; 6-hour auto-stop schedule untouched |

> **Audit Correction Note (Item #3)**: An earlier draft of this table misquoted `creationTimestamp` as `2026-11-09T19:18:51.999-08:00` due to a manual timezone transcription error. The machine-recorded value in `cloud-preflight.json` (`r73` and `r75`) is `2026-11-09T12:18:54.625-08:00` (`2026-11-09T20:18:54.625Z`), which plus `21600s` (6 hours) equals `terminationTimestampUtc = 2026-11-10T02:18:54.625Z` (`2026-11-10T09:18:54.625+07:00`).

---

## 2. Preflight & Pinned Image Digest Verification (`r73` & `r75`)

- **Host Available Memory (`MemAvailable`)**: `60.603–60.604 GiB` (`~65.07 GB`) — passes the `6.0 GiB` gate (`>= 6,442,450,944 bytes`) with `>54.6 GiB` headroom.
- **Root Disk Free Space**: `184.403 GiB` (`198,001,168,384 bytes`).
- **Toolchain Versions**:
  - Docker Engine: `29.9.3` (Server & Client healthy, `0` active containers, `3` default networks `bridge`/`host`/`none`, `0` volumes).
  - Java: OpenJDK `21.0.10` (`2026-01-20`).
  - Maven: Apache Maven `3.8.7` (`mvn -B clean test-compile` in `experiments/claroline/bewt-suite` compiles 22 main + 42 test classes in `11.352 s`, exit 0).
  - Node.js: `v20.20.2` (Cloud VM) / `v24.19.0` (Windows).
- **Pinned Docker Image Digests Verified Against `claroline-g0.mjs`, `t03b2-a-20261110-r6/image-inspect.json`, `t03b2-a-20261110-r6/run-record.json`, and `cloud-preflight.json`**:
  - **App image**: `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af`
  - **Browser image**: `selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f`

> **Audit Correction Note (Item #2)**: An earlier draft of this report and `G0-RUNTIME-RESULTS.md` mistakenly wrote `selenium/standalone-chrome-debug@sha256:c35da9ee...` in prose. Cross-referencing `t03b2-a-20261110-r6/image-inspect.json` (`RepoDigests: ["selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f"]`), `t03b2-a-20261110-r6/run-record.json` (`browserImageDigest: "sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f"`), and `cloud-preflight.json` (`browserImageId: "sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f"`) confirms the actual pinned and inspected image is `selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f`. Historical evidence files were not modified.

---

## 3. SonarCloud Quality Gate & Security Findings Resolution (Item #1)

### 3.1. Root Cause of Initial Quality Gate Failure (`183668bc` / `a38b667`)
At commit `a38b667e468170bfe3ed799a5c043ad99ef2d88e`, SonarCloud reported `Quality Gate: ERROR` because `new_security_rating` was **`3` (`C`)** instead of **`1` (`A`)**, caused by **15 security-related findings** in the newly added/modified files:

| Rule ID | Type / Severity | Impact | Count | File & Lines | Root Cause |
| --- | --- | --- | --- | --- | --- |
| `jssecurity:S8707` | `VULNERABILITY` (`MAJOR`) | `SECURITY:HIGH` | 6 | `experiments/claroline/tools/cloud-controller.mjs` (lines 214, 217, 268, 269, 470, 485) | CLI entrypoints (`preflight` line 469 and `write-manifest` line 483) passed raw `process.argv[3]` into `resolve(process.argv[3])` and filesystem sinks (`existsSync`, `statSync`, `readdirSync`, `writeFileSync`) without strict identifier validation or directory confinement. |
| `jssecurity:S8707` | `VULNERABILITY` (`MAJOR`) | `SECURITY:HIGH` | 5 | `experiments/claroline/tools/validate-evidence.mjs` (lines 28, 31, 54, 74, 151) | CLI entrypoint (line 263) passed raw `process.argv[2]` into `resolve(process.argv[2])` and `validateEvidenceDirectory` (`existsSync`, `statSync`, `readdirSync`, `readFileSync`) without strict identifier validation or confinement under `docs/tasks/T03-B2/evidence`. |
| `javascript:S4036` | `VULNERABILITY` (`MINOR`) | `SECURITY:LOW` | 1 | `experiments/claroline/tools/record-offline-verification.mjs` (line 28) | `spawnSync('git', args, ...)` invoked bare `'git'` via inherited `process.env.PATH` rather than a verified absolute binary path and fixed environment `PATH`. |
| `javascript:S1313` | `CODE_SMELL` (`MINOR`) | `SECURITY:LOW` | 3 | `experiments/claroline/tools/cloud-controller.mjs` (lines 297, 359, 410) | Hardcoded ephemeral VM external IP literal `'34.142.128.95'` as default parameter/fallback in `executeRemoteAction`, `runCloudPreflight`, and `syncEvidenceFromCloud`. |

### 3.2. Code Fixes Implemented (`2e31e1a0a2aa6681047817bcee17e25405d5ba84`)
No rule suppression (`// NOSONAR`), quality profile alteration, or rule deactivation was used:

1. **Path Traversal Prevention (`jssecurity:S8707` — 11/11 resolved)**:
   - Added `validateEvidenceId(evidenceId)` and `resolveEvidenceDirectoryById(evidenceId, baseDir)` in `experiments/claroline/tools/cloud-controller.mjs`.
   - `validateEvidenceId` enforces `/^(?:t03b2-[a-z0-9]{1,20}-\d{8}-r[1-9]\d*|offline-verification-\d{8}-r[1-9]\d*)$/`, rejecting any slashes, backslashes, dots (`..`), or arbitrary paths.
   - `resolveEvidenceDirectoryById` matches the validated ID against `readdirSync(rootDir, { withFileTypes: true })` under `docs/tasks/T03-B2/evidence` and resolves `matched.name` from the directory listing.
   - Updated the CLI entrypoints of `cloud-controller.mjs` (`preflight` and `write-manifest`) and `validate-evidence.mjs` to use `validateEvidenceId` + `resolveEvidenceDirectoryById`.
2. **Fixed Child-Process Executable & `PATH` Policy (`javascript:S4036` — 1/1 resolved)**:
   - Exported `GIT_CLI_PATH` and `NODE_CLI_PATH` from `experiments/claroline/tools/child-process-policy.mjs` (verified under `C:\Program Files\Git\cmd\git.exe` / `C:\Program Files\nodejs\node.exe` on Windows via `protectedDirectory`, and `/usr/bin/git` / `/usr/bin/node` on Linux via `verifyLinuxRootExecutable`).
   - Updated `experiments/claroline/tools/record-offline-verification.mjs` to invoke `spawnSync(GIT_CLI_PATH, ...)` and `spawnSync(NODE_CLI_PATH, ...)` with `env: DOCKER_ENV` (which has a fixed, unwriteable `PATH`).
3. **Dynamic VM External IP Resolution (`javascript:S1313` in `cloud-controller.mjs` — 3/3 resolved)**:
   - Added `resolveVmExternalIp({ spawnSyncFn })` in `experiments/claroline/tools/cloud-controller.mjs` to query `networkInterfaces[0].accessConfigs[0].natIP` dynamically from `gcloud compute instances describe` after verifying the VM's termination schedule, failing closed with `VM_EXTERNAL_IP_UNAVAILABLE` if `natIP` is absent, and removed all `'34.142.128.95'` literals.

### 3.3. Verified SonarCloud Quality Gate Result (`2e31e1a0a2aa6681047817bcee17e25405d5ba84`)
Verified via `https://sonarcloud.io/api/qualitygates/project_status?projectKey=NgaiLong49423_BEWT-CovExt&pullRequest=12` and GitHub Check Run (`completed_at: 2026-11-09T21:38:56Z`, `conclusion: success`):

| Metric | Threshold | Actual Value | Status |
| --- | --- | --- | --- |
| **Quality Gate Status** | — | **`OK` (`PASSED`)** | **PASS** |
| `new_reliability_rating` | `1` (`A`) | `1` (`A`) | `OK` |
| `new_security_rating` | `1` (`A`) | **`1` (`A`)** *(improved from `3` / `C`)* | **`OK`** |
| `new_maintainability_rating` | `1` (`A`) | `1` (`A`) | `OK` |
| `new_duplicated_lines_density` | `<= 3.0%` | `0.0%` | `OK` |
| `new_security_hotspots_reviewed` | `100.0%` | `100.0%` (0 hotspots) | `OK` |
| Open `VULNERABILITY` issues on PR #12 | `0` | **`0`** | **`OK`** |

---

## 4. Unit & Negative Test Results (`44/44 PASS` on Windows `r74` & Linux `r75`)

Executed post-commit on `2e31e1a0a2aa6681047817bcee17e25405d5ba84` (`sourceMatchesHeadAtTest: true`, `sourceWorkingTreeDirtyAtTest: false`):

- **Windows (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r74/`)**:
  - 9/9 `node --check` syntax checks: **PASS** (exit 0).
  - `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **44 passed, 0 failed** (exit 0).
- **Ubuntu 24.04 Cloud VM (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r75/`)**:
  - 9/9 `node --check` syntax checks: **PASS** (exit 0).
  - `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **44 passed, 0 failed** (exit 0).
- **New Tests Added in `r74`/`r75` (Tests 42–44)**:
  - **Test 42**: Verifies `GIT_CLI_PATH` and `NODE_CLI_PATH` resolution and tests `validateEvidenceId` / `resolveEvidenceDirectoryById` against path-traversal payloads (`../t03b2-d-20261110-r5`, `docs/tasks/T03-B2/evidence/...`, `t03b2-d-20261110-r5/../../etc/passwd`, `C:\Windows\System32`).
  - **Test 43**: Verifies `resolveVmExternalIp` dynamic `natIP` resolution and fail-closed `VM_EXTERNAL_IP_UNAVAILABLE` error when `natIP` is missing.
  - **Test 44**: Verifies Ubuntu host bridge firewall specification (`deriveLinuxBridgeInterfaceName`, `buildHostBridgeFirewallSpec`), active rule verification (`assertHostBridgeFirewallRuleInstalled`), negative fault cases (short network ID, bridge name mismatch, `docker0`, missing rule, duplicate rule, `-j ACCEPT`, `-j DROP` without `--reject-with icmp-net-unreachable`), and zero-residual rollback verification (`assertHostBridgeFirewallRuleRemoved`).

> **Important Distinction (Item #8)**: Passing `44/44` offline unit/fault tests and `validate-evidence.mjs` `VALID` proves only tool/harness correctness and evidence integrity for pre-approval runs. It **does NOT** establish G0 runtime `PASS`.

---

## 5. Technical Analysis & Approval Request Packet: Ubuntu Host Firewall Network Isolation (Item #5)

### 5.1. Architectural Problem Statement
1. On a user-defined Docker bridge with `--internal` (`Internal: true`), Docker omits a default gateway and breaks host loopback port forwarding (`127.0.0.1:<hostPort> -> <containerPort>`).
2. On a non-internal bridge (`Internal: false`, `com.docker.network.bridge.enable_ip_masquerade=false`), host loopback port forwarding works, but on a cloud VM (`bewt-covext-runner`), the VPC router forwards packets even without NAT masquerading (or before route removal), as observed in historical diagnostic `r2`.
3. The existing candidate (`ROUTE_ISOLATION_METHOD = 'container-netns-default-route-drop-v1'`) proposed running `docker exec --privileged --user 0 <containerId> /bin/sh -c 'ip route del default'` **after** `docker start`, which has two drawbacks:
   - It requires invoking `docker exec --privileged` inside the untrusted container namespace.
   - It leaves a brief time window between `docker start` and `docker exec ... ip route del default` during which the container has an active default route.

### 5.2. Ubuntu Host Firewall Design (`HOST_FIREWALL_ISOLATION_METHOD = 'linux-docker-user-bridge-reject-v1'`)
Implemented and unit-tested in `experiments/claroline/tools/claroline-g0.mjs` (`deriveLinuxBridgeInterfaceName`, `buildHostBridgeFirewallSpec`, `assertHostBridgeFirewallRuleInstalled`, `assertHostBridgeFirewallRuleRemoved`) while remaining gated behind Team Lead approval:

1. **Docker Bridge Interface Identification**:
   - When `docker network create` creates the task-labeled bridge with full 64-hex ID `<networkId>`, Linux Docker Engine creates bridge interface `br-<networkId.slice(0, 12)>` (e.g., `br-2ed133a9f5b8` in `t03b2-a-20261110-r6`).
   - `deriveLinuxBridgeInterfaceName(networkId, inspectedBridgeName)` validates `/^[a-f0-9]{64}$/i` and confirms `br-${networkId.slice(0, 12).toLowerCase()}` matches `/sys/class/net/br-<id12>`.
2. **IPv4 Filtering via `DOCKER-USER` Chain (Pre-Start Enforcement)**:
   - Docker Engine on Linux evaluates the `DOCKER-USER` chain in the `filter` table (`FORWARD` hook) **before** any Docker-generated rules.
   - **Before `docker start`** (while `app` and `browser` containers are in `created` / dormant state), insert at position 1 of `DOCKER-USER`:
     ```bash
     sudo -n /usr/sbin/iptables -w 5 -I DOCKER-USER 1 \
       -i br-<id12> ! -o br-<id12> \
       -m conntrack ! --ctstate RELATED,ESTABLISHED \
       -m comment --comment bewt-t03b2-<runId> \
       -j REJECT --reject-with icmp-net-unreachable
     ```
   - **Why `-j REJECT --reject-with icmp-net-unreachable` instead of `-j DROP`**:
     - Our fail-closed egress classifier (`classifyTcpProbe` / `classifyEgressProbe` in `claroline-g0.mjs`) explicitly rejects `TCP_TIMEOUT_INCONCLUSIVE` (`status 124`) and requires an explicit `NETWORK_UNREACHABLE` (`ENETUNREACH` / `Network is unreachable`) signal with matching `__BEWT_TCP_PROBE_EXIT__` status.
     - With `-j REJECT --reject-with icmp-net-unreachable`, any container-initiated SYN packet leaving `br-<id12>` toward an external IP (`! -o br-<id12>`, such as `1.1.1.1:443`) immediately receives ICMP Type 3 Code 0 (`Net Unreachable`) from the host kernel, causing the socket in the container to fail in `<5 ms` with `Network is unreachable` (`ENETUNREACH`), deterministically satisfying `classifyEgressProbe`!
   - **Why Intra-Bridge and Host Loopback Traffic Remain Unblocked**:
     - **Browser $\leftrightarrow$ App (`172.26.254.x` $\leftrightarrow$ `172.26.254.y`)**: Both ingress and egress interfaces are `br-<id12>` (`-i br-<id12> -o br-<id12>`), which does **not** match `! -o br-<id12>`. Selenium Chrome inside `browser` can reach `http://claroline-app:80` or the bridge IP unhindered.
     - **Host Loopback (`127.0.0.1:<appPort>` and `127.0.0.1:<browserPort>`)**: Connections originate on the host via `docker-proxy` (`172.26.254.1 -> 172.26.254.x` on `OUTPUT`/`INPUT`, not `FORWARD`); even if DNAT traverses `FORWARD`, container reply packets have conntrack state `ESTABLISHED,RELATED`, which does **not** match `! --ctstate RELATED,ESTABLISHED`.
3. **IPv6 Handling**:
   - The task network is created with `--ipv6=false` (`EnableIPv6: false`, verified by `assertNetworkPolicy`), and the GCE VM NIC (`ens4`) has `stackType: IPV4_ONLY` (`HOST_IPV6_UNAVAILABLE` / `ENETUNREACH`).
   - Containers on `br-<id12>` receive no IPv6 global address or default route (`ip -6 route show default` is empty).
   - As defense-in-depth on dual-stack hosts, an analogous `ip6tables` rule (`sudo -n /usr/sbin/ip6tables -w 5 -I FORWARD 1 -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -m comment --comment bewt-t03b2-<runId> -j REJECT --reject-with icmp6-no-route`) can also be applied.
4. **`sudo` Privilege Scope & Security Comparison**:
   - On `bewt-covext-runner`, `/usr/sbin/iptables` is verified via `verifyLinuxRootExecutable('/usr/sbin/iptables')` (`uid=0, gid=0`, mode `0755`, realpath `/usr/sbin/xtables-nft-multi`).
   - Unlike `docker exec --privileged`, which grants all Linux capabilities (`CAP_SYS_ADMIN`, device access, etc.) inside the container namespace, `sudo -n /usr/sbin/iptables` runs on the trusted host with a fixed argument array (`buildHostBridgeFirewallSpec`) and leaves `HostConfig.Privileged: false` and `CapAdd: null` on all containers.
5. **Zero Impact on Other Resources**:
   - The rule matches **only** packets with input interface `-i br-<id12>` (the unique 12-hex prefix of the current run's network ID) and carries `--comment bewt-t03b2-<runId>`.
   - Host traffic (`ens4`), default `docker0`, and any other container networks (`br-<other>`) never match `-i br-<id12>`.
6. **Deterministic Rollback & Cleanup Verification**:
   - During `finally` cleanup (`cleanup-claroline-g0.mjs`), after stopping/removing the run's containers:
     1. Execute `sudo -n /usr/sbin/iptables -w 5 -D DOCKER-USER -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -m comment --comment bewt-t03b2-<runId> -j REJECT --reject-with icmp-net-unreachable`.
     2. Run `sudo -n /usr/sbin/iptables -w 5 -S DOCKER-USER` and pass the output to `assertHostBridgeFirewallRuleRemoved(output, spec)`, which fails closed if any rule referencing `br-<id12>` or `bewt-t03b2-<runId>` remains.

### 5.3. Technical Approval Request #1 (Network Isolation & GCE `IPV4_ONLY` Host Control)
We request Team Lead approval for:
1. **Enabling `HOST_FIREWALL_ISOLATION_METHOD` (`linux-docker-user-bridge-reject-v1`) on the Ubuntu Cloud VM**:
   - Pre-start command: `sudo -n /usr/sbin/iptables -w 5 -I DOCKER-USER 1 -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -m comment --comment bewt-t03b2-<runId> -j REJECT --reject-with icmp-net-unreachable`
   - Verification before `docker start`: `sudo -n /usr/sbin/iptables -w 5 -S DOCKER-USER` checked via `assertHostBridgeFirewallRuleInstalled`.
   - Post-start verification before service launch: in-container TCP egress probe to `1.1.1.1:443` must return `NETWORK_UNREACHABLE` (`__BEWT_TCP_PROBE_EXIT__=1`).
   - Teardown rollback: `sudo -n /usr/sbin/iptables -w 5 -D DOCKER-USER ...` checked via `assertHostBridgeFirewallRuleRemoved`.
2. **GCE `IPV4_ONLY` Host Control Policy**:
   - On `bewt-covext-runner` (`stackType: IPV4_ONLY`), permit `HOST_IPV6_UNAVAILABLE` (`ENETUNREACH` on host control probe to `2606:4700:4700::1111:443`) when the task network has `EnableIPv6 === false` and the container's `ip -6 route show default` is verified empty.

---

## 6. Risk & Business Impact Analysis of the Unattributed Claroline Image Patch (Item #6)

### 6.1. Exact Code Diff Identified in Layer 13 of `olianasd/claroline-strongpsw`
Read-only layer comparison (`docs/tasks/T03-B2/evidence/offline-verification-20261109-r14/image-source-layer-comparison.json`) verified that Layer 8 of `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` contains all 1,630 files of official `claroline-1.11.10.tar.gz` (`sha256:666b63e3b4cf0d188a7f618c0c65493812f0ba2283e606d8f1ea8236072d9dd6`) with **0 byte mismatches**.

In Layer 13, exactly **one** application source file is modified: `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` (official release SHA-256: `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1` $\rightarrow$ image Layer 13 SHA-256: `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8`, both 23,040 bytes).

Exact unified diff at lines 186–201 inside function `define_course_keys()`:

```diff
--- layer_8_official_1.11.10 (claroline/inc/lib/add_course.lib.inc.php)
+++ layer_13_pinned_image (claroline/inc/lib/add_course.lib.inc.php)
@@ -186,15 +186,15 @@
         // here  we can add a counter to exit if need too many try
-        $limitQtyTry = 128;
-
-        if (($tryNewFSCId+$tryNewFSCDb+$tryNewFSCDir > $limitQtyTry)
-                or ($tryNewFSCId > $limitQtyTry / 2 )
-                or ($tryNewFSCDb > $limitQtyTry / 2 )
-                or ($tryNewFSCDir > $limitQtyTry / 2 )
-            )
-        {
-            trigger_error('too many try for ' .  $wantedCode ,E_USER_WARNING);
-            return false;
-
-        }
+        // $limitQtyTry = 128;
+
+        // if (($tryNewFSCId+$tryNewFSCDb+$tryNewFSCDir > $limitQtyTry)
+                // or ($tryNewFSCId > $limitQtyTry / 2 )
+                // or ($tryNewFSCDb > $limitQtyTry / 2 )
+                // or ($tryNewFSCDir > $limitQtyTry / 2 )
+            // )
+        // {
+            // trigger_error('too many try for ' .  $wantedCode ,E_USER_WARNING);
+            // return false;
+
+        // }
     }
```

### 6.2. Technical & Business Impact Assessment

| Dimension | Assessment |
| --- | --- |
| **Why the patch exists in `olianasd/claroline-strongpsw`** | In official Claroline 1.11.10, creating a course with an existing `$wantedCode` (e.g., `'Course001'`) appends a numeric suffix (`001`, `002`, ...) in a `while (!$keysAreUnique)` loop and increments `$tryNewFSCId`, `$tryNewFSCDb`, and `$tryNewFSCDir`. After 64 collisions (`$limitQtyTry / 2 = 64`), official Claroline triggers `E_USER_WARNING: too many try for <wantedCode>` and returns `false`, aborting course creation. In the original BEWT benchmark (and automated test-generation/crawling experiments where tests repeatedly create `'Course001'` without resetting the database), the 65th course creation fails unless this 128-try cap is commented out. |
| **Impact on G0 (`Claroline_AddUserTest`)** | **Zero runtime impact on G0.** `Claroline_AddUserTest` exercises admin login and user creation (`claroline/admin/adminaddnewuser.php` $\rightarrow$ table `cl_user`). It never loads or executes `claroline/inc/lib/add_course.lib.inc.php`. |
| **Impact on G1–G4 (`AddCourseTest`, course workflows, and code coverage)** | 1. **Normal test execution ($<64$ courses with same prefix)**: Identical functional behavior; courses are created with identical keys/tables. Since our harness resets the database between runs, `$tryNewFSCId` starts at `0` and never approaches `64`.<br>2. **Branch/line coverage delta**: In `add_course.lib.inc.php`, the 12 commented-out lines (1 guard condition + `trigger_error` + `return false`) are non-executable comments in the image, reducing executable statements in `define_course_keys()` by 3 statements / 1 branch.<br>3. **Exhaustion edge-case**: Any negative test specifically asserting failure after $>64$ duplicate course codes would not trigger `return false` on the unmodified image layer. |
| **Security & Provenance Risk** | The patch contains **no** backdoor, network call, credential change, or privilege escalation—it only comments out the `128`-retry guard in `define_course_keys()`. However, because it differs from pristine upstream Claroline `1.11.10`, the image must be recorded as a **BEWT benchmark derivative image** (`SOURCE_RELEASE_VERIFIED` with 1 documented benchmark patch) rather than a pristine upstream build. |

### 6.3. Image Provenance Decision Request #2 for Team Lead
Please choose one of the following options for `T03-B2`:
- **Option P1 (Recommended for BEWT benchmark fidelity)**: Accept `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` as the pinned BEWT benchmark runtime image, with the 1-file `add_course.lib.inc.php` retry-limit patch explicitly documented in `config/apps/claroline.json` metadata and research reports as a known upstream BEWT benchmark modification.
- **Option P2 (Strict pristine upstream source)**: Before starting Claroline services in the container, restore `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` from Layer 8 (official SHA-256 `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1`) and verify its SHA-256 inside the container so 100% of the 1,630 application files match official `claroline-1.11.10.tar.gz` byte-for-byte.

---

## 7. Cloud Runtime Execution & G0 Status Table (Items #7 & #8)

All runtime executions on `bewt-covext-runner` stopped fail-closed at `requestRouteIsolationApproval()` (`BLOCKED_APPROVAL_REQUIRED`) **before** `docker start`, as required by Section 6/Item #7 before approvals are granted:

| Component / Gate | Status | Exit Code | Verified Evidence & Details |
| --- | --- | --- | --- |
| **Cloud VM Preflight (`r73`, `r75`)** | **`PASS`** | `0` | `bewt-covext-runner` (`3042402845209891905`) `RUNNING`, `60.603 GiB` free RAM, `184.403 GiB` free disk, auto-stop `2026-11-10T02:18:54.625Z` (`offline-verification-20261110-r75/cloud-preflight.json`). |
| **Node Syntax Checks (`r74` Win, `r75` Linux)** | **`PASS`** | `0` (9/9) | All 9 `.mjs` modules pass `node --check` on commit `2e31e1a0a2aa6681047817bcee17e25405d5ba84`. |
| **Offline Unit/Fault Tests (`r74` Win, `r75` Linux)** | **`PASS`** | `0` (44/44) | `44/44` tests pass on both Windows (`r74`) and Ubuntu 24.04 Cloud VM (`r75`). |
| **Maven Test Compilation (Cloud VM)** | **`PASS`** | `0` | `mvn -B clean test-compile` compiled 22 main + 42 test classes in `11.352 s`. |
| **SonarCloud Quality Gate (`PR #12`)** | **`PASS`** | `0` | Status `OK`, `Security Rating = A (1)`, `Reliability = A (1)`, `Maintainability = A (1)`, `0` vulnerabilities, `0.0%` duplication on `2e31e1a0a2aa6681047817bcee17e25405d5ba84`. |
| **Cloud Diagnostic `t03b2-d-20261110-r4`** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.522 GiB`); created network `692707f3...` & dormant app `1051585e...`; blocked at `BLOCKED_APPROVAL_REQUIRED` before `docker start`. Pre-start cleanup bug fixed in `183668bc`; `cleanup-recovery-r1.json` **`PASS`** (0 residuals). |
| **Cloud Diagnostic `t03b2-d-20261110-r5`** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.541 GiB`); created network `a8be33f2...` & dormant app `dca3595a...`; blocked at `BLOCKED_APPROVAL_REQUIRED` before `docker start`. Automatic `cleanup-result.json` **`PASS`** (0 residuals). |
| **Cloud G0 Run A `t03b2-a-20261110-r6`** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.541 GiB`); created network `2ed133a9...`, dormant app `f6681250...`, dormant browser `2824b38e...`; blocked at `BLOCKED_APPROVAL_REQUIRED` before `docker start`. Automatic `cleanup-result.json` **`PASS`** (0 residuals). |
| **Cloud G0 Run B** | **`NOT_RUN`** | — | Gated behind Run A completion and Team Lead approval gates. |
| **HTTP / MySQL Readiness** | **`NOT_RUN`** | — | Containers were not started prior to approval gate. |
| **Selenium Base / `Claroline_AddUserTest` (JUnit XML)** | **`NOT_RUN`** | — | No `TEST-test.Claroline_AddUserTest.xml` generated because runtime stopped before `docker start`. |
| **Database Reset Verification** | **`NOT_RUN`** | — | Containers were not started prior to approval gate. |
| **Overall Task T03-B2 G0 Status** | **`PARTIAL` / `BLOCKED`** | — | **Recommendation: `REQUEST_CHANGES` (Do NOT merge PR #12 yet).** |
