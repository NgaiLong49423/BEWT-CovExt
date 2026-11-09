# BEWT-CovExt Cloud Runner Runbook (T03-B2 Claroline G0)

This runbook documents the exact commands to operate the Google Cloud Compute Engine Ubuntu 24.04 runner (`bewt-covext-runner`), execute allowlisted Claroline G0 diagnostics/runs, recover Docker resources if a run aborts, synchronize evidence to the local workstation, and run deterministic evidence validation.

---

## 1. Cloud VM Configuration Constants

Configured in `experiments/claroline/tools/cloud-controller.mjs` (`CLOUD_VM_CONFIG`):

- **Project ID**: `gen-lang-client-0311012609`
- **Instance Name**: `bewt-covext-runner`
- **Expected Instance ID**: `3042402845209891905`
- **Zone**: `asia-southeast1-a`
- **Machine Type**: `c4d-highmem-8` (8 vCPU, 63 GiB RAM, 200 GB Hyperdisk Balanced)
- **Remote Repository Path**: `/home/runner/BEWT-CovExt`
- **Auto-Stop Policy**: `maxRunDuration=21600s` (6 hours), `instanceTerminationAction=STOP`

> **Governance Rule**: Never recreate the VM, never create a duplicate VM, and never extend or reset `maxRunDuration` without explicit user approval. If `status !== 'RUNNING'`, `cloud-controller.mjs` stops fail-closed.

---

## 2. Step-by-Step Operations

### 2.1. Run Cloud Preflight
Verifies `gcloud` authentication, project ID, VM `RUNNING` state, instance ID, `maxRunDuration=21600s`, `instanceTerminationAction=STOP`, remaining runtime before `terminationTimestamp`, remote RAM (`>= 6 GiB`), free disk space, Docker Engine health, active containers, and remote Git branch/HEAD:

```powershell
node experiments/claroline/tools/cloud-controller.mjs preflight docs/tasks/T03-B2/evidence/<evidence-folder>/cloud-preflight.json
```

### 2.2. Run Syntax & Unit Test Suite on Cloud VM (`unit-tests`)
Runs all `node --check` syntax checks and the 41-test unit/fault suite (`cleanup-claroline-g0.test.mjs`) on the Ubuntu 24.04 Cloud VM:

```powershell
node experiments/claroline/tools/cloud-controller.mjs exec unit-tests
```

### 2.3. Compile Claroline Maven Test Suite on Cloud VM (`maven-compile`)
Verifies Java 21 + Maven 3.8.7 compilation (`mvn -B clean test-compile`) inside `/home/runner/BEWT-CovExt/experiments/claroline/bewt-suite`:

```powershell
node experiments/claroline/tools/cloud-controller.mjs exec maven-compile
```

### 2.4. Execute Claroline App-Only Diagnostic on Cloud VM (`run-diagnostic`)
Runs `run-claroline-diagnostic.mjs` on the Cloud VM with a unique `t03b2-d-YYYYMMDD-rN` run ID:

```powershell
node experiments/claroline/tools/cloud-controller.mjs exec run-diagnostic t03b2-d-20261110-r5
```

### 2.5. Execute Claroline G0 Runner on Cloud VM (`run-g0`)
Runs `run-claroline-g0.mjs` on the Cloud VM with a unique `t03b2-a-YYYYMMDD-rN` or `t03b2-b-YYYYMMDD-rN` run ID:

```powershell
node experiments/claroline/tools/cloud-controller.mjs exec run-g0 t03b2-a-20261110-r6
```

### 2.6. Run Deterministic Cleanup Recovery (`cleanup-run`)
If any run stops before cleanup completes, invoke exact-ID/label-verified cleanup recovery on the Cloud VM:

```powershell
node experiments/claroline/tools/cloud-controller.mjs exec cleanup-run <runId>
```

### 2.7. Inspect Remote Processes or Docker Cleanliness (`process-check`, `inspect-docker-clean`)
```powershell
node experiments/claroline/tools/cloud-controller.mjs exec process-check <runId>
node experiments/claroline/tools/cloud-controller.mjs exec inspect-docker-clean
```

---

## 3. Evidence Sync & Integrity Verification

### 3.1. Sync Evidence Directory from Cloud VM to Local Worktree (`sync-evidence`)
Copies `/home/runner/BEWT-CovExt/docs/tasks/T03-B2/evidence/<runId>` to `docs/tasks/T03-B2/evidence/<runId>` via `scp`, moves raw private Docker inventories (`docker-before-private.json`, `docker-after-private.json`) into gitignored `.local-state/cloud-private-evidence/<runId>/`, writes `sha256-manifest.json`, and verifies every file's SHA-256 hash:

```powershell
node experiments/claroline/tools/cloud-controller.mjs sync-evidence <runId>
```

### 3.2. Write / Refresh `sha256-manifest.json` (`write-manifest`)
Computes and writes `sha256-manifest.json` for a local evidence directory:

```powershell
node experiments/claroline/tools/cloud-controller.mjs write-manifest docs/tasks/T03-B2/evidence/<runId>
```

### 3.3. Run Deterministic Evidence Validator (`validate-evidence.mjs`)
Validates run ID format, source commit hash, pinned image digests, chronological timestamps, exit code vs outcome consistency, Surefire XML test reports (when business tests run), DB assertions, Docker isolation records, zero-residual cleanup, `sha256-manifest.json`, and secret/path scrubbing:

```powershell
node experiments/claroline/tools/validate-evidence.mjs docs/tasks/T03-B2/evidence/<runId>
```
