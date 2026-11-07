# Demo Runbook — EC-C04 và EC-C05

Mục tiêu là trình bày hai test đã PASS và cleanup được xác minh trong Sprint 04. Đây là runbook; không có test nào chạy thêm trong quá trình đóng gói báo cáo. Demo dùng Compose project hiện hữu `bewt-covext-expresscart-b31302f`, pinned app và storage thử nghiệm. **Không tạo project mới, không reset volume, không chạy prune.**

## 1. Điều kiện trước demo

- Thực hiện tại repo `D:\Github-Projects\BEWT-CovExt` bằng PowerShell.
- Docker Engine/context phải truy cập được; project app và Mongo phải đang chạy.
- Java `21.0.12`, Maven `3.9.16`, Chrome `156.0.8078.76`, ChromeDriver `156.0.8078.80`.
- Giữ nguyên source commit `b31302f4e99c3293bd742c6d076a721e168118b0` và Compose project đã tạo.
- Chạy **một test một lần**, tuần tự; không chạy toàn bộ `TestSuite` vì suite gốc có phụ thuộc thứ tự và state.
- Không ghi hay chiếu `.env`, giá trị `ADMIN_PASSWORD`, token, hay nội dung fixture bí mật.

## 2. Readiness checks (chỉ đọc)

```powershell
docker context show
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml ps
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3111/).StatusCode
docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml exec -T mongo mongo --quiet --eval "db.adminCommand('ping').ok"
java -version
mvn -version
& 'experiments/expresscart/tools/chromedriver-156.0.8078.80/chromedriver-win64/chromedriver.exe' --version
```

Điều kiện: context là `desktop-linux`; `docker compose ps` cho thấy đúng project; HTTP trả 200; Mongo ping trả 1; Java/Maven/driver khớp manifest. Nếu điều kiện không đạt, **dừng demo** và ghi BLOCKED. Không tự `compose up`, restart, down, xóa hoặc reset storage trong buổi demo nếu chưa có quyết định vận hành riêng.

## 3. EC-C04 — Forgot password cho email không đăng ký

### Fixture preflight

Script preflight tạo UUID email mới, xác minh email đó vắng mặt chính xác trong collection `customers`, rồi đặt `TEST_UNREGISTERED_EMAIL` cho process. Script không chèn account. Dùng một thư mục output run mới để giữ fixture evidence:

```powershell
$runDir = 'docs/research-results/final/demo-runs/EC-C04'
New-Item -ItemType Directory -Force $runDir | Out-Null
& 'experiments/expresscart/tools/prepare-unregistered-email.ps1' -EvidencePath "$runDir/fixture-preflight.json"
```

Script giữ địa chỉ UUID trong fixture evidence của run; không chiếu nội dung file ra màn hình. Không thay bằng email người dùng thật hoặc email đã đăng ký.

### Chạy test

```powershell
$driver = (Resolve-Path 'experiments/expresscart/tools/chromedriver-156.0.8078.80/chromedriver-win64/chromedriver.exe').Path
try {
    mvn -f 'experiments/expresscart/bewt-suite/pom.xml' "-Dtest=tests.ForgottenPasswordTest" "-Dwebdriver.chrome.driver=$driver" test
} finally {
    Remove-Item Env:TEST_UNREGISTERED_EMAIL -ErrorAction SilentlyContinue
}
```

PowerShell gọi script preflight trong cùng session nên biến môi trường được kế thừa bởi Maven. Vì lệnh chỉ định POM trong `experiments/expresscart/bewt-suite/`, Surefire report mặc định nằm tại `experiments/expresscart/bewt-suite/target/surefire-reports/TEST-tests.ForgottenPasswordTest.xml`. Kiểm tra `tests=1`, `failures=0`, `errors=0`, `skipped=0` và assertion trong report. Không tính HTTP 200 riêng lẻ là PASS.

### Cleanup và evidence

Test này dùng email không đăng ký và theo evidence Sprint 04 không tạo customer. Lưu fixture-preflight JSON đã sinh, Surefire XML/text và console output vào `$runDir`; rà soát để không có credential. Kết quả chuẩn từ Sprint 04 và ba repeat: [validated-initial](../sprint-04/e2e/EC-C04/validated-initial/TEST-tests.ForgottenPasswordTest.xml), [repeat evidence](../sprint-04/e2e/EC-C04/validated-repeat-1/TEST-tests.ForgottenPasswordTest.xml).

