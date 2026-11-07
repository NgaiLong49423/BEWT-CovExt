# Đánh giá dọn dẹp và tái lập môi trường ExpressCart

Ngày kiểm tra: 2026-10-29. Phạm vi: Docker và repository bằng lệnh chỉ đọc. Không tạo/chạy/xóa container, image, volume hay network. Không đọc `.env`, Docker environment variables, hoặc giá trị secrets. Không chỉnh sửa `bewt-original/`.

## 1. Executive Summary

**VERIFIED:** Docker hiện không có container nào chạy hoặc đã dừng mang image hay tên ExpressCart. Có một image không tag `olianasd/expresscart-strongpsw`, digest `sha256:36f9dbf2...`, ID đầy đủ `sha256:36f9dbf2...`; repository trước đó ghi nhận digest đầy đủ `sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16`. Image là dấu vết duy nhất hiện tại liên hệ trực tiếp với pilot cũ. Chưa có container reference nào cho image đó.

**VERIFIED:** Docker daemon có các tài nguyên của dự án MamXanh khác. Không tài nguyên nào trong số đó được xác định là ExpressCart; giữ nguyên. Không thấy volume/network có tên ExpressCart. **NOT_VERIFIED:** liệu dữ liệu cũ có từng nằm trong container writable layer đã bị xóa, external bind mount, image, hoặc tài nguyên Docker khác không thể xác định từ snapshot hiện tại.

Đề xuất **giữ image cũ** trong giai đoạn này: nó không gắn với container hiện có và không cản trở tạo môi trường mới bằng tên, network, ports và storage riêng. Không chọn image đó tự động cho thực nghiệm mới vì image digest chưa chứng minh phiên bản ứng dụng ExpressCart. Phương án mới nên dùng source chính thức đã pin commit/tag và tự build image có provenance; nếu cần image phát hành, chọn image chính thức có version/digest đã kiểm chứng và xác nhận tương thích Selenium trước khi dùng.

## 2. Current Docker Resources

Đã chạy thành công ngoài sandbox các truy vấn read-only `docker ps -a`, `docker images --no-trunc --digests`, `docker volume ls`, `docker network ls`. Sandbox chặn named pipe Docker; kết quả ngoài sandbox là nguồn của bảng dưới.

| Loại | Kết quả liên quan | Labels/references | Trạng thái |
|---|---|---|---|
| Containers | Không có ExpressCart. 11 container hiện có đều tên `mamxanh-*` hoặc `suspicious_solomon`; hiện ở trạng thái Exited/Created | Chưa inspect labels, mounts, networks của các container khác; không suy ra tài nguyên ExpressCart từ tên gần giống | VERIFIED inventory; tài nguyên MamXanh không đụng đến |
| Images | Một image `olianasd/expresscart-strongpsw:<none>`, ID/digest `36f9dbf2b430...`, 1.33 GB; không tag | Chưa inspect image labels/config/history; không có container reference hiện tại | VERIFIED presence; ownership lịch sử chỉ suy ra theo repo/audit trước, chưa đủ để xóa an toàn |
| Volumes | 14 local volumes, tất cả tên theo `codex-pr75-local_*` hoặc `mamxanh-*`; không thấy volume ExpressCart | `docker volume ls` không trả labels hoặc container references; không inspect mountpoint/data | VERIFIED names; ExpressCart data association NOT_VERIFIED |
| Networks | `bridge`, `host`, `none`, `mamxanh-dev_default`, `mamxanh-pr85-review_default`; không có network ExpressCart | Chưa inspect labels/connected endpoints | VERIFIED names; network dùng chung/đối tượng quản lý được bảo vệ |
| Docker labels | Chưa có container candidate ExpressCart nên không có labels trên container để truy dấu. Image/volume/network labels chưa inspect | `docker ps/images/volume/network ls` không hiển thị labels | NOT_VERIFIED; cần label-filtered inspect nếu Team Lead muốn thẩm định image |

