# BEWT-CovExt Cloud Runner Execution, Evidence Collection & Validation Report (T03-B2 Claroline G0)

**Date**: 2026-11-10  
**Task**: `T03-B2` (Claroline 1.11.10 — G0 Baseline Verification)  
**Branch**: `feature/t03b2-claroline-g0` ([PR #12](https://github.com/NgaiLong49423/BEWT-CovExt/pull/12))  
**Tested Code Commit**: `3fe306ad0a4a7f1e3bd235c018041cbeee8072cb` (implements Team Lead Decisions `A1` & `P1`, verified in Windows `r76`, Cloud VM `r77`, and Cloud Diagnostic `t03b2-d-20261110-r6`; prior Cloud runs `d-r4`, `d-r5`, `a-r6` recorded on `183668bc18e89b4e04212be510b971a9f79c7f65`, SonarCloud hardening on `2e31e1a0a2aa6681047817bcee17e25405d5ba84` in `r74`/`r75`)  
**Pinned BEWT Commit**: `0501249ff3e9a5ea83a06155cd2971dc36197056`  
**Verified Claroline Application Commit**: `22d852f93081bc36b1d08b93f5e0c14b49a573f6` (`1.11.10-bewt-derivative`, Decision `P1`, promoted in `config/apps/claroline.json`)  
**Current G0 Gate Disposition**: `PARTIAL` / `BLOCKED` (`REQUEST_CHANGES` — **Do NOT merge PR #12** until an independent Team Lead Ed25519 public key and signed per-run host-firewall decision token are provisioned and G0 Run A/B + DB reset pass at runtime)

---

## 1. Cloud VM Status & Auto-Stop Schedule Verification (Corrected & Reconciled)

Direct verification via `gcloud compute instances describe bewt-covext-runner --zone=asia-southeast1-a --project=gen-lang-client-0311012609` and `node experiments/claroline/tools/cloud-controller.mjs preflight offline-verification-20261110-r77` (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r77/cloud-preflight.json`):

| Property | Verified Value |
| --- | --- |
| **GCP Project ID** | `gen-lang-client-0311012609` |
| **Instance Name / ID** | `bewt-covext-runner` / `3042402845209891905` |
| **Zone** | `asia-southeast1-a` |
| **Status** | `RUNNING` |
| **Machine Type** | `c4d-highmem-8` (8 vCPU AMD EPYC, 63 GiB RAM) |
| **Network Stack / Uplink** | `IPV4_ONLY` / default IPv4 uplink interface **`ens3`** (`default via 10.148.0.1 dev ens3 proto dhcp src 10.148.0.3 metric 100`) |
| **Firewall Backend** | `/usr/sbin/iptables` $\rightarrow$ `/usr/sbin/xtables-nft-multi` (`iptables v1.8.10 (nf_tables)`) |
| **Boot Disk** | 200 GB `hyperdisk-balanced` (`184.401 GiB` available) |
| **OS / Kernel** | Ubuntu 24.04.4 LTS (`Linux 7.0.0-1017-gcp x86_64 GNU/Linux`) |
| **Creation Timestamp** | `2026-11-09T12:18:54.625-08:00` (`= 2026-11-09T20:18:54.625Z` UTC `= 2026-11-10T03:18:54.625+07:00` ICT) |
| **Max Run Duration** | `21600s` (6 hours = `21,600,000 ms`) |
| **Termination Action** | `STOP` |
| **Termination Timestamp** | `2026-11-09T18:18:54.625-08:00` (`= 2026-11-10T02:18:54.625Z` UTC `= 2026-11-10T09:18:54.625+07:00` ICT; `14,025 s` $\approx 3\text{h }53\text{m}$ remaining at `r77` capture) |
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

## 4. Unit & Negative Test Results (`46/46 PASS` on Windows `r76` & Linux `r77` + `3/3 PASS` on `verify-config-apps.test.mjs`)

Executed post-commit on `3fe306ad0a4a7f1e3bd235c018041cbeee8072cb` (`sourceMatchesHeadAtTest: true`, `sourceWorkingTreeDirtyAtTest: false`):

- **Windows (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r76/`)**:
  - 9/9 `node --check` syntax checks: **PASS** (exit 0).
  - `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **46 passed, 0 failed** (exit 0).
  - `node --test docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs`: **3 passed, 0 failed** (exit 0).
- **Ubuntu 24.04 Cloud VM (`docs/tasks/T03-B2/evidence/offline-verification-20261110-r77/`)**:
  - 9/9 `node --check` syntax checks: **PASS** (exit 0).
  - `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`: **46 passed, 0 failed** (exit 0).
  - `node --test docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs`: **3 passed, 0 failed** (exit 0).
- **New Tests Added in `r76`/`r77` (Tests 45–46)**:
  - **Test 45**: Verifies Linux default uplink parsing (`parseLinuxDefaultUplinkInterface`), GCE `IPV4_ONLY` host egress control verification (`verifyHostEgressControlsForRun`), and Decision `P1` pinned image provenance metadata (`APPLICATION_SOURCE_COMMIT`, `APPLICATION_SOURCE_VERSION`, `IMAGE_PROVENANCE_CLASSIFICATION = 'BEWT_BENCHMARK_DERIVATIVE_PINNED'`, `PINNED_IMAGE_PATCH_RECORD` with Layer 8 `23,010` bytes `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1` vs Layer 13 `23,040` bytes `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8` and exact line ranges `382–389` and `557–562`).
  - **Test 46**: Verifies the independent Ed25519 Team Lead host-firewall authorization verifier (`verifyHostFirewallDecision` / `requestHostFirewallApproval`), covering positive signature + scope + TTL + replay ledger persistence and negative fault cases (no trusted public key, invalid signature, wrong role/identity, mismatched `runId`/`networkId`/`bridgeInterface`/`uplinkInterface`/`insertCommand`/`deleteCommand`/`scope`/`rollback`, expired TTL `>15 min`, and replayed nonce).

> **Important Distinction (Item #8)**: Passing `46/46` offline unit/fault tests, `3/3` manifest tests, and `validate-evidence.mjs` `VALID` proves only tool/harness correctness and evidence integrity for pre-approval runs. It **does NOT** establish G0 runtime `PASS`.

---

## 5. Implementation & Live Cloud Preflight of Decision 1 (`A1`: `linux-docker-user-bridge-reject-v1`)

### 5.1. Reconciled Cloud VM Network Topology & Firewall Backend (`t03b2-d-20261110-r6/host-network-firewall-preflight.json`)
Direct inspection on `bewt-covext-runner` (`3042402845209891905`) during `t03b2-d-20261110-r6` verified and reconciled the earlier report contradiction (`ens4` vs `ens3`):
1. **Default Uplink Interface**: `ip -4 route show default` outputs `default via 10.148.0.1 dev ens3 proto dhcp src 10.148.0.3 metric 100`. The VM's default uplink interface is **`ens3`** (`parseLinuxDefaultUplinkInterface` verified `ens3`). Earlier prose in PR #12 / §5.2 that mentioned `ens4` was a documentation error and is corrected here.
2. **Task Docker Bridge Interface**: Creating network `19ec2e85b68514830ce05530dbe5ec7233cefd4059daeb73cd56798f6fd7470a` (`172.26.254.0/24`, gateway `172.26.254.1`, `Internal: false`, `EnableIPv6: false`, `com.docker.network.bridge.enable_ip_masquerade: "false"`, `com.docker.network.bridge.enable_icc: "true"`) created kernel bridge **`br-19ec2e85b685`**, verified in `/sys/class/net/br-19ec2e85b685/bridge` (`exists: true`).
3. **Host Firewall Backend**: `/usr/sbin/iptables --version` outputs **`iptables v1.8.10 (nf_tables)`** (realpath `/usr/sbin/xtables-nft-multi`, root-owned `0:0`, mode `0755`), and `/usr/bin/sudo` is verified (`0:0`, mode `4755`).
4. **IPv6 Control Verification**: `ip -6 route show default` is empty (`[]`), and `verifyHostEgressControlsForRun` verified `HOST_IPV6_UNAVAILABLE` (`ENETUNREACH`) is safe on GCE `IPV4_ONLY` when `EnableIPv6 === false` and host IPv6 default routes are empty.

### 5.2. Unified Official Firewall Rule Specification (`buildHostBridgeFirewallSpec`)
Earlier report sections showed two slightly different rule formulations (`! -o br-<id12>` vs `-o ens4`). In commit `3fe306ad0a4a7f1e3bd235c018041cbeee8072cb`, the single authoritative specification in `buildHostBridgeFirewallSpec` is:

- **Pre-Start Insert Command (`sudoInsertArgs`)**:
  ```bash
  /usr/bin/sudo -n /usr/sbin/iptables -w 5 -I DOCKER-USER 1 \
    -i br-<id12> ! -o br-<id12> \
    -m conntrack ! --ctstate RELATED,ESTABLISHED \
    -m comment --comment bewt-t03b2-<runId> \
    -j REJECT --reject-with icmp-net-unreachable
  ```
- **Why `! -o br-<id12>` (with `uplinkInterface: "ens3"` recorded in the spec) is Strictly Stronger than `-o ens3` alone**:
  - `! -o br-<id12>` blocks container-initiated traffic leaving `br-<id12>` toward **`ens3` (Internet / VPC / GCE metadata server `169.254.169.254`) AND any other non-bridge interface** (`docker0`, other `br-*` networks, or tunnel interfaces), while still allowing intra-bridge traffic (`-i br-<id12> -o br-<id12>`, so `browser` $\leftrightarrow$ `app` works) and host loopback reply packets (`--ctstate RELATED,ESTABLISHED`, so `127.0.0.1:<appPort>` and `127.0.0.1:<browserPort>` work).
- **Teardown Rollback Command (`sudoDeleteArgs`)**:
  ```bash
  /usr/bin/sudo -n /usr/sbin/iptables -w 5 -D DOCKER-USER \
    -i br-<id12> ! -o br-<id12> \
    -m conntrack ! --ctstate RELATED,ESTABLISHED \
    -m comment --comment bewt-t03b2-<runId> \
    -j REJECT --reject-with icmp-net-unreachable
  ```
  Verified by `assertHostBridgeFirewallRuleRemoved` against `/usr/bin/sudo -n /usr/sbin/iptables -w 5 -S DOCKER-USER`.

### 5.3. Independent Authorization Verifier & Fail-Closed Approval Gate (`verifyHostFirewallDecision`)
Per Team Lead Section 3 (*"Phê duyệt kiến trúc trong prompt này không được sử dụng thay cho cơ chế xác thực độc lập mà code đang yêu cầu... Nếu chưa đáp ứng được cơ chế đó, dừng tại approval gate và trình bày chính xác phần còn thiếu; không tự bypass"*):
- `claroline-g0.mjs` implements `verifyHostFirewallDecision(authReq, decisionRecord, options)` and `requestHostFirewallApproval(spec)`:
  1. Verifies an **Ed25519 cryptographic signature** (`crypto.verify(null, Buffer.from(canonicalPayload, 'utf8'), publicKey, signature)`) over the canonical JSON payload binding:
     - `approvedBy.handle` and `approvedBy.role === "Team Lead"`
     - `decisionId === "A1"` and `isolationMethod === "linux-docker-user-bridge-reject-v1"`
     - Exact `runId`, `networkId`, `bridgeInterface` (`br-<id12>`), `uplinkInterface` (`ens3`)
     - Exact `insertCommand`, `deleteCommand`, `checkCommand`, `scope`, and `rollback`
     - `issuedAt`, `expiresAt` ($\le 15\text{ minutes}$ TTL), and one-time `nonce`
  2. Checks and persists the consumed `nonce` + `runId` in an append-only replay ledger to prevent reuse across runs.
- Because no out-of-band Team Lead Ed25519 public key (`BEWT_TEAM_LEAD_ED25519_PUBLIC_KEY_PEM_FILE`) and per-run signed decision token (`BEWT_HOST_FIREWALL_DECISION_FILE`) have been provisioned out-of-band yet, Cloud Diagnostic `t03b2-d-20261110-r6` wrote `host-firewall-authorization-request.json` and stopped fail-closed at `BLOCKED_APPROVAL_REQUIRED` **before** executing `sudo /usr/sbin/iptables` or `docker start`, then ran automatic `finally` cleanup (`cleanup-result.json`: `PASS`, `0` residuals).

---

## 6. Reconciled Claroline Pinned Image Patch Analysis & Decision 2 (`P1`) Implementation

### 6.1. Reconciled File Byte Counts, SHA-256 Digests, and Exact 10-Line Diff in Layer 13
Direct inspection of `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` (`offline-verification-20261109-r14/image-source-layer-comparison.json` and container filesystem inspection) reconciled two contradictions in the earlier report/PR text:
1. **Byte Count & SHA-256 Reconciliation**:
   - **Layer 8 (`sha256:d33f1c16adf9e589e8a0501b33b99d1cd8f73e1c4ec6e753d05a3c076e7d302f`, pristine official `claroline-1.11.10.tar.gz`)**: `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` is **23,010 bytes**, SHA-256 `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1`.
   - **Layer 13 (`sha256:a48416c0ca244a9138ac9e537426ed037f4373a85160ffc43514a7a6b4e7501a`, final runtime filesystem)**: `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` is **23,040 bytes** (`+30` bytes from prepending `// ` to 10 lines), SHA-256 `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8`.
   - *(Note: Earlier PR #12 summary text had misquoted two unrelated hashes `722cc95...` and `c743513...`, and §6.1 prose had stated "both 23,040 bytes"; the true values are `23,010` bytes `fee57c4d...` in Layer 8 and `23,040` bytes `c3428b9e...` in Layer 13.)*
2. **Exact Code Diff Reconciliation (Lines 382–389 in `create_course_tables()` and Lines 557–562 in `fill_Db_course()`)**:
   - Earlier §6.1 draft showed a reconstructed snippet at lines 186–201 (`define_course_keys()`). Direct line-by-line comparison between Layer 8 and Layer 13 proves that `define_course_keys()` is untouched; the **actual** 10 commented lines are at lines **382–389** (`create_course_tables($courseDbName)`) and lines **557–562** (`fill_Db_course(...)`):

```diff
--- layer8/var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php
+++ layer13/var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php
@@ -382,8 +382,8 @@
-        CREATE TABLE IF NOT EXISTS `" . $tbl_mdb_names['course_description'] . "` (
+        // CREATE TABLE IF NOT EXISTS `" . $tbl_mdb_names['course_description'] . "` (
             `id` int(11) NOT NULL default '0',
             `title` varchar(255) default NULL,
             `content` text,
             `upDate` datetime NOT NULL default '0000-00-00 00:00:00',
             `visibility` ENUM('SHOW','HIDE') NOT NULL default 'SHOW',
-          PRIMARY KEY  (`id`)
-        ) ENGINE=MyISAM COMMENT='eachelt is a part of the course description';");
+          // PRIMARY KEY  (`id`)
+        // ) ENGINE=MyISAM COMMENT='eachelt is a part of the course description';");
@@ -387,3 +387,3 @@
-        CREATE TABLE IF NOT EXISTS `" . $tbl_mdb_names['course_properties'] . "` (
+        // CREATE TABLE IF NOT EXISTS `" . $tbl_mdb_names['course_properties'] . "` (
@@ -557,6 +557,6 @@
-    if(claro_sql_query("INSERT INTO `" . $tbl_mdb_names['course_description'] . "`
-                SET `id` = 1, `title` = '" . claro_sql_escape(get_lang('Description')) . "', `content` = NULL, `upDate` = NOW(), `visibility` = 'HIDE'") == false) return false;
-    if(claro_sql_query("INSERT INTO `" . $tbl_mdb_names['course_description'] . "`
-                SET `id` = 2, `title` = '" . claro_sql_escape(get_lang('Objectives')) . "', `content` = NULL, `upDate` = NOW(), `visibility` = 'HIDE'") == false) return false;
-    if(claro_sql_query("INSERT INTO `" . $tbl_mdb_names['course_description'] . "`
-                SET `id` = 3, `title` = '" . claro_sql_escape(get_lang('Human and technical resources')) . "', `content` = NULL, `upDate` = NOW(), `visibility` = 'HIDE'") == false) return false;
+    // if(claro_sql_query("INSERT INTO `" . $tbl_mdb_names['course_description'] . "`
+                // SET `id` = 1, `title` = '" . claro_sql_escape(get_lang('Description')) . "', `content` = NULL, `upDate` = NOW(), `visibility` = 'HIDE'") == false) return false;
+    // if(claro_sql_query("INSERT INTO `" . $tbl_mdb_names['course_description'] . "`
+                // SET `id` = 2, `title` = '" . claro_sql_escape(get_lang('Objectives')) . "', `content` = NULL, `upDate` = NOW(), `visibility` = 'HIDE'") == false) return false;
+    // if(claro_sql_query("INSERT INTO `" . $tbl_mdb_names['course_description'] . "`
+                // SET `id` = 3, `title` = '" . claro_sql_escape(get_lang('Human and technical resources')) . "', `content` = NULL, `upDate` = NOW(), `visibility` = 'HIDE'") == false) return false;
```

### 6.2. Implementation of Team Lead Decision 2 (`P1 — Accept Pinned BEWT Benchmark Image`)
Following Team Lead Decision 2 (`P1`):
1. Promoted `config/apps/claroline.json` with `source.commit = "22d852f93081bc36b1d08b93f5e0c14b49a573f6"`, `source.packageVersion = "1.11.10-bewt-derivative"`, `runtime.version = "1.11.10-bewt-derivative-php-5.5.9-apache-2.4.7-mysql-5.5.61"`, and `runtime.imageDigest = "sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af"`.
2. Exported `IMAGE_PROVENANCE_CLASSIFICATION = 'BEWT_BENCHMARK_DERIVATIVE_PINNED'` and `PINNED_IMAGE_PATCH_RECORD` in `experiments/claroline/tools/claroline-g0.mjs`, embedding full provenance into every run's `run-record.json`.
3. Updated `docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs` (`['bludit', 'claroline', 'expresscart', 'kanboard']`, **3/3 PASS**).

---

## 7. Cloud Runtime Execution & G0 Status Table (Items #7 & #8)

> **Reconciliation Note on `t03b2-d-20261110-r5`**: Earlier PR #12 summary text erroneously claimed that `t03b2-d-20261110-r5` ran on `--internal` and verified HTTP 200 and MySQL 39 tables. In fact, `docs/tasks/T03-B2/evidence/t03b2-d-20261110-r5/diagnostic-result.json` proves that `t03b2-d-20261110-r5` stopped fail-closed at `BLOCKED_APPROVAL_REQUIRED` **before** `docker start` (`businessTest: "NOT_RUN"`, `selenium: "NOT_RUN"`, `dbReset: "NOT_RUN"`). Neither `d-r5` nor `d-r6` started the Claroline container; HTTP and MySQL readiness on the Cloud VM remain **`NOT_RUN`**.

| Component / Gate | Status | Exit Code | Verified Evidence & Details |
| --- | --- | --- | --- |
| **Cloud VM Preflight (`r73`, `r75`, `r77`)** | **`PASS`** | `0` | `bewt-covext-runner` (`3042402845209891905`) `RUNNING`, `60.614 GiB` free RAM, `184.402 GiB` free disk, auto-stop `2026-11-10T02:18:54.625Z` (`offline-verification-20261110-r77/cloud-preflight.json`). |
| **Node Syntax Checks (`r76` Win, `r77` Linux)** | **`PASS`** | `0` (9/9) | All 9 `.mjs` modules pass `node --check` on commit `3fe306ad0a4a7f1e3bd235c018041cbeee8072cb`. |
| **Offline Unit/Fault Tests (`r76` Win, `r77` Linux)** | **`PASS`** | `0` (46/46) | `46/46` tests pass on both Windows (`r76`) and Ubuntu 24.04 Cloud VM (`r77`). |
| **Runtime Manifest Contract (`config/apps/claroline.json`)** | **`PASS`** | `0` (3/3) | Promoted under Decision `P1`; `verify-config-apps.test.mjs` passes `3/3`. |
| **Maven Test Compilation (Cloud VM)** | **`PASS`** | `0` | `mvn -B clean test-compile` compiled 22 main + 42 test classes in `11.352 s`. |
| **SonarCloud Quality Gate (`PR #12`)** | **`PASS`** | `0` | Status `OK`, `Security Rating = A (1)`, `Reliability = A (1)`, `Maintainability = A (1)`, `0` vulnerabilities, `0.0%` duplication. |
| **Cloud Diagnostic `t03b2-d-20261110-r4` (legacy route policy)** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.522 GiB`); blocked at `BLOCKED_APPROVAL_REQUIRED` before `docker start`; `cleanup-recovery-r1.json` **`PASS`** (0 residuals). |
| **Cloud Diagnostic `t03b2-d-20261110-r5` (legacy route policy)** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.541 GiB`); blocked at `BLOCKED_APPROVAL_REQUIRED` before `docker start`; automatic `cleanup-result.json` **`PASS`** (0 residuals). |
| **Cloud G0 Run A `t03b2-a-20261110-r6` (legacy route policy)** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.541 GiB`); blocked at `BLOCKED_APPROVAL_REQUIRED` before `docker start`; automatic `cleanup-result.json` **`PASS`** (0 residuals). |
| **Cloud Diagnostic `t03b2-d-20261110-r6` (`A1` host-firewall policy)** | **`BLOCKED`** | `1` | Memory gate `PASS` (`60.614 GiB`); verified bridge `br-19ec2e85b685`, uplink `ens3`, `iptables v1.8.10 (nf_tables)`, GCE `IPV4_ONLY`; wrote `host-firewall-authorization-request.json`; blocked at `BLOCKED_APPROVAL_REQUIRED` (no Ed25519 key/token) before `sudo iptables` / `docker start`. Automatic `cleanup-result.json` **`PASS`** (`0` containers/networks/volumes/firewallRules). |
| **Cloud G0 Run A & Run B (under `A1`)** | **`NOT_RUN`** | — | Gated behind diagnostic `PASS` and independent Ed25519 host-firewall authorization token. |
| **HTTP / MySQL Readiness** | **`NOT_RUN`** | — | Containers were not started prior to approval gate. |
| **Selenium Base / `Claroline_AddUserTest` (JUnit XML)** | **`NOT_RUN`** | — | No `TEST-test.Claroline_AddUserTest.xml` generated because runtime stopped before `docker start`. |
| **Database Reset Verification** | **`NOT_RUN`** | — | Containers were not started prior to approval gate. |
| **Overall Task T03-B2 G0 Status** | **`PARTIAL` / `BLOCKED`** | — | **Recommendation: `REQUEST_CHANGES` (Do NOT merge PR #12 yet).** |
