# Results and Discussion draft

## Results

The final Sprint 01 Gemini run produced five Gherkin candidates, all five parsed successfully. Technical review revised all five; the Team Lead accepted four for implementation and retained EC-C03 as REVISE. Source-backed behavior was confirmed by static review for the four accepted candidates. This does not establish empirical novelty: no controlled comparison or coverage experiment against the 31 BEWT cases was run.

LangGraph generated Java for the four accepted candidates. The first suite-level Maven compilation failed; after five class-level repair calls across the four candidates, final module compilation passed. The module compile design does not isolate each candidate. In Sprint 03, all four candidate invocations were BLOCKED before their application oracle. In Sprint 04, after runtime recovery, 14 official invocations reached behavior assertions 11 times: eight invocations passed and three failed; three more were blocked before the oracle. At candidate level, two of four accepted cases ended PASS (EC-C04 and repaired EC-C05); both passed three serial repeats (6/6 repeat invocations). This is feasibility evidence for two candidate flows, not a general success rate for the method.

Sprint 05 independently validated the two unresolved candidates. For EC-C02, manual UI steps cleared the cart and set the badge to zero, but the dynamic AJAX empty-state markup lacked the `Cart empty` text. The pinned JavaScript contains a missing quote in the generated class attribute. After its delayed reload, the server-rendered template displayed the expected empty state. The failure therefore reveals a confirmed transient application UI defect; the present test also asserts the text immediately after the container becomes visible, so the test is sensitive to that transition. No app patch or oracle change was applied.

For EC-C01, manual UI showed the discount and total changing from £138 to £128 after the application's automatic reload; removing the discount restored £138 after reload. This matches the session update and recalculation code. The independent headless Java run still timed out waiting for `#discount-amount`, while manual browser inspection found the expected post-reload DOM. The source does not explain this discrepancy conclusively; Sprint 05 classifies it INCONCLUSIVE. The Java failure is not counted as confirmed application behavior failure.

## Discussion

The results show a complete feasibility chain through generation, human review, module compilation, and real E2E execution for selected cases. They also expose practical weaknesses: initial generated tests needed multiple source/API and fixture/selector repairs; compile evidence was module-wide; and at least one candidate had a transient application behavior mismatch. Static source evidence was valuable for interpreting runtime failures but did not replace execution. C01 illustrates why a test failure should not be automatically attributed to application behavior when manual UI state disagrees.

The defensible claim is limited: the pipeline produced four reviewed Java tests, recovered from an initial module compile failure, and obtained repeatable E2E PASS for two accepted candidates in one pinned application. It does not demonstrate that BEWT-CovExt outperforms BEWT or improves coverage/detection. A comparative study, broader applications, an explicit mutation/coverage measure, and isolated root-cause validation of C01 remain necessary for stronger claims.

## Research-ready summary

| Claim | Evidence | Limit |
|---|---|---|
| Five AI Gherkin candidates were syntactically valid | Cucumber parser 5/5 | Syntax is not semantic correctness |
| Four accepted cases produced Java source through LangGraph | Official Sprint 03 artifacts 4/4 | Java needed repairs |
| Final Maven module compile passed | Sprint 03 compile log | Not separate per-class compilation |
| Two accepted candidates passed and repeated reliably | S04 C04/C05, 6/6 repeats | One application, small accepted sample; C02/C01 not PASS |
| C02 has malformed transient empty-state rendering | Pinned source + manual UI + Surefire failure | Correct state appears after reload; Gherkin has no timing bound |
| C01's application behavior was correct after reload in manual UI | UI state/totals and source calculations | Headless Selenium discrepancy remains unresolved |

Traceability: [consolidated metrics](RESEARCH-METRICS-CONSOLIDATED.md), [candidate tables](RESEARCH-RESULTS-TABLES.md), [defect validation](DEFECT-VALIDATION.md).