Docker listing thể hiện `mamxanh-dev` và `mamxanh-pr85-review` containers cùng các volume/networks đặt tên tương ứng. Đây là bằng chứng có tài nguyên dự án khác, không phải kết luận chúng đang được dùng ở thời điểm này: các containers quan sát được đều dừng. Không xóa hoặc dùng lại chúng.

## 3. ExpressCart Legacy Environment

| Artefact/tài nguyên | Bằng chứng | Kết luận |
|---|---|---|
| Container cũ | Docker inventory hiện không có container image/naming ExpressCart | Không có container cụ thể đề xuất xóa |
| Image cũ | Docker inventory có image digest ở §2. Repository README/script cũ dùng `olianasd/expresscart-strongpsw`; image cache đã có digest tương ứng theo audit trước | Liên hệ với pilot cũ: **VERIFIED** qua tên repo/digest khớp cấu hình. Phiên bản ứng dụng trong image: **NOT_VERIFIED** |
| Image reference | Image được tag `<none>` nhưng hiển thị theo digest; không có alias version | Không chạy `docker run` bằng image này cho thực nghiệm mới |
| Volume | Không có volume tên ExpressCart trong inventory | Không đủ bằng chứng nói volume không tồn tại hoặc không có dữ liệu ExpressCart; inspect metadata/data chưa thực hiện |
| Network | Không có network tên ExpressCart trong inventory | Không đủ bằng chứng xác nhận network cũ từng không tồn tại; không có network ExpressCart để xóa theo snapshot |
| Logs/results | `rg --files` ngoài `bewt-original` tìm thấy đề cương và audit report; không có thư mục logs/results/config môi trường được track hiện ra | Logs ngoài repo, ignored files và Docker logs cũ: NOT_VERIFIED; không đọc `.env` |
| Repository config | `bewt-original/expresscart/README.md`, Base Maven suite/scripts; `bewt-original` bị ignore bởi repo ngoài | Các tham chiếu gốc còn nguyên; không sửa/xóa |

### Quan hệ container/image/volume/network

Không có container để inspect `.Config.Image`, labels, mounts hoặc network attachments. Do đó không thể lập quan hệ container→volume/network cho pilot cũ hoặc chứng minh không còn dữ liệu trong writable layer cũ. Không có Compose project/container hiện tại để lần theo labels. Image hiện không có container reference nhìn thấy trong `docker ps -a`; Docker daemon không báo image là đang được container hiện tồn tại sử dụng. Điều này **không chứng minh** image đã hết giá trị hoặc không được người dùng dự định dùng lại.

## 4. Repository & Version Assessment

**Commit SHA BEWT:** `0501249ff3e9a5ea83a06155cd2971dc36197056` (`git -C bewt-original rev-parse HEAD`). Working tree của BEWT sạch theo `git -C bewt-original status --short`. Repo ngoài có báo cáo audit trước đó chưa tracked; không có thay đổi nguồn BEWT.

BEWT tham chiếu directory/artifact `expresscart-1.19`; POM artifactId cũng là `expresscart-1.19`. Đây là baseline label theo repository, **không xác minh** phiên bản runtime npm của website trong image. README [`bewt-original/expresscart/README.md`](../../bewt-original/expresscart/README.md) dùng image `olianasd/expresscart-strongpsw` và port `3000:1111`; Base Java suite đặt URL localhost:3000, Chrome major 127, Selenium 4.35.0, JUnit 4.12, WebDriverManager 5.8.0. POM có mâu thuẫn compiler: properties Java 21 nhưng Maven compiler plugin source/target 1.8. TestSuite có 31 entries phụ thuộc thứ tự; `SearchProductTest` cần sản phẩm do `AddProductTest` tạo.

**CONFLICT:** thư mục `full_xpath` có `run-docker.sh` dùng image `olianasd/expresscart-mongodb`, khác Base README. Không lấy biến thể đó làm baseline mới.

