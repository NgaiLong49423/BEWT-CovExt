# T02 — Benchmark Audit (8 Applications Baseline Inventory & Environment Readiness)

- **Task scope / acceptance gate:** Static benchmark audit of 8 applications, baseline inventory verification, Gherkin/Java test count mismatch classification, upstream provenance analysis, environment readiness review, and G0 rollout planning.
- **Base branch + base SHA:** `origin/main` at `7e27950b44473cf4d6a5d7d5222bc8dac9b3a266` (following merge of PR #3 / T01-B).
- **Working branch:** `feature/t02-benchmark-audit`.
- **Reviewed starting HEAD (full SHA):** `d967e75db74d537881b9f543fe38617e1c1025bd`.
- **PR:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/5
- **Push status:** PUSHED (tracking `origin/feature/t02-benchmark-audit`).
- **Runtime/commit/version audited:** Static audit against `bewt-original/` pinned at `0501249ff3e9a5ea83a06155cd2971dc36197056` (`https://github.com/OlianasD/BEWT.git`).
- **Status proposed by Agent:** `READY_FOR_REVIEW`.

---

## 1. What changed (Including Final Review Corrections)

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/tasks/T02/evidence/review-fixes/verify-review-fixes.mjs` | Updated | Hardened test runner: Enforces non-zero exit code on failure, suppresses success message when checks fail, strictly differentiates `PASS`, `FAIL`, `NOT_VERIFIED`, and `BLOCKED`. Guarantees Claroline network/auth errors are flagged as `BLOCKED` and never misinterpreted as proof of tag absence. |
| `docs/tasks/T02/evidence/review-fixes/test-negative-cases.mjs` | Corrected | Negative tests start from a parser-valid Docker manifest; independently assert missing digest, malformed digest, and draft marker errors. Wrong-SHA and injected network-error cases invoke `runVerification()` and assert its `FAIL` / `BLOCKED` outcomes. Process exit propagation remains covered. |
| `docs/tasks/T02/evidence/review-fixes/verify-review-fixes.mjs` | Updated | Added an injectable command executor for deterministic `runVerification()` tests; production default still executes Git using argument arrays. |
| `docs/tasks/T02/G0-ROLLOUT-PLAN.md` | Updated | Preserved the existing naming, labels, PowerShell syntax, credentials, and reset safeguards. Replaced Joomla and MediaWiki direct Compose cleanup with `T03_IMPLEMENTATION_REQUIRED` pseudocode verifying full container labels/run ID, Compose project and file identity, mount/volume ownership, and post-teardown state. Project names and `docker compose ls` are not ownership proof. |
| `docs/tasks/T02/BASELINE-INVENTORY.md` | Updated | Clarified Gherkin metrics: Replaced unverified "standard parseable scenarios" with observable structural metric "234 `.feature` files with explicit `Scenario:` headers" (each containing 1 explicit scenario), noted Bludit's 23 files omit keyword, preserved 258 literature cases and 257 physical files as separate metrics, and reaffirmed RQ2 denominator is deferred to Task T04. |
| `docs/tasks/T02/PROPOSED-STATUS-UPDATE.json` | Updated | Synchronized metric field names to `filesWithExplicitScenarioHeaders` across global targets and all 8 application records. |
| `docs/tasks/T02/evidence/review-fixes/*` | Updated & Generated | Execution evidence files: `review-fixes-tests.tap` (31 tests), `review-fixes-validation.json`, `negative-tests.tap` (6 tests), `negative-tests-validation.json`. |
| `docs/tasks/T02/TASK-REPORT.md` | Updated | Recorded final review corrections, verified all repo-relative file links, updated evidence tables, and aligned handoff metadata. |

---

## 2. Actual verification

All review fixes and baseline findings were verified with automated test suites and native TypeScript execution against `framework/src/contracts.ts`:

| Test / Command | Exit code | Status | Evidence path |
|---|---:|:---:|---|
| Base Commit SHA Verification (`git cat-file -t 7e27950b...`) | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (line 3) |
| Upstream Git Tag / Commit Dereference (6 apps) | 0 | **PASS** (6/6) | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (lines 4-9) |
| Claroline Absence Verification (`git ls-remote` returns exit 0, empty) | 0 | **NOT_VERIFIED** | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (line 10) |
| ExpressCart Runtime Manifest (`parseApplicationManifest`) | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (line 11) |
| 7 Draft Manifests JSON Syntax Check | 0 | **PASS** (7/7) | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (lines 12, 15, 18, 21, 24, 27, 30) |
| 7 Draft Manifests Metadata Structure Check | 0 | **PASS** (7/7) | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (lines 13, 16, 19, 22, 25, 28, 31) |
| 7 Draft Manifests Runtime Validator Blocking (`ContractError`) | 0 (caught) | **BLOCKED** (7/7 Expected) | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (lines 14, 17, 20, 23, 26, 29, 32) |
| Config Isolation (`config/apps/` contains ONLY `expresscart.json`) | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` (line 33) |
| `node --experimental-strip-types docs/tasks/T02/evidence/review-fixes/verify-review-fixes.mjs` — Positive Verification Suite (31 checks) | **0** | **PASS** | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` |
| Negative Test: Wrong upstream SHA through `runVerification()` returns `FAIL` | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` (line 3) |
| Negative Test: Injected network failure through `runVerification()` returns `BLOCKED` | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` (line 4) |
| Negative Test: Parser-valid Docker manifest with only `imageDigest` removed fails for digest requirement | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` (line 5) |
| Negative Test: Malformed Docker image digest fails for digest requirement | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` (line 6) |
| Negative Test: Parser-valid Docker manifest with only draft marker added fails for unsupported marker | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` (line 7) |
| Negative Test: Runner process exit code 1 on failure | 0 | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` (line 8) |
| `node --experimental-strip-types docs/tasks/T02/evidence/review-fixes/test-negative-cases.mjs` — Negative Verification Suite (6 tests) | **0** | **PASS** | `docs/tasks/T02/evidence/review-fixes/negative-tests.tap` |
| Secret scan on git diff | 0 | **PASS** | Zero secrets, credentials, or `.env` files present |

---

## 3. Upstream Provenance Summary

| Application | Upstream Repository | Release Tag | Canonical Dereferenced Commit SHA | Status |
|---|---|---|---|---|
| **Bludit** | `https://github.com/bludit/bludit` | `2.3.4` | `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` | **VERIFIED** |
| **Claroline** | `https://github.com/claroline/Claroline` | `1.11.10` (Legacy) | `NOT_VERIFIED` | **NOT_VERIFIED** |
| **ExpressCart** | `https://github.com/mrvautin/expressCart` | Commit pin | `b31302f4e99c3293bd742c6d076a721e168118b0` | **VERIFIED** |
| **Joomla** | `https://github.com/joomla/joomla-cms` | `3.10.11` | `01deee0a7b8cf91fc503b2cc13359c6e43aac47f` | **VERIFIED** |
| **Kanboard** | `https://github.com/kanboard/kanboard` | `v1.2.15` | `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b` | **VERIFIED** |
| **MantisBT** | `https://github.com/mantisbt/mantisbt` | `release-1.2.0` | `d06bf60f5ed9f96029bb830a005d4819a4f87b45` | **VERIFIED** |
| **MediaWiki** | `https://github.com/wikimedia/mediawiki` | `1.40.0` | `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` | **VERIFIED** |
| **PrestaShop** | `https://github.com/PrestaShop/PrestaShop` | `1.6.1.23` | `475d65fbda93403cd1afde0db09764c5295e952c` | **VERIFIED** |

*(Note: Commit dereference distinguishes annotated tag objects from the peeled commit `^{commit}`. A verified release commit does NOT automatically prove a Docker Hub image was built from that commit. Claroline tag query returns exit 0 with empty output, confirming tag absence on GitHub).*

---

## 4. Research Metrics Disambiguation

To preserve rigorous academic fidelity:
1. **Literature Metric:** **258 business cases** from Table 2 of Olianas et al. (2026) remains preserved as the benchmark's historical published claim.
2. **Physical Repository Inventory:** **257 Gherkin `.feature` files** and **257 business test classes** in Base suites (258 if counting Bludit's `Installer.class`). Mismatches explained: MantisBT has `0_Login.feature` unexecuted in TestSuite (+1), and PrestaShop lacks `.feature` files for 2 Java tests (`AddEmptyTag`, `AddLanguageIsoCodeValidity`) (-2).
3. **Observable Gherkin Structure:** **234 `.feature` files contain explicit `Scenario:` headers** (each file containing exactly 1 explicit scenario block). Bludit's 23 feature files completely omit the `Scenario:` keyword (containing only `Feature:` followed directly by steps). Off-the-shelf parser validation of these 234 files will be conducted in Task T04.
4. **RQ2 Behavioral Coverage Gain:** The denominator for RQ2 will NOT be assumed as 257 or 258; it will be established in Task T04 from an explicit pre-expansion behavioral inventory.

---

## 5. Safety & Integrity Invariants

- **`bewt-original/` touched?** **NO.** Strictly read-only research baseline (`git status --porcelain` verified).
- **Docker / DB resources touched?** **NONE.** Zero Docker commands executed during T02.
- **Previously accepted baseline findings changed?** **NO.** Existing inventory counts, application pins, metrics caveats, and research conclusions are preserved.
- **Parallel isolation with T01-C:** 100% maintained. Zero edits to `framework/`, `adapters/expresscart/`, `docs/program/STATUS.json`, or `IMPLEMENTATION-ROADMAP.md`.
- **Manifest directory hygiene:** `config/apps/` contains ONLY `expresscart.json`. All 7 draft manifests reside exclusively in `docs/tasks/T02/manifests/*.draft.json`.

---

## 6. Review Request for Team Lead

- **Decisions requested from Team Lead:**
  1. Approve the verified upstream commit pins (6 verified on GitHub, Claroline marked `NOT_VERIFIED`).
  2. Approve the manifest separation strategy: draft manifests kept in `docs/tasks/T02/manifests/` until promoted upon runtime verification in T03.
  3. Approve the research metric disambiguation (258 literature cases vs 257 repository files vs 234 files with explicit scenario headers; RQ2 denominator deferred to T04).
  4. Approve the strict safety runbook for Task T03 (namespacing, ownership labels, PowerShell syntax, clean data reset verification, working copy for URL parameterization).
- **Suggested next task:** Task T03 (G0 Runtime Rollout starting with Kanboard, Bludit, Claroline).
- **PR URL:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/5
