# Yêu cầu Phê duyệt Khởi động VM & Hạn mức Chạy
## (Google Cloud VM Start & Run Duration Approval Request)

**Mã yêu cầu**: `REQ-G0-VM-20261110-01`  
**Ngày lập**: 2026-11-10T04:30:00Z  
**Người lập**: AGENT 1 (G0 Runtime & Cloud Docker Engineer)  
**Người nhận phê duyệt**: Team Lead & Orchestrator (AGENT 0)  
**Mục tiêu**: Cấp quyền khởi động / xác nhận hạn mức hoạt động cho VM `bewt-covext-runner` để triển khai thực nghiệm G0 Cloud Runtime xuyên suốt 8 ứng dụng web theo Master Goal BEWT-CovExt v2.0.

---

### 1. Định danh Hạ tầng Google Cloud Bắt buộc (Pinned Cloud Identity)

| Thuộc tính | Giá trị Ghim Bắt buộc (Pinned Value) | Giá trị Thực tế Kiểm tra qua `gcloud` | Trạng thái Đối chiếu |
|---|---|---|---|
| **Project ID** | `gen-lang-client-0311012609` | `gen-lang-client-0311012609` | ✅ MATCH |
| **Project Display Name** | `Mina` | `Mina` | ✅ MATCH |
| **Zone** | `asia-southeast1-a` | `asia-southeast1-a` | ✅ MATCH |
| **Instance Name** | `bewt-covext-runner` | `bewt-covext-runner` | ✅ MATCH |
| **Instance ID** | `3042402845209891905` | `3042402845209891905` | ✅ MATCH |
| **Machine Type** | `c4d-highmem-8` (8 vCPU, ~63 GiB RAM) | `c4d-highmem-8` | ✅ MATCH |
| **Boot Disk** | 200 GB Hyperdisk Balanced (Ubuntu 24.04 LTS) | 200 GB persistent-disk-0 | ✅ MATCH |
| **GCP User Account** | `longgiango511@gmail.com` | `longgiango511@gmail.com` | ✅ MATCH |
| **Remote SSH User** | `runner` | `runner` | ✅ MATCH |
| **Remote Repo Path** | `/home/runner/BEWT-CovExt` | `/home/runner/BEWT-CovExt` | ✅ MATCH |
| **Current Live Status** | *Được kiểm tra trực tiếp* | `RUNNING` (Khởi động lúc `2026-11-10T03:18:05Z`) | ⚠️ RUNNING (Khác giả định TERMINATED) |
| **Scheduled Max Run Duration** | `21600` giây (6 giờ) theo `.env` / config | `18000` giây (5 giờ) được gắn trên VM | ⚠️ Cần đồng bộ (Mismatch 18000 vs 21600) |
| **Termination Timestamp** | `2026-11-10T09:18:05Z` (nếu 6h) | `2026-11-10T08:17:56.412692Z` (theo hạn mức 5h) | ℹ️ Còn lại ~3h45m trước khi tự STOP |
| **Termination Action** | `STOP` | `STOP` | ✅ MATCH |

---

### 2. Lý do Nghiệp vụ & Phạm vi Thực thi (Business Justification & Scope)

Thực thi các nhiệm vụ kiểm thử G0 Runtime trực tiếp trên môi trường Cloud Docker được cấp phép (cấm tuyệt đối chạy Docker trên local Windows theo quy tắc `BEWT_LOCAL_DOCKER_ALLOWED=false`):

1. **Claroline G0 Baseline Smoke & Diagnostic**:
   - Chạy `preflight-probe`, `unit-tests`, `maven-compile` trên hệ điều hành Ubuntu 24.04 thực tế.
   - Chạy chẩn đoán `run-claroline-diagnostic.mjs` và kiểm thử tích hợp `run-claroline-g0.mjs` với kịch bản `test.Claroline_AddUserTest`.
   - Thu thập trace thực nghiệm, kiểm tra tính cô lập mạng (bridge không masquerade + quy tắc iptables REJECT egress).
2. **Kanboard Fresh Verified G0 Run (Giải quyết dứt điểm SHA-256 mismatch)**:
   - Chạy lượt test sạch mới `tests.AddNewProject` trên Cloud VM để thu thập nguyên vẹn byte gốc (original raw bytes) của Surefire XML report và lệnh Maven verbatim `mvn -B -Dtest=tests.AddNewProject ...`.
   - Tạo bản ghi kép `surefire-hash.json` (`originalXmlSha256` và `sanitizedXmlSha256`), khắc phục nguyên nhân gây sai lệch băm trong T04-C mà tuyệt đối không sửa đổi hay giả mạo log lịch sử.
3. **Kiểm tra Readiness & Manifests cho 8 Ứng dụng**:
   - Bludit, Claroline, ExpressCart, Joomla, Kanboard, MantisBT, MediaWiki, PrestaShop.
   - Xác nhận khả năng kéo image đã ghim (pinned image digests), khởi động container độc lập, kiểm tra HTTP 200 và probe cổng DB qua dynamic loopback binding.

