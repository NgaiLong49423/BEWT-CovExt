# T02 — Benchmark Audit (8 Applications Baseline Inventory & Environment Readiness)

- **Task scope / acceptance gate:** Static benchmark audit of 8 applications, baseline inventory verification, Gherkin/Java test count mismatch classification, upstream provenance analysis, environment readiness review, and G0 rollout planning.
- **Base branch + base SHA:** `origin/main` at `7e27950fefab0eefc37cf326e3c54c3e8006bfb6` (following merge of PR #3 / T01-B).
- **Working branch:** `feature/t02-benchmark-audit`.
- **Head commit (full 40-char SHA):** `4ab8198c3051c1324f5e0df01f21b09866b60982`
- **PR:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/5
- **Push status:** PUSHED (tracking `origin/feature/t02-benchmark-audit`)
- **Runtime/commit/version audited:** Static audit against `bewt-original/` pinned at `0501249ff3e9a5ea83a06155cd2971dc36197056` (`https://github.com/OlianasD/BEWT.git`).
- **Status proposed by Agent:** `READY_FOR_REVIEW`.

---

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/tasks/T02/BASELINE-INVENTORY.md` | Created | Comprehensive inventory of all 8 applications, comparing proposal Table 2 (258 cases) against physical repository (257 feature files, 257 business test classes), documenting 6 specific mismatch classifications (M1–M6). |
| `docs/tasks/T02/UPSTREAM-AND-VERSION-MATRIX.md` | Created | Detailed mapping of upstream repositories, canonical release tags/commits, Docker image provenance, and archival risk analysis for all 8 applications. |
| `docs/tasks/T02/ENVIRONMENT-REQUIREMENTS.md` | Created | Audit of runtime tech stacks, severe host port collisions (8080 on 4 apps, 3000 on 3 apps), hardcoded LAN IPs (`192.168.1.141`), hardcoded local ChromeDriver paths, and reset strategies. |
| `docs/tasks/T02/APP-ADAPTER-GAP-ANALYSIS.md` | Created | Method-by-method reusability assessment of `ApplicationAdapter` contract against ExpressCart reference implementation, identifying shared logic vs app-specific needs. |
| `docs/tasks/T02/G0-ROLLOUT-PLAN.md` | Created | Phased rollout plan ranking the 7 remaining applications by setup complexity (Kanboard -> Bludit -> Claroline -> MantisBT -> Joomla -> MediaWiki -> PrestaShop) with strict sequential isolation safeguards. |
| `docs/tasks/T02/PROPOSED-STATUS-UPDATE.json` | Created | Standalone status update artifact proposing updated baseline counts and G0 preparation state without creating merge conflicts with T01-C. |
| `config/apps/bludit.json` | Created | Draft application manifest for Bludit (2.3.4, flat-file, single container). |
| `config/apps/claroline.json` | Created | Draft application manifest for Claroline (1.11.10, bundled MySQL, single container). |
| `config/apps/joomla.json` | Created | Draft application manifest for Joomla (3.10.11, Compose with MySQL 5.6). |
| `config/apps/kanboard.json` | Created | Draft application manifest for Kanboard (1.2.15, embedded SQLite, single container). |
| `config/apps/mantisbt.json` | Created | Draft application manifest for MantisBT (1.2.0, bundled MySQL, single container). |
| `config/apps/mediawiki.json` | Created | Draft application manifest for MediaWiki (1.40.0, Compose with MariaDB, 2 volumes). |
| `config/apps/prestashop.json` | Created | Draft application manifest for PrestaShop (1.6.1.23, custom network, 2 containers). |
| `docs/tasks/T02/TASK-REPORT.md` | Created | Task handoff report documenting audit findings, verification commands, and review requests. |

*(Note: `config/apps/expresscart.json`, `docs/program/STATUS.json`, and `docs/program/IMPLEMENTATION-ROADMAP.md` were strictly preserved without modification to prevent collisions with parallel task T01-C).*

---

## 2. Actual verification

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `git worktree add -b feature/t02-benchmark-audit ... origin/main` | 0 | PASS | Worktree initialized at `7e27950` (`origin/main`) |
| Baseline feature & scenario parser across 8 apps | 0 | PASS | `docs/tasks/T02/BASELINE-INVENTORY.md` (257 feature files, 234 explicit + 23 implicit scenarios) |
| Baseline Java test suite parser (`TestSuite.java` & `*Test.java`) | 0 | PASS | `docs/tasks/T02/BASELINE-INVENTORY.md` (257 business test classes, 1 Installer class) |
| Baseline POM dependency & compiler audit across 12 suites | 0 | PASS | `docs/tasks/T02/BASELINE-INVENTORY.md` (Java 21, JUnit 4.12, Selenium 4.34.0/4.35.0, WebDriverManager 5.8.0) |
| BaseTest configuration & hardcoded URL audit | 0 | PASS | `docs/tasks/T02/ENVIRONMENT-REQUIREMENTS.md` (Identified `192.168.1.141` in Bludit, MantisBT, PrestaShop) |
| Docker & Flakiness script audit across all baseline directories | 0 | PASS | `docs/tasks/T02/ENVIRONMENT-REQUIREMENTS.md` (Identified port 8080/3000 collisions & teardown procedures) |
| Schema validation of 7 draft application manifests | 0 | PASS | `config/apps/*.json` (Validated against `ApplicationManifest` interface in `framework/src/contracts.ts`) |
| Secret scan & git diff review | 0 | PASS | Zero secrets, credentials, or `.env` files staged; only allowed docs & manifests |

---

## 3. Research impact

- **Apps affected & Source pins:**
  - All 8 applications audited: Bludit (2.3.4), Claroline (1.11.10), ExpressCart (1.19 / 1.1.19), Joomla (3.10.11), Kanboard (1.2.15), MantisBT (1.2.0), MediaWiki (1.40.0), PrestaShop (1.6.1.23).
  - Pinned baseline commit: `0501249ff3e9a5ea83a06155cd2971dc36197056` (`https://github.com/OlianasD/BEWT.git`).
- **Baseline Count Resolution (Paper vs Repo):**
  - Table 2 in paper claims **258** cases.
  - Physical repository contains **257** Gherkin `.feature` files and **257** business test classes in Base `TestSuite.java` (258 if including Bludit's initial `Installer.class`).
  - Mismatch explained: MantisBT has +1 unexecuted feature (`0_Login.feature`), PrestaShop has -2 missing features (`AddEmptyTag`, `AddLanguageIsoCodeValidity` exist only in Java).
  - All 23 Bludit feature files lack the `Scenario:` keyword (implicit syntax).
- **Gate status:**
  - Before: G0 `NOT_VERIFIED` across all 7 applications; ExpressCart feasibility verified in Sprint 01.
  - Proposed after: G0 remains `NOT_VERIFIED` (honest reporting: static audit only, runtime not executed). D2 updated to `PROPOSED_BASELINE_AUDIT_COMPLETED`.
- **Deliverables impact:**
  - Lays complete factual foundation for Task T03 (G0 rollout) and Task T04 (Coverage Gap Analysis).

---

## 4. Safety & integrity

- **`bewt-original/` touched?** **NO.** Completely untouched and read-only. Status verified via `git status` inside `bewt-original/`.
- **Docker / project resources touched?** **NONE.** Zero Docker containers, images, volumes, or networks were created, started, stopped, or deleted. Zero database writes.
- **Parallel isolation with T01-C:** Completely respected. T02 operated solely in dedicated worktree `D:\Github-Projects\BEWT-CovExt-worktrees\t02-benchmark-audit`. Zero edits to `framework/`, `adapters/expresscart/`, `config/apps/expresscart.json`, `docs/program/STATUS.json`, or `docs/program/IMPLEMENTATION-ROADMAP.md`.
- **Secret scan:** Verified zero API keys, passwords, or personal credentials present in added files.

---

## 5. Evidence and reproduction

- **Deliverables Directory:** `docs/tasks/T02/`
  - `docs/tasks/T02/BASELINE-INVENTORY.md`
  - `docs/tasks/T02/UPSTREAM-AND-VERSION-MATRIX.md`
  - `docs/tasks/T02/ENVIRONMENT-REQUIREMENTS.md`
  - `docs/tasks/T02/APP-ADAPTER-GAP-ANALYSIS.md`
  - `docs/tasks/T02/G0-ROLLOUT-PLAN.md`
  - `docs/tasks/T02/PROPOSED-STATUS-UPDATE.json`
- **Application Manifests:** `config/apps/*.json`
- **Reproduction:** All file counts, class names, POM properties, and script contents can be re-verified against `bewt-original/` using standard read-only inspection scripts.

---

## 6. Review request

- **Decisions requested from Team Lead:**
  1. Approve the baseline count reconciliation: accept 257 physical `.feature` files (with MantisBT `0_Login` and PrestaShop missing specs documented) as the canonical empirical denominator for RQ2 behavioral coverage gain.
  2. Approve the G0 rollout complexity ranking: begin runtime execution in T03 starting with Kanboard (Rank 1), Bludit (Rank 2), and Claroline (Rank 3).
  3. Approve the URL parameterization strategy (`-Dapp.url=...`) to safely override the hardcoded `192.168.1.141` LAN IP addresses in Bludit, MantisBT, and PrestaShop.
- **Suggested next task:** Task T03 (G0 Runtime Rollout & Smoke Verification for Kanboard, Bludit, and Claroline).
- **PR URL:** https://github.com/NgaiLong49423/BEWT-CovExt/pull/5
