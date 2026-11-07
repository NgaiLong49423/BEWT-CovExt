> **Document:** ExpressCart Experimental Environment Status Report  
> **File:** `docs/experiments/expresscart/EXPRESSCART-ENVIRONMENT-REPORT.md`  
> **Version:** v1.0.0  
> **Created:** 2026-11-02  
> **Last Updated:** 2026-11-02  
> **Status:** Under Review

# ExpressCart Experimental Environment Status Report

## 1. Executive Summary

**Current status: PARTIAL.** The pinned ExpressCart experiment now runs in Docker, ChromeDriver starts against Chrome 156, and the adapted `AddUserTest` passed before and after an ownership-verified experiment-only reset. The LangGraph/Gemini candidate workflow produced five Gherkin candidates; they await human review. See Section 10 and the [Sprint 01 results report](../../research-results/sprint-01/SPRINT-01-RESULTS.md) for current runtime evidence. The earlier sections below preserve the original setup snapshot and are superseded where their runtime status differs from Section 10.

The source baseline is upstream `mrvautin/expressCart`, commit `b31302f4e99c3293bd742c6d076a721e168118b0`, whose `package.json` and lockfile identify ExpressCart `1.1.19`. This revision is pinned in [SOURCE-LOCK.json](../../../experiments/expresscart/SOURCE-LOCK.json). The new Compose project is namespaced `bewt-covext-expresscart-b31302f`; it declares three new volumes, a private project network, no MongoDB host port, and app binding only to `127.0.0.1:3111`. These are configuration declarations only; no corresponding Docker resource exists yet.

## 2. Source and Environment Status

| Item | Status | Evidence |
|---|---|---|
| Official upstream repository | VERIFIED | Public upstream `https://github.com/mrvautin/expressCart`; source commit page identifies the repository and commit. |
| Full source commit | VERIFIED | `b31302f4e99c3293bd742c6d076a721e168118b0`; local checkout resolves to the same SHA. |
| Application version | VERIFIED | `package.json` and `package-lock.json` at the pinned ref both say `1.1.19`; `package.json` blob SHA `ecdb41069f18e077c1f5aefe20e7182e79e5d236`. |
| Source cleanliness | VERIFIED | `git diff --exit-code HEAD -- . ':!Dockerfile.experiment'` passed; only the experiment Dockerfile is untracked inside the source checkout. |
| Node compatibility declared upstream | VERIFIED | `package.json` engine is `>=10.16.0`. |
| Upstream Dockerfile suitability | CONFLICT | At this pinned revision it uses Node 8.9.4, below the declared package engine, and runs `npm install`. It is not used by the experiment configuration. |
| Upstream Compose suitability | CONFLICT | It uses fixed container names, publishes MongoDB on host port 27017, and uses MongoDB 3.4.10. It is not used by the experiment configuration. |
| Docker daemon/resources | BLOCKED | `docker version` reports client 29.8.0 but cannot connect to `npipe:////./pipe/dockerDesktopLinuxEngine`. Container/image/volume/network inventories therefore could not be read; their ownership and use by MamXanh/other projects remain NOT_VERIFIED. See [read-only inventory attempt](../../../experiments/expresscart/evidence/docker-inventory-readonly.txt). |
| New image digests | NOT_VERIFIED | No image could be pulled or built. Tags are recorded as intended inputs, not resolved artifacts. |

## 3. Prepared Experiment Architecture

Files created:

- [Compose configuration](../../../experiments/expresscart/compose.yaml)
- [Experiment Dockerfile](../../../experiments/expresscart/source/Dockerfile.experiment)
- [Pinned source/runtime manifest](../../../experiments/expresscart/SOURCE-LOCK.json)
- [Copied BEWT test suite](../../../experiments/expresscart/bewt-suite/pom.xml)

The Compose project uses a source build and the local image name `bewt-covext/expresscart:1.1.19-b31302f`. It declares service-private network `bewt-covext-expresscart-b31302f_experiment`; volumes `..._mongo-data`, `..._app-config`, and `..._app-uploads`; and publishes only `127.0.0.1:3111:1111`. MongoDB has no published host port. Compose adds project ownership labels when it creates resources. `docker compose config` succeeded and confirmed the rendered names/bindings. No Compose `up`, build, or container command was run.

