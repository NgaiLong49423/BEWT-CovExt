# BEWT-CovExt — Program Contract / Hợp đồng triển khai nghiên cứu

**Phiên bản:** 1.0 — 2026-11-07
**Nguồn phạm vi ưu tiên:** `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` (v2.0, 20/10/2026).
**Repository:** `https://github.com/NgaiLong49423/BEWT-CovExt` (public).
**Mốc remote đã quan sát trước khi lập contract:** `main` tại `44bd7c4d7de683afbf1b14ac65c0b43db5950d8c`. Đọc lại remote trước mỗi task, không coi mốc này bất biến.

## 1. Tầm nhìn và sản phẩm nghiên cứu

**Mục tiêu:** tạo **BEWT-CovExt: phần mở rộng benchmark BEWT dựa trên coverage-guided AI Agent**. AI Agent là **phương pháp**; sản phẩm quan trọng là tập case mới có Gherkin, Java/Selenium, nguồn gốc, kiểm chứng thực thi và quy trình tái lập. Không chuyển mục tiêu thành chỉ viết framework, chỉ sinh test, chỉ cải tiến tỷ lệ PASS hoặc chỉ hoàn thiện báo cáo.

**Phạm vi:** 8 web applications trong BEWT Extended, dự kiến 5 Gherkin + 5 Java/Selenium E2E cases mới cho mỗi app: **40 cases mục tiêu**. Đây là stretch goal (mục tiêu tham vọng), KHÔNG được coi là 40 đã sinh, 40 đã review hay 40 đã VALIDATED. Bằng chứng có thể dẫn đến số VALIDATED thấp hơn; phải báo đúng số.

**Đóng góp dự kiến:** (C1) benchmark delta đa ứng dụng với case mới; (C2) workflow Agent phân tích gap → Gherkin → Selenium → validation → human approval; (C3) schema/evaluation protocol cho phép người khác kiểm chứng lại.

## 2. App inventory và phạm vi gốc

Các nhãn version và counts bên dưới **là từ đề cương**, chưa đồng nghĩa đã pin/chạy runtime. ExpressCart có nhãn BEWT `1.19` nhưng source upstream đã kiểm chứng độc lập là package `1.1.19`; ghi mối quan hệ này trong manifest, không tự giả định hai source hoàn toàn tương đương.

| App | BEWT Base version (đề cương) | Original business cases (đề cương) | Mục tiêu mới |
|---|---|---:|---:|
| Bludit | 2.3.4 | 23 | 5 |
| Claroline | 1.11.10 | 40 | 5 |
| ExpressCart | 1.19 (nhãn benchmark) | 31 | 5 |
| Joomla | 3.10.11 | 35 | 5 |
| Kanboard | 1.2.15 | 30 | 5 |
| MantisBT | 1.2.0 | 37 | 5 |
| MediaWiki | 1.40.0 | 27 | 5 |
| PrestaShop | 1.6.1.23 | 35 | 5 |
| **Tổng** | | **258** | **40** |

Audit cũ ghi có chênh lệch giữa 258 business case entries với file Gherkin/Scenario headers thực tế. **Không tự sửa đầu vào cho khớp 258**; thống kê chính xác và lưu mapping/mismatch.

## 3. Bốn câu hỏi nghiên cứu — RQ1–RQ4

| RQ | Câu hỏi | Bằng chứng cần có |
|---|---|---|
| RQ1 — Scenario Novelty & Validity | Bao nhiêu candidate hợp lệ, khác benchmark cũ, được reviewer duyệt? | Review rubric, acceptance rate, rejected reasons, semantic comparison by app |
| RQ2 — Behavioral Coverage Gain | Các test bổ sung bao phủ hành vi/điều kiện mới nào? | Pre/post behavior inventory, coverage matrix, numerator/denominator theo app |
| RQ3 — Executability & Stability | Java/Selenium có compile, chạy đúng oracle, ổn định sau reset? | First/final build, E2E XML, fixtures, 3 reruns, cleanup, failure taxonomy |
| RQ4 — Agent Workflow Utility | Agent cần bao nhiêu effort: sửa, thời gian, can thiệp người, token/chi phí? | Call/repair log, time, reviewer actions, provider usage; cost nếu có cơ sở |

Không được thay RQ2 bằng tỷ lệ file Gherkin hợp cú pháp. So sánh Agent tốt hơn single-prompt/thủ công cần thí nghiệm đối chứng riêng; **không bắt buộc để báo RQ4 về effort nội tại**, nhưng không được claim ưu thế khi chưa đo.

## 4. Định nghĩa trạng thái, theo đúng đối tượng

- **PROPOSED:** AI đề xuất, chưa qua review nghiệp vụ.
- **REVIEWED / ACCEPTED_FOR_IMPLEMENTATION:** người có trách nhiệm chấp thuận thử triển khai; chưa chứng minh novelty/behavior/runtime.
- **IMPLEMENTED:** có Java test và liên kết tới scenario; compile status riêng.
- **VALIDATED:** case có traceability tới benchmark version/commit, reviewer duyệt tính mới + oracle, fixture/precondition có căn cứ, Java assertions phản ánh oracle, ít nhất một E2E PASS và **3/3 reruns theo protocol reset/cleanup xác minh**, có source/evidence/commit đủ tái lập. Nếu điều kiện nào thiếu: không được nâng VALIDATED.
- **REJECTED / INCONCLUSIVE / BLOCKED / NOT_RUN / NOT_EVALUATED:** trạng thái riêng, không tự chuyển thành FAIL hoặc PASS.

## 5. Ranh giới đã hoàn thành

Sprint 01–05 xác minh **ExpressCart feasibility**, không phải nghiệm thu 8-app program: upstream ExpressCart `b31302f4e99c3293bd742c6d076a721e168118b0`, runtime `1.1.19`; baseline `AddUserTest` trước/sau reset PASS; 5 Gherkin proposed, 4 accepted để triển khai, 4 Java tests sinh; 2/4 final E2E PASS (C04/C05), 6/6 repeats trên hai case, C02 transient UI app defect, C01 inconclusive, C03 vẫn revise. Behavioral coverage gain và empirical novelty là **NOT_EVALUATED**. Nguồn: `docs/research-results/final/` và Sprint 01–05.

## 6. Nghiệm thu tổng thể

Program chỉ có thể kết luận đạt toàn bộ mục tiêu **khi** từng app hoàn tất G0–G4; D1–D8 có evidence theo `ACCEPTANCE-MATRIX.md`; 8 app có coverage matrix và phân loại chính xác số case PROPOSED/ACCEPTED/VALIDATED; RQ1–RQ4 được trả lời bằng dữ liệu thực. Nếu không đạt 40 validated, ghi target vs actual và lý do; không hạ tiêu chí hoặc tuyên bố xong chỉ vì đã viết báo cáo.

Mọi thay đổi phạm vi, protocol hay oracle cần decision record của Team Lead trước khi sửa vào contract. Không tự điều chỉnh các tiêu chí để đạt PASS.
