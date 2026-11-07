# Defense Q&A — câu hỏi có thể gặp

## 1. Nghiên cứu đã hoàn thành bao nhiêu test mới?

Có 5 Gherkin candidates được sinh; 4 được Team Lead ACCEPT, EC-C03 giữ REVISE. Java được sinh cho 4 accepted candidates. Hai candidate, EC-C04 và EC-C05, có final E2E PASS trong Sprint 04 và ba repeat PASS mỗi test. C01 và C02 không tính PASS.

## 2. Vì sao chỉ 2/4 candidate PASS?

C04 chạy được với email UUID preflighted và assertion generic response đạt. C05 sau repair đạt title/content assertion và cleanup. C02 có empty-state AJAX render lỗi tạm thời. C01 manual UI cho discount/tổng tiền đúng sau reload nhưng headless Java test timeout; nguyên nhân chưa xác minh. Mẫu nhỏ này được báo đúng là 2/4, không mở rộng thành tuyên bố chung về hiệu quả.

## 3. 3 BLOCKED của Sprint 04 có phải test fail không?

Không. Official Sprint 04 có 14 invocations: 3 dừng trước behavior oracle, vì vậy chúng không được tính behavioral FAIL. 11 invocations đến oracle, trong đó 8 PASS và 3 FAIL. Surefire error/failure là trạng thái runner; nghiên cứu phân loại theo mức oracle đã đạt.

## 4. Vì sao không báo first compile “0/4”?

Không có bốn compile attempts. Maven compile toàn bộ test suite như một module. Có một module attempt đầu tiên FAIL do API mismatches, sau repairs có module compile cuối PASS. Số class được include trong build không biến thành bốn quan sát compile độc lập.

## 5. Tại sao empirical novelty không ghi 0%?

Không có protocol thực nghiệm đo novelty hoặc behavioral coverage gain so với BEWT baseline. Giá trị `noveltyEmpiricallyVerified: 0` trong Sprint 03 chỉ ghi nhận không candidate nào được empirically verified trong sprint đó; nó không phải phép đo cho thấy novelty bằng 0%. Vì vậy kết quả là **NOT_EVALUATED**. `0/5 lexical duplicate hints` là một heuristic riêng, không chứng minh novelty.

## 6. Có thể nói candidates mới so với 31 baseline tests không?

Static review không tìm thấy hành vi tương đương trong 31 scenarios đối với bốn accepted cases, nhưng đây là kết quả rà soát source/feature, không phải controlled novelty/coverage measurement. Cách nói phù hợp: “không thấy tương đương trong lần technical review”; empirical novelty vẫn NOT_EVALUATED.

## 7. C02 là lỗi ứng dụng thật hay test implementation lỗi?

Có lỗi ứng dụng UI tạm thời được xác nhận: server xóa cart, badge về 0, nhưng AJAX renderer tạo empty-state container rỗng do markup source thiếu dấu nháy. Sau automatic reload, server template hiển thị `Cart empty`. Test assert text ngay khi container visible, nên test failure nhạy với transition; lỗi source/UI tạm thời vẫn có evidence độc lập. Không khẳng định lỗi tồn tại sau reload.

## 8. Vì sao C01 không được coi là defect hoặc PASS?

S04 ledger ghi C01 là `FAIL / APPLICATION_UI` sau timeout chờ `#discount-amount`. Tuy nhiên manual UI sau đó cho thấy Apply/Remove cập nhật session và số tiền sau automatic reload; timeout tự nó không chứng minh hành vi ứng dụng sai. Exact DOM/session trace từ Java run chưa được lưu, nên chưa phân biệt được timing, hidden/duplicate element hay khác biệt session. Vì vậy giữ nguyên kết quả invocation lịch sử S04 nhưng phân loại tổng hợp ở cấp ứng dụng là INCONCLUSIVE; manual observation cũng không thay thế E2E PASS.

## 9. Vì sao không patch C02 để đạt PASS?

Mục tiêu là bảo toàn baseline và xác minh defect. Patch có thể tạo một nhánh thực nghiệm riêng sau khi BEFORE evidence được đóng băng và có quyết định review. Không thay assertion để làm PASS, không thay source pin trong kết quả baseline.

## 10. Vì sao không chạy cả 31 test gốc?

Phạm vi sprint tập trung vào bốn accepted candidates và một smoke baseline `AddUserTest`. Full suite có execution order và shared state; mục tiêu hiện tại feasibility của pipeline chứ không tái lập toàn benchmark. Báo cáo không tuyên bố 31 tests đã chạy.

## 11. Nghiên cứu có chứng minh phương pháp tốt hơn BEWT?

Không. BEWT là benchmark/baseline chứa ứng dụng và test suites, không phải thuật toán test-generation để làm đối chứng. Coverage gain so với hành vi trong BEWT baseline và hiệu quả so với phương pháp test-generation khác là hai câu hỏi riêng; cả hai **NOT_EVALUATED** vì chưa có phép đo/đối chứng tương ứng. Kết luận duy nhất là feasibility có giới hạn trên ExpressCart.

## 12. Vì sao không khái quát sang tám ứng dụng/40 test?

Đó là mục tiêu trong đề cương, không phải dữ liệu thực nghiệm. Báo cáo dùng đúng scope một app, năm candidates (bốn accepted), bốn Java classes.

## 13. Repair có làm thay đổi oracle không?

Các adaptation đã lưu ở repair history. C02 selector modal được cập nhật; C01 fixture/precondition/locator được sửa; C05 chờ giá trị Summernote và cleanup native confirm. Không hạ expected behavior để tạo PASS. Sprint 05 không đổi oracle.

## 14. Thực nghiệm có lặp lại được không?

Có manifest source/runtime/image, fixture procedures, prompts/responses, Java source, repair history, Surefire XML, logs và screenshots. Hai candidate PASS có 3 repeats mỗi test. Full-volume seed fingerprint không được xác minh; vì vậy chỉ nói repeatability trong cùng runtime, không nói full reset protocol đã chứng minh.

## 15. Có bao nhiêu model tokens/cost?

Usage telemetry được lưu riêng theo Sprint 01/Sprint 03. Sprint 01 reported total không bằng input + output; Sprint 03 cũng giữ provider total riêng. Cost không được báo. Không cộng provider totals thành số verified và không ước tính cost.

## 16. Điều gì cần làm tiếp theo để bài nghiên cứu mạnh hơn?

Trace C01 headed/headless với cùng fixture/session, đo explicit behavioral coverage/novelty, thêm control method/baseline, mở rộng ứng dụng và candidate set, rồi lặp lại với provenance đồng nhất. Trước tiên xử lý C01 inconclusive và giữ C03 ở review gate.
