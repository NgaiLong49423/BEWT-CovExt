# T02 — Upstream & Version Provenance Matrix (8 Applications)

> **Program:** BEWT-CovExt  
> **Task:** T02 — Benchmark Audit (Parallel Worktree)  
> **Source Baseline Reference:** `bewt-original/` (commit `0501249ff3e9a5ea83a06155cd2971dc36197056`)  
> **Scope Document:** `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` (v2.0, 20/10/2026)  
> **Audit Date:** 2026-11-08  
> **Verification Status:** STATIC_AUDIT_VERIFIED (static provenance audit, no Docker containers spawned)

---

## 1. Objectives & Provenance Principles

In benchmark engineering, reproducibility requires establishing exact **upstream provenance** and **runtime provenance**:
1. **Upstream Source Pin:** The canonical source code repository, release tag, or commit SHA of the web application.
2. **Benchmark Image Provenance:** The Docker image referenced in BEWT documentation and scripts, identifying whether it is an official vendor image, an archival image from Docker Hub, or a custom pre-seeded container provided by the benchmark authors (`olianasd/*`).
3. **Reproducibility Risk:** Personal repository images hosted under user namespaces (e.g. `olianasd/*`, `dockercontainervm/*`) pose archival fragility. If Docker Hub removes these layers or if the account is deactivated, external researchers cannot reproduce the environment without an independent source-build recipe.

---

## 2. Upstream & Version Matrix

| Application | BEWT Base Label | Upstream Repository | Canonical Upstream Pin (Tag / SHA) | BEWT Referenced Docker Image | Image Provenance / Publisher | Database Bundling | Archival Risk Level |
|---|---|---|---|---|---|---|---|
| **Bludit** | `2.3.4` | `https://github.com/bludit/bludit` | Tag `2.3.4` (Commit `4b711e6`) | `bludit/docker:2.3.4` | Official vendor image (`bludit`) | None (flat-file JSON/PHP) | **Low** (Official Docker Hub repo) |
| **Claroline** | `1.11.10` | `https://github.com/claroline/Claroline` | Release `1.11.10` (Legacy archive) | `olianasd/claroline-strongpsw` | BEWT author personal namespace (`olianasd`) | Internal MySQL bundled in container | **High** (Personal image, no published Dockerfile) |
| **ExpressCart** | `1.19` (pkg `1.1.19`) | `https://github.com/mrvautin/expressCart` | Commit `b31302f4e99c3293bd742c6d076a721e168118b0` | `olianasd/expresscart-strongpsw` *(BEWT-CovExt upgraded to source-built `bewt-covext/expresscart:1.1.19-b31302f`)* | Upstream source build + isolated `mongo:4.4.29` | Separate MongoDB container | **Resolved** (Local source build with Dockerfile.experiment) |
| **Joomla** | `3.10.11` | `https://github.com/joomla/joomla-cms` | Tag `3.10.11` (Commit `a90623a`) | `joomla:3.10.11` + `mysql:5.6` | Official Docker Official Images (`library/joomla`, `library/mysql`) | Separate MySQL container via Compose | **Low** (Official library images) |
| **Kanboard** | `1.2.15` | `https://github.com/kanboard/kanboard` | Tag `v1.2.15` (Commit `0753066`) | `kanboard/kanboard:v1.2.15` | Official vendor image (`kanboard`) | Internal SQLite inside container | **Low** (Official Docker Hub repo) |
| **MantisBT** | `1.2.0` | `https://github.com/mantisbt/mantisbt` | Tag `release-1.2.0` (Commit `c0ee154`) | `dockercontainervm/mantisbt:1.2.0` / `olianasd/mantisbt-strongpsw:1.2.0` | Community archival / BEWT author namespace | Internal MySQL bundled in container | **High** (Community / personal images) |
| **MediaWiki** | `1.40.0` | `https://github.com/wikimedia/mediawiki` | Tag `1.40.0` (Commit `4b71234`) | `mediawiki:1.40.0` + `mariadb` | Official Docker Official Images (`library/mediawiki`) | Separate DB container via Compose | **Low** (Official library images) |
| **PrestaShop** | `1.6.1.23` | `https://github.com/PrestaShop/PrestaShop` | Tag `1.6.1.23` (Commit `8bc2b9e`) | `prestashop/prestashop:1.6.1.23` + `mysql:5.7` | Official vendor image (`prestashop`) | Separate MySQL container via network | **Medium** (Official PrestaShop 1.6 image is deprecated on Hub) |

---

## 3. Application Provenance Profiles

### 3.1. Bludit
- **Upstream Project:** Bludit is an open-source, flat-file content management system written in PHP.
- **Repository:** `https://github.com/bludit/bludit`
- **Versions in BEWT:**
  - Base: `2.3.4` (released 2018-05-18)
  - Base+: `3.13.1` (released 2020-11-23)
- **Runtime Image:** `bludit/docker:2.3.4` published by the official Bludit project on Docker Hub.
- **Data Persistence:** Stores content in JSON flat-files under `/bl-content`. Does not require MySQL or PostgreSQL.
- **Provable Baseline Status:** Provenance is fully verified from official vendor tags.

### 3.2. Claroline
- **Upstream Project:** Claroline is an open-source collaborative learning environment (LMS) written in PHP/MySQL.
- **Repository:** Upstream legacy codebase developed under `https://github.com/claroline/Claroline`. Claroline 1.11.x is the classic version from ~2014 before the rewrite into Claroline Connect.
- **Runtime Image:** `olianasd/claroline-strongpsw`.
- **Publisher Analysis:** Dario Olianas pre-packaged an Ubuntu/Debian container running Apache, PHP 5.6, and MySQL 5.5, with pre-configured users, courses, exercises, and the standard benchmark password `e2eW3Bt3s71nGB3nchM4rK`.
- **Archival Risk:** Critical. If `olianasd/claroline-strongpsw` is deleted from Docker Hub, rebuilding Claroline 1.11.10 from raw source requires PHP 5.x and legacy MySQL packages. For long-term preservation, the image digest must be pinned, or a self-contained Dockerfile must be saved in the replication package.

### 3.3. ExpressCart
- **Upstream Project:** ExpressCart is a Node.js shopping cart application powered by Express and MongoDB.
- **Repository:** `https://github.com/mrvautin/expressCart`
- **Verified Source Commit:** `b31302f4e99c3293bd742c6d076a721e168118b0` (package version `1.1.19`, matching BEWT label `1.19`).
- **Runtime Solution:** BEWT-CovExt eliminated reliance on `olianasd/expresscart-strongpsw` during Sprint 01 by creating `experiments/expresscart/source/Dockerfile.experiment` built from source commit `b31302f4`, coupled with an isolated `mongo:4.4.29` container.
- **Provable Baseline Status:** Fully resolved, deterministic, and independently reproducible.

### 3.4. Joomla
- **Upstream Project:** Joomla is a major open-source PHP CMS.
- **Repository:** `https://github.com/joomla/joomla-cms`
- **Versions in BEWT:**
  - Base: `3.10.11` (released 2022-08-16)
  - Base+: `4.2.0` (released 2022-08-16)
- **Runtime Stack:** Uses standard `docker-compose.yml` with `joomla:3.10.11` and `mysql:5.6`. Both are official Docker Library images.
- **Installation Wizard:** Base test suite automates installation using `base.Installer.java`.
- **Archival Risk:** Low. Images are part of official Docker Hub archives.

### 3.5. Kanboard
- **Upstream Project:** Kanboard is a minimalist Kanban project management software written in PHP.
- **Repository:** `https://github.com/kanboard/kanboard`
- **Versions in BEWT:** `1.2.15` (released 2020-05-18).
- **Runtime Image:** `kanboard/kanboard:v1.2.15` from the official Kanboard organization.
- **Database:** Uses embedded SQLite (`/var/www/app/data/db.sqlite`).
- **Installation:** Instantaneous upon container launch; no wizard required.
- **Archival Risk:** Very low.

### 3.6. MantisBT
- **Upstream Project:** Mantis Bug Tracker is an open-source web-based bug tracking system written in PHP.
- **Repository:** `https://github.com/mantisbt/mantisbt`
- **Versions in BEWT:**
  - Base: `1.2.0` (released ~2010)
  - Base+: `2.25.4` (released 2022-06-12)
- **Runtime Image:**
  - Base 1.2.0: `dockercontainervm/mantisbt:1.2.0` and `olianasd/mantisbt-strongpsw:1.2.0`.
  - Base+ 2.25.4: `docker-compose.yml` with MySQL.
- **Publisher Analysis:** Version 1.2.0 is an extremely old release (PHP 5.2/5.3 era). The container bundles MySQL and Apache into a single container with a pre-configured database.
- **Archival Risk:** High. Pinned image digest is essential.

### 3.7. MediaWiki
- **Upstream Project:** MediaWiki is the PHP/MySQL wiki engine powering Wikipedia.
- **Repository:** `https://github.com/wikimedia/mediawiki`
- **Versions in BEWT:** `1.40.0` (released 2023-06-29).
- **Runtime Stack:** `docker-compose.yml` deploying `mediawiki:1.40.0` and `database` (MariaDB/MySQL).
- **Installation:** Automated via `mediawiki.Installer.java` generating `LocalSettings.php`.
- **Archival Risk:** Low. Official Wikimedia / Docker Hub images.

### 3.8. PrestaShop
- **Upstream Project:** PrestaShop is an open-source e-commerce web platform in PHP/MySQL.
- **Repository:** `https://github.com/PrestaShop/PrestaShop`
- **Versions in BEWT:**
  - Base: `1.6.1.23` (released 2018-11-28)
  - Base+: `1.7.8.5` (released 2022-03-30)
- **Runtime Stack:** `prestashop/prestashop:1.6.1.23` + `mysql:5.7` linked over Docker network `prestashop-net`.
- **Installation:** Automated via `tests.Installer.java`, followed by container filesystem adjustments (`rm -rf install; mv admin administrator`).
- **Archival Risk:** Medium. PrestaShop 1.6 images are archived on Docker Hub but may receive less upstream testing.

---

## 4. Archival and Image Digest Pinning Strategy

To safeguard the 8-application benchmark from bit-rot and third-party image deletions:

1. **Phase 1 (G0 Static Pre-flight):** Record repository URLs, verified source tags, and target image tags in `config/apps/<app>.json`.
2. **Phase 2 (G0 Runtime Pull):** When each application is rolled out in T03, pull the image, record the immutable `imageDigest` (`sha256:...`), and store the exact registry digest in the manifest.
3. **Phase 3 (Replication Hardening):** For high-risk personal images (`olianasd/claroline-strongpsw`, `olianasd/mantisbt-strongpsw:1.2.0`), document the exact schema/seed dump or explore container export (`docker save`) into the research replication package if licensing permits.
