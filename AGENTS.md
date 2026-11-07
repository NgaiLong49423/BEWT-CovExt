# BEWT-CovExt — Quy tắc bắt buộc cho Coding Agent

Trước khi phân tích, lập kế hoạch, sửa code hoặc chạy thực nghiệm, đọc theo thứ tự:
1. `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` — đề cương v2.0, hợp đồng phạm vi nghiên cứu.
2. `docs/program/PROGRAM-CONTRACT.md` — mục tiêu, nguyên tắc, định nghĩa các kết quả.
3. `docs/program/ACCEPTANCE-MATRIX.md` — gate và điều kiện nghiệm thu.
4. `docs/program/IMPLEMENTATION-ROADMAP.md` — thứ tự và kiến trúc triển khai.
5. `docs/program/STATUS.json` — trạng thái đã có bằng chứng, không tự nâng trạng thái.
6. `docs/program/TASK-HANDOFF-TEMPLATE.md` — cấu trúc báo cáo mỗi nhiệm vụ.

## Nguyên tắc không thương lượng
- Mục tiêu gốc: **8 ứng dụng, tối đa mục tiêu 5 kịch bản mới/ứng dụng = 40 case**. Không tự thay scope thành ExpressCart-only feasibility study.
- Source `bewt-original/` là nguồn nghiên cứu đọc-only; không tự reset, clean, sửa hoặc stage. Repository ngoài bỏ qua thư mục này.
- Không sửa/xóa tài nguyên Docker hoặc dữ liệu của dự án khác; mọi thao tác có khả năng xóa chỉ áp dụng tài nguyên thuộc experiment được xác minh ownership.
- Không đưa `.env`, credentials, tokens, email thực, bản dump DB, cache/build artifact, file quá lớn hoặc bằng chứng chưa lọc vào Git (repository là **public**).
- Dùng một task = một nhánh/PR có phạm vi rõ; không push thẳng `main`, không force push và không tự merge khi chưa có quyết định Team Lead.
- Báo cáo `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `INCONCLUSIVE`, `NOT_EVALUATED` theo bằng chứng. `ACCEPTED` để triển khai KHÔNG bằng `VALIDATED`.
- Kết thúc **mọi task**: lưu file báo cáo + bằng chứng (đường dẫn tương đối), cập nhật `docs/program/STATUS.json` đúng phạm vi, commit và push nhánh, mở PR nếu được; gửi full SHA, branch, PR URL và file paths. Nếu push không thành công, nêu rõ `PUSH_BLOCKED` và không tuyên bố đã publish.
- Chỉ tuyên bố nghiệm thu khi Team Lead đã review kết quả thực tế trên GitHub và chấp thuận; Coding Agent không tự ghi ACCEPTED gate cho chính mình.

Các tài liệu `docs/research-results/final/` hiện tại ghi lại nghiên cứu ExpressCart. Giữ nguyên lịch sử, không dùng chúng để thay thế mục tiêu 8 ứng dụng. Mọi tài liệu mới phải có evidence liên kết tới source/code/commit/lần chạy thật.
