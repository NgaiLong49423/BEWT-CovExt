# Open Blockers

1. **Human decisions:** all 40 oracle and novelty decisions remain pending and unsigned. Team Lead review is required before any case can be accepted or validated.
2. **Semantic implementation:** none of the 40 R2 Java classes implements its embedded Gherkin/oracle. Each needs source-backed review and a corrected immutable revision or explicit reject/revise outcome.
3. **Runtime provenance:** G0/G3 run records do not bind app commit, test hash, image digest, or runtime versions; ExpressCart image digest is missing from its manifest.
4. **Cleanup and attempt counts:** BL-GAP-001 rerun 1 has failed zero-residual verification; reconcile 79 summary invocations against 84 run records and 85 JUnit XML files; correct JO-GAP-003's flakiness denominator.
5. **Baseline denominator:** the 180 UBU denominator is not established in the current source-backed inventory. No RQ2 percentage is publishable.
6. **Metrics:** the false-PASS engine has been replaced and its negative controls pass; independent review, broader fault-injection coverage, and manuscript synchronization remain.
7. **Model provenance:** five failed Gemini attempts are recorded, no successful live generation or actual usage is evidenced, and current model/cost claims conflict with that ledger.
8. **Credential literals:** ten Claroline/Kanboard R2 login calls contained literals; security-only R3 copies now require runtime configuration. Compile and execute those copies after the approved fixture supplies credentials, and determine privately whether rotation is warranted.
9. **Scientific manuscript:** reconcile conclusions, results tables, metrics, cost, approval, and case outcomes to the primary evidence without erasing historical pilot records.
10. **Final protocol:** after decisions and fixes, rerun correct test revisions from known clean states, bind each execution to exact source/runtime identity, verify cleanup, and record required reruns.

No human identity, decision, runtime result, or model telemetry can be supplied by the coding agent on behalf of the Team Lead.

## Candidate and run update (2026-11-12)

The primary audit counts above remain the historical baseline. A separate preliminary engineering task exercised `KB-GAP-001` through R8: R5–R7 attempts failed during remediation; R8 had four behavior-test passes (initial plus three clean-state reruns), while three additional early attempts failed before candidate actions because the run command omitted `KANBOARD_TEST_USERNAME`. All ten attempts reported zero-residual cleanup. See `docs/tasks/KB-GAP-001-R5/TASK-REPORT.md` and its evidence package. These new records do not rewrite or add to the historical 79-invocation accounting.

The R8 browser used `selenium/standalone-chrome:latest`; the post-run digest was inspected, but the runner does not bind a resolved browser image ID to each container record. The report therefore keeps R8 preliminary and not scientifically validated. Human oracle/novelty approval remains pending for all 40 candidates; 39 candidates have no corrected G3 implementation evidenced in this task, and the KB-GAP-001 wording decision is pending in its reviewer packet.

## 2026-11-12 Kanboard R10 evidence

R10 supersedes R8 as the current preliminary engineering implementation for KB-GAP-001: VM compile PASS (43 test sources), G3 PASS 4/4 including three clean-state reruns, and cleanup zero residual 4/4. R9 failed 0/4 due to an XPath ancestor-class substring bug; it is retained as failed history. Scientific validation remains blocked by unsigned human oracle/novelty review and the pending Gherkin/UI-label wording decision. The runner still omits per-container image IDs and uses a hard-coded g0-kanboard task label. No other candidate was executed in this remediation task.
