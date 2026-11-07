# Evidence Index — Sprint 01–05

Mục tiêu index là cho phép truy từ kết luận cuối về raw evidence; các report cũ được giữ làm lịch sử, metrics gốc không bị ghi đè.

## Đóng gói và sử dụng ngoài repository

Không tìm thấy `final.zip` trong repository tại thời điểm rà soát; ZIP đang có trong workspace là ChromeDriver distribution, không phải gói nộp nghiên cứu. Bảy tài liệu final dùng liên kết tương đối đến evidence Sprint 01–05 và `experiments/expresscart/`, nên thư mục `final/` riêng lẻ không tự đầy đủ.

Để có package độc lập, giữ nguyên cấu trúc đường dẫn và gồm: toàn bộ `docs/research-results/final/`; báo cáo, metrics và raw evidence liên quan trong `docs/research-results/sprint-01/` đến `sprint-05/`; `experiments/expresscart/SOURCE-LOCK.json`, runtime/source manifests, source files được trích dẫn, Java generated tests, generation prompts/responses, repair history, Surefire XML, logs và screenshots được dẫn trong index. Không đưa `.env`, credentials, dữ liệu user thật, cache/build outputs hay ChromeDriver archive vào gói nộp. Nếu không tạo archive này, nộp kèm repository checkout/commit có các đường dẫn evidence nguyên vẹn; demo runbook vẫn cần experiment runtime và fixture riêng.

| Claim/table | Evidence chính | Dùng để xác nhận | Status / limit |
|---|---|---|---|
| Source pin/runtime | [S01 runtime manifest](../../../experiments/expresscart/evidence/runtime-manifest.json), [source lock](../../../experiments/expresscart/SOURCE-LOCK.json), [S04 runtime manifest](../sprint-04/runtime/runtime-manifest.json) | Commit, package version, Docker project, image IDs, versions, readiness | VERIFIED tại thời điểm capture |
| Baseline smoke/reset | [S01 AddUser pre-reset](../../../experiments/expresscart/evidence/addusertest-admin-fixture-run1.log), [post-reset](../../../experiments/expresscart/evidence/addusertest-post-reset-run2.log) | Adapted AddUserTest pass trước/sau scoped reset | 2/2 runs; không phải 31-test run |
| Gherkin generation | [S01 candidate output](../sprint-01/runs/2026-11-02T07-06-24-329Z-b9a90ab1/CANDIDATES-UNREVIEWED.feature), [S01 metrics](../sprint-01/metrics.json) | 5 candidates, parser 5/5, string/lexical checks | Không chứng minh semantic validity/novelty |
| Technical/human review | [S02 technical review](../sprint-02/CANDIDATE-REVIEW.md), [decision JSON](../sprint-02/human-review-decisions.json), [S03 result](../sprint-03/SPRINT-03-RESULTS.md) | Four ACCEPT, one REVISE; reviewer Team Lead | Decisions not E2E acceptance |
| Java generation/compile | [official LangGraph generation](../sprint-03/generation/langgraph-run/README.md), [first compile](../sprint-03/compilation-langgraph-first-attempt.log), [final compile](../sprint-03/compilation-langgraph-final.log), [repair history](../sprint-03/langgraph-repair-history.json) | Four classes, first module fail, five class-level repairs, final module pass | Compile measured at module level |
| S03 BLOCKED | [S03 metrics](../sprint-03/metrics.json), [S03 E2E](../sprint-03/e2e/langgraph-final/) | Four invocations blocked before behavior oracle | Not behavioral FAIL |
| S04 official invocation stats | [S04 metrics JSON](../sprint-04/metrics.json), [run metrics CSV](../sprint-04/run-metrics.csv), [Surefire index](../sprint-04/surefire-index.json) | 14 invocations, 8 PASS/3 FAIL/3 BLOCKED, 11 reached oracle | Four exploratory C04 runs excluded |
| S04 repair/repeats | [repair history](../sprint-04/repair-history.json), [C04 verified runs](../sprint-04/e2e/EC-C04/), [C05 repeatability](../sprint-04/fixtures/EC-C05-repeatability.txt) | Four S04 repair iterations; two passing candidates, six repeats | Two candidate scenarios, not six independent candidates |
| C02 S05 validation | [S05 Java XML](../sprint-05/e2e/EC-C02/TEST-tests.EmptyCartTest.xml), [console](../sprint-05/e2e/EC-C02/independent-validation-console.log), [screenshot](../sprint-05/e2e/EC-C02/independent-run/screenshots/testEmptyCartContainingProduct.png), [manual observations](../sprint-05/evidence/manual-ui-observations.json), [pinned source JS](../../../experiments/expresscart/source/public/javascripts/expressCart.js), [cart template](../../../experiments/expresscart/source/views/themes/Cloth/cart.hbs) | AJAX empty state blank, cart count zero, server-rendered state after reload | CONFIRMED_APP_DEFECT (transient UI) |
| C01 S05 validation | [S05 Java XML](../sprint-05/e2e/EC-C01/TEST-tests.RemoveDiscountCodeTest.xml), [console](../sprint-05/e2e/EC-C01/independent-validation-console.log), [manual observations](../sprint-05/evidence/manual-ui-observations.json), [route](../../../experiments/expresscart/source/routes/index.js), [cart math](../../../experiments/expresscart/source/lib/cart.js) | UI totals after reload vs headless timeout | INCONCLUSIVE; exact Selenium browser session DOM trace absent |
| Official S01/S03 model usage | [S01 metrics](../sprint-01/metrics.json), [S03 metrics](../sprint-03/metrics.json) | Model/calls/provider telemetry | Raw numbers retained; totals inconsistent, cost unavailable |
| Final corrected interpretation | [readiness review](FINAL-READINESS-REVIEW.md) | Log of wording/denominator corrections | No raw S01–S04 metric JSON edited |

## Sprint report index

- [Sprint 01](../sprint-01/SPRINT-01-RESULTS.md)
- [Sprint 02](../sprint-02/SPRINT-02-RESULTS.md)
- [Sprint 03](../sprint-03/SPRINT-03-RESULTS.md)
- [Sprint 04](../sprint-04/SPRINT-04-RESULTS.md)
- [Sprint 05](../sprint-05/SPRINT-05-RESULTS.md)
- [Final research report](FINAL-RESEARCH-REPORT.md)
- [Final results tables](FINAL-RESULTS-TABLES.md)
- [Presentation content](FINAL-PRESENTATION-CONTENT.md)
- [Demo runbook](DEMO-RUNBOOK.md)
- [Defense Q&A](DEFENSE-QA.md)