**Phiên bản chính thức mới hơn:** trong môi trường audit này chưa xác minh GitHub/release registry chính thức hoặc phiên bản source hiện hành. Vì vậy, “bản mới nhất”, tag image chính thức, digest, license và trạng thái duy trì đều **NOT_VERIFIED**. Không mặc định version mới nhất tương thích với 31 test gốc. UI selectors, routes/admin flow, data model/seed, auth behavior, Mongo compatibility, browser behavior và expected outcomes đều có thể đổi giữa các phiên bản.

**Đề xuất lựa chọn:** bắt đầu đánh giá source tag **ExpressCart 1.19** làm baseline tương thích với đề cương/BEWT, nhưng lấy từ repository upstream chính thức được Team Lead xác nhận và pin source commit. Tự build image mới với tên/tag nội bộ chứa commit, rồi lưu image ID/digest. Không tái sử dụng image cũ và không giả định tag `1.19` hoặc image có cùng tên đã chứng minh provenance. Nếu source upstream không còn phát hành version 1.19, Team Lead cần duyệt baseline mới; thực hiện compatibility review riêng trước khi thay suite/version. Đây là khuyến nghị thiết kế, không phải xác nhận 1.19 hiện có thể tải.

## 5. Resources Safe to Remove

**Không có tài nguyên nào được xác định là an toàn để xóa trên bằng chứng hiện có.** Image cũ có quan hệ rõ với pilot, nhưng chưa xác minh tags/labels khác, lịch sử, khả năng tái lập hay ý định giữ. Image không ảnh hưởng đến việc tạo môi trường độc lập. Giữ lại là phương án an toàn hiện tại.

| Tài nguyên | ID/tên cụ thể | Evidence thuộc pilot cũ | Ảnh hưởng xóa | Khôi phục | Lệnh dự kiến |
|---|---|---|---|---|---|
| Container | Không có candidate trong inventory | Không áp dụng | Không áp dụng | Không áp dụng | Không có lệnh |
| Image | `olianasd/expresscart-strongpsw@sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16`; local ID `sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16` | Digest khớp image đã lưu trong ExpressCart Base README/pilot audit; local tag là `<none>` | Giải phóng khoảng 1.33 GB; mất cache, image layer cục bộ và khả năng tái tạo đúng digest nếu registry không còn | Có thể pull lại nếu registry còn giữ digest và truy cập được; hiện NOT_VERIFIED. Pull không bảo đảm nguồn còn nguyên vẹn nếu chỉ dùng tag | Chưa đề xuất ở giai đoạn này. Chỉ xem xét `docker image rm <full-image-id>` sau khi kiểm tra labels/references và phê duyệt riêng |
| Volume | Không có ExpressCart volume candidate | Tên inventory không khớp; nội dung/mount metadata chưa inspect | Không biết nếu xóa | NOT_VERIFIED; có thể mất dữ liệu không thể tái tạo | Không có lệnh |
| Network | Không có ExpressCart network candidate | Không có container reference để truy nguồn; networks hiện còn gồm defaults và hai mạng MamXanh | Có thể làm gián đoạn project khác nếu nhầm | Có thể tạo lại cấu hình bridge, nhưng kết nối/runtime settings không được bảo toàn | Không có lệnh |

Image là ứng viên duy nhất để *đánh giá* dọn sau; báo cáo không phân loại nó “safe to remove”. Nếu cần tiết kiệm ổ đĩa ngay, quyết định này vẫn cần kiểm tra image labels/metadata và phê duyệt Team Lead.

## 6. Resources Requiring Confirmation

