# Sprint 05 — Xác minh độc lập EC-C01 và EC-C02

**Baseline:** ExpressCart upstream `mrvautin/expressCart`, commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19`; runtime hiện hữu `http://127.0.0.1:3111`. Không sửa source pin, assertion, Docker resource hoặc database storage.

## Kết quả phân loại

| Candidate | Phân loại | Kết luận có thể bảo vệ bằng evidence |
|---|---|---|
| EC-C02 — Empty cart | **CONFIRMED_APP_DEFECT** (lỗi UI tạm thời) | Sau click Confirm, server xóa cart và badge chuyển về `0`, nhưng DOM được cập nhật bằng AJAX có `#cart-empty` rỗng. Source pin có markup động thiếu dấu nháy ở thuộc tính `class`; sau notification-triggered reload, template server-rendered hiển thị `Cart empty`. Candidate test thất bại đúng tại text assertion trong trạng thái chuyển tiếp. Không kết luận lỗi trạng thái dữ liệu hoặc lỗi tồn tại sau reload. |
| EC-C01 — Discount | **INCONCLUSIVE** | Qua UI, Apply/Remove cập nhật session và tổng tiền chính xác sau reload (`£138 → £128`, rồi về `£138`). Java test độc lập vẫn timeout đợi `#discount-amount` sau 10 giây, mâu thuẫn với quan sát UI. Chưa xác định được nguyên nhân khác biệt giữa Chrome headless và browser UI; không quy lỗi này cho ứng dụng, oracle hay selector khi chưa có evidence cô lập. |

## EC-C02 — Empty Cart

Tái hiện thủ công trên storefront: thêm một sản phẩm published qua nút **Add to cart**, mở cart, chọn **Empty cart**, rồi **Confirm**. Ngay sau phản hồi, `#cart-count` là `0`, notification là `Cart successfully emptied`, nhưng `#cart-empty` có text rỗng. Sau reload tự động của notification, cùng session hiển thị `Cart empty`; badge vẫn `0`. Evidence đã cấu trúc tại [manual-ui-observations.json](evidence/manual-ui-observations.json), screenshot lần chạy Java độc lập tại [testEmptyCartContainingProduct.png](e2e/EC-C02/independent-run/screenshots/testEmptyCartContainingProduct.png), và Surefire tại [TEST-tests.EmptyCartTest.xml](e2e/EC-C02/TEST-tests.EmptyCartTest.xml).

Trong source pin, [`expressCart.js`](../../../experiments/expresscart/source/public/javascripts/expressCart.js) tạo `cartTotalsEmptyHtml` với `no-pad-left>` nhưng không đóng dấu nháy trước `>`. `updateCartDiv()` chèn markup đó sau khi nhận cart rỗng. Cùng source gọi `showNotification(..., true)`, còn [`common.js`](../../../experiments/expresscart/source/public/javascripts/common.js) reload trang sau animation/toast. Server route `/product/emptycart` xóa cart trong session và gọi recalculation; [cart.js](../../../experiments/expresscart/source/lib/cart.js) đặt `totalCartItems=0` khi cart rỗng. Template [`cart.hbs`](../../../experiments/expresscart/source/views/themes/Cloth/cart.hbs) có empty state hợp lệ.

Kết luận có phạm vi hẹp: có lỗi giao diện trong trạng thái AJAX tức thời; server state và trạng thái server-rendered sau reload đúng. Test Java ở [`EmptyCartTest.java`](../../../experiments/expresscart/bewt-suite/src/test/java/tests/EmptyCartTest.java) chờ container visible rồi assert text ngay, nên failure không đo riêng được thời lượng tồn tại của lỗi. Gherkin không quy định deadline cho state transition. Không vá app hay sửa oracle trong Sprint 05.

## EC-C01 — Discount

Fixture là một published product được thêm qua UI và một discount active đã dùng ở Sprint 04; giá trị fixture không được chép vào phần diễn giải. Tại `/checkout/payment`, tổng trước áp dụng là `£138`. Click **Apply** cho notification thành công nhưng DOM chưa đổi tức thì; sau automatic reload, discount `£10` xuất hiện và tổng là `£128`. Click **Remove** cũng giữ DOM cũ ngay lúc đầu; sau reload, trường mã rỗng, discount biến mất và tổng trở lại `£138`. Cart/session được dọn sau đó bằng thao tác UI; trạng thái cuối badge `0`.

Source [`index.js`](../../../experiments/expresscart/source/routes/index.js) gán `req.session.discountCode`, gọi `updateTotalCart()` và trả thông báo thành công. [`cart.js`](../../../experiments/expresscart/source/lib/cart.js) tính `totalCartAmount = net - discount + shipping`; route remove xóa session code và tính lại. Front-end [`expressCart.js`](../../../experiments/expresscart/source/public/javascripts/expressCart.js) không render summary mới tức thời mà dùng notification-triggered reload. Vì Gherkin chỉ yêu cầu state sau hành động, không định nghĩa state phải tức thời, quan sát sau reload đáp ứng hậu điều kiện chức năng.

Java test độc lập được gọi với ChromeDriver `156.0.8078.80` cục bộ và fixture Maven; test vẫn lỗi `TimeoutException` tại `RemoveDiscountCodeTest.java:92`, đợi `#discount-amount`. Raw log và Surefire là [console log](e2e/EC-C01/independent-validation-console.log), [XML](e2e/EC-C01/TEST-tests.RemoveDiscountCodeTest.xml), và [text report](e2e/EC-C01/tests.RemoveDiscountCodeTest.txt). Do test thất bại trong khi UI browser đạt state sau reload, chưa thể coi lần test này là oracle hợp lệ về application behavior. Cần bổ sung browser-side trace hoặc cô lập test session/selector trước khi kết luận nguyên nhân.

## Kết luận và giới hạn

Không có patch BEFORE/AFTER vì chưa cần sửa baseline để hoàn thành xác minh. Bằng chứng source cho C02 và thao tác UI độc lập được giữ riêng khỏi báo cáo Sprint 04. C01 vẫn là **INCONCLUSIVE**, không phải PASS hay defect đã xác nhận. Không thay đổi Git history, `bewt-original/`, dependency hoặc tài nguyên Docker. Chi tiết các bước click/DOM và kết quả cuối được ghi ở [manual-ui-observations.json](evidence/manual-ui-observations.json).
