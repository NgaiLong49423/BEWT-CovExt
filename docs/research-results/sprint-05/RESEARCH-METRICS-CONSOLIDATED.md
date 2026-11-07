# Metrics tổng hợp Sprint 01–05

## Quy tắc đếm

- **Candidate** là một kịch bản EC-Cxx duy nhất; các lần chạy lặp lại không tăng candidate count.
- **Invocation** là một lần gọi test method có evidence. Run exploratory có fixture chưa được preflight được giữ lại nhưng không gộp vào official Sprint 04 denominator.
- **Compile** được Maven thực hiện ở cấp module; không suy diễn số compile riêng từng class từ kết quả module.
- `BLOCKED` là dừng trước oracle vì runtime/fixture; không tính là hành vi ứng dụng FAIL. `INCONCLUSIVE` giữ nguyên khi chưa cô lập được chênh lệch.
- Các số Sprint 01–04 là số gốc theo evidence sprint đó; Sprint 05 bổ sung phân loại sau xác minh và không ghi đè lịch sử.

## RQ1 — Gherkin, human review và Java generation

| Metric | Kết quả | Mẫu số / giải thích | Evidence |
|---|---:|---|---|
| Original candidate generated | 5 | Một run chính thức hoàn tất trong tập 5 candidates | [S01 metrics](../sprint-01/metrics.json), [candidate output](../sprint-01/runs/2026-11-02T07-06-24-329Z-b9a90ab1/CANDIDATES-UNREVIEWED.feature) |
| Gherkin syntax valid | 5/5 | Parse candidates gốc; cú pháp không chứng minh tính đúng | [S01 metrics](../sprint-01/metrics.json) |
| Evidence-reference string check | 5/5 | Kiểm tra lexical string, không phải semantic grounding | [S01 metrics](../sprint-01/metrics.json) |
| Lexical duplicate hints | 0/5 | Heuristic không chứng minh novelty | [S01 metrics](../sprint-01/metrics.json) |
| Technical reviews / revised features syntax | 5/5, 5/5 | Một candidate EC-C03 được yêu cầu revise | [S02 metrics](../sprint-02/metrics.json), [review](../sprint-02/CANDIDATE-REVIEW.md) |
| Team Lead accepted / revised / rejected | 4 / 1 / 0 | 5 candidates; EC-C03 giữ REVISE | [S03 report](../sprint-03/SPRINT-03-RESULTS.md), [decisions](../sprint-02/human-review-decisions.json) |
| Human revision count | 1 | EC-C03; quyết định là revise, không phải acceptance | [S03 metrics](../sprint-03/metrics.json) |
| Source-backed behavior, accepted scenarios | 4/4 | Static source review trên 4 accepted candidates; không đồng nghĩa E2E pass | [S03 result tables](../sprint-03/research-ready-result-tables.md) |
| Empirical novelty evaluation | NOT_EVALUATED | Không có kiểm định coverage/novelty thực nghiệm hoặc đối chứng; trường lịch sử `noveltyEmpiricallyVerified: 0` chỉ có nghĩa chưa candidate nào được xác nhận, không phải tỷ lệ novelty đo được 0% | [S03 metrics](../sprint-03/metrics.json) |
| Official LangGraph Java generation | 4/4 | 4 accepted candidates; official path only | [S03 metrics](../sprint-03/metrics.json) |
| First module compile | FAIL | Maven module chứa cả 4 class; 0/4 class có first-attempt module PASS | [S03 first/final compile](../sprint-03/compilation-langgraph-first-attempt.log), [metrics](../sprint-03/metrics.json) |
| Final module compile after repairs | PASS; 4/4 class included | Module compile thành công, 38 test source files ở S03 | [S03 final compile](../sprint-03/compilation-langgraph-final.log) |
| Generation/compiler repair rounds | 5 class-level repair calls | EC-C02:1, C04:1, C01:1, C05:2; tối đa 2 mỗi candidate | [S03 repair history](../sprint-03/langgraph-repair-history.json) |

## RQ2 — E2E execution and repeatability

