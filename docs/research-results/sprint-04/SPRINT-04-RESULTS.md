# BEWT-CovExt — Sprint 04: Recover and Execute Real E2E

**Status: PARTIAL.** The existing ExpressCart experiment recovered without a restart. Four previously LangGraph-generated Selenium classes were reused, compiled, and executed against the live pinned app. EC-C04 and EC-C05 reached their behavior assertions and passed repeatability; EC-C02 and EC-C01 exposed two UI behavior failures that remain unresolved. No expected assertion was weakened.

## 1. Runtime recovery

Docker Desktop and its Linux engine were already running. An initial in-sandbox Docker probe was denied access to the named pipe; the authorized outside-sandbox read showed Docker Engine `29.8.0`, context `desktop-linux`, and the existing Compose project `bewt-covext-expresscart-b31302f` healthy. The app returned HTTP `200` on `127.0.0.1:3111`; MongoDB health was `healthy` and `ping=1`.

The exact Compose project labels matched both running containers. The pinned source remained `mrvautin/expressCart` commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19`. Docker image IDs and project-owned volume/network names are in [runtime manifest](runtime/runtime-manifest.json). No container, image, volume, or network was created, restarted, reset, deleted, or pruned.

## 2. Fixture preparation

- **EC-C02:** Mongo showed eight published products. Every browser invocation started with a fresh cart count assertion; the product was added by storefront UI. The clear-cart UI action ran. Final database inspection found no session with a non-empty cart.
- **EC-C04:** `/customer/forgotten` returned HTTP `200`. Before each official run, a full UUID email was checked for exact absence in `customers` and passed through `TEST_UNREGISTERED_EMAIL`; the unknown account was not inserted. Four earlier runs with unverified email absence are preserved as exploratory and excluded from official metrics.
- **EC-C01:** Mongo showed eight published products and two active discounts (amount `10`, percent `10`) whose validity windows covered the test. The active code was passed only as `-Dtest.discount.code` and is omitted from evidence. The cart was created through storefront UI in the same browser session and emptied in `@After`.
- **EC-C05:** A fresh random experiment admin password was saved only in the gitignored `experiments/expresscart/.env`; the exact owner record was verified and updated inside the experiment database. `ADMIN_EMAIL`/`ADMIN_PASSWORD` were inherited by the Maven process and removed from the parent process afterward. Values are not present in reports or console evidence. The test created a unique slug per run and removed its page through admin UI teardown.

Fixture counts and sanitized preparation records are in [fixture preparation](fixtures/fixture-preparation.json), [preflight evidence](fixtures/), and [post-execution database state](fixtures/post-execution-db-state.json). The EC-C04 per-run email absence check is implemented in [prepare-unregistered-email.ps1](../../../experiments/expresscart/tools/prepare-unregistered-email.ps1). The coupon was supplied dynamically as a Maven test property; raw Surefire XML records system properties, so that seeded demo fixture literal exists in the raw C01 XML and is not repeated in summary tables. It is not a credential. The full database/volume reset was **NOT_RUN**; isolation used new browser sessions plus UI cleanup. The final experiment state has eight published products, two active seeded discounts, zero static pages, zero orders, and zero sessions with a cart.

## 3. Compile and E2E results

Final Maven module `test-compile` **PASS**; the last recompilation compiled 39 Java test source files, including the four candidate classes and an isolated UI cleanup helper. `compile-final.log` records the final build check.

| ID | E2E invocations | First invocation | Final status | Behavior PASS | Repeatability |
|---|---:|---|---|---:|---|
| EC-C02 | 2 | Selector error waiting for nonexistent `.bootbox-accept` | **FAIL — application UI behavior** | 0 | Not repeated |
| EC-C04 | 4 | **PASS** | **PASS** | 4 | 3/3 repeats PASS |
| EC-C01 | 3 | Blocked before oracle by missing visible total | **FAIL — application UI behavior** | 0 | Not repeated |
| EC-C05 | 5 | Content assertion and cleanup failed | **PASS after repair** | 4 | 3/3 repeats PASS |

Across 14 candidate method invocations: 11 reached a behavior assertion, 8 passed, 3 failed behavior assertions, and 3 stopped before the behavior oracle. Surefire records 15 testcase outcomes because EC-C05's first single test invocation produced both a content assertion failure and a teardown failure. A separate static-page cleanup helper ran once and passed.

Four earlier EC-C04 runs also passed, but are retained as exploratory and excluded because their exact email addresses were not checked for absence in Mongo before execution. Including those exploratory runs, 18 candidate executions occurred chronologically; official metrics use the 14 verified-fixture runs above.

### Remaining application failures

1. **EC-C02:** the confirmation action empties the cart and displays `Cart successfully emptied`, but the dynamic empty-cart markup does not render the expected `Cart empty` text. The pinned template contains that intended text; the AJAX renderer in `source/public/javascripts/expressCart.js` builds malformed markup (the `class` attribute quote is not closed). The accepted assertion remains unchanged.
2. **EC-C01:** the active coupon is accepted far enough for the test to wait for the discounted state, but `discount-amount` never becomes visible. The route updates session discount data; the pinned client handler for applying the code only shows the success notification and does not refresh the cart summary. The test expectation remains unchanged.

These are application UI failures, not Docker or missing-fixture failures. They were not patched because the task scope is running the experiment, and altering the pinned application/oracle would change the baseline. See [run metrics](run-metrics.csv) and [repair history](repair-history.json).

## 4. Repairs

- EC-C02 repair 1 replaced the incorrect modal selector with upstream `#buttonConfirm`; this exposed the application empty-state mismatch.
- EC-C01 fixture adaptation added a UI-created cart and teardown before its first run. Repair 1 recorded checkout path/cart count; repair 2 chose the visible total when duplicate IDs exist. The final run reached the coupon behavior and exposed the client refresh defect.
- EC-C05 repair 1 waited for Summernote's backing `#pageContent` value to equal the full unique text and changed cleanup to handle ExpressCart's native JavaScript `confirm()`. Its behavior and cleanup then passed.
- The first EC-C05 attempt left its uniquely named page because the old cleanup waited for a Bootstrap/Bootbox modal. Its identity was verified against a baseline page count of zero, then a separate Selenium UI helper deleted only that page and passed. No direct database deletion was used.

