# T02 — Benchmark Audit (8 Applications Baseline Inventory & Environment Readiness)

- **Task scope / acceptance gate:** Static benchmark audit of 8 applications, baseline inventory verification, Gherkin/Java test count mismatch classification, upstream provenance analysis, environment readiness review, and G0 rollout planning.
- **Base branch + base SHA:** `origin/main` at `7e27950b44473cf4d6a5d7d5222bc8dac9b3a266` (following merge of PR #3 / T01-B).
- **Working branch:** `feature/t02-benchmark-audit`.
- **Head commit (full 40-char SHA):** `a04ed8276b8d41ae76abb4477ae72a1f82cc6a13`
- **PR:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/5
- **Push status:** PUSHED (tracking `origin/feature/t02-benchmark-audit`).
- **Runtime/commit/version audited:** Static audit against `bewt-original/` pinned at `0501249ff3e9a5ea83a06155cd2971dc36197056` (`https://github.com/OlianasD/BEWT.git`).
- **Status proposed by Agent:** `READY_FOR_REVIEW`.

---

## 1. What changed (Including Review Fixes)

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/tasks/T02/BASELINE-INVENTORY.md` | Updated | Separated three independent metrics: (1) 258 published literature cases, (2) 257 physical `.feature` files & 257 business test classes, and (3) 234 standard parseable scenarios (Bludit 23 files lack `Scenario:`). Confirmed RQ2 denominator is NOT 257 files, but must be derived from Task T04 behavioral inventory. Fixed base SHA. |
| `docs/tasks/T02/UPSTREAM-AND-VERSION-MATRIX.md` | Updated | Verified canonical upstream commit SHAs dereferenced from Git tags via `git ls-remote`. Marked Claroline as `NOT_VERIFIED` (legacy tarball). Added explicit distinction between source release tags and image provenance. Fixed base SHA. |
| `docs/tasks/T02/ENVIRONMENT-REQUIREMENTS.md` | Updated | Clarified that `-Dapp.url` has zero effect on `bewt-original/` because `BaseTest.java` hardcoded `192.168.1.141` without reading system properties; documented Task T03 working copy requirement. Fixed base SHA. |
| `docs/tasks/T02/APP-ADAPTER-GAP-ANALYSIS.md` | Updated | Updated draft manifest references to `docs/tasks/T02/manifests/*.draft.json`. Reusability analysis confirmed. |
| `docs/tasks/T02/G0-ROLLOUT-PLAN.md` | Updated | Added strict operational safety rules for T03: unique namespacing (`bewt-covext-<app>-<runId>`), mandatory ownership labels, host port availability checks, parameterized credentials, mount inspection, zero global prunes, guarded container exec commands, and image pull requirements. Fixed base SHA. |
| `docs/tasks/T02/PROPOSED-STATUS-UPDATE.json` | Updated | Standalone status update reflecting verified upstream commit pins, metric separation, and draft manifest paths. Fixed base SHA. |
| `docs/tasks/T02/manifests/*.draft.json` (7 files) | Moved & Updated | Draft manifests relocated from `config/apps/` to dedicated `docs/tasks/T02/manifests/` folder. Added `manifestType: "DRAFT_STATIC_AUDIT_NOT_PRODUCTION"` and verified upstream source pins. |
| `config/apps/` | Cleaned | Removed the 7 draft manifests from `config/apps/` so that `config/apps/` contains ONLY `expresscart.json` (the production runtime manifest). |
| `docs/tasks/T02/evidence/review-fixes/*` | Created | Automated verification script (`verify-review-fixes.mjs`), test TAP log (`review-fixes-tests.tap`), and JSON summary verifying base SHA, upstream pins, runtime schema blocking, and config isolation. |
| `docs/tasks/T02/TASK-REPORT.md` | Updated | Recorded review fixes, verification test results, and final handoff metadata. |

---

## 2. Actual verification

All review fixes and baseline findings were verified with automated scripts and native TypeScript execution against `framework/src/contracts.ts`:

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `git cat-file -t 7e27950b44473cf4d6a5d7d5222bc8dac9b3a266` | 0 | PASS | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (Base SHA confirmed) |
| `git ls-remote` upstream tag/commit dereference across 7 repos | 0 | PASS (6 verified, 1 NOT_VERIFIED) | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (Matched 6 canonical commits, Claroline confirmed no tag) |
| `parseApplicationManifest('config/apps/expresscart.json')` | 0 | PASS | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (ExpressCart runtime manifest valid) |
| JSON syntax validation on 7 draft manifests | 0 | JSON_SYNTAX_PASS | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (All 7 valid JSON) |
| Draft structure check on 7 draft manifests | 0 | DRAFT_STRUCTURE_PASS | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (All required draft fields present) |
| `parseApplicationManifest` on 7 draft manifests | 0 (caught) | RUNTIME_SCHEMA_BLOCKED | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (Correctly blocked from runtime execution) |
| Directory check on `config/apps/` | 0 | PASS | `docs/tasks/T02/evidence/review-fixes/review-fixes-validation.log` (Only `expresscart.json` present) |
| Review fixes automated test suite (31 tests) | 0 | PASS (31/31 passing or expected block) | `docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap` |
| Secret scan on git diff | 0 | PASS | Zero secrets, credentials, or `.env` files present |

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

*(Note: Commit dereference distinguishes annotated tag objects from the peeled commit `^{commit}`. A verified release commit does NOT automatically prove a Docker Hub image was built from that commit).*

---

## 4. Research Metrics Disambiguation

To preserve rigorous academic fidelity:
1. **Literature Metric:** **258 business cases** from Table 2 of Olianas et al. (2026) remains preserved as the benchmark's historical claim.
2. **Physical Repository Inventory:** **257 Gherkin `.feature` files** and **257 business test classes** in Base suites (258 if counting Bludit's `Installer.class`). Mismatches explained: MantisBT has `0_Login.feature` unexecuted in TestSuite (+1), and PrestaShop lacks `.feature` files for 2 Java tests (`AddEmptyTag`, `AddLanguageIsoCodeValidity`) (-2).
3. **Parseable Scenarios:** **234 standard scenarios** conform to strict Gherkin grammar; Bludit's 23 feature files lack the `Scenario:` keyword and require normalization.
4. **RQ2 Behavioral Coverage Gain:** The denominator for RQ2 will NOT be assumed as 257 or 258; it will be established in Task T04 from an explicit pre-expansion behavioral inventory.

---

## 5. Safety & Integrity Invariants

- **`bewt-original/` touched?** **NO.** Strictly read-only research baseline (`git status --porcelain` verified).
- **Docker / DB resources touched?** **NONE.** Zero Docker containers, images, volumes, or networks created or touched in this review fix.
- **Parallel isolation with T01-C:** 100% maintained. Zero edits to `framework/`, `adapters/expresscart/`, `docs/program/STATUS.json`, or `IMPLEMENTATION-ROADMAP.md`.
- **Manifest directory hygiene:** `config/apps/` contains ONLY `expresscart.json`. All 7 draft manifests reside exclusively in `docs/tasks/T02/manifests/*.draft.json`.

---

## 6. Review Request for Team Lead

- **Decisions requested from Team Lead:**
  1. Approve the verified upstream commit pins (6 verified on GitHub, Claroline marked `NOT_VERIFIED`).
  2. Approve the manifest separation strategy: draft manifests kept in `docs/tasks/T02/manifests/` until promoted upon runtime verification in T03.
  3. Approve the research metric disambiguation (258 literature cases vs 257 repository files vs 234 standard scenarios; RQ2 denominator deferred to T04).
  4. Approve the strict safety runbook for Task T03 (namespacing, ownership labels, port checks, working copy for URL parameterization).
- **Suggested next task:** Task T03 (G0 Runtime Rollout starting with Kanboard, Bludit, Claroline).
- **PR URL:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/5
