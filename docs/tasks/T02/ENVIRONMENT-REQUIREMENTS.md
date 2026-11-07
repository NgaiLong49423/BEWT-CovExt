# T02 — Environment Requirements & Runtime Isolation Audit (8 Applications)

> **Program:** BEWT-CovExt  
> **Task:** T02 — Benchmark Audit (Parallel Worktree)  
> **Source Baseline Reference:** `bewt-original/` (commit `0501249ff3e9a5ea83a06155cd2971dc36197056`)  
> **Scope Document:** `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` (v2.0, 20/10/2026)  
> **Audit Date:** 2026-11-08  
> **Verification Status:** STATIC_AUDIT_VERIFIED (static configuration audit, no containers launched)

---

## 1. Scope & Objective

This document analyzes the runtime infrastructure, container topology, database lifecycle, setup procedures, and teardown mechanisms for all eight applications in the BEWT benchmark. It identifies critical configuration risks—including severe port collisions, hardcoded local IP addresses in the original test code, and manual post-installation requirements—and defines safe isolation strategies for the subsequent G0 rollout (T03).

---

## 2. Environment Matrix Across 8 Applications

| Application | Tech Stack | SUT Port in BEWT | Database Engine | Deployment Method | Pre-test Setup Routine | Teardown / Reset Routine | Setup Complexity |
|---|---|---|---|---|---|---|---|
| **Bludit** | PHP 7.x, Apache | `8080` (HTTP) | Flat-file (JSON files under `/bl-content`) | `docker run -d -p 8080:80 bludit/docker:2.3.4` | `mvn -Dtest=Installer test` (runs first in `TestSuite`) | `docker stop; docker rm` (container removal wipes all state) | **Low** |
| **Claroline** | PHP 5.6, Apache | `3000` (HTTP), `3306` (MySQL) | MySQL 5.5 (bundled inside container) | `docker run -it -d -p 3000:80 -p 3306:3306 ... olianasd/claroline-strongpsw` | None (database pre-seeded in image) | `docker stop; docker rm` | **Low** |
| **ExpressCart** | Node.js 14.x, Express | `3000` (HTTP) | MongoDB 4.4 (isolated container) | Docker Compose (`app` + `mongo`) | None (pre-seeded via Mongo seed scripts) | Stop compose, remove named Mongo volume | **Low** |
| **Joomla** | PHP 7.x, Apache | `8080` (HTTP) | MySQL 5.6 (separate container) | Docker Compose (`joomla-3.10.11/docker-compose.yml`) | `mvn -Dtest=Installer test` + `mvn -Dtest=RemoveMessages test` | Stop compose, remove containers (ephemeral MySQL storage) | **Medium** |
| **Kanboard** | PHP 7.x, Apache | `8080` (HTTP) | SQLite 3 (embedded in container) | `docker run -d -p 8080:80 kanboard/kanboard:v1.2.15` | None (SQLite initialized on container start) | `docker stop; docker rm` (wipes SQLite file) | **Very Low** |
| **MantisBT** | PHP 5.3, Apache | `3000` (HTTP), `3306` (MySQL) | MySQL 5.1 (bundled inside container) | `docker run -it -d -p 3000:80 -p 3306:3306 ... olianasd/mantisbt-strongpsw:1.2.0` | None (database pre-seeded in image) | `docker stop; docker rm` | **Low** |
| **MediaWiki** | PHP 8.x, Apache | `8080` (HTTP) | MariaDB / MySQL (separate container) | Docker Compose (`mediawiki-1.40.0/docker-compose.yml`) | `mvn -Dtest=Installer test` -> downloads `LocalSettings.php` -> `docker cp LocalSettings.php mediawiki-1400-mediawiki-1:/var/www/html` | Stop compose, remove containers AND remove volumes `mediawiki-1400_images`, `mediawiki-1400_db` | **High** |
| **PrestaShop** | PHP 5.6, Apache | `8080` (HTTP), `3307` (MySQL) | MySQL 5.7 (separate container) | Custom Docker network (`prestashop-net`) with two containers | `mvn -Dtest=Installer test` -> `docker exec ... rm -rf install` -> `docker exec ... mv admin administrator` | Stop and remove both containers (`some-prestashop`, `some-mysql`) | **High** |

---

## 3. Critical Environmental Findings & Anomalies

### 3.1. Port Collisions (Massive Concurrency Blocker)
In the original BEWT repository scripts:
- **Port 8080 is used by FOUR applications:** Bludit (`8080`), Joomla (`8080`), Kanboard (`8080`), and PrestaShop (`8080`)!
- **Port 3000 is used by THREE applications:** Claroline (`3000`), ExpressCart (`3000`), and MantisBT (`3000`)!
- **Port 3306 is exposed to host by TWO applications:** Claroline (`3306`) and MantisBT (`3306`)!

```mermaid
graph TD
    subgraph Port8080["Host Port 8080 Collision"]
        Bludit["Bludit (8080)"]
        Joomla["Joomla (8080)"]
        Kanboard["Kanboard (8080)"]
        PrestaShop["PrestaShop (8080)"]
    end

    subgraph Port3000["Host Port 3000 Collision"]
        Claroline["Claroline (3000)"]
        ExpressCart["ExpressCart (3000)"]
        MantisBT["MantisBT (3000)"]
    end

    subgraph Port3306["Host Port 3306 Collision"]
        ClarolineDB["Claroline MySQL (3306)"]
        MantisDB["MantisBT MySQL (3306)"]
    end
```