## 4. EC-C05 — Tạo và xem static page

### Fixture preflight

- `ADMIN_EMAIL` và `ADMIN_PASSWORD` phải có trong ignored file `experiments/expresscart/.env` và thuộc duy nhất experiment owner account.
- Chỉ dùng fixture đã được xác minh ở Sprint 04. Nếu không thể xác minh credential, dừng; không hardcode hoặc chiếu giá trị.
- Test tự sinh tên, slug UUID, nội dung duy nhất, đăng nhập qua UI, tạo trang, mở storefront slug, kiểm title/content và xóa trang trong `@After`.
- Không dùng lại slug cố định hoặc chạy song song với test khác.

Nếu tài khoản chưa được cấu hình, script [prepare-sprint04-admin.ps1](../../../experiments/expresscart/tools/prepare-sprint04-admin.ps1) kiểm tra nhãn Compose project, ghi credential ngẫu nhiên vào `.env` bị ignore và cập nhật đúng owner record của experiment. Script làm thay đổi password fixture trong database experiment; chỉ chạy trong môi trường demo thử nghiệm và không in giá trị. Khi fixture đã sẵn có như Sprint 04, không chạy lại script.

### Đưa biến môi trường vào process mà không in giá trị

```powershell
$envFile = 'experiments/expresscart/.env'
$cfg = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^(ADMIN_EMAIL|ADMIN_PASSWORD)=(.*)$') {
        $cfg[$Matches[1]] = $Matches[2]
    }
}
if (-not $cfg['ADMIN_EMAIL'] -or -not $cfg['ADMIN_PASSWORD']) {
    throw 'Experiment admin fixture is not configured; stop the demo.'
}
$env:ADMIN_EMAIL = $cfg['ADMIN_EMAIL']
$env:ADMIN_PASSWORD = $cfg['ADMIN_PASSWORD']
Remove-Variable cfg, line -ErrorAction SilentlyContinue
```

Không gọi `Write-Output $cfg`, không bật Maven debug `-X`, không chụp màn hình terminal đang hiện environment values.

### Chạy test

```powershell
$driver = (Resolve-Path 'experiments/expresscart/tools/chromedriver-156.0.8078.80/chromedriver-win64/chromedriver.exe').Path
try {
    mvn -f 'experiments/expresscart/bewt-suite/pom.xml' "-Dtest=tests.CreateStaticPageTest" "-Dwebdriver.chrome.driver=$driver" test
} finally {
    Remove-Item Env:ADMIN_EMAIL,Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable driver -ErrorAction SilentlyContinue
}
```

Xác minh `experiments/expresscart/bewt-suite/target/surefire-reports/TEST-tests.CreateStaticPageTest.xml` có một test, không failure/error/skip. Đọc title/content assertion trong report. Sau đó kiểm tra cleanup evidence: số static pages phải trở về 0, page slug duy nhất phải vắng trong admin UI, và teardown không fail. Lưu report, console log, screenshot nếu có lỗi, cùng sanitized page count trước/sau; không lưu `.env`.

Evidence chuẩn: [final repaired attempt](../sprint-04/e2e/EC-C05/attempt-2/TEST-tests.CreateStaticPageTest.xml), [repeat 1](../sprint-04/e2e/EC-C05/repeat-1/TEST-tests.CreateStaticPageTest.xml), [repeatability counts](../sprint-04/fixtures/EC-C05-repeatability.txt). S04 chứng minh cleanup về `pages=0` ở initial pass và cả ba repeats.

## 5. Dừng/rollback không phá hủy

- Nếu test fail trước khi tạo trang, lưu report rồi dừng.
- Nếu fail sau khi lưu trang, để `@After` hoàn tất; kiểm tra đúng slug duy nhất qua UI. Chỉ cleanup page test đó bằng UI và lưu evidence.
- Nếu teardown fail, dừng các test tiếp theo; không xóa database, không reset Docker volumes, không chạy `docker compose down -v`.
- Không chạy EC-C01/C02 như một phần demo PASS: C02 là lỗi UI tạm đã xác nhận; C01 đang INCONCLUSIVE.
- Không gộp demo reruns vào official Sprint 04 metrics. Ghi chúng thành run mới có timestamp và evidence riêng.
