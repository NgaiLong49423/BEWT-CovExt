# Active Maven Credential Integration

- Status: `PARTIAL`; Claroline and Kanboard candidate classes compile. Runtime/E2E validation remains `NOT_RUN`.
- Worktree branch: `task/claroline-kanboard-maven-security` (local branch stacked on PR #27's `task/final-remediation-audit`).
- Base branch/SHA: `task/final-remediation-audit` / `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00`.
- Implementation commit: `58b55dada7469a0c32714a1d177399eb62792a73`.
- PR: [#28](https://github.com/NgaiLong49423/BEWT-CovExt/pull/28), open draft, stacked on PR #27's branch; no GitHub check-runs were registered for the observed head `cb923c5cab0cfacdaf0193836866f76993e5d167`.
- Scope: active Claroline and Kanboard Maven suites; no extension R2 artifact or `bewt-original/` source was modified.

## Active Maven integration

- Added five R3 candidate classes to each suite and tracked their normalized-LF SHA-256 hashes in each `extension-revisions.json`.
- Corrected only the copied R3 comments to identify them as Revision 3 security-only credential-configuration copies; historical extension R2/R3 sources remain unchanged.
- Kept candidates out of each broad `TestSuite`; they require candidate-specific fixture and runtime identity checks before execution.
- Claroline R3 classes require `CLAROLINE_TEST_USERNAME` and `CLAROLINE_TEST_PASSWORD`; Kanboard R3 classes require the configured Kanboard variables recorded in its manifest.

## Claroline credential-only pass

A secret-safe, in-memory comparison classified the 51 active literal-login sites without printing values:

- 37 calls authenticate the same administrator runtime account. They now read `CLAROLINE_TEST_USERNAME` and `CLAROLINE_TEST_PASSWORD` through the required property/environment helper.
- 14 calls authenticate accounts created by the suite's own fixture flows: 10 student, 2 teacher, and 2 administrator test accounts. Their usernames remain test data; the password is supplied through `CLAROLINE_TEST_FIXTURE_USER_PASSWORD`.
- The previous shared password literal was also reused in fixture creation, course-password setup, and the correct-course-password enrollment path. These now use required configuration keys instead of a hardcoded value.
- The mismatched user-password and wrong course-password tests use separately configured values guarded to differ from the corresponding valid fixture value. Their negative checks remain explicit.
- All five active Maven R2 candidate copies now use runtime properties. Their active source hashes are recorded separately from the immutable extension R2 artifacts.
- Added `credential-source-check.mjs`; it checks every Java login call and fails if the password argument is an inline string literal.
- The earlier scan's five extension R2 login lines and five generator literals remain unchanged and outside this active-suite pass. Values were not copied into this report.

## Verification

| Command/action | Result | Evidence |
|---|---|---|
| `node credential-source-check.mjs` (from `experiments/claroline/bewt-suite/`) | `PASS`; 56 Java login call sites checked, no inline password literals | Reproducible static regression check |
| Hash comparison for all active and extension paths in both `extension-revisions.json` manifests | `PASS`; 20 hashes match | Current source tree and registrations |
| Historical credential fingerprint check against active Claroline Java sources | `PASS`; 0 matches | Only a boolean/count was emitted; credential value was not printed |
| Active R2 and upstream artifact registration hashes | `PASS`; 5 active source hashes recorded; all 5 upstream hashes match extension registrations | `experiments/claroline/bewt-suite/extension-revisions.json` |
| `mvn -B -ntp -DskipTests test` in `experiments/claroline/bewt-suite/` | `PASS`; 52 test sources compiled; Surefire skipped execution | Current Maven output; main classes were already up to date |
| `mvn -B -ntp -DskipTests test` in `experiments/kanboard/bewt-suite/` | `PASS`; 42 test sources compiled; Surefire skipped execution | Current Maven output |
| Runtime candidate or full-suite execution | `NOT_RUN` | No verified app/WebDriver ownership or candidate fixture state; full-suite shell scripts have globally named Docker lifecycle commands |

The first Claroline recompile after adding the shared credential helper failed because its name collided with private helpers in the five R3 classes. The helper and active call sites were renamed to `requiredRuntimeCredential`; the subsequent Maven compile passed. The current Maven commands printed a leading Windows `Access is denied.` message before the Maven logs, but both commands returned exit code 0 and ended with `BUILD SUCCESS`.

## Rotation risk and remaining work

Credential rotation status is `NOT_VERIFIED`; the owner should confirm and act through the private credential-management procedure. This public report omits credential values and sensitive identifying details. The historical extension R2 and generator findings remain to be reviewed in their owning tasks.

Compile success does not establish behavioral correctness, human acceptance, or research `VALIDATED` status. Candidate runtime tests still require verified app and WebDriver ownership, approved fixture configuration, source-bound run manifests, and semantic review.

## Cross-app credential follow-up (2026-11-12)

This follow-up covers active non-ExpressCart generated Java candidates and `experiments/tools/unified-g0-runner.mjs` only.

- Bludit shared authentication now requires `BLUDIT_TEST_USERNAME` and `BLUDIT_TEST_PASSWORD`; the shared username no longer has an inline default. Test-created account passwords and deliberately invalid/empty authentication inputs remain fixture data and were not reclassified as runtime credentials.
- Joomla `JO-GAP-003` now has an immutable security-only Revision 3 at `extension/joomla/selenium/2fe8982badb9713cf8935bc53c1d61ad/revision-3/`. Its frontend author identity reads required `BEWT_AUTHOR_USERNAME` and `BEWT_AUTHOR_PASSWORD`. The matching Maven copy is `experiments/joomla/bewt-suite/src/test/java/base/T01C_2fe8982badb9713cf8935bc53c1d61ad_R3.java`, registered by the new extension registration and `experiments/joomla/bewt-suite/extension-revisions.json`. Revision 2 remains unchanged; the candidate remains outside broad `TestSuite` selection.
- Kanboard's five active generated candidates use the already registered R3 classes and `KANBOARD_TEST_USERNAME` / `KANBOARD_TEST_PASSWORD`. Their active Maven R2 copies were restored byte-for-byte to match immutable extension R2 source; no Kanboard R2 artifact was changed.
- The shared G0 runner resolves non-ExpressCart application/admin, database, and installer credentials through required environment values for Bludit, Joomla, Kanboard, MantisBT, MediaWiki, and PrestaShop. Configuration resolves before evidence-directory creation or Docker operations. Installer CLI credentials for MediaWiki and PrestaShop are required inputs. No credentials are included in this report.
- Added `experiments/tools/credential-source-check.mjs` and `.test.mjs`. The scanner checks the latest active revision for each non-ExpressCart generated candidate; historical R2 files remain intact.

Verification for this follow-up:

| Command/action | Result |
|---|---|
| `node experiments/tools/credential-source-check.mjs` | PASS; 35 latest active non-ExpressCart candidate revisions, no inline login identity/password literals |
| `node --test experiments/tools/credential-source-check.test.mjs` | PASS; 7 tests, including credential literal rejection, missing-environment fail-closed behavior, image-ID mapping, and Maven argv redaction |
| `node --check experiments/tools/unified-g0-runner.mjs` | PASS |
| `mvn -B -ntp -DskipTests test` in `experiments/bludit/bewt-suite/` | PASS; 17 main and 31 test sources compiled; tests skipped |
| Same Maven command in `experiments/joomla/bewt-suite/` | PASS; 31 main and 46 test sources compiled; tests skipped |
| Same Maven command in `experiments/kanboard/bewt-suite/` | PASS; 42 test sources compiled; tests skipped |
| Normalized hash comparisons | PASS; active Joomla/Kanboard R2 copies match immutable extension R2 sources; Joomla R3 extension, active copy, and registration hashes match |

Runtime tests were not run. App ownership, WebDriver ownership, and candidate fixture state remain unverified. The account identity used by the removed active login literals may have been reused outside disposable fixtures; assess and rotate it out of band if applicable. The immutable Joomla and Kanboard extension R2 historical files still contain their original literals by design; their registered active R3 successors are credential-safe. Independent test-created user passwords and explicit negative-auth inputs remain separately classified fixture data.

Required runner environment variable names for secure injection:

| App | Required environment variables |
|---|---|
| Bludit | `BLUDIT_TEST_USERNAME`, `BLUDIT_TEST_PASSWORD` |
| Joomla | `JOOMLA_DB_ROOT_PASSWORD`, `JOOMLA_DB_USER`, `JOOMLA_DB_PASSWORD`, `BEWT_ADMIN_USERNAME`, `BEWT_ADMIN_PASSWORD`, `BEWT_ADMIN_EMAIL`, `BEWT_ADMIN_PASSWORD_ROTATED` |
| Kanboard | `KANBOARD_TEST_USERNAME`, `KANBOARD_TEST_PASSWORD` |
| MantisBT | `BEWT_ADMIN_USERNAME`, `BEWT_ADMIN_PASSWORD` |
| MediaWiki | `MEDIAWIKI_DB_ROOT_PASSWORD`, `MEDIAWIKI_DB_USER`, `MEDIAWIKI_DB_PASSWORD`, `MEDIAWIKI_DB_INSTALL_USER`, `BEWT_ADMIN_USERNAME`, `BEWT_ADMIN_PASSWORD` |
| PrestaShop | `PRESTASHOP_DB_ROOT_PASSWORD`, `PRESTASHOP_DB_NAME`, `PRESTASHOP_DB_USER`, `PRESTASHOP_DB_PASSWORD`, `PRESTASHOP_ADMIN_NAME`, `BEWT_ADMIN_USERNAME`, `BEWT_ADMIN_PASSWORD`, `BEWT_ADMIN_EMAIL` |

The selector-only Joomla `JO-GAP-003` additionally requires `BEWT_AUTHOR_USERNAME` and `BEWT_AUTHOR_PASSWORD`; these are not required for the broad G0 runner because the candidate is excluded from `TestSuite`.
## G0 provenance follow-up (2026-11-12)

`run-record.json` now records each created DB/browser/app container's Docker `containerId`, configured `imageReference`, resolved Docker `imageId`, and creation time, captured from `docker inspect` immediately after creation. The Maven result record now stores the full argv array passed to `spawnSync`, in order, with credential-like assignments and URL credentials redacted; it also records the repository-root working directory and process result. Focused synthetic tests cover image-ID mapping and argv order/redaction. No live G0 run was performed in this change.

## MediaWiki and PrestaShop fixture evidence follow-up (2026-11-12)

- The active runner uses MediaWiki 1.40's supported `php maintenance/run.php install` entry point inside the MediaWiki app container and PrestaShop's `install/index_cli.php`, followed by its install-directory removal and admin-path rename. The previous configuration descriptions incorrectly said the Maven Selenium `Installer` tests executed; `config/apps/{mediawiki,prestashop}.json` now documents the runner's actual setup path. Setup errors are recorded with exit state and abort before the Maven smoke test instead of being swallowed.
- Both MySQL-compatible DB containers now receive the configured app DB user/password alongside the DB name. PrestaShop app and Maven test configuration use the same required `PRESTASHOP_DB_NAME`; MediaWiki install and DB initialization use the same database name and configured app user. No live setup was executed in this task.
- Readiness records include UTC check time, HTTP status (or null when unreachable), validator name, URL path only, and `completedBeforeMaven`; failed stages are retained in `run-record.json`. MediaWiki and PrestaShop each get an additional post-setup login-control readiness check through the published loopback port before Maven, while Maven retains the internal Docker hostname. Container stdout/stderr logs are saved per DB/app/browser role before stopping/removing containers, with configured credential values redacted; setup, Maven, and failure logs use the same redaction.
- Each run record is source-bound to the repository commit, tracked-tree cleanliness (untracked run evidence excluded), runner SHA-256, active Java test source path/SHA-256, app source commit/version, and configured image reference. Baseline Gherkin path/Git blob SHA-1 and its mapping catalog SHA-256 are included when the T04-G catalog maps the selected baseline test; otherwise the fields are explicitly `NOT_AVAILABLE`.
- Corrected the runner's MediaWiki baseline test selector to `mediawiki.CreatePageTest`, matching `experiments/mediawiki/g0-plan.json`. PrestaShop remains `tests.AddNewCategory`.

Verification for this follow-up:

| Command/action | Result |
|---|---|
| `node --check experiments/tools/unified-g0-runner.mjs` | PASS |
| `node --test experiments/tools/credential-source-check.test.mjs` | PASS; 15 offline tests, including fixture DB alignment, readiness controls/evidence, source mapping, setup state, and log redaction/order |
| `node experiments/tools/credential-source-check.mjs` | PASS; 35 latest active non-ExpressCart candidate revisions, no inline login username/password literals |
| Live G0 or application setup | NOT_RUN; this task intentionally performed offline checks only |

The failed MediaWiki/PrestaShop G0 runs remain historical evidence; this patch does not rewrite them. The next run will record fixture failure and sanitized setup stdout/stderr before aborting if setup exits nonzero, and will retain sanitized app/DB/browser logs for diagnosis. Readiness for any future run remains `NOT_RUN` until actually executed.

## G0 failure diagnosis follow-up (2026-11-12)

- MediaWiki 1.40 setup now invokes `php maintenance/run.php install`, the documented entry point for installation and maintenance scripts since 1.40. The previous direct `maintenance/install.php` invocation was deprecated in that version; the existing failed-run evidence does not establish whether deprecation caused the installer exit, so the next offline-source-driven runtime attempt must inspect the newly captured output if it still fails. See the [MediaWiki install script manual](https://www.mediawiki.org/wiki/Manual:Install.php/en).
- Every MediaWiki setup step stores sanitized stdout/stderr in per-run files and records command label, exit code, signal/error code, and paths in `run-record.json`. Credential values are redacted before evidence is written.
- MediaWiki and PrestaShop post-setup login probes now use the published `127.0.0.1:<appPort>` endpoint; Maven keeps the app's internal Docker hostname. Readiness failures now record outcome, last HTTP status (or null), validator, UTC timestamp, endpoint path, and pre-Maven ordering in `run-record.json` before aborting.
- `source.workingTreeDirty` now checks tracked files only, and `workingTreeStatusScope` states that untracked run evidence is excluded. Baseline Gherkin Git object IDs are stored as `gitBlobSha1`; the mapping catalog retains its separate `mappingCatalogSha256` field.

Verification for this follow-up:

| Command/action | Result |
|---|---|
| `node --check experiments/tools/unified-g0-runner.mjs` | PASS |
| `node --test experiments/tools/credential-source-check.test.mjs` | PASS; 18 offline tests, including setup log redaction/exit, loopback readiness, failed-readiness persistence, tracked-tree scope, and Gherkin hash naming |
| `node experiments/tools/credential-source-check.mjs` | PASS; 35 latest active non-ExpressCart candidate revisions, no inline login username/password literals |
| App config JSON and `git diff --check` | PASS |
| Live G0 | NOT_RUN; parent owns runtime reruns and this task did not contact the VM |