> [!WARNING]
> Running multiple applications simultaneously on the same host machine will cause immediate `bind: address already in use` failures.
> **Operational Rule for T03/G0:**
> 1. Applications must be deployed **strictly sequentially** (one active application runtime at any given time).
> 2. Alternatively, application manifests must support dynamic port mapping (e.g. `APP_HOST_PORT` environment override), with adapter parameterization for Selenium base URLs.

---

### 3.2. Hardcoded Local LAN IP Addresses in Baseline Java Code
A major empirical discovery during the code audit of `src/test/java/.../BaseTest.java`:
- In **Bludit** (`bludit-2.3.4` and `bludit-3.13.1`): `BaseTest.java` hardcodes:
  ```java
  private String app_url = "http://192.168.1.141:8080/admin";
  ```
- In **MantisBT** (`mantisbt-1.2.0`): `BaseTest.java` hardcodes:
  ```java
  private String app_url = "http://192.168.1.141:3000/mantisbt";
  ```
- In **PrestaShop** (`prestashop-1.6.1.23`): `BaseTest.java` hardcodes:
  ```java
  private String app_url = "http://192.168.1.141:8080/administrator/";
  ```

`192.168.1.141` was the local private IP address of the original researcher's desktop machine. On any other network, tests executing against `192.168.1.141` will hang or fail with connection timeouts!
*(Note: In newer suites like `expresscart-1.19`, `joomla-3.10.11`, `kanboard-1.2.15`, and `prestashop-1.7.8.5`, the authors corrected this to `http://localhost:<port>`.)*

**Required Solution for G0 Rollout:**
The adapter harness for Bludit, MantisBT, and PrestaShop 1.6 must inject or configure the SUT URL dynamically via JVM system properties (e.g., `-Dapp.url=http://localhost:8080/...`), ensuring tests resolve against the active container on `localhost`.

---

### 3.3. Hardcoded Local Windows Paths to ChromeDriver
In multiple baseline test suites:
- **Claroline** (`claroline-1.11.10/src/test/java/test/BaseTest.java`):
  ```java
  System.setProperty("webdriver.chrome.driver", "C:/Users/User/Downloads/chromedriver-win64-chrome127/chromedriver-win64/chromedriver.exe");
  ```
- **MantisBT 2.25.4** and **MediaWiki 1.40.0**: Contain identical hardcoded path references to `C:/Users/User/Downloads/...`.

However, all suites also declare `io.github.bonigarcia:webdrivermanager:5.8.0` in their `pom.xml`, and include a `setupRemoteWebdriver()` method pointing to `http://localhost:4444/wd/hub`.
**Required Solution for G0 Rollout:**
Tests executed in automated pipelines must use WebDriverManager or RemoteWebDriver, preventing reliance on nonexistent local directories.

---

## 4. Reset & State Isolation Strategies

To guarantee the reproducibility requirements of G0, G3, and G4 (3 repeated executions starting from identical data states), reset strategies are classified into three architectural patterns:

### Pattern A: Ephemeral Single-Container (Bludit, Claroline, Kanboard, MantisBT 1.2.0)
- **Mechanism:** All application state resides inside the container's writable layer (flat-files or internal SQLite/MySQL). No external volumes are mounted.
- **Teardown Procedure:**
  ```powershell
  docker stop <container_name>
  docker rm <container_name>
  ```
- **Determinism:** 100% clean state on next `docker run`.

### Pattern B: Ephemeral Multi-Container Compose (Joomla 3.10.11)
- **Mechanism:** Joomla and MySQL run as separate services, but MySQL volume is anonymous/ephemeral (not a named persistent volume).
- **Teardown Procedure:**
  ```powershell
  docker compose down --volumes --remove-orphans
  ```
- **Determinism:** High. The database starts fresh on `docker compose up -d`.

### Pattern C: Persistent Named Volumes with Post-Exec (MediaWiki 1.40.0, PrestaShop 1.6.1.23, ExpressCart)
- **Mechanism:** Database or uploads persist across runs in named volumes or dedicated networks.
- **MediaWiki:** Uses named volumes `mediawiki-1400_images` and `mediawiki-1400_db`. Teardown must explicitly remove both volumes:
  ```powershell
  docker stop mediawiki-1400-mediawiki-1 mediawiki-1400-database-1
  docker rm mediawiki-1400-mediawiki-1 mediawiki-1400-database-1
  docker volume rm mediawiki-1400_images mediawiki-1400_db
  ```
- **PrestaShop:** Uses custom network `prestashop-net` and requires post-install container modification:
  ```powershell
  docker exec some-prestashop bash -c "rm -rf install; mv admin administrator"
  ```
  Teardown:
  ```powershell
  docker stop some-prestashop some-mysql
  docker rm some-prestashop some-mysql
  ```
  *(Network `prestashop-net` can remain).*

---

## 5. Workstation Resource & Capacity Recommendations

Given a Windows developer workstation running Docker Desktop, IntelliJ/VSCode, and Node/Maven builds:
- **Concurrent Execution:** Strictly prohibited across different SUT applications to avoid port contention and CPU/RAM exhaustion.
- **Browser Automation:** Use headless Chrome or containerized Selenium (`selenium/standalone-chrome:127.0-chromedriver-127.0`).
- **Memory Allocation:** Ensure Docker Desktop has at least 6 GB of RAM allocated, as MediaWiki and PrestaShop with MySQL containers require ~2 GB during installation and test execution.
