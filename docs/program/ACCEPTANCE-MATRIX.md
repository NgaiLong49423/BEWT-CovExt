# BEWT-CovExt — Acceptance Matrix / Ma trận nghiệm thu

**Áp dụng cho:** cả 8 ứng dụng, bốn vai trò AI Agent và D1–D8 theo đề cương v2.0. **Mặc định:** `NOT_STARTED`/`NOT_VERIFIED` cho phần không có evidence, KHÔNG giả lập PASS.

## A. G0–G4: Điều kiện theo từng app

| Gate | Mục đích | Điều kiện PASS (tối thiểu) | Bằng chứng bắt buộc |
|---|---|---|---|
| **G0 Environment** | Runtime và baseline tái lập được | App/version/commit hoặc image digest đã khóa; Docker isolated; HTTP/DB readiness; ít nhất 1 Base test có assertion PASS; seed/reset được kiểm chứng, không tác động dự án khác | `config/apps/<app>.json`, runtime manifest, ownership checks, Base XML/log, reset before/after |
| **G1 Dataset/Coverage** | Phát hiện gap có nghĩa | Inventory source Gherkin + Base mapping; coverage matrix; ~8–12 proposals nếu có thể; 5 case mục tiêu/app được review (không ép duyệt case sai); oracle/novelty do reviewers ghi quyết định | baseline inventory, candidate list, rubric, rejected/revised reasons, human approval |
| **G2 Framework** | Orchestrator chạy được thực chất | LangGraph có state/checkpoint, 4 vai trò rõ (coverage, Gherkin, Selenium, validation), fixed tool allowlist, human pause/resume, bounded repair; ít nhất 1 full vertical slice và test tự động | code/graph config, node/tool tests, trace run, gate logs, PR diff |
| **G3 Validation** | Case chạy đúng và có thể tái lập | Mỗi selected case có original + revised Gherkin, generated Java + first source, oracle check, fixture, first compile/run, repair history, reset/cleanup, 3 reruns; status theo case được phân loại | JUnit XML, logs, screenshot khi fail, DB before/after, candidate result JSON |
| **G4 Research Release** | Dataset/evaluation có thể kiểm toán | App manifest, kết quả từng case, 3-rerun summary, RQ1–RQ4 contribution, metrics với mẫu số, reproduction steps, reviewer sign-off; không claim undocumented results | research dataset, scripts, evidence index, metrics CSV/JSON, acceptance record |

**Lưu ý:** G2 là gate kiến trúc cấp framework; kiểm tra full functionality qua một app trước, rồi kiểm tra lại bằng adapter trên các app khác. Không tính một app PASS G2 là đủ để kết luận tích hợp 8 app PASS.

## B. Deliverables theo đề cương

| ID | Sản phẩm | Nghiệm thu |
|---|---|---|
| **D1** | AI Agent Framework source | 4 role nodes + orchestration/checkpoints + tool calling + HITL + bounded repairs + automated tests; không dùng scripts ExpressCart-only làm bằng chứng tái sử dụng 8 app |
| **D2** | Baseline manifests cho 8 app | 8/8 pin/version/runtime/seed/reset/Base smoke; giữ nguyên các mismatch của BEWT nếu có |
| **D3** | Coverage matrix cho 8 app | Pre/post behavioral inventory, mapping original Gherkin/Base, gap evidence, reviewer decisions |
| **D4** | 40 Gherkin mới (mục tiêu) | 5/app được lựa chọn/review, verified oracle & novelty, không trùng; ghi số chưa đạt và lý do |
| **D5** | 40 Java/Selenium tests (mục tiêu) | 1+ implementation/case, first source, compile/run/3 reruns, validated status có chứng cứ |
| **D6** | Research dataset | machine-readable JSON/CSV/JSONL: candidates, approvals, outcomes, provenance, rejected/revisions |
| **D7** | Evaluation & replication | rubric, scripts, runbooks, reset, reproducer versions, threat analysis, secret-free evidence |
| **D8** | Báo cáo khoa học | RQ1–RQ4 trả lời bằng dữ liệu, coverage gain đo theo inventory chứ không chỉ cộng 258+40 |

## C. Chính sách trạng thái và review

- **Engineering outcome:** `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `INCONCLUSIVE`, `NOT_EVALUATED`; tách runtime, fixture, compile, behavior, cleanup.
- **Task review:** `IN_PROGRESS`, `READY_FOR_REVIEW`, `CHANGES_REQUESTED`, `ACCEPTED`, `BLOCKED`; chỉ Team Lead có quyền ghi quyết định cuối cùng; Agent ghi đề xuất và evidence.
- **Candidate decision:** `PROPOSED`, `REVISE`, `REJECTED`, `ACCEPTED_FOR_IMPLEMENTATION`, `VALIDATED`; trạng thái VALIDATED phải đủ 4 thành phần: novelty/oracle approved + Java/E2E PASS + reruns theo protocol + provenance.
- **Measurement:** số candidate khác số invocation; rerun không tăng sample độc lập; compile toàn Maven module không được diễn giải thành per-class compile PASS; NOT_EVALUATED khác 0%; BLOCKED khác behavioral FAIL.

## D. Thẩm định remote (bắt buộc sau mỗi task)

1. Đọc PR diff thực tế trên GitHub, đối chiếu mô tả với changed files và phạm vi task.
2. Đọc trực tiếp source, tests, fixtures, run logs và metrics JSON qua đường dẫn `blob/<branch>/<path>` hoặc full SHA; không chỉ đọc report tổng kết.
3. Xác nhận các kiểm thử có evidence tương ứng với **cùng commit/phiên bản/runtime**; thiếu evidence → `NOT_VERIFIED`, không tự PASS.
4. Kiểm tra data consistency, source pin, `bewt-original/` không bị sửa, không có secrets hoặc tài nguyên ngoài experiment bị ảnh hưởng.
5. Ghi review decision với yêu cầu sửa cụ thể; Agent sửa trên **cùng PR** bằng commit mới (trừ khi phạm vi thay đổi, tạo task mới).
6. Không merge `main` trước khi Team Lead phê duyệt. Nếu CI không có, local evidence bắt buộc và được gắn trạng thái `LOCAL_VERIFIED`, không biến thành `CI_PASS`.

## E. Phạm vi từ nay đến task kế tiếp

**Đã kiểm tra trên GitHub:** nhánh main commit `44bd7c4d7de683afbf1b14ac65c0b43db5950d8c`, có evidence Sprint 01–05 và code Agent ExpressCart; repo không track `bewt-original/` vì gitignore. **Chưa có bằng chứng:** 7 app còn lại G0, coverage matrices đủ 8, 40 validated cases, full reusable four-role graph. Task 00 phải xác minh các khoảng trống này, không tự điền PASS.