| Tài nguyên | Tình trạng | Bước xác nhận chỉ đọc |
|---|---|---|
| Image ExpressCart cũ | Khớp repo/digest nhưng tagless, chưa inspect labels và không có container references | `docker image inspect <full-image-id> --format '{{json .RepoDigests}} {{json .Config.Labels}} {{json .Config.ExposedPorts}} {{json .Config.Volumes}}'`; kiểm tra Compose/scripts cũ đã được rà, rồi Team Lead quyết định giữ/xóa |
| Images không tag khác | Không phát hiện image ExpressCart nào khác trong listing | Không xóa image lạ chỉ vì `<none>`; image ID/digest này là ứng viên đã thấy |
| Volumes | 14 volumes mang tên project khác; không có tên ExpressCart | Giữ nguyên. Nếu sau này cần đối chiếu, inspect riêng `Name`, `Labels`, `Mountpoint` và container mounts; không đọc nội dung dữ liệu |
| Networks | `bridge`, `host`, `none`, `mamxanh-dev_default`, `mamxanh-pr85-review_default` | Giữ nguyên; inspect labels/connected containers chỉ khi cần xác nhận owner |
| MamXanh resources | Có tên/ID project-specific, containers đều Exited tại snapshot | Không phải ExpressCart; không xóa, prune hay tái sử dụng |
| Logs ngoài workspace/Docker logs | Chưa truy vấn | NOT_VERIFIED; không cần xóa để xây môi trường độc lập |
| Version/source chính thức | Chưa đọc trang upstream/release | Team Lead xác nhận Git remote, release/tag và license trước khi pin |

Không dùng name match làm căn cứ xóa. Bằng chứng mạnh cần có: full ID/digest, Compose project/service labels, container `Image` ID, `Mounts` source, network endpoints, labels tương ứng và quyết định owner. Không có candidate nào đáp ứng toàn bộ điều kiện.

## 7. Proposed Cleanup Commands

**Không có lệnh xóa được đề xuất để chạy lúc này.** Để giữ image cũ, không cần cleanup Docker trước khi tạo môi trường mới độc lập.

Nếu Team Lead sau đó quyết định xóa image sau khi review, lệnh hẹp dự kiến (hiện **chưa được phê duyệt/chưa chạy**) là:

```powershell
docker image rm sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16
```

Trước lệnh cần kiểm tra lại `docker image inspect` labels/digest, `docker ps -a --no-trunc` image references, và registry availability. Nếu daemon báo image đang được tham chiếu, dừng và báo owner; không force. Lệnh trên chỉ nhắm đúng một image ID, không bao gồm prune. Không có lệnh volume/network/container vì chưa xác định được tài nguyên cũ an toàn để xóa. Không chạy `docker system prune`, `docker volume prune` hoặc `docker compose down -v`.

## 8. Fresh Environment Setup Plan

Ưu tiên một deployment độc lập có thể tái lập và không nạp state cũ:

1. Team Lead xác nhận upstream source chính thức, ExpressCart 1.19 hoặc version thay thế, license và acceptance baseline. Lưu repository URL, immutable commit/tag, manifest và SHA256.
2. Tạo project namespace mới, ví dụ `bewt-covext-expresscart-<commit-short>`, Compose file mới trong extension workspace (không đặt trong/sửa `bewt-original`). Build image từ source pin; gắn OCI labels `org.opencontainers.image.source`, `revision`, `version`, `created`, project/experiment ID. Không kéo/chạy image cũ tự động.
3. Pin base image digests và phiên bản database/ExpressCart; ghi Docker/Compose version, platform/architecture và build provenance. Không dùng mutable `latest`. Chọn network/project name mới riêng. Chọn volume riêng có nhãn experiment; hoặc dùng disposable storage được reset xác định. Không mount volume khác.
4. Cô lập ports về loopback trên một port riêng và truyền base URL qua cấu hình extension nếu test cho phép. Base tests hiện hard-code localhost:3000; kiểm tra port availability và giữ port mapping riêng biệt khi cần chạy baseline. Không sửa test gốc.
5. Dùng Java 21/Maven đã hiện diện, nhưng giải quyết POM compiler 21/1.8 trong disposable extension build; giữ Selenium 4.35.0, JUnit 4.12, Chrome 127 theo baseline trước khi thay đổi. Pin browser/driver image hoặc binary version chính xác. Không nâng dependency tùy tiện.
6. Khởi động lần đầu chỉ sau phê duyệt; kiểm tra readiness/HTTP, health/database, version endpoint/package metadata và test-account seed. Lưu logs đã lọc secrets, image IDs/digests, config hash và startup result.
7. Baseline smoke: chạy duy nhất `AddUserTest` trong isolated copy với fixture sạch; ghi Maven exit, Surefire report, assertion/evidence và trạng thái trước/sau. Sau đó reset bằng cách hủy đúng experiment-scoped container/storage, tạo lại từ pinned image và xác minh state/fixture trở về fingerprint ban đầu. Lặp lại smoke sau reset để chứng minh repeatability.
8. Lưu evidence trong `runs/<run_id>/`: source/image/browser/toolchain manifest, commands, timestamps, exit code, Surefire XML/logs, hashes và reset evidence. Không lưu credential values/API keys; kết quả không PASS được giữ cùng error classification.

