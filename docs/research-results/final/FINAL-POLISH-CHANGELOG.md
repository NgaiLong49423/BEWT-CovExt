# Final Document Polish — Changelog

## Các hiệu chỉnh

1. **Demo runbook:** thêm `-f experiments/expresscart/bewt-suite/pom.xml` vào cả hai lệnh Maven. Sửa Surefire XML paths sang `experiments/expresscart/bewt-suite/target/surefire-reports/`. Đối chiếu với POM: không có `reportsDirectory` override; lệnh tiếp tục chạy tuần tự từng test class.
2. **Báo cáo chính:** xóa đoạn nháp `C11? no; detail theo candidate:`. Làm rõ rằng các con số 38 (S03) và 39 (S04) là Java test source files của cả suite, còn bốn generated test classes truy vết tới bốn accepted candidates. Không diễn giải compile cấp Maven module thành bốn phép đo theo candidate.
3. **Thuật ngữ/mẫu số:** định nghĩa riêng candidate, generated test class, Java source file, test-method invocation, repeat và repair iteration trong bảng kết quả; điều chỉnh slide và báo cáo để thống nhất.
4. **BEWT và đối chứng:** làm rõ BEWT là benchmark/baseline, không phải thuật toán test-generation. Tách `behavioral coverage gain vs BEWT baseline` khỏi `comparative effectiveness vs another test-generation method`; cả hai được ghi `NOT_EVALUATED` do không có protocol/đối chứng.
5. **Behavioral oracle:** giữ S04 C01 `FAIL / APPLICATION_UI` như phân loại invocation-level lịch sử; giải thích rằng timeout không tự chứng minh lỗi ứng dụng. Sau manual UI evidence S05, phân loại tổng hợp C01 giữ `INCONCLUSIVE`. C02 vẫn `CONFIRMED_APP_DEFECT (transient UI)`: AJAX empty-state có lỗi render, còn trang sau reload hiển thị `Cart empty`.
6. **Submission package:** xác nhận không có `final.zip` trong repository; ZIP hiện có là ChromeDriver distribution. Ghi rõ `final/` phụ thuộc liên kết tương đối đến evidence repo. Đưa danh sách evidence cần giữ nếu tạo package độc lập, đồng thời loại `.env`, credentials, dữ liệu user thật, build artifacts không liên quan và ChromeDriver archive.
7. **Biên tập:** bỏ cách đặt câu hỏi có thể ngụ ý metric `0/4` là phép đo; giữ giải thích rằng compile chỉ được đo ở cấp module. Rà soát headings, bảng, code fences và đường dẫn tương đối.

## Bảo toàn dữ liệu và kiểm tra

- Không sửa metrics hoặc raw evidence Sprint 01–05.
- Không chạy Maven tests, Selenium, Docker commands hoặc thực nghiệm mới.
- Không thay đổi Docker resources, `bewt-original/`, dirty build/Gradle artifacts, dependencies, Git history hoặc remote.
- Kiểm tra cú pháp lệnh dựa trên POM/config: hai test classes tồn tại trong suite, `-f` trỏ tới đúng POM, report names khớp Surefire evidence và thư mục output mặc định theo module. Không thực thi lệnh demo.
- `final.zip` không được tạo trong vòng polish này.
