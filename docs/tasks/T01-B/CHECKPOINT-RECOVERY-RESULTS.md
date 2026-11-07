# Checkpoint Recovery Results

`framework/test/integration/workflow.test.ts` launches separate Node processes against one temporary SQLite database. Process 1 interrupts at `AWAITING_HUMAN_REVIEW` and confirms Java preparation has not run. Process 2 opens a fresh `SqliteSaver` for the same file/thread, resumes with ACCEPT, invokes the Java preparation callback once, and reaches `EXECUTION_COMPLETED`.

Result: PASS, included in the 13/13 integration suite. The temporary database and marker are removed in `finally`; no checkpoint database is tracked. This proves normal process-stop/restart recovery in the test environment, not power-loss durability, concurrent writer behavior, production storage policy or OS principal authentication.

Actual CLI runs also recorded append-only REVISE/ACCEPT decisions against separate checkpoint IDs. Run `t01b-08ed746f-a703-4ba5-be89-83c2aaa348e3` includes a REVISE for revision 1 and a fresh review checkpoint for revision 2; acceptance on the new checkpoint was not replayed from the earlier terminal run. The successful execution is `t01b-1e84898b-dd81-4ae0-94c3-18e5f2356bcf`, with current acceptance bound to checkpoint `7e6e17b3-d963-4437-a1d0-99b19fe19639`.

See [`verification-final-20261107/framework-integration.log`](evidence/verification-final-20261107/framework-integration.log) and per-run `human-review-request.json`, `validation-result.json` files. Reviewer ID is an OS user-principal SHA-256 pseudonym; it does not independently prove a human identity outside this local CLI trust boundary.