Các bước này là kế hoạch; không bước nào được thực hiện trong audit hiện tại.

## 9. Risks & Compatibility Issues

| Rủi ro | Trạng thái | Hệ quả/kiểm soát |
|---|---|---|
| Image digest không xác nhận ExpressCart runtime version | NOT_VERIFIED | Không dùng image cũ làm benchmark mới; xác nhận source/version và build provenance |
| Upstream ExpressCart 1.19 có thể cũ/không còn được hỗ trợ | NOT_VERIFIED | Kiểm tra nguồn, khả năng build và bảo mật trước khi quyết định; đừng tự đổi sang latest |
| Selenium tests bám admin UI, routes, selectors và seeded data | VERIFIED source dependency; version-to-version impact NOT_VERIFIED | Compatibility mapping từng test và oracle; có thể cần approved extension changes |
| Tests phụ thuộc thứ tự và shared data | VERIFIED trong Base `TestSuite.java`/AddProduct→SearchProduct | Giữ thứ tự; smoke độc lập; reset giữa runs; không parallelize suite |
| Java/Maven compiler config mâu thuẫn | VERIFIED static | Xác nhận effective compile trong copy; không sửa original POM |
| Docker sandbox named-pipe access | BLOCKED trong sandbox; Docker listing thành công ngoài sandbox | Thiết kế runner với quyền tối thiểu; không phải app failure |
| Dữ liệu legacy có thể ở layer/mount ngoài listing | NOT_VERIFIED | Không hứa image/volume cleanup xóa hết; tạo storage mới độc lập |
| Docker daemon đang có tài nguyên dự án khác | VERIFIED | Không prune, không xóa MamXanh hoặc tài nguyên mặc định |

## 10. Decisions Required from Team Lead

1. Chọn baseline version: đề xuất thẩm định ExpressCart **1.19** từ upstream source được xác nhận; duyệt version khác nếu source hoặc khả năng build không đáp ứng.
2. Xác nhận upstream repository, tag/commit, license và cách tạo image có provenance.
3. Quyết định giữ image cũ (đề xuất: giữ) hay xem xét xóa riêng image digest nêu trên sau khi kiểm tra labels/references.
4. Duyệt project/network/volume namespace mới và cách reset được phép cho disposable experiment.
5. Duyệt xử lý compiler/browser contract, và cho phép build/start/HTTP-check/smoke/reset trong giai đoạn sau.
6. Xác nhận nơi lưu logs/evidence và retention, với quy tắc lọc secrets.

**Kết thúc audit:** báo cáo này là artifact duy nhất được tạo. Không có Docker resource nào được tạo, chạy hoặc xóa; `bewt-original/` không thay đổi. Dừng tại đây để Team Lead xem xét.