Detailed repair outcomes are preserved in [repair-history.json](repair-history.json). Four candidate repair iterations were used total; no candidate exceeded two.

## 5. Repeatability and reset

EC-C04 passed its verified-fixture initial run plus three serial repeats. Each unique email had an exact database absence preflight, and the flow created no customer. EC-C05 passed after repair plus three serial repeats; page count returned to zero after every run. These six repeat executions passed, with no observed flakiness. Four earlier EC-C04 runs remain preserved under `e2e/EC-C04/exploratory/` but are excluded from official metrics.

No Docker volume reset was performed. The experiment remained on the existing startup seed; per-run state was isolated with a new browser and cleaned through UI. Final DB counts show no leftover cart or static page. A full pristine seed fingerprint was **NOT_RUN**, so Sprint 04 does not claim a full-volume reset verification.

## 6. EC-C03 review package

EC-C03 remains **REVISE**. The Sprint 04 proposal keeps the behavior assertions in the scenario and moves fixture recovery/deletion into a mandatory teardown contract that must execute despite assertion failure. See [revised feature](review/EC-C03-publication-state-review.feature) and [teardown contract](review/EC-C03-teardown-contract.md). It was not executed and requires Team Lead approval.

## 7. Research metrics and limits

- Java generation success: **4/4 reused from Sprint 03 LangGraph output**; no generation call or rewrite was performed in Sprint 04.
- Module compilation: final **PASS**, 39 test source files. Candidate-specific compilation was not isolated because Maven compiles the suite module.
- First-attempt E2E PASS: **1/4** candidates (EC-C04).
- Final candidate E2E PASS: **2/4** (EC-C04, EC-C05); EC-C05's PASS followed one repair.
- Repeated-run PASS: **6/6** executions across the two passing candidates.
- Application behavior failures remaining: **2** (EC-C02, EC-C01); environment failures: **0**.
- Repair iterations: **4** total — EC-C02: 1, EC-C01: 2, EC-C05: 1, EC-C04: 0.
- Sprint 04 model/token usage: **0/not applicable**. Original Sprint 03 model artifacts and usage remain unchanged.

See [metrics.json](metrics.json), [metrics.csv](metrics.csv), and [research-ready tables](research-ready-result-tables.md). Surefire XML is archived for all 14 official candidate invocations. Four earlier EC-C04 exploratory runs are retained separately and excluded because their exact-email absence was not preflighted. Failure screenshots are under the candidate run directories. The shared `BaseTest` captures failure screenshots from the JUnit watcher after teardown, so screenshots can show the cleaned post-test page; Surefire XML and console logs preserve the failure location/message.

## 8. Integrity and next step

The official generated classes remain under `docs/research-results/sprint-03/generation/langgraph-run/`; adaptations are only in the experiment copy under `experiments/expresscart/bewt-suite/`. This task made no writes under `bewt-original/`, and its source/test files have no Git status changes. The nested repository does have 50 dirty entries, all Gradle cache/build outputs (34 modified and 16 untracked); sample timestamps predate Sprint 04 runtime inspection, but exact provenance is **NOT_VERIFIED**. These artifacts were left untouched. See [source-preservation evidence](source-preservation.json). No dependency was upgraded. No commit or push occurred. No credential values appear in this report or its run logs.

Next research step: Team Lead should decide whether to open a separate application-baseline defect work item for the EC-C02 and EC-C01 UI defects. Keep the accepted test oracles intact until that decision; do not label all four candidates PASS.
