# T03-A1 — Offline G0 implementation for Joomla, MantisBT, MediaWiki and PrestaShop

## Implemented

- Copied only each pinned BEWT `pom.xml`, `src/main/java` Page Objects and `src/test/java` baseline suite into `experiments/<app>/bewt-suite`. Source `bewt-original/` was read only.
- Added per-suite `ExperimentConfig` adapters. Application URL, Selenium endpoint, DB settings and administrative credentials are required process environment values; there are no committed secret defaults. The Base tests use `RemoteWebDriver` and fail on malformed configuration.
- Removed fixed `192.168.1.141`, local Chrome/ChromeDriver workstation paths, and the benchmark's static high-entropy administrator password from copied Java tests. Synthetic test emails use the reserved `.invalid` domain.
- Added `experiments/<app>/g0-plan.json` with verified source commits, Base test selection, candidate services, deny-by-default network requirements and explicit digest/runtime blockers. These are offline plans; they are not promoted `config/apps` manifests or runnable Compose files.
- Added `experiments/g0-safety/offline-runtime-safety.mjs`: pre-start gate requires a run-owned internal IPv4-only bridge with no endpoint; ownership verification checks exact run labels/IDs/names/image digest/mounts/network/loopback port bindings; cleanup planning emits only argument arrays after complete inventory validation; startup CLI success is not readiness or PASS.

## Deliberately pending

No runtime runner, Compose deployment, digest promotion, app-specific readiness/seed/reset executor or Docker cleanup executor has been implemented for these four apps. App image tags without immutable registry digests are not safe runtime pins. The profile for MantisBT identifies the third-party bundled-DB image as lacking source attestation. MediaWiki's DB image version remains unresolved. PrestaShop installation requires a future ownership-checked post-install adapter. No Docker, HTTP, DB, Selenium or cleanup PASS is claimed.

## Environment variables

The test adapters require values at process runtime (no `.env` file committed):

`BEWT_APP_URL`, `BEWT_INSTALL_URL`, `BEWT_WEBDRIVER_URL`, `BEWT_ADMIN_USERNAME`, `BEWT_ADMIN_PASSWORD`, `BEWT_ADMIN_PASSWORD_ROTATED`, `BEWT_ADMIN_EMAIL`, `BEWT_DB_HOST`, `BEWT_DB_USER`, `BEWT_DB_PASSWORD`, `BEWT_DB_NAME`.

Only values used by the selected Base test/setup path need be supplied. Missing values fail closed. `BEWT_ADMIN_EMAIL` should use a reserved test domain, and secrets must be injected transiently by the eventual approved runner.

## Offline reproduction

```powershell
node --check experiments/g0-safety/offline-runtime-safety.mjs
node --check experiments/g0-safety/test/offline-runtime-safety.test.mjs
node --check experiments/g0-safety/test/baseline-adapter.test.mjs
node --test experiments/g0-safety/test/offline-runtime-safety.test.mjs experiments/g0-safety/test/baseline-adapter.test.mjs
mvn -B -o -f experiments/joomla/bewt-suite/pom.xml test-compile
mvn -B -o -f experiments/mantisbt/bewt-suite/pom.xml test-compile
mvn -B -o -f experiments/mediawiki/bewt-suite/pom.xml test-compile
mvn -B -o -f experiments/prestashop/bewt-suite/pom.xml test-compile
```

These commands compile the Java test sources only; they do not invoke Selenium. `-o` prevents Maven from using the network. Runtime results remain `NOT_RUN`.