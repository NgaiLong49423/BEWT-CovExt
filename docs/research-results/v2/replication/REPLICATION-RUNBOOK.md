# BEWT-CovExt v2.0 — Empirical Replication Runbook

This document provides complete instructions to verify, replicate, and audit all empirical results, artifacts, and test suites across the 8 target web applications of the BEWT-CovExt v2.0 research program.

---

## 1. Environment & Prerequisites

### 1.1 Hardware & OS
- **Local Machine**: Windows 10/11 x64 or Linux x86_64, minimum 16 GB RAM.
- **Remote Cloud VM**: Google Cloud Compute Engine instance `bewt-covext-runner` (`c4d-highmem-8`, 8 vCPU, 64 GB RAM, Ubuntu 24.04 LTS).

### 1.2 Runtimes & Dependencies
- **Node.js**: v20.x or v22.x+ (verified on v24.19.0).
- **Java**: OpenJDK 21 LTS (`java -version` returning 21.x).
- **Maven**: Apache Maven 3.8.x or 3.9.x (`mvn -version`).
- **Git**: Git 2.40+.
- **Docker**: Docker Engine 24.x+ (Cloud VM only; local execution of test suites uses isolated Maven mocks and headless drivers).

---

## 2. Repository Checkout & Integrity Verification

Clone the repository and verify the latest integrated commit:

```bash
git clone https://github.com/NgaiLong49423/BEWT-CovExt.git
cd BEWT-CovExt
git status
```

Verify the immutable SHA-256 hashes of all 40 registered Java test classes:
```bash
node -e "
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const apps = ['bludit', 'claroline', 'expresscart', 'joomla', 'kanboard', 'mantisbt', 'mediawiki', 'prestashop'];
let verified = 0;
for (const app of apps) {
  const selDir = join('extension', app, 'selenium');
  for (const sub of readdirSync(selDir)) {
    const regFile = join(selDir, sub, 'revision-1', 'registration.json');
    if (existsSync(regFile)) {
      const reg = JSON.parse(readFileSync(regFile, 'utf8'));
      const javaCode = readFileSync(reg.artifactPath, 'utf8');
      const hash = createHash('sha256').update(javaCode).digest('hex');
      if (hash === reg.sourceSha256) verified++;
      else console.error('Mismatch on:', reg.candidateId);
    }
  }
}
console.log('Verified hashes:', verified, '/ 40');
"
```

---

## 3. Local Compilation of All 8 Application Suites

Run clean Maven test compilation across all 8 target suites:

```bash
# Bludit
mvn -B clean test-compile -f experiments/bludit/bewt-suite/pom.xml

# Claroline
mvn -B clean test-compile -f experiments/claroline/bewt-suite/pom.xml

# ExpressCart
mvn -B clean test-compile -f experiments/expresscart/bewt-suite/pom.xml

# Joomla
mvn -B clean test-compile -f experiments/joomla/bewt-suite/pom.xml

# Kanboard
mvn -B clean test-compile -f experiments/kanboard/bewt-suite/pom.xml

# MantisBT
mvn -B clean test-compile -f experiments/mantisbt/bewt-suite/pom.xml

# MediaWiki
mvn -B clean test-compile -f experiments/mediawiki/bewt-suite/pom.xml

# PrestaShop
mvn -B clean test-compile -f experiments/prestashop/bewt-suite/pom.xml
```

Expected result: `BUILD SUCCESS` across all 8 suites.

---

## 4. Remote Cloud VM Verification

To verify the test suites in the Linux cloud environment (`bewt-covext-runner`):

1. **Preflight Probe**:
   ```bash
   node experiments/claroline/tools/cloud-controller.mjs preflight
   ```
   Verifies: VM is running, instance ID, zone, and RAM (> 60 GiB available).

2. **Sync Remote Repository**:
   ```bash
   node experiments/claroline/tools/cloud-controller.mjs exec git-sync
   ```
   Synchronizes `/home/runner/BEWT-CovExt` on the VM with the latest `origin/main` commit.

3. **Remote Maven Compile Across 8 Apps**:
   ```bash
   node experiments/claroline/tools/cloud-controller.mjs exec maven-compile-all
   ```
   Executes clean `mvn -B -q clean test-compile` sequentially for all 8 applications.
   Execution duration: ~12 seconds.
   Result: `PASS` across all 8 apps.

---

## 5. Quantitative Metrics Recomputation (RQ1–RQ4)

Run the autonomous metrics recomputation script:

```bash
node docs/research-results/v2/replication/recompute-metrics.mjs
```

This reads directly from:
- `data/coverage/behavioral-taxonomy-baseline.json` (baseline denominator $D_{base} = 180$)
- `data/coverage/<app>/source-backed-gap-proposals.json` (candidate proposals)
- `data/reviews/<app>/human-review-decisions.jsonl` (human approval records)
- `extension/<app>/selenium/*/registration.json` (registered test classes)

Outputs:
- **RQ1**: 100.0% Syntax Validity & Semantic Novelty ($40/40$).
- **RQ2**: $+22.22\%$ Behavioral Coverage Expansion ($+40 / 180$).
- **RQ3**: 100.0% Maven Clean Compile Success ($8/8$ suites local & remote).
- **RQ4**: Operational Cost < \$0.05 total LLM cost for 40 test suites.
