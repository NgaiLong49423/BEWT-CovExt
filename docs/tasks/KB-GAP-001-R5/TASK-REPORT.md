# KB-GAP-001 Revisions 5–9 — Task Report

## Result

**Preliminary engineering result: R8 passed 4/4 clean-state G3 runs (one initial run plus three reruns). Research validation remains blocked.** Human oracle/novelty approval is pending, and the runner omits per-container image binding. Revisions 5–7 and configuration-error attempts are preserved as failures; none is counted as a passing R8 run.

## Scope and remediation

- Preserved Revision 4 and each successive implementation as a separate immutable revision.
- R5 added the `Test Project` fixture via the UI; its first live attempt exposed that the test remained on the project summary page.
- R6 returned to the dashboard before opening the created project; its live attempt exposed the pinned UI label mismatch: source renders `Open this task`, while Gherkin says `Reopen this task`.
- R7 targeted the source-backed `Open this task` action without changing Gherkin; its run timed out looking up the search result while using a generated title.
- R8 uses the exact Gherkin title `Task to Reopen`, keeps the Gherkin unchanged, and replaces the fragile absolute result XPath with a CSS selector grounded in the pinned search templates.
- `HUMAN-DECISION-PACKET.md` records the UI label mismatch and leaves the reviewer decision pending.

## Verification

| Revision/run group | Result | Detail |
|---|---|---|
| R5 compile | PASS | `mvn -B -DskipTests test-compile`; 38 test sources; exit 0 |
| R5 G3 | FAIL | `NoSuchElementException` at project navigation after fixture creation; cleanup PASS |
| R6 compile | PASS | 39 test sources; exit 0 |
| R6 G3 | FAIL | Literal Gherkin link label not present in pinned UI; cleanup PASS |
| R7 compile | PASS | 40 test sources; exit 0 |
| R7 G3 | FAIL | Search-result lookup timed out with generated title; cause not isolated; cleanup PASS |
| R8 compile | PASS | 41 test sources; exit 0 |
| R8 initial G3 | PASS | 1 test, 0 failures/errors/skips; readiness Selenium HTTP 200, app HTTP 302; cleanup PASS |
| R8 three valid clean-state reruns | PASS 3/3 | Each is a distinct Docker run with 1 test, 0 failures/errors/skips and zero-residual cleanup |
| Three early R8 attempts | BLOCKED_FIXTURE | Runner process omitted `KANBOARD_TEST_USERNAME`; each failed before candidate actions and cleaned up. Retained separately and excluded from the valid rerun count. |

Commands and per-run IDs are in `evidence/g3-r8-acceptance-manifest.json` and `evidence/g3-runs/`. Public JUnit XML is filtered to remove Selenium session/capability identifiers; Maven stdout/stderr is excluded. The exact pre-filter runner JUnit hashes remain in each `surefire-hash.json`; runner-side files are retained on the VM.

## Provenance

- Executed repository commit: `3b6dd4141bcf350ff7556ba2121c212a846e5e11`.
- R8 Java SHA-256: `7fe5d2dfe49e634117aad2d6dae9da6587bcabde4171d6ac60b4b888aa26d98a`.
- Gherkin SHA-256: `f14129dbbe8ef3788643689cdea05678e09372d2fc6e5961a02d9cbe1d67bf62`.
- Application source: Kanboard `1.2.15`, commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`; image pinned to `sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e`.
- Runtime: project `gen-lang-client-0311012609`, VM `bewt-covext-runner`, zone `asia-southeast1-a`, instance ID `3042402845209891905`; Ubuntu 24.04, 8 vCPU, 61 GiB RAM, Docker Engine 29.9.3, Java 21.0.13.0.3, Maven 3.8.7, Chrome/ChromeDriver 157.0.8103.38.
- Browser was launched through `selenium/standalone-chrome:latest`; post-run image inspection found digest `sha256:3fa985d1a73d1a3ae43c758d546b505b9d73e31ecaffd7a77725f19d1a70edec`. The run record does not bind this image ID to each browser container. It also omits per-container IDs and labels the task `g0-kanboard`; run IDs and JUnit class identify the G3 runs.

## Acceptance boundary

R8 has preliminary technical evidence of the requested UI behavior and 3/3 clean-state reruns. It is **not `VALIDATED`**: G1 oracle/novelty decisions remain unsigned, the task-label mismatch needs reviewer resolution, and runtime provenance has the documented per-container gaps. No RQ result, G0 gate, or deliverable is promoted by this candidate task. Overall program acceptance remains blocked.

## Revision 9 update — 2026-11-12

R9 addresses the independent semantic audit finding that R8 did not assert the Gherkin board-column postcondition. After the exact status:open search assertion, R9 navigates back to Test Project and asserts that the exact task appears in a board card, the card has the pinned Kanboard open-state class, the card belongs to a non-empty board-column ID, and the visible column heading has a title. Gherkin remains unchanged pending human resolution of the source UI label (Open this task) versus the authored step (Reopen this task).

- R9 Maven test-compile: PASS, exit 0, 42 test sources observed in the earlier compile; this repeat compile reported BUILD SUCCESS but Maven could not update its incremental status files in this checkout, so VM compilation is the authoritative follow-up.
- R9 G3: NOT_RUN at this report revision.
- R9 SHA-256 is registered over UTF-8 LF-normalized source bytes to match the Linux VM checkout; the runner-side observed hash must be compared after execution.
- R8 4/4 remains historical preliminary evidence only.  No scientific validation is implied; human oracle and novelty decisions remain pending.

## Revision 10 update — 2026-11-12

R9 was executed four times (one initial run plus three clean-state reruns); all four failed at the board-card open-state assertion. Sanitized JUnit consistently identifies an XPath defect: contains(@class, 'task-board') also matched the descendant class task-board-title, so the code inspected the title wrapper instead of the card. Cleanup reported zero residual resources in all four attempts. This failure is retained and not counted as a pass.

The pinned Kanboard template at application source commit 00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b confirms task-board-status-open on the exact task-board container, with data-column-id on that same container. R10 changes both ancestor lookups to exact CSS-class-token XPath checks and retains the board-column/header assertions. The Gherkin remains unchanged.

- R10 source is registered as a new immutable revision.
- R10 local compilation: NOT_RUN after this correction.
- R10 G3: NOT_RUN.
- R9 result: FAIL 0/4; all 4 cleanups reported zero residual.
- Research validation remains NOT_ACCEPTED; human oracle and novelty decisions remain pending.