The experiment Dockerfile uses `node:14.21.3-bullseye-slim` and `npm ci --only=production`; Compose requests `mongo:4.4.29`. These are fixed version tags, but their registry digests and actual runtime compatibility remain **NOT_VERIFIED** until a Docker build/start succeeds. Node 14 and MongoDB 4.4 are EOL runtime choices (Node 14 ended support in 2023; MongoDB 4.4 ended support in 2024) made for compatibility investigation with this old application and MongoDB Node driver `^3.3.3`; they carry security/support risks and need Team Lead approval before the experiment is treated as a maintained service. See the official [Node.js EOL schedule](https://nodejs.org/en/about/previous-releases) and [MongoDB lifecycle schedule](https://www.mongodb.com/legal/support-policy/lifecycles).

The Mongo volume, app configuration volume, and uploads volume are fresh named volumes under the dedicated Compose project. They do not refer to the old `olianasd` image or its data. The source checkout is newly obtained from the verified upstream commit. The Docker daemon being unavailable prevented a live inventory proving whether other Docker resources exist; **no old or shared resource was touched**.

## 4. BEWT Selenium Suite and Compatibility Changes

The source suite was copied to `experiments/expresscart/bewt-suite`; `bewt-original/` was not modified. In the copy only, `BaseTest` now defaults to `http://127.0.0.1:3111` (overridable by `expresscart.baseUrl`), removes the fixed Chrome 127 browser pin so Selenium Manager can resolve the installed browser, and checks for a non-null driver during teardown. The AddUser assertion and test data were not changed.

The copied suite keeps Selenium `4.35.0`, WebDriverManager `5.8.0`, JUnit `4.12`, and the copied POM. Environment versions observed: Java `21.0.12`, Maven `3.9.16`, Node `24.19.0`, npm `11.17.0`, and Chrome `156.0.8078.76`. No `chromedriver.exe` was found on PATH. Selenium Manager could not access Chrome-for-Testing metadata and reported access denied for its user cache; it fell back to an unusable cached driver for Chrome 127.

### Build and Smoke Test Evidence

- `mvn -f experiments/expresscart/bewt-suite/pom.xml clean test-compile` — **PASS**; compiled 28 main and 33 test Java files.
- `docker compose -f experiments/expresscart/compose.yaml config` — **PASS**; syntax and intended resource names/bindings rendered.
- `mvn -f experiments/expresscart/bewt-suite/pom.xml -Dtest=AddUserTest test` — **BLOCKED/FAIL** before test body. Surefire reports a Selenium `NoSuchDriverException`; test setup could not start Chrome. The teardown guard prevents an additional null-driver error in the retained run.
- Evidence: [Maven smoke attempt log](../../../experiments/expresscart/evidence/addusertest-maven.log), [Surefire XML](../../../experiments/expresscart/bewt-suite/target/surefire-reports/TEST-tests.AddUserTest.xml), [Surefire text report](../../../experiments/expresscart/bewt-suite/target/surefire-reports/tests.AddUserTest.txt), [exit code](../../../experiments/expresscart/evidence/addusertest-exit-code.txt).
- HTTP readiness, Mongo connectivity, application version at runtime, admin account setup, assertion behavior, image digests, data-before/after evidence, reset, and second smoke run — **NOT_VERIFIED** because no application/container could be started.

The assertion’s expected row/order may depend on initial data. Its validity on a clean new database remains **NOT_VERIFIED**; it must not be weakened merely to obtain PASS. The first live run must distinguish app/setup/data/selector/assertion failures after browser and application startup are available.

## 5. Reset and Repeatability Plan

No reset has been performed. After successful initial startup and explicit confirmation that each resource carries Compose project label `bewt-covext-expresscart-b31302f`, record database and app-config/uploads state, run the single smoke test, and record the resulting state. For a clean repeat, stop only this project and remove only its three named volumes after rechecking their exact Compose labels and IDs; then recreate the project, repeat first-run setup/data initialization, and run `AddUserTest` again. Removing these volumes discards all experiment database, setup/configuration, and uploaded-file state. Never use global prune commands or select resources by name alone.

Reset reproducibility is **NOT_VERIFIED**, so this environment is not ready for broader experiments or the 31-case suite.

## 6. Acceptance Criteria

| Criterion | Result | Reason |
|---|---|---|
| ExpressCart runs in Docker | BLOCKED | Docker daemon unavailable; no build/start performed. |
| No old image/data used | PARTIAL | New source checkout and isolated config are prepared; live Docker provenance cannot yet be observed. |
| `AddUserTest` passes with valid assertion | BLOCKED | Browser setup failed before reaching app or assertion. |
| Reset verified | NOT_VERIFIED | No app state or volumes were created. |
| Smoke test passes after reset | NOT_VERIFIED | No initial smoke pass/reset cycle. |
| Evidence and version manifest exist | PARTIAL | Source lock and test/build evidence exist; runtime digests/logs/data evidence do not. |
| Other project resources unaffected | PARTIAL | No Docker mutations occurred; inventory unavailable, so current ownership remains unknown. |

## 7. Risks and Decisions for Team Lead

1. Restore Docker Desktop Linux engine availability, then inspect the full Docker inventory before creating anything; retain all existing resources unless ownership is conclusively established.
2. Approve or replace the proposed Node 14.21.3 / MongoDB 4.4.29 runtime. Both are legacy versions; compatibility and vulnerability posture need evaluation.
3. Provide a usable ChromeDriver/Selenium Manager path. Prefer a project-local cache/download and record the resolved driver version and hash; avoid relying on the inaccessible user cache.
4. Decide the clean first-run admin/data initialization process. The copied test uses fixed test inputs and the expected user-row position may not hold for a fresh database.
5. After the above, build and start only with `docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml up -d --build`; verify labels, inspect image IDs/digests, HTTP readiness and Mongo connectivity before running tests.
6. Approve the scoped reset only after ownership is proved. Candidate reset commands are listed in the next section and must be run one resource at a time with label/ID checks.

## 8. Proposed Commands (Not Executed)

These commands are for a later approved run. They have **not** been executed:

```powershell
# Build/start only the dedicated project after Docker inventory and port checks.
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml up -d --build

# Inspect only this project; confirm labels/IDs before any reset.
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml ps -a
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml images
docker volume inspect bewt-covext-expresscart-b31302f_mongo-data bewt-covext-expresscart-b31302f_app-config bewt-covext-expresscart-b31302f_app-uploads

# After capturing before/after evidence and verifying exact Compose labels,
# stop this project, then remove only the three IDs proven to belong to it.
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml down
docker volume rm <verified-mongo-volume-id> <verified-app-config-volume-id> <verified-app-uploads-volume-id>

# Recreate clean state and repeat the baseline smoke test.
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml up -d --build
mvn -f experiments/expresscart/bewt-suite/pom.xml -Dtest=AddUserTest test
```

Do not run a reset command until the engine works and each ID has been inspected. No existing Docker image, container, volume, or network has been designated safe to delete in this assessment.

## 9. Upstream References

- [Pinned upstream commit](https://github.com/mrvautin/expressCart/commit/b31302f4e99c3293bd742c6d076a721e168118b0)
- [Pinned `package.json`](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/package.json)
- [Pinned `package-lock.json`](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/package-lock.json)
- [Pinned upstream Dockerfile](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/Dockerfile)
- [Pinned upstream Compose file](https://github.com/mrvautin/expressCart/blob/b31302f4e99c3293bd742c6d076a721e168118b0/docker-compose.yml)

## 10. Emergency Sprint Update — 2026-11-02

This dated update supersedes the earlier runtime-blocked statements above.

| Check | Current result | Evidence |
|---|---|---|
| Docker engine and isolated Compose project | VERIFIED; app and Mongo run under `bewt-covext-expresscart-b31302f` | [runtime manifest](../../../experiments/expresscart/evidence/runtime-manifest.json) |
| HTTP readiness / Mongo connectivity | PASS; HTTP 200 / ping 1 | Same manifest |
| App, DB, and browser versions | ExpressCart 1.1.19 at `b31302f4e99c3293bd742c6d076a721e168118b0`; Node 14.21.3; MongoDB 4.4.29; Chrome 156.0.8078.76; ChromeDriver 156.0.8078.80 | [runtime manifest](../../../experiments/expresscart/evidence/runtime-manifest.json) |
| ChromeDriver compatibility | PASS 1/1; Selenium logs a non-blocking missing-CDP-binding warning | [compatibility log](../../../experiments/expresscart/evidence/chromedriver-smoke.log) |
| `AddUserTest` | PASS before and after reset, each 1/1 | [post-reset log](../../../experiments/expresscart/evidence/addusertest-post-reset-run2.log), [Surefire XML](../../../experiments/expresscart/bewt-suite/target/surefire-reports/TEST-tests.AddUserTest.xml) |
| Reset | PASS; exact Compose project ownership was checked for both containers and four named volumes before and after scoped removal/recreation | [pre-reset ownership/data](../../../experiments/expresscart/evidence/pre-reset-ownership-and-data.json), [post-reset ownership](../../../experiments/expresscart/evidence/post-reset-ownership.json), [clean seed counts](../../../experiments/expresscart/evidence/post-reset-clean-seed-counts.json) |
| AI candidate workflow | PARTIAL; five schema-valid, Gherkin-valid candidates await human review; no Java tests generated or run | [Sprint 01 results](../../research-results/sprint-01/SPRINT-01-RESULTS.md) |
| `bewt-original/` and other Docker projects | No changes made | Git path check and scoped Compose commands |

The original admin fixture password hash differed from the value already in the copied BEWT test, causing `INVALID_PASSWORD`. An experiment-only fixture helper updates that seeded owner's hash from the copied test input without printing or persisting the value. The test assertion itself remains unchanged. The experiment uses newly created named volumes and does not use the legacy third-party ExpressCart image or data.

The AI run generated five candidates, all currently `AWAITING_HUMAN_REVIEW`. Syntax and route/test/feature reference checks are automated triage only, not human validity or confirmed novelty. Token usage was recorded for the latest successful run; the provider's reported `total_tokens` conflicts with its input/output sum, and no cost amount was reported. Java generation, compile, and candidate execution remain `NOT_RUN` until a human accepts candidate IDs.
