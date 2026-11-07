# Dàn ý thuyết trình — BEWT-CovExt Feasibility Study

## Slide 1 — Vấn đề và mục tiêu

- Hạn chế trong việc phát hiện coverage gap từ bộ kiểm thử hiện có.
- Mục tiêu: feasibility của pipeline AI Agent phân tích baseline → Gherkin → human review → Selenium Java → compile/E2E.
- Nêu rõ nghiên cứu hiện tại không phải controlled comparison với BEWT.

## Slide 2 — Phạm vi và baseline

- ExpressCart upstream 1.1.19, commit `b31302f…`.
- 31 baseline tests/features; experiment Docker riêng.
- Java 21, Maven 3.9.16, Selenium 4.35, Chrome/Driver 156.
- Dùng sơ đồ pipeline và liên kết source/evidence ở runtime manifest Sprint 01/04.

## Slide 3 — Phương pháp và human review

- 5 Gherkin được sinh; 5/5 parse hợp lệ.
- 4 ACCEPT, 1 REVISE (EC-C03), 0 REJECT.
- Giải thích syntax validity, source-backed review và novelty là ba khái niệm khác nhau.

## Slide 4 — Java generation và compile

- 4/4 class được LangGraph sinh.
- Compile module lần đầu FAIL; sau 5 class-level repair calls final module compile PASS.
- Maven compile là module-level, không báo cáo như bốn lần compile riêng.

## Slide 5 — E2E outcomes

- S03: 4/4 BLOCKED trước oracle vì app/fixture.
- S04: 14 invocation = 8 PASS, 3 FAIL, 3 BLOCKED; 11 đạt behavior oracle.
- Candidate-level: 2/4 final PASS; 6/6 repeats cho EC-C04 và EC-C05.
- Hiển thị rõ mẫu số invocation và candidate.

## Slide 6 — Defect validation

- C02: UI cart count 0, empty state tạm rỗng; malformed markup source; sau reload đúng. CONFIRMED_APP_DEFECT (transient UI).
- C01: £138 → £128 sau reload; remove về £138; Java headless timeout vẫn mâu thuẫn. INCONCLUSIVE.
- Dùng hai ảnh/evidence: C02 screenshot failure và DOM observation JSON; không dùng ảnh teardown làm bằng chứng trạng thái lỗi.

## Slide 7 — Kết luận có thể bảo vệ

- Feasibility được chứng minh trên một ứng dụng và hai candidate E2E pass lặp lại.
- Chưa chứng minh phương pháp tốt hơn BEWT hoặc đạt novelty coverage empirically.
- Phân biệt lỗi app, test implementation, fixture và environment.

## Slide 8 — Hạn chế và công việc tiếp theo

- Cô lập C01 headless mismatch; sửa test synchronization trong bản sao, giữ oracle.
- Với C02, mở issue riêng/patch isolated baseline sau khi Team Lead chấp thuận; lưu BEFORE/AFTER.
- Mở rộng có kiểm soát sang phần candidate còn lại, rồi mới thử nghiệm đối chứng coverage.
- Nhắc status EC-C03 vẫn REVISE.

## Q&A evidence index

- Metrics: [RESEARCH-METRICS-CONSOLIDATED.md](RESEARCH-METRICS-CONSOLIDATED.md).
- Tables: [RESEARCH-RESULTS-TABLES.md](RESEARCH-RESULTS-TABLES.md).
- Defect evidence: [DEFECT-VALIDATION.md](DEFECT-VALIDATION.md).
- Threats to validity: [THREATS-TO-VALIDITY.md](THREATS-TO-VALIDITY.md).
