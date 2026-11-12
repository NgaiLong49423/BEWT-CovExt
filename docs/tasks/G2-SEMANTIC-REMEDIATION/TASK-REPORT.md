# G2 40-Case Semantic Mapping Audit and R3 Engineering Update

## Scope and audit result

This audit covers the latest Java revision for all 40 candidates at task base 8c1abafb5254af73bdc43ef9d2f5849bd5c64b00: 30 R2 and 10 R3. EC-GAP-002 and KB-GAP-001 remain included for traceability but receive no edits here because PR #32 and PR #30 are active.

The machine-readable matrix is 40-CASE-SEMANTIC-MATRIX.json. It records candidate Java paths and canonical UTF-8 LF SHA-256 hashes, exact Gherkin/oracle/implementation lines, extracted actions/assertions, source pins/references, and compile/runtime evidence by revision. R2 outcomes are explicitly historical when a later revision exists. Password and email-shaped test literals are redacted in the matrix.

The initial line audit found 0 MATCHED, 22 WRONG_BEHAVIOR, 15 PARTIALLY_IMPLEMENTED, and 3 WEAK_ORACLE. After the source-backed JO-GAP-004 R3 correction, the matrix records 1 MATCHED, 21 WRONG_BEHAVIOR, 15 PARTIALLY_IMPLEMENTED, and 3 WEAK_ORACLE. The KB classifications reflect exact latest-revision evidence: KB-GAP-002 submits a comment but accepts a generic page title; KB-GAP-008 saves a subtask but uses the wrong title and does not verify TODO status.

## JO-GAP-004 R3

The R2 mapping only read category/list state. Immutable R3 at extension/joomla/selenium/ae6c8ee75a51838ce2ddfa2df16cb9ed/revision-3 adds the exact article fixture check, version-1 precondition, body edit/save, version-2 assertion, persisted-body check, and version-history assertions for two distinct rows with timestamps and author admin. The revision is registered with the unchanged Gherkin hash and parent R2 path. The matching Maven-suite copy is at experiments/joomla/bewt-suite/src/test/java/base/T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3.java.

The source-to-action/oracle mapping is JO-GAP-004-R3-SOURCE-ACTION-MAP.json. It binds the action/assertion lines to Joomla 3.10.11 source at commit 01deee0a7b8cf91fc503b2cc13359c6e43aac47f. The verified source includes the readonly version form field, article save increment, ContentHistory observer snapshot behavior, modal history row rendering, and selected history deletion. The candidate proposal is ACCEPTED_FOR_IMPLEMENTATION; human oracle/novelty review remains pending and was not changed.

## Verification and limits

The affected suite compiled with mvn -B -DskipTests test-compile (PASS). Evidence is in evidence/joomla-r3-test-compile.txt and joomla-r3-test-compile.exit-code.txt. The candidate-scoped G3 harness also compiles; evidence is in evidence/joomla-g3-harness-test-compile.txt and its exit-code file. Its setup suite checks the clean-install `save_history` option through Joomla's admin UI, refuses an existing exact-title fixture, creates the article through the existing BEWT UI flow, and requires one initial history row before R3. Setup rolls back only the created exact-title fixture if these checks fail. The live setup harness has not yet run.

No Selenium test was executed and no app, Docker, VM, or G3 run occurred. No candidate is marked VALIDATED. JO-GAP-004 R3 is a preliminary engineering implementation awaiting runtime evidence and human oracle/novelty review; it is not scientific acceptance.
