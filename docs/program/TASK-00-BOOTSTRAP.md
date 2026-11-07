# Task 00 — Đồng bộ contract, kiểm kê GitHub thực tế và lập kế hoạch triển khai 8 ứng dụng

## Giao nhiệm vụ cho Codex Agent

**Mục tiêu:** đưa bộ tài liệu `AGENTS.md` + `docs/program/` vào repository, kiểm tra chính xác current repository và tạo một kế hoạch implementation có task dependencies/acceptance; commit & push một nhánh và PR để Team Lead/ChatGPT review **code thực tế**. Task 00 không yêu cầu thay đổi ứng dụng hay Docker.

**Nguồn file:** các file Markdown/JSON do ChatGPT cung cấp trong `bewt-covext-contract/`. Người vận hành đặt đúng các relative paths dưới repo; nếu Agent không thể truy cập nội dung file, yêu cầu cung cấp chúng thay vì tự sáng tác lại với tên giống nhau.

**Import:** ưu tiên file `BEWT-CovExt-T00-Governance.patch` do Team Lead tải về và đặt tại đường dẫn máy local được cung cấp. Chạy `git apply --check <duong-dan-patch>` trước khi `git apply <duong-dan-patch>` trên task branch/worktree mới. Patch tạo đúng 7 file, không thay đổi file sẵn có. Nếu không có patch, chép 7 file từ các link tải riêng theo đúng đường dẫn.

## Bắt buộc thực hiện

1. Kiểm tra git remote trỏ tới `https://github.com/NgaiLong49423/BEWT-CovExt`, refresh `origin/main` và lưu base SHA; so sánh với `44bd7c4d...` đã quan sát. Đọc `.gitignore`, kiểm kê read-only working tree; không xóa 50 dirty Gradle/build artifacts trong `bewt-original/`.
2. Tạo task branch từ remote `main` mới nhất, tốt nhất `docs/t00-program-contract`; nếu repo đang dirty, dùng worktree riêng để không ảnh hưởng file ngoài scope.
3. Đưa `AGENTS.md` và 6 file tại `docs/program/` vào đúng vị trí. Kiểm tra JSON parse, Markdown links, tên file và phần release trong `.gitignore`. Không tự thay mục tiêu 8 app/40 test.
4. Kiểm kê source hiện có: ExpressCart agent, scripts, configs, generated tests, run evidence, Gherkin, commits; ghi **file và class cụ thể** chứng minh các node/roles thực sự có/thiếu. Đối chiếu đề cương 8-app và các mismatch BEWT Base/Gherkin.
5. Tạo `docs/tasks/T00/TASK-REPORT.md`, `docs/tasks/T00/REPO-STATE-AND-GAPS.md` và `docs/tasks/T00/NEXT-TASK-PLAN.md`. Kế hoạch phải làm rõ T01 framework extraction, T02 app audits/G0, T03 G0 rollout, T04 coverage, T05 generation/validation, T06 evaluation, T07 final report; nhiệm vụ đầu tiên phải đủ nhỏ để chạy và review.
6. Cập nhật `docs/program/STATUS.json` **chỉ** khi đã có evidence mới, không tự đánh dấu gate ACCEPTED. Các fields null/NOT_VERIFIED phải giữ nếu chưa đo.
7. Validate tất cả tài liệu được tạo và mã liên kết; kiểm tra `git diff --cached`/secret scan trước commit. Chỉ stage files thuộc `AGENTS.md`, `docs/program/`, `docs/tasks/T00/`.
8. **Commit + push nhánh task** lên GitHub, mở PR hướng `main` nếu xác thực cho phép; tuyệt đối không merge hoặc push thẳng `main`. Kiểm tra remote SHA đúng với local HEAD sau push.
9. Trong thông báo kết thúc, xuất: branch, full SHA, PR URL (nếu có), mọi file vừa tạo với repo-relative path, status PASS/PARTIAL/BLOCKED, danh sách tests/checks + evidence path, việc cần Team Lead quyết định. Nếu không được push do credential/403, công khai `PUSH_BLOCKED` và giữ tất cả local changes, không nói đã publish.

## Nghiệm thu T00

- Repo remote chứa governance docs ở nhánh feature với full SHA xác minh được.
- Có báo cáo **dựa trên source code thực**, không chỉ lặp proposal; có gap list, các lựa chọn kiến trúc và next task có acceptance criteria.
- Không sửa bất kỳ file dưới `bewt-original/`, không ảnh hưởng Docker, không leak secrets, không sửa raw Sprint 01–05 evidence.
- Team Lead/ChatGPT có thể đọc trực tiếp PR diff, `STATUS.json`, T00 reports, source links để quyết định T01.

**Kết thúc tại review gate.** Không bắt đầu rewrite framework hoặc triển khai cả bảy app còn lại trước khi task T00 được review và chốt T01.
