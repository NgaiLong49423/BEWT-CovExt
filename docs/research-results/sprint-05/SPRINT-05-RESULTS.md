# BEWT-CovExt — Sprint 05 Results

**Status: PARTIAL — research report package prepared; C02 transient UI defect independently reproduced; C01 remains INCONCLUSIVE.** No patch was applied.

## Summary

- Reused pinned ExpressCart `1.1.19` at upstream commit `b31302f4e99c3293bd742c6d076a721e168118b0` and existing Compose project at `127.0.0.1:3111`.
- Manually reproduced both flows through browser UI. C02's immediate AJAX empty-state text is absent, while cart count becomes zero; after automatic reload the expected message appears. The pinned JS has malformed dynamic markup. Classification: **CONFIRMED_APP_DEFECT**, limited to transient rendering.
- C01's discount/session math and rendered result were verified through UI after automatic reload: `£138 → £128` on apply, then `£138` and blank code after remove. Java Selenium still timed out waiting for the discount element. Classification: **INCONCLUSIVE** pending headless/browser-session diagnosis.
- Two independent targeted Java test invocations ran with pinned ChromeDriver: C01 ended as a Surefire `ERROR` (discount visibility timeout); C02 ended as an assertion `FAIL` (empty-message text). Their reports and logs are archived in `e2e/`.
- Aggregate official Sprint 04 metrics remain 14 invocations (8 PASS, 3 FAIL, 3 BLOCKED), 11 behavior oracles reached; two of four accepted candidates passed at candidate level and each passed three repeats. Sprint 05 targeted reruns are additional diagnostic invocations, not new candidates.
- Across Sprint 01–03: 5 Gherkin candidates; 4 accepted, 1 revised; 4 LangGraph Java classes generated; first Maven module compile failed then final compile passed after repairs. No empirical comparison proves advantage over BEWT.

## Deliverables

- [DEFECT-VALIDATION.md](DEFECT-VALIDATION.md)
- [RESEARCH-METRICS-CONSOLIDATED.md](RESEARCH-METRICS-CONSOLIDATED.md)
- [RESEARCH-RESULTS-TABLES.md](RESEARCH-RESULTS-TABLES.md)
- [RESEARCH-METHODOLOGY-DRAFT.md](RESEARCH-METHODOLOGY-DRAFT.md)
- [RESULTS-AND-DISCUSSION-DRAFT.md](RESULTS-AND-DISCUSSION-DRAFT.md)
- [THREATS-TO-VALIDITY.md](THREATS-TO-VALIDITY.md)
- [PRESENTATION-OUTLINE.md](PRESENTATION-OUTLINE.md)
- [manual UI observations](evidence/manual-ui-observations.json)

## Environment and integrity

Both browser-session fixtures were removed through the UI; final observed cart badge was `0`, discount element absent. No Docker resources or `bewt-original/` files were modified. No dependency, pinned source, assertion, or expected result was changed. No secrets were added to the Sprint 05 documents. No commit or push occurred.

## Remaining work before publication

1. Diagnose the C01 headless-versus-manual UI discrepancy and rerun the unchanged oracle only after identifying a reproducible test setup.
2. Decide whether C02's transient rendering defect should be reported as the behavioral finding or whether a time-bounded oracle needs separate review; preserve the accepted baseline unchanged.
3. Keep empirical novelty and comparative effectiveness claims out of the paper until a controlled comparison is run.
4. Keep EC-C03 at REVISE until Team Lead review.

See [consolidated denominators](RESEARCH-METRICS-CONSOLIDATED.md), [research tables](RESEARCH-RESULTS-TABLES.md), and [defect analysis](DEFECT-VALIDATION.md).