| Scope / metric | Result | Denominator | Evidence |
|---|---:|---|---|
| Baseline AddUserTest | PASS 2/2 | 1 class, pre- and post-reset | [S01 report](../sprint-01/SPRINT-01-RESULTS.md), [post-reset XML](../../../experiments/expresscart/bewt-suite/target/surefire-reports/TEST-tests.AddUserTest.xml) |
| Sprint 03 official candidate invocation | 0 PASS; 4 BLOCKED | 4 accepted candidates; none reached behavior oracle | [S03 metrics](../sprint-03/metrics.json) |
| Sprint 04 official candidate invocations | 14 total: 8 PASS, 3 FAIL, 3 BLOCKED | Method invocations, not unique tests | [S04 run metrics](../sprint-04/run-metrics.csv), [S04 metrics](../sprint-04/metrics.json) |
| Sprint 04 behavior oracle reached | 11/14 | 11 PASS/FAIL outcomes; 3 pre-oracle blocks | [S04 metrics](../sprint-04/metrics.json) |
| Sprint 04 candidate first-attempt PASS | 1/4 | One outcome per accepted candidate | [S04 metrics](../sprint-04/metrics.json) |
| Sprint 04 final candidate PASS | 2/4 | EC-C04, EC-C05; C05 after repair | [S04 metrics](../sprint-04/metrics.json) |
| Sprint 04 repeats | 6/6 PASS | 3 serial repeats each for C04/C05; candidate-level repeatability 2/2 candidates | [S04 report](../sprint-04/SPRINT-04-RESULTS.md) |
| Sprint 04 exploratory C04 runs | 4 PASS; excluded | Missing recorded exact-email absence preflight; evidence retained separately | [exploratory CSV](../sprint-04/exploratory-runs.csv) |
| Sprint 05 independent reruns | C01 FAIL-to-oracle; C02 FAIL-at-assertion | One invocation per candidate, not new candidates; C01 classification INCONCLUSIVE; C02 transient UI defect confirmed | [C01 XML](e2e/EC-C01/TEST-tests.RemoveDiscountCodeTest.xml), [C02 XML](e2e/EC-C02/TEST-tests.EmptyCartTest.xml), [UI evidence](evidence/manual-ui-observations.json) |

Official Sprint 04 history: 4 Sprint 03 invocations were blocked, followed by 14 Sprint 04 invocations. Sprint 05 ran 2 targeted invocations for defect validation. Those totals describe chronology only; they are not a denominator for independent test quality because the same four candidates were reused and several runs were repeats/repairs. Candidate-level final E2E PASS remains **2/4** (C04/C05); C02 and C01 are not PASS, with Sprint 05 classifications in [DEFECT-VALIDATION.md](DEFECT-VALIDATION.md).

## RQ3 — Failure categories and repair effectiveness

| Category / outcome | Observed evidence | Counts and scope |
|---|---|---|
| Generation/code | Initial Java module compile failed from API mismatch; repair produced a passing final module compile | S03: 1 failed module attempt, 5 class-level repairs, 1 final pass; not 4 independent compile attempts |
| Selector/fixture | C02 modal selector repaired; C01 setup/visible-total preconditions blocked before oracle twice | S04 invocation counts: C02 selector error 1; C01 pre-oracle blocked 2; see `run-metrics.csv` |
| Cleanup/test data | C05 initial content assertion plus teardown issue; repair resolved and cleanup verified | S04: one initial failed method invocation, then 4 passing invocations including 3 repeats |
| Environment | All 4 candidate runs in S03 blocked because app unavailable/config absent; S04 runtime recovered | S03 4/4 blocked; S04 environment category 0; independent S05 C01 ChromeDriver failure was resolved by selecting pinned local driver, then test reached oracle |
| Behavioral failures initially classified by S04 | C02 empty message; C01 discount amount absent; C05 first content mismatch | 3 behavior-failing invocations in 14; S05 confirms C02 transient markup issue, C01 remains INCONCLUSIVE, C05 is repaired test/data synchronization outcome |
| Repair outcome | C04 no repairs and pass; C05 pass after repair; C01/C02 not candidate PASS | S04 repair iterations 4 total; candidate outcome table in S04 metrics |

## Model and token usage

| Run | Model / calls | Input / output / provider total | Status |
|---|---|---|---|
| S01 final candidate generation | `gemini-3.8-flash`; 1 successful final generation request | 6,210 / 1,189 / 9,246 | Provider total conflicts with input + output (7,399); cost not reported |
| S03 official LangGraph pipeline | `gemini-3.8-flash`; 9 successful structured responses | 25,180 / 10,500 / 66,750 | Provider total kept separate; cost not calculated |
| S03 superseded direct-call history | 12 responses | 28,791 / 16,497 / 84,997 | Excluded from official generation metrics; historical artifacts retained |
| S02, S04, S05 | 0 calls in each sprint | Not applicable | No model call in these phases |

Do not present the sum of provider `total_tokens` as a verified token count. The provider-reported telemetry conflicts with component sums; cost remains unavailable. See [S01 metrics](../sprint-01/metrics.json) and [S03 metrics](../sprint-03/metrics.json).