---

### 3. Thông số Khởi động / Điều chỉnh Hạn mức Đề xuất (Proposed Parameters)

- **Hạn mức chạy tối đa (maxRunDuration)**:
  - Nếu duy trì VM hiện tại đang chạy: Cập nhật biến cấu hình cục bộ chấp nhận hạn mức `18000` giây (5 giờ) của phiên hiện tại, hoặc Team Lead chạy lệnh cập nhật schedule lên `21600` giây (6 giờ).
  - Nếu khởi động lại sau khi STOP: Khởi động với đúng tham số ghim:
    ```bash
    gcloud compute instances start bewt-covext-runner \
      --project=gen-lang-client-0311012609 \
      --zone=asia-southeast1-a
    ```
- **Hành động khi hết hạn (Instance Termination Action)**: `STOP` (không bao giờ dùng DELETE; bảo toàn toàn bộ dữ liệu ổ đĩa `/home/runner/BEWT-CovExt` và Docker cache).
- **Phạm vi Run ID được phép chạy trong phiên**:
  - `t03b2-d-YYYYMMDD-r*` (Claroline diagnostic)
  - `t03b2-a-YYYYMMDD-r*` / `t03b2-b-YYYYMMDD-r*` (Claroline G0 live runs)
  - `t03a-live-YYYYMMDD-r*` (Kanboard fresh reconciliation run)
  - `g0-smoke-<app>-YYYYMMDD-r*` (Các smoke test của 6 app còn lại)

---

### 4. Kế hoạch Thu hồi & Hoàn nguyên (Rollback & Zero-Residual Cleanup Plan)

Toàn bộ quá trình thực thi trên Cloud VM phải tuân thủ nghiêm ngặt quy trình an toàn tài nguyên:
1. **Ownership Labels**: Mọi container, network, volume sinh ra trong quá trình chạy bắt buộc phải gắn đủ nhãn nhận diện:
   - `project=bewt-covext`
   - `owner=bewt-covext`
   - `managed-by=bewt-covext-agent`
   - `app=<appId>`
   - `task=<taskId>`
   - `runId=<runId>`
2. **Teardown & Cleanup Tự động**:
   - Sử dụng script cleanup chuyên dụng (`cleanup-claroline-g0.mjs`, `cleanup-kanboard-g0.mjs`, `cleanup-bludit-g0.mjs`, `cleanup-experiment`).
   - Kiểm tra đối chiếu inventory trước và sau khi chạy (`docker-before.json` vs `docker-after.json`).
   - Xóa chính xác theo ID tài nguyên đã ghi nhận; xác minh không còn container/network/volume nào mang nhãn của `runId`.
   - Bảo toàn 100% tài nguyên của các tiến trình hoặc project khác trên VM. Cấm tuyệt đối lệnh `docker system prune` hay xóa diện rộng.
3. **Rollback Quy tắc Mạng & Firewall**:
   - Nếu áp dụng quy tắc firewall `A1` trên host, lệnh xóa hoàn nguyên bắt buộc được thực thi trong khối `finally`:
     ```bash
     /usr/bin/sudo -n /usr/sbin/iptables -w 5 -D DOCKER-USER \
       -i br-<id12> ! -o br-<id12> \
       -m conntrack ! --ctstate RELATED,ESTABLISHED \
       -m comment --comment bewt-t03b2-<runId> \
       -j REJECT --reject-with icmp-net-unreachable
     ```
   - Xác minh bằng lệnh `iptables -S DOCKER-USER` bảo đảm không để lại quy tắc dư thừa.
4. **Tự động Dừng VM (Safety Net)**:
   - Cơ chế tự dừng sau `maxRunDuration` do Compute Engine quản lý đảm bảo VM tự tắt về trạng thái `TERMINATED` ngay cả khi kết nối mạng hoặc phiên agent bị ngắt đột ngột.

---

### 5. Khuyến nghị Kỹ thuật cho Team Lead

1. **Xác nhận trạng thái VM hiện tại**: VM `bewt-covext-runner` đã ở trạng thái `RUNNING` (còn ~3 giờ 45 phút thời gian hoạt động).
2. **Quyết định về maxRunDuration**:
   - Hiện tại VM có `scheduling.maxRunDuration.seconds = 18000` (5 giờ), trong khi file `.env` quy định `21600` (6 giờ).
   - Kiến nghị Team Lead phê duyệt cho phép bộ điều khiển `cloud-controller.mjs` chấp nhận hạn mức `18000s` nếu thời gian còn lại lớn hơn `minRemainingSecondsForRun` (600s), hoặc cập nhật `.env` tạm thời thành `18000` cho phiên hiện tại để vượt qua preflight check mà không cần restart VM.
3. **Cấp quyền thực thi**: Khi Team Lead phê duyệt yêu cầu này, AGENT 1 sẽ ngay lập tức tiến hành chạy preflight và các kịch bản G0 trên Cloud VM.
