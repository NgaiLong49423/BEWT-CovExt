# G2 40-Case Semantic Mapping Audit and R3 Engineering Update

## Scope and audit result

This audit covers the latest Java revision for all 40 candidates at task base 8c1abafb5254af73bdc43ef9d2f5849bd5c64b00: 30 R2 and 10 R3. EC-GAP-002 and KB-GAP-001 remain included for traceability but receive no edits here because PR #32 and PR #30 are active.

The machine-readable matrix is 40-CASE-SEMANTIC-MATRIX.json. It records candidate Java paths and canonical UTF-8 LF SHA-256 hashes, exact Gherkin/oracle/implementation lines, extracted actions/assertions, source pins/references, and compile/runtime evidence by revision. R2 outcomes are explicitly historical when a later revision exists. Password and email-shaped test literals are redacted in the matrix.

The initial line audit found 0 MATCHED, 22 WRONG_BEHAVIOR, 15 PARTIALLY_IMPLEMENTED, and 3 WEAK_ORACLE. After the source-backed JO-GAP-004 R3 correction, the matrix records 1 MATCHED, 21 WRONG_BEHAVIOR, 15 PARTIALLY_IMPLEMENTED, and 3 WEAK_ORACLE. The KB classifications reflect exact latest-revision evidence: KB-GAP-002 submits a comment but accepts a generic page title; KB-GAP-008 saves a subtask but uses the wrong title and does not verify TODO status.

## JO-GAP-004 R3

The R2 mapping only read category/list state. Immutable R3 at extension/joomla/selenium/ae6c8ee75a51838ce2ddfa2df16cb9ed/revision-3 adds the exact article fixture check, version-1 precondition, body edit/save, version-2 assertion, persisted-body check, and version-history assertions for two distinct rows with timestamps and author admin. The revision is registered with the unchanged Gherkin hash and parent R2 path. The matching Maven-suite copy is at experiments/joomla/bewt-suite/src/test/java/base/T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3.java.

The source-to-action/oracle mapping is JO-GAP-004-R3-SOURCE-ACTION-MAP.json. It binds the action/assertion lines to Joomla 3.10.11 source at commit 01deee0a7b8cf91fc503b2cc13359c6e43aac47f. The verified source includes the readonly version form field, article save increment, ContentHistory observer snapshot behavior, modal history row rendering, and selected history deletion. The candidate proposal is ACCEPTED_FOR_IMPLEMENTATION; human oracle/novelty review remains pending and was not changed.

## Verification and limits

The affected suite compiled with mvn -B -DskipTests test-compile (PASS). Evidence is in evidence/joomla-r3-test-compile.txt and joomla-r3-test-compile.exit-code.txt. The candidate-scoped G3 harness also compiles; evidence for the final UI preflight revision is in evidence/joomla-g3-harness-ui-preflight-test-compile-r3.txt and its exit-code file.

G3 attempt 1 (`g3-jogap004-r3-20261113-initial`) is preserved at `docs/tasks/g3-evidence/joomla/JO-GAP-004/g3-jogap004-r3-20261113-initial/`. Joomla installation and admin login completed, but the suite setup could not find a selected `save_history` input on the directly addressed component-options page. The `@BeforeClass` setup failed before R3; the candidate outcome is `NOT_RUN`, not a behavioral failure. Runner cleanup passed and the run-labeled Docker residual inventory was empty. The first attempt files are retained unchanged.

The pinned Joomla 3.10.11 source explains the supported setup path: Articles manager renders its Options toolbar when the user has `core.admin` or `core.options` for `com_content` (`administrator/components/com_content/views/articles/view.html.php:200-202`); the component-options view binds the component form, and `administrator/components/com_content/config.xml` defines `save_history` as a radio. The base installer SQL seeds com_content params with `save_history:1`, despite the config field's default of 0. The preflight now opens Articles > Options through that toolbar, requires the configuration modal/form, reads the selected radio, and records a sanitized page path/title plus form/radio visibility. It remains fail-closed and does not mutate the option. A fresh initial attempt is pending this harness correction; it must verify `save_history=1` and exactly one initial history row before executing R3.

No JO-GAP-004 candidate test has completed. No candidate is marked VALIDATED. JO-GAP-004 R3 remains a preliminary engineering implementation awaiting runtime evidence and human oracle/novelty review; it is not scientific acceptance.
