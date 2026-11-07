# BEWT Initial Repository Audit & Feasibility Assessment

Ngày kiểm tra: **2026-10-29**, múi giờ Asia/Saigon. Trạng thái: **Under Review**.

Phạm vi: kiểm tra chỉ đọc repository, đề cương và công cụ cục bộ; chỉ tạo báo cáo này. Không build, compile, chạy test, khởi động/dừng container, pull image, cài dependency hoặc sửa benchmark. Báo cáo dùng tiếng Việt theo yêu cầu riêng của nhiệm vụ.

## 1. Executive Summary

**Có cơ sở để triển khai một pilot ExpressCart sau khi Team Lead duyệt; chưa đủ bằng chứng để công nhận G0 hoặc triển khai thực nghiệm trên cả tám ứng dụng.** Đã kiểm tra cấu trúc **8/8 ứng dụng**, nhưng số ứng dụng được xác minh môi trường thực thi trong đợt audit là **0/8**. Docker daemon hoạt động không đồng nghĩa ứng dụng hoặc Selenium test chạy được.

Đã đọc toàn bộ đề cương `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx`, gồm phần chính và phụ lục. Đề cương v2.0, ngày 20/10/2026, đặt mục tiêu 8 ứng dụng × 5 cases mới, Java/Selenium, LangGraph JS/Gemini và G0–G4; 40 cases và mốc 298 đều là mục tiêu, chưa phải kết quả [P].

Các phát hiện chính:

| Phát hiện | Trạng thái và giới hạn | Bằng chứng |
|---|---|---|
| Có 36 `TestSuite.java`, tổng 1.166 class entries trong `@SuiteClasses` | **VERIFIED — static**; không phải 1.166 test đã chạy PASS | [C2], [R1] |
| Có 33 Maven projects với `pom.xml`, không có Maven aggregator hay `<modules>`; 8 Full-XPath directories có Gradle build | **VERIFIED — static**; ba Full-XPath projects chỉ có Gradle | [C2], [B] |
| Tám Base suites có đúng 258 business case entries; Bludit còn có một `Installer` entry | **VERIFIED — static**; không đếm installer là business case | [S], [P] §1.2 |
| Có 257 file `.feature`, chỉ 234 `Scenario` headers | **CONFLICT** với cách hiểu “258 Gherkin cases tương ứng 1–1 với Base”; chưa xác nhận mapping đầy đủ | [C3], [G] |
| Bludit Gherkin đặt dưới `bludit-3.13.1`, không có `Scenario`; MantisBT có thêm `0_Login.feature`; PrestaShop có 33 file và tên/nội dung không luôn khớp | **CONFLICT** về version/mapping/số lượng; không tự sửa nguồn | [G], [S] |
| Java 21, Maven, Docker/Compose, Node/npm hiện có; Chrome 127 và đường dẫn ChromeDriver 127 có trong Selenium cache | **VERIFIED — presence/version checks**; browser session, dependency resolution và build chưa được chạy | [C4], [C6] |
| Docker server 29.8.0 truy cập được ngoài sandbox; ExpressCart image có digest cục bộ nhưng không có tag | **VERIFIED — metadata**; không có BEWT container trong danh sách hiện tại | [C5] |
| README, POM và scripts không khóa đồng nhất Selenium/Chrome/image | **CONFLICT**; phải chọn contract riêng cho từng Base app | [R1], [M], [F] |

Không tìm thấy AI Framework, extension tests, app manifests hoặc replication package trong checkout hiện tại. Đánh giá khả thi tích hợp là kết luận thiết kế có điều kiện, không phải xác nhận framework đã tồn tại hoặc hoạt động.

## 2. Repository Structure

### 2.1. Danh tính và ranh giới repository

| Thành phần | Danh tính quan sát được | Mức xác minh |
|---|---|---|
| Repository ngoài `BEWT-CovExt` | HEAD `6fd857a0b59a0ff177e32da9334ded66b0745dbe` | VERIFIED [C1] |
| Repository lồng `bewt-original/` | Có `.git` riêng; HEAD `0501249ff3e9a5ea83a06155cd2971dc36197056` | VERIFIED [C1] |
| Quan hệ giữa hai repository | `.gitignore` của repo ngoài bỏ qua `/bewt-original/`; `git ls-files --stage bewt-original` không có entry, `git submodule status` không có output | VERIFIED: không được repo ngoài quản lý như tracked directory/submodule tại snapshot này [C1] |
| Working tree lúc bắt đầu | Cả hai `git status --porcelain=v1` không có output | VERIFIED; chưa có thay đổi được Git phát hiện [C1] |

Hệ quả: clone repository ngoài hiện không tự mang theo BEWT gốc. Replication package cần ghi nguồn lấy benchmark, SHA và quy trình dựng lại; không được giả định commit của repo ngoài đã pin nội dung repo lồng.

### 2.2. Component inventory

Các đường dẫn bên dưới tương đối từ root `BEWT-CovExt`.

| Component | Path | Purpose | Evidence | Notes |
|---|---|---|---|---|
| Đề cương | `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` | Phạm vi, RQ1–RQ4, gates, acceptance | [P] | Có thật; proposal, không phải execution evidence |
| README tổng BEWT | `bewt-original/README.md` | Tổ chức, biến thể, lệnh chạy, thứ tự/reset | [R1]:14–68 | Có thật |
| README từng app | `bewt-original/<app>/README.md` | Docker và installation | [R2] | Có đủ tám file |
| Base và Base+ | `bewt-original/<app>/baseline/<version>/` | Suite chính dùng Page Objects | [S], [M] | 12 suite directories: 8 Base + 4 phiên bản bổ sung |
| Exp-Wait | `bewt-original/<app>/explicit_wait/<version>/` | Biến thể explicit waits | [C2] | 8 suites, dùng phiên bản mới ở app có hai baseline |
| No-PO | `bewt-original/<app>/no_pageobjects/<version>/` | Biến thể không dùng Page Objects | [C2] | 8 suites |
| Full-XPath | `bewt-original/<app>/full_xpath/<version>/` | Biến thể locator XPath tuyệt đối | [B], [C2] | 8 suites, 8 Gradle builds và 5 POM |
| Gherkin | `bewt-original/<app>/gherkin/` | Mô tả hành vi thủ công | [G], [C3] | Bludit có thêm subdirectory version; không phải bộ Cucumber thống nhất |
| Java tests | `<suite>/src/test/java/` | JUnit test classes, `BaseTest`, `TestSuite`, một số installer | [S] | Package `tests`, `test`, `base` hoặc `mediawiki` tùy app |
| Page Objects | `<baseline>/src/main/java/po/` | Encapsulate locator và thao tác giao diện | [J] | Được kiểm tra trên Base structure; Full-XPath/No-PO không theo mô hình này |
| Maven build | `<suite>/pom.xml` | Dependencies/compiler | [M], [C2] | 33 independent projects; không phải 33 modules dưới một parent |
| Docker Compose | Joomla 3.10.11; MantisBT 2.25.4; MediaWiki 1.40.0 suite directories | App + database | [D] | Các app khác hướng dẫn `docker run` trong README/scripts |
| Repetition/reset scripts | `<baseline>/flakiness.bat`, nhiều biến thể có `flakiness.sh` | Lặp suite, chép Surefire reports, tái tạo container | [F] | Có mutation và mặc định 50 lượt; không chạy trong audit |
| ExpressCart helper scripts | `bewt-original/expresscart/full_xpath/expresscart-1.19/{run-docker.sh,teardown-docker.sh}` | Run/remove container | [F] | Image khác README; teardown nhận tham số tùy ý |
| Application implementation | Không tìm thấy app source tree/Dockerfile/package.json trong BEWT scan | SUT — System Under Test, hệ thống được kiểm thử | [C2] | Java trong repo là test harness; SUT được cung cấp qua image |
| Framework/extension/data | `framework/`, `extension/`, `config/apps/`, `data/`, `runs/`, `analysis/`, `scripts/` tại root | Kiến trúc được đề cương khuyến nghị | [P] §11; root listing [C1] | Chưa tồn tại ở root lúc audit; không tạo |
| Root README/ADRs/license | Không tìm thấy root `README.md`, ADR hoặc LICENSE/COPYING/NOTICE trong vùng scan benchmark ngoài `.git` | Governance và quyền tái phân phối | [C2] | Không suy ra “không có bản quyền”; quyền sử dụng/tái phân phối NOT_VERIFIED |

Không tìm thấy `AGENTS.md` trong filesystem scan của checkout. Hướng dẫn người dùng cung cấp trong chat được áp dụng. Không tìm thấy specification khác ngoài đề cương và Gherkin để làm acceptance source cho nhiệm vụ này.

## 3. Eight Applications Inventory

### 3.1. Đối chiếu số lượng và phiên bản

**Phương pháp đếm:** `Expected` từ đề cương; `Base entries` từ danh sách `@SuiteClasses`, loại duy nhất `Installer` của Bludit; `.feature` là số file vật lý; `Scenario` là header khớp `^\s*Scenario(?: Outline)?:`. Các số này đo các artefact khác nhau, không thay thế cho semantic mapping hoặc parser validation.

| Application | Base version theo đề cương và directory | Expected | Base entries | .feature files | Scenario headers | Kết luận |
|---|---|---:|---:|---:|---:|---|
| Bludit | 2.3.4 | 23 | 23 (+1 Installer) | 23 | 0 | CONFLICT: Gherkin đặt trong `gherkin/bludit-3.13.1`; 23 `Feature:` headers có steps nhưng thiếu `Scenario` |
| Claroline | 1.11.10 | 40 | 40 | 40 | 40 | Số lượng khớp; POM artifactId là `claroline-1.11.0`, version SUT chưa xác minh |
| ExpressCart | 1.19 | 31 | 31 | 31 | 31 | Số lượng khớp; version application bên trong image chưa xác minh |
| Joomla | 3.10.11 | 35 | 35 | 35 | 35 | Số lượng khớp; cần installer và post-install |
| Kanboard | 1.2.15 | 30 | 30 | 30 | 30 | Số lượng khớp |
| MantisBT | 1.2.0 | 37 | 37 | 38 | 38 | CONFLICT: thêm `0_Login.feature`; chưa có 1–1 mapping được duyệt |
| MediaWiki | 1.40.0 | 27 | 27 | 27 | 27 | Số lượng khớp; Installer là test riêng ngoài suite |
| PrestaShop | 1.6.1.23 | 35 | 35 | 33 | 33 | CONFLICT: thiếu số lượng/mapping; tên `29_AddTag.feature` khác intent trong nội dung |
| **TOTAL** | | **258** | **258** | **257** | **234** | **258 Base case entries không đồng nghĩa 258 file Gherkin hợp lệ** |

Bằng chứng: đề cương [P] §1.2; Base suites [S]; toàn bộ file/header count [C3]. Ví dụ Bludit `gherkin/bludit-3.13.1/01_AddContentTest.feature`:1–9. MantisBT `gherkin/0_Login.feature`:1 mô tả login; Base `TestSuite.java`:9–45 có 37 entries, không có class login riêng. PrestaShop `gherkin/29_AddTag.feature`:1,6–11 mô tả language ISO; Base `TestSuite.java`:37–39 liệt kê riêng `AddTag`, `AddEmptyTag`, `AddLanguageIsoCodeValidity`. Không gán tự động file 29 cho test cùng tên và không tự bổ sung hai file để ép khớp số lượng.

Không có `Feature:` header trong phần lớn Gherkin ngoài Kanboard/Bludit; vì vậy parser Gherkin chuẩn có thể cần một lớp nhập liệu thích nghi. Đây là rủi ro từ syntax đã quan sát, **chưa chạy parser để kết luận chính xác lỗi parse**.

### 3.2. Base locations, entry points và Maven

Quy ước: `A = bewt-original/<app>`, `B = A/baseline/<Base-directory>` theo bảng. Mọi `B` đều có `pom.xml`, `src/main/java/po/` và `src/test/java/`. Toàn bộ Base POM dùng JUnit **4.12**, WebDriverManager **5.8.0**; version dependency không phải kết quả dependency resolution [M].

| App | Base-directory | Gherkin path từ A | TestSuite path từ B | Maven projects toàn app | Selenium Base | Compiler khai báo |
|---|---|---|---|---:|---|---|
| bludit | `bludit-2.3.4` | `gherkin/bludit-3.13.1/` | `src/test/java/tests/TestSuite.java` | 4 | 4.34.0 | source/target 21 |
| claroline | `claroline-1.11.10` | `gherkin/` | `src/test/java/test/TestSuite.java` | 4 | 4.35.0 | source/target 21 |
| expresscart | `expresscart-1.19` | `gherkin/` | `src/test/java/tests/TestSuite.java` | 4 | 4.35.0 | properties 21; compiler plugin source/target 1.8 |
| joomla | `joomla-3.10.11` | `gherkin/` | `src/test/java/base/TestSuite.java` | 4 | 4.35.0 | release 21 |
| kanboard | `kanboard-1.2.15` | `gherkin/` | `src/test/java/tests/TestSuite.java` | 3 | 4.35.0 | source/target 21 |
| mantisbt | `mantisbt-1.2.0` | `gherkin/` | `src/test/java/base/TestSuite.java` | 5 | 4.34.0 | release 21 |
| mediawiki | `mediawiki-1.40.0` | `gherkin/` | `src/test/java/mediawiki/TestSuite.java` | 4 | 4.35.0 | source/target 21 |
| prestashop | `prestashop-1.6.1.23` | `gherkin/` | `src/test/java/tests/TestSuite.java` | 5 | 4.35.0 | source/target 21 |
| **TOTAL** | | | | **33** | | |

Ba directory không có POM: `bludit/full_xpath/bludit-3.13.1`, `joomla/full_xpath/joomla-4.2.0`, `kanboard/full_xpath/kanboard-1.2.15`; cả ba có `build.gradle` và Gradle version catalog. Đây là giới hạn của tuyên bố README “all suites use Maven”, **không phải thiếu Base Maven project** [B], [R1]:52.

### 3.3. Setup/reset và điều kiện trước khi chạy từng ứng dụng

Tất cả dòng dưới có **VERIFIED cấu hình/tài liệu**, **NOT_VERIFIED runtime và reset thực tế**.

| App | Docker setup và dependency | Setup/reset theo artefact | Điều phải xác minh |
|---|---|---|---|
| Bludit | `bludit/docker:2.3.4`, `8080:80`; Base+ dùng 3.13.1 | Installation wizard; Base suite bắt đầu bằng `Installer`; flakiness script stop/remove rồi tạo lại | Mapping Gherkin 3.13.1 → Base 2.3.4; installer; persistence của image; script browser 138 khác Base 127 |
| Claroline | `olianasd/claroline-strongpsw`, workdir `/home/claroline`, entrypoint `./run-services-docker.sh`; `3000:80`, `3306:3306` | README nói preinstalled; script tái tạo container sau mỗi suite | Version bên trong image; dependency DB nội bộ; URL phải là `/claroline11110/claroline/index.php`; artifactId lệch |
| ExpressCart | `olianasd/expresscart-strongpsw`, `3000:1111`; image metadata expose 1111 và 27017 | README nói preinstalled; script stop/remove/recreate; không có mount trong lệnh run | Version ứng dụng/DB, seed, readiness, reset; image full_xpath khác README |
| Joomla | `joomla:3.10.11` + `mysql:5.6` qua Compose, `8080:80`, `JOOMLA_DB_HOST` | Chạy Installer, cài sample data, RemoveMessages; script tái tạo cả hai containers | DB readiness, installer/oracle, Compose project naming, dữ liệu tồn tại ngoài writable layers hay không |
| Kanboard | `kanboard/kanboard:v1.2.15`, `8080:80` | README nói ready; script stop/remove/recreate | Database backend và image-declared volumes chưa inspect; phải chứng minh dữ liệu reset, không chỉ container ID đổi |
| MantisBT | README Base dùng `dockercontainervm/mantisbt:1.2.0`; Base script dùng **`olianasd/mantisbt-strongpsw:1.2.0`**; `3000:80`, `3306:3306` | Base preinstalled theo README; script tái tạo container | **CONFLICT image** phải giải quyết trước khi chọn baseline. Base+ 2.25.4 dùng Compose, installer và `mariadb:latest`, không thay thế Base |
| MediaWiki | `mediawiki:1.40.0` + `mariadb:11.3.2`, `8080:80`; volumes `images`, `db` | Installer riêng; copy `LocalSettings.php`; script remove app+DB và cả hai named volumes | Installer/download path, readiness, config copy, volume reset và đúng project name |
| PrestaShop | `prestashop/prestashop:1.6.1.23` + `mysql:5.7`, network `prestashop-net`, `8080:80`, `DB_SERVER` | Installer riêng; post-install bỏ thư mục install, đổi admin directory; tái tạo app+DB, giữ network | Manual mutation phải nằm trong disposable SUT; image volumes, DB readiness; script browser 140 khác Base 127; Gherkin mapping |

Nguồn: từng app README [R2], Base repetition scripts [F], Compose [D], ExpressCart image metadata [C5]. Nội dung giá trị xác thực không được sao chép vào báo cáo. Những database backend không được source/config chứng minh được ghi là chưa xác minh.

## 4. Java/Selenium Architecture

### 4.1. Stack và build contract

Base dùng Java/JUnit 4/Selenium và Maven. Nhiều POM khai báo Java 21; ExpressCart đồng thời có properties Java 21 và `maven-compiler-plugin:3.7.0` cấu hình source/target 1.8 [M-EC]:15–20,44–54. **VERIFIED sự không đồng nhất cấu hình; effective compiler settings và khả năng compile NOT_VERIFIED** vì không chạy Maven build/effective-pom trong audit. Không kết luận phải dùng JDK 8 và không nâng dependency để khắc phục khi chưa có kết quả.

README tuyên bố Selenium 4.35.0/Chrome 127 [R1]:52, trong khi Base Bludit 2.3.4 và MantisBT 1.2.0 dùng Selenium 4.34.0 [M]:11. Một số Full-XPath POM/catalog còn dùng Selenium 3.141.59, JUnit 4.13.2 hoặc 4.12 và Java compatibility 1.8; hai Gradle catalogs Bludit/Kanboard có thêm Jupiter engine 5.8.1 [B]. Không được gộp các cấu hình này thành một stack đồng nhất hoặc tự chuyển Base sang JUnit 5.

Không có Surefire version được pin trong các POM đã scan; execution provider/plugin version thực tế **NOT_VERIFIED**. Gherkin không được nối trực tiếp với Java bằng Cucumber dependency trong 33 POM; việc trích inventory là xử lý artefact, không phải tái sử dụng một Cucumber runner đã có.

### 4.2. Page Object Pattern và execution flow

Page Object Pattern (đóng gói locator và thao tác của trang) đã có trong Base. ExpressCart `po/PageObject.java`:10–12 giữ WebDriver và gọi `PageFactory.initElements`; `Home` kế thừa navigation objects, dùng `@FindBy` và trả Page Objects tiếp theo [J]. Test dùng JUnit assertions để kiểm tra kết quả sau chuỗi thao tác.

Luồng ExpressCart tiêu biểu: JUnit `@Before` → tạo native ChromeDriver → implicit wait 30 giây → test mở app/admin → gọi Page Objects → assertion → `@After` gọi `driver.quit()` [J-BASE]:20–65. Mỗi test tạo browser mới; **database/SUT state không được reset bởi `driver.quit()`**.

Tám Base `BaseTest` đều có native browser setup, browser major 127, implicit wait 30 giây và teardown quit qua kiểm tra chọn dòng [C2]. Base URL được hard-code theo app; ExpressCart là `http://localhost:3000`, Claroline có subpath riêng, Joomla/MediaWiki/Kanboard dùng 8080. Không có bằng chứng một tham số `-DbaseUrl` được tất cả Base tests hỗ trợ.

Native ExpressCart đặt `--headless=new`, `--disable-gpu`, kích thước màn hình, `setBrowserVersion("127")` rồi `new ChromeDriver(options)`; không gọi WebDriverManager trong method đang được chọn. Có fallback paths tuyệt đối tới máy tác giả, nhưng method fallback không được `setUp()` gọi [J-BASE]:39–51. Remote helper dùng `http://localhost:4444/wd/hub`; README yêu cầu thay method trong Base để chọn remote [R1]:63–67. Việc đó **không được phép trong nhiệm vụ hiện tại**, nên pilot đề xuất dùng native path trước.

### 4.3. Waits, data dependencies và lỗi có thể xảy ra

Base có implicit waits nhưng vẫn dùng `Thread.sleep`, ví dụ ExpressCart AddUser:30 và nhiều Page Objects. Exp-Wait có `utils/Wait.java` dùng `WebDriverWait(Duration.ofSeconds(30))` và `ExpectedConditions` [J-WAIT]. Đây là biến thể khác, không tự chuyển test Base sang Exp-Wait để làm PASS.

**Test phụ thuộc thứ tự/state:** README [R1]:60–61 nói rõ mọi suite có dependencies; source thể hiện chuỗi tạo/sử dụng/xóa. ExpressCart `TestSuite.java`:13,16 đặt AddProduct trước SearchProduct; AddProduct:24–30 tạo `NewProduct000`, SearchProduct:18–22 dùng đúng tên đó. Các chuỗi khác gồm tạo/xóa discount, user, review, tag. Vì vậy `mvn test` không chọn suite cụ thể có nguy cơ chạy các test classes ngoài thứ tự hoặc chạy thêm suite/installer, tùy Surefire discovery; audit chưa thực thi để kết luận hành vi discovery cụ thể.

Teardown chủ yếu đóng browser, không có transaction rollback/DB fixture cleanup trên từng case. `driver.quit()` không guard null trong ExpressCart nên lỗi setup có thể kéo theo lỗi teardown [J-BASE]:62–65. Sleeps cố định, XPath phụ thuộc DOM và data names dùng lại có thể gây timing/state failure; đây là rủi ro source-based, **không phải flaky failures đã quan sát**.

### 4.4. Khả năng thêm tests mà giữ nguyên Base

**Khả thi về thiết kế**, bằng extension Maven project riêng, dùng cùng Java/JUnit/Selenium contract từng app và đặt Gherkin/code mới ngoài `bewt-original/`. Page Objects nằm trong `src/main/java` nên có thể tái sử dụng qua artifact build từ bản sao disposable, hoặc source overlay chỉ đọc với provenance rõ. `BaseTest` nằm trong `src/test/java`, không tự có trong main JAR; không giả định khai báo dependency JAR là đủ để kế thừa BaseTest.

Cần Team Lead chọn cơ chế build sandbox/overlay trước. Phương án ưu tiên để thử sau duyệt: một workspace thực thi tạm sao chép suite cần thiết, ghi code mới vào overlay, giữ nguyên bytes của bản gốc và ghi diff/hash. Build outputs ghi vào workspace tạm, không vào `bewt-original/`. Suite extension có danh sách thứ tự riêng, khai báo fixture; không chèn class mới vào `TestSuite.java` gốc. Nếu cần thêm Page Objects thì đặt trong extension và không sửa original. Tất cả mới là đề xuất, chưa tạo project/overlay.

## 5. Docker & Local Environment

### 5.1. Công cụ thực tế

| Kiểm tra chỉ đọc | Kết quả quan sát | Mức xác minh |
|---|---|---|
| `java -version` | Oracle Java 21.0.12, 64-bit | VERIFIED công cụ |
| `mvn -version` | Apache Maven 3.9.16, dùng JDK 21.0.12; Windows 11 amd64 | VERIFIED công cụ; chưa compile |
| `docker --version` | Docker 29.8.0, build 88096ef | VERIFIED CLI |
| `docker compose version` | Docker Compose v5.5.1 | VERIFIED CLI; chưa kiểm tra compatibility các Compose files cũ |
| `docker info --format '{{json .ServerVersion}}'` trong sandbox | Permission denied với named pipe `dockerDesktopLinuxEngine` | BLOCKED riêng kiểm tra trong sandbox |
| Cùng lệnh ngoài sandbox được cấp quyền | Server `29.8.0` | VERIFIED daemon; không phải lỗi app |
| `docker info` chọn OSType/Architecture/CPU/MemTotal | linux, x86_64, 16 CPUs, 7.157.481.472 bytes RAM (~6,67 GiB) | VERIFIED tài nguyên engine; đủ cho tải thực nghiệm hay không NOT_VERIFIED |
| `git --version` | 2.55.0.windows.3 | VERIFIED |
| `node --version` / `npm --version` | v24.19.0 / 11.17.0 | VERIFIED công cụ; chưa kiểm tra tương thích package LangGraph/SDK |
| Chrome file version tại Program Files | 156.0.8078.48 | VERIFIED; khác browser 127 Base chọn |
| Selenium cache Chrome executable | `C:\Users\Lenovo\.cache\selenium\chrome\win64\127.0.6533.119\chrome.exe`, file version 127.0.6533.119 | VERIFIED sự hiện diện và file version; chưa khởi chạy |
| Selenium cache driver | `C:\Users\Lenovo\.cache\selenium\chromedriver\win64\127.0.6533.119\chromedriver.exe` tồn tại | VERIFIED path; file ProductVersion trống, chưa chạy binary/session handshake |
| `Get-NetTCPConnection` lọc Listen ports 3000/8080/3306/4444/8989 | Không trả dòng listener tại thời điểm kiểm tra | Quan sát tức thời; không bảo đảm ports còn trống ở lần chạy sau |

`mvn -version` trong sandbox có thêm dòng `Access is denied.` nhưng vẫn in version và exit 0; chạy lại ngoài sandbox không còn dòng này. Không kết luận Maven hỏng. Docker read-only checks ngoài sandbox đã thành công; giới hạn sandbox vẫn cần tính đến khi thiết kế runner sau này [C4–C6].

Không kiểm tra API key, credentials, `.env` hoặc thực hiện Gemini request. Authentication/quota/cost của Gemini **NOT_VERIFIED**. Không cài TypeScript/LangGraph/SDK và không xác nhận các packages đó đã có.

### 5.2. Images, ports, volumes và startup

Tám ứng dụng đều có hướng dẫn Docker trong README [R2]; ba nhóm dùng Compose và các nhóm khác dùng `docker run`. Điều này chỉ chứng minh **deployment recipe tồn tại**, không chứng minh các registry images hiện pull được hoặc tám môi trường chạy thành công.

`docker ps -a` cho thấy không có BEWT containers tại thời điểm kiểm tra. `docker image ls` có image `olianasd/expresscart-strongpsw:<none>`, ID rút gọn `36f9dbf2b430`; không có các image app BEWT còn lại trong danh sách. Không đọc environment của containers khác và không tác động tài nguyên đó.

Metadata của image ExpressCart đã có [C5]:

| Field | Giá trị | Giới hạn |
|---|---|---|
| RepoDigest | `olianasd/expresscart-strongpsw@sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16` | Digest thực tế cục bộ; chưa chứng minh Base application version |
| ExposedPorts | `1111/tcp`, `27017/tcp` | Port 27017 gợi ý DB service; engine/version/seed chưa xác minh |
| Config.Volumes | `null` | Không có image-declared volume; chưa xác minh reset dữ liệu runtime |
| WorkingDir | `/var/expressCart` | Không có source application tương ứng trong repository |
| Entrypoint | `/bin/sh -c ./start.sh` | Chưa đọc/chạy startup script bên trong image |
| Cmd | `null` | Không có override cần thiết được chứng minh |

Các cấu hình persistence quan trọng: MediaWiki mount `images:/var/www/html/images` và `db:/var/lib/mysql`; Joomla/MantisBT Compose không khai báo named volume trong files đã đọc, nhưng image có thể tự khai báo volume. Do chưa inspect các images đó, không suy ra remove container là xóa mọi dữ liệu. MediaWiki có `LocalSettings.php` bind mount ở dạng comment; README/scripts chọn copy file [D], [F].

Environment keys liên quan được nhận diện theo cấu hình: Joomla dùng `JOOMLA_DB_HOST` và khóa password DB; MediaWiki dùng `MYSQL_DATABASE`, khóa user/password/root password; MantisBT Base+ dùng `MYSQL_DATABASE` và các khóa xác thực; PrestaShop dùng `DB_SERVER` và DB credentials. **Không tái bản giá trị credentials.** DB/network config phải nằm trong experiment manifest sau khi được duyệt; không thay bằng SQL Server hoặc Google Sheets.

Ports 8080 được dùng chung bởi Bludit/Joomla Base/Kanboard/MediaWiki/PrestaShop; 3000 và 3306 có thể trùng giữa Claroline/ExpressCart/MantisBT. Với Base URLs hard-code, ưu tiên chạy app tuần tự. Không tự sửa Base URL, Compose hoặc host ports trong original để chạy song song.

### 5.3. Reset và reproducibility

README [R1]:58 yêu cầu phá và tái tạo SUT sau **mọi lần chạy đầy đủ hoặc một phần**. Repetition scripts chứa quy trình tham khảo nhưng không phải safe runner có thể tái dùng ngay: mặc định 50 lượt, tên container cố định, fixed sleeps, không chứng minh readiness hoặc guard exit code, output ghi tương đối có thể ra ngoài suite directory [F].

Các khác biệt phải giải quyết: MantisBT Base README/script dùng hai image khác nhau; ExpressCart Full-XPath helper dùng `olianasd/expresscart-mongodb`; Bludit Base script tạo browser 138, PrestaShop Base script browser 140 trong khi BaseTest chọn 127. MantisBT README:22 còn nhắc Joomla và dòng removal:31 lặp tên container; ưu tiên đọc service names trong Compose thay vì sao chép các tên sai. Không sửa trong audit.

Chưa xác minh pull availability, image digests cho bảy app còn lại, clean-state fingerprint, HTTP readiness, database startup, reset seed và browser handshake. G0 vì thế **NOT_VERIFIED**.

## 6. ExpressCart Pilot Assessment

### 6.1. Artefact và khả năng chạy

| Hạng mục | Kết quả và bằng chứng |
|---|---|
| SUT source | Không tìm thấy application source/package.json/Dockerfile; sử dụng image [C2], [R2-EC] |
| Base identity | Directory và POM artifactId `expresscart-1.19` [M-EC]:8,12; application package/runtime version **NOT_VERIFIED** |
| Gherkin | `bewt-original/expresscart/gherkin/`, 31 files/31 Scenario headers [C3] |
| Test source | `bewt-original/expresscart/baseline/expresscart-1.19/src/test/java/tests/` |
| Page Objects | Cùng project `src/main/java/po/`, helper `src/main/java/utils/` [J] |
| Entry point | `tests.TestSuite`, 31 classes có thứ tự [S-EC]:8–40 |
| Dependencies | Selenium 4.35.0, JUnit 4.12, WebDriverManager 5.8.0; compiler ambiguity 21/1.8 [M-EC] |
| Website startup | README:13 dùng image `olianasd/expresscart-strongpsw` và `3000:1111`; metadata startup ở §5.2 |
| Browser | Native Chrome major 127; implicit wait 30 giây; appUrl localhost:3000 [J-BASE] |
| Reset recipe | Base `flakiness.bat`:12–25 / `.sh`:12–28; stop/remove rồi tạo lại image |

**Baseline Smoke Test đề xuất: `tests.AddUserTest`.** Đây là case đầu tiên trong suite, không yêu cầu data do case đứng trước tạo. Test mở `/admin`, dùng admin seed qua Page Objects, tạo một user và assert trong Users, sau đó logout [J-ADDUSER]. Preconditions vẫn phải xác minh: correct seeded admin, user fixture chưa tồn tại và website ready. Đây là test có mutation dữ liệu nên chỉ chạy trên disposable pilot SUT và phải reset sau cả PASS lẫn FAIL. Không chọn `SearchProductTest` đơn lẻ trên seed sạch vì nó phụ thuộc sản phẩm do `AddProductTest` tạo.

### 6.2. Lệnh đề xuất cho giai đoạn SAU khi duyệt

**Chưa thực hiện các lệnh trong mục này.** Cần phê duyệt quyền chạy container/build/test/reset và dùng một bản sao thực thi của suite, để `target/` không được sinh trong `bewt-original/`.

1. Tạo disposable execution copy sau khi được duyệt, ghi source SHA/hash, kiểm tra compiler contract và browser cache. Chạy các lệnh Maven sau tại root của **bản sao** `expresscart-1.19`:

```powershell
mvn clean compile test-compile
```

2. Dùng image digest cục bộ, bind loopback đúng appUrl. `--pull=never` giúp không âm thầm lấy image khác; nếu thiếu image thì dừng:

```powershell
docker run --pull=never --name bewt-covext-expresscart-pilot -p 127.0.0.1:3000:1111 -d olianasd/expresscart-strongpsw@sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16
```

3. Kiểm tra HTTP readiness và version bên trong SUT theo allowlist metadata đã duyệt; không đọc `.env`, không dump `docker inspect` environment hoặc ứng dụng config chứa secrets. Lưu quan sát seed trước test. Khi ready, chạy đúng class:

```powershell
mvn "-Dtest=tests.AddUserTest" test
```

4. Lưu exit code, stdout/stderr đã lọc, `target/surefire-reports/`, source/image/browser IDs và evidence của assertion. Sau mọi kết quả, stop/remove **đúng pilot container**, sau đó tạo lại cùng digest cho lần sau:

```powershell
docker stop bewt-covext-expresscart-pilot
docker rm bewt-covext-expresscart-pilot
```

Đây là đề xuất reset có mutation, chưa được thực hiện. Phải xác minh user fixture trở về trạng thái ban đầu sau recreation; container ID mới không đủ. Không dùng `prune`, không xóa volume toàn hệ thống. Khi đạt smoke+reset mới xin duyệt chạy cả `mvn "-Dtest=TestSuite" test`; 1 case PASS không chứng minh 31 cases PASS.

### 6.3. Failure cases cần dự kiến

- Untagged local image: README dùng tên không digest có thể dẫn tới pull/không tìm thấy tag; không suy ra digest cache đã có tag `latest`.
- Browser 156 mặc định và browser 127 trong cache: phải ghi browser session thực tế; Selenium Manager có thể cần network/cache metadata dù executable tồn tại.
- Mâu thuẫn compiler configuration: chỉ kết luận sau effective build trong bản sao; không đổi POM gốc.
- Port/name collision, SUT chưa ready, database seed khác, user fixture tồn tại: phân loại environment/data failure trước khi quy lỗi cho generated test.
- `Thread.sleep` hoặc locator lỗi thời: cần log/screenshot để phân biệt timing, locator và app behavior; không tự đổi oracle để làm PASS.
- Image digest chứng minh binary identity, chưa chứng minh version 1.19 theo đề cương; cần version evidence trước baseline freeze.

## 7. AI Agent Integration Assessment

### 7.1. Kết luận thiết kế

TypeScript orchestration gọi Java/Maven và Docker qua process/tool boundary là khả thi về kiến trúc; không cần chuyển test sang TypeScript. Node/npm đã có, nhưng chưa có package/lockfile/framework trong repo nên end-to-end integration **NOT_VERIFIED**.

Tài liệu chính thức xác nhận LangGraph JS có interrupt/checkpointer/thread identity cho human review; node được resume sẽ chạy lại từ đầu nên side effects trước interrupt phải idempotent. Đây là hỗ trợ thư viện, không phải bằng chứng implementation tại đây. [LangGraph Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts).

Gemini có function calling để model đề xuất tool và arguments; runner phía ứng dụng vẫn phải validate schema, authorization và thực thi allowlist. Không cung cấp raw host shell/Docker socket tùy ý cho model. Chưa chọn hoặc kiểm tra model, SDK version, quota và chi phí. [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling).

### 7.2. Trả lời các câu hỏi tích hợp

| Câu hỏi | Phương án đề xuất có căn cứ | Điều chưa có / điều kiện |
|---|---|---|
| 1. Agent đọc Gherkin thế nào? | Read-only allowlist `gherkin/**/*.feature`, giữ raw bytes, SHA, file/line; extractor thích nghi syntax hiện có; parser chuẩn kiểm tra trên bản dẫn xuất | 23 Bludit files thiếu Scenario; nhiều app thiếu Feature wrapper. Không sửa file gốc; cần policy normalization và mapping được duyệt [G] |
| 2. Xây behavioral inventory từ đâu? | Gherkin Given/When/Then; Base TestSuite order; test assertions; Page Object actions/locators; app/version metadata | Đây là inventory hành vi của artefact; không phải source-code coverage. SUT app source chưa có; oracle mới cần UI/docs evidence và independent review [P] §4,6,7 |
| 3. Tools để sinh test? | `read_bewt_artifact`, source lookup, schema validation, duplicate screening, candidate save, review gate, controlled Maven/reset/evidence adapters | Tất cả chưa triển khai; permission tách read/propose/build/execute/reset; Gemini không tự quyết định APPROVED |
| 4. Chạy Maven có kiểm soát? | Executable + argument array cố định, allowlisted app/candidate/class, cwd disposable, timeout/process-tree termination, CPU/RAM limits, output capture, Surefire XML parsing | Không nhận command string từ model; compile success, executed test count và assertions phải tách biệt. Không dùng blanket `mvn test` cho Base có dependency order [R1], [S] |
| 5. Reset SUT? | Adapter riêng từng app, pin digest, experiment-owned container/network/volume names, readiness và clean-state assertion; một app tại một thời điểm | Stop/remove không đủ nếu volumes giữ state; installers/post-install riêng cho Joomla/MediaWiki/PrestaShop/Bludit. Adapter chưa có [D], [F] |
| 6. Execution evidence? | `runs/<run_id>/`: command/cwd/exit/time, stdout/stderr redacted, Surefire XML/TXT, screenshots khi runner hỗ trợ, code/hash, first-pass source, repair diffs, reset fingerprint, image/browser/toolchain/model metadata, review decisions | Existing scripts chỉ chép Surefire reports; screenshot/DOM collector và append-only manifest chưa có. Không log `.env`/API keys hoặc raw secret-bearing configs |
| 7. Thêm test mà không sửa Base? | `extension/<app>/gherkin` và Selenium project/overlay riêng; reuse main Page Objects có provenance; extension suite order riêng | BaseTest là test-source, build integration cần giải quyết; Base originals giữ nguyên. Chưa build thử [J], §4.4 |
| 8. Rủi ro ưu tiên? | Version/mapping conflict, DB reset, compiler/browser mismatch, mutable image tags, prompt injection từ repo, approval replay/duplicate execution | Chưa có immutable runner/evidence contract. Source là input, không cho phép nó thay policy hoặc tool permissions [P] §5 |

### 7.3. Traceability đến RQ1–RQ4

| RQ | Dữ liệu cần ghi | Khả năng hiện tại |
|---|---|---|
| RQ1 Novelty & Validity | Toàn bộ candidates kể cả rejected, source refs, fingerprint/semantic review, hai reviewer và tie-break | Chỉ có nguồn Base/Gherkin; inventory/review dataset NOT_VERIFIED |
| RQ2 Behavioral Coverage Gain | Taxonomy, baseline denominator, behavior/condition mapping trước/sau | Chưa có matrix; không dùng 258→298 hoặc đếm file làm coverage gain |
| RQ3 Executability & Stability | Compile/execute riêng, correct oracle, clean reset, 3 reruns/case | Chưa chạy; 0 runtime-verified apps trong audit |
| RQ4 Agent Workflow Utility | LLM calls/tokens/cost/time, repair attempts, human intervention, first-pass immutable source | Framework chưa có; không thể kết luận Agent tốt hơn phương pháp khác nếu thiếu đối chứng |

Theo đề cương [P] §5–7: tối đa 2 repair rounds có audit trail; thay oracle phải xin reviewer; 3/3 reruns là kiểm tra ổn định sơ bộ, không chứng minh không flaky. Hai reviewer độc lập kiểm tra novelty/oracle; giữ cả failure và NOT_RUN trong mẫu số phù hợp. Không thay phạm vi 8 × 5.

## 8. Research Gate Assessment

`VERIFIED` nghĩa là đã kiểm tra đúng loại bằng chứng được nêu; `NOT_VERIFIED` là thiếu kiểm tra/evidence; `BLOCKED` chỉ dùng khi có trở ngại cụ thể; `CONFLICT` là nguồn không khớp. Một finding static VERIFIED không nâng cả gate lên VERIFIED.

Đề cương §6.1 còn gọi G2 là Generation Gate; §8 gọi G2 là Framework. Báo cáo giữ G2 Framework theo §8 và đánh giá cả generation/compile trong G2–G3, không tự thay acceptance criteria [P]:P252, P303–309.

| Gate | Điều kiện cần đạt | Bằng chứng hiện có | Thiếu và rủi ro | Công việc tiếp theo | Trạng thái |
|---|---|---|---|---|---|
| G0 Environment readiness | 8 app đúng Base version, pinned toolchain/images, ít nhất 1 Base case/app và reset evidence | 8 deployment recipes, Base source/POM, local CLI, Docker daemon, ExpressCart cached digest | Chưa chạy 8 app/test; 7 app images chưa có trong local list; version/image/compiler/browser conflicts; reset chưa chứng minh | Duyệt pilot ExpressCart, verify clean reset; rồi làm tuần tự bảy app | **NOT_VERIFIED**; có CONFLICT phải giải quyết. Sandbox Docker check từng bị BLOCKED, đã đọc được ngoài sandbox |
| G1 Coverage gap identification | Inventory đúng Base, source-backed gaps; 5 scenarios/app được hai reviewer duyệt | 258 Base entries; 257 Gherkin files; taxonomy trong proposal | Mapping/version/syntax conflict; chưa có inventory, candidates và human review | Duyệt mapping/normalization trên bản dẫn xuất; inventory + novelty/oracle review | **NOT_VERIFIED**, input **CONFLICT** |
| G2 AI Agent Framework | State, role nodes, tools, checkpoints, review pause/resume, generation và audit log trên 1 vertical slice | Proposal và khả năng thư viện theo official docs; Node/npm hiện có | Không có code/lockfile/schema/runner; Gemini access/quota chưa kiểm tra | Chốt contract/permissions/model budget rồi triển khai pilot sau duyệt | **NOT_VERIFIED** |
| G3 Test generation and validation | Gherkin→Java mapping, compile/execute, oracle đúng, bounded repair, reset/evidence từng app | Base architectural examples, Maven recipes | Không có test mới; không compile/run; chưa có evidence collector/human oracle sign-off | Chạy candidate đã được duyệt trong isolated runner, ghi first pass và tối đa 2 repairs | **NOT_VERIFIED** |
| G4 Reproducible benchmark extension | Manifest, 3 reruns/case từ state tương đương, reviewer sign-off, release/replication package | Proposal định nghĩa tiêu chí; BEWT SHA cục bộ xác định được | Chưa có dataset mới, reruns, approvals, license decision; repo ngoài ignore original | Chốt provenance/acquisition/license; chỉ release case đạt protocol | **NOT_VERIFIED** |

Không gate nào được đánh dấu VERIFIED. Chưa có bằng chứng một blocker kỹ thuật làm dự án bất khả thi; hiện còn các điều kiện chưa kiểm tra và conflicts cần quyết định. Dừng theo ranh giới audit không được tính là test failure hoặc tự động gán BLOCKED cho toàn bộ gate.

## 9. Risks & Blockers

| ID | Mức độ / trạng thái | Rủi ro hoặc trở ngại cụ thể | Tác động / cách xử lý đề xuất |
|---|---|---|---|
| R01 | Cao — CONFLICT | 258 Base entries nhưng 257 Gherkin files; Bludit version/syntax, Mantis login, PrestaShop intent mismatch [G] | Sai denominator/novelty. Chốt case manifest với manual mapping, không sửa original |
| R02 | Cao — CONFLICT | README uniform stack khác POM; ExpressCart compiler 21/1.8 [M] | Build contract không đồng nhất. Pin theo từng Base; kiểm chứng ở disposable copy |
| R03 | Cao — CONFLICT | MantisBT Base images khác nhau; ExpressCart helper image khác README [F] | Có thể chạy sai SUT/seed/oracle. Team Lead chọn nguồn và version evidence |
| R04 | Cao — NOT_VERIFIED | Application runtime/version, DB seed/reset, browser handshake chưa chạy | G0 chưa đạt; cần baseline smoke+reset cho 8 apps |
| R05 | Cao — VERIFIED dependency structure | TestSuite order/data names chia sẻ [S], [J] | Test đơn lẻ hoặc chạy song song có thể thiếu state. Dependency graph/fixtures và serialized app runs |
| R06 | Cao — NOT_VERIFIED | Mutable/default image tags, đặc biệt `mariadb:latest` ở Mantis Base+; bảy app images chưa có cục bộ [D], [C5] | Pin digests sau khi được duyệt pull/inspect; không đổi Base thành Base+ |
| R07 | Trung bình — BLOCKED một phần | Docker named pipe bị sandbox từ chối; ngoài sandbox đọc được [C5] | Runner cần quyền thực thi giới hạn; không gọi đây là Docker daemon/app failure |
| R08 | Cao — NOT_VERIFIED | Framework/model/quotas/cost chưa kiểm tra; Node hiện có không chứng minh SDK tương thích | Chốt versions, lockfile, API budget và deterministic tool validation trước generation |
| R09 | Trung bình — VERIFIED scripts, NOT_VERIFIED safety | Repetition scripts 50 lượt, fixed names/sleeps, manual post-install mutations [F] | Không chạy scripts nguyên trạng cho pilot; thiết kế app-scoped reset adapter |
| R10 | Cao — VERIFIED Git layout | Benchmark bị repo ngoài ignore và có Git riêng [C1] | Clone extension chưa tái lập baseline; ghi acquisition+SHA, không tự đổi Git layout |
| R11 | Cao — NOT_VERIFIED | Không tìm thấy license file trong benchmark scan [C2] | Quyền redistribution phải được Team Lead kiểm tra trước release; không suy ra được phép công bố |
| R12 | Cao — planning risk | 8 legacy environments + 40 oracle/tests + framework trong 14 ngày/4 người [P] §8 | Đề cương tự đánh giá HIGH-RISK/STRETCH GOAL; báo thiếu gate trung thực, không tự giảm app/case |

Blockers để bước sang execution: chưa có phê duyệt thao tác runtime của giai đoạn sau; cần lựa chọn image/version và xử lý mapping conflicts. Không có test/build failure mới nào được quan sát vì các kiểm tra đó không được chạy. Quyền Docker ngoài sandbox đã đủ cho kiểm tra đọc, chưa xác nhận runner tương lai được phép mutate.

## 10. Recommended Next Actions

**Chỉ là kế hoạch, chưa triển khai.**

1. **Chốt baseline contract và các conflicts.** Team Lead duyệt SHA BEWT, Base versions, bảng 258 Base cases ↔ Gherkin, quy tắc parser normalization không ghi đè source; chọn image đúng cho MantisBT và image ExpressCart theo digest. Giữ riêng 258 business cases, installer/helper và mọi spec thiếu/mislabel.
2. **Duyệt và thực hiện ExpressCart smoke + reset.** Dùng disposable execution copy, image có sẵn với digest, Chrome 127; kiểm chứng effective compiler settings, HTTP/version/seed, một `AddUserTest`, Surefire evidence và clean-state reset. Chỉ mở rộng full suite sau khi smoke/reset đạt. Từng lệnh Docker/build/test/reset cần nằm trong phạm vi duyệt, không chạy flakiness 50 lần.
3. **Hoàn tất G0 theo app và thiết kế vertical slice Framework.** Lập manifests cho tám app, verify một Base case+reset từng app; song song ở mức kế hoạch chốt schema inventory/evidence/approval, model budget và runner isolation. Chỉ sau khi được duyệt mới xây graph một candidate đi qua review→generation→validation; chưa chạy generation hàng loạt hoặc nhận 40 cases là đã hoàn thành.

Thứ tự tiếp theo sau ba việc trên: G1 inventory/review → mở rộng generation/validation theo từng app → 3 reruns/case → replication/report và release approval. Chưa thể ước lượng tỷ lệ PASS hay thời gian thực tế khi G0 chưa có runtime evidence.

## 11. Evidence References

### 11.1. Source references và anchors

Các references `[P]`, `[S]`, `[M]` là file/path đã đọc; `:n–m` là line numbers của text source. DOCX không có source line ổn định nên dùng heading/table và paragraph index `P<n>` từ extraction. Paragraph index được đếm theo document order của `//w:body/w:p | //w:body/w:tbl/w:tr/w:tc/w:p`, gộp các `w:t`; không phải số trang Word. Không tạo file extraction.

| Ref | Path / anchor | Quan sát |
|---|---|---|
| P | `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx`; SHA256 `E1FCF5B04BBCF6807F1355EB2A9448D1BEB8EE3473B1E46CDD81B8D44A9343E0` | Đã đọc P1–P468. Version/date P5; table P45–97; RQ P125–143; framework P190–246; validation P247–289; gates P290–316; deliverables/layout P397–427; appendices P439–468 |
| R1 | `bewt-original/README.md`:14–48,52–68 | 36 suites, 8 app, variants, stack, Maven run, reset/order, remote browser |
| R2 | `bewt-original/{bludit,claroline,expresscart,joomla,kanboard,mantisbt,mediawiki,prestashop}/README.md` | Tám tài liệu deployment/setup; đọc với credential-related lines bị loại khỏi output ở các lượt đọc có lọc |
| R2-EC | `bewt-original/expresscart/README.md`:9–27 | Image, port, ready claim, Maven commands |
| S | `bewt-original/<app>/baseline/<Base-directory>/src/test/java/<package>/TestSuite.java` theo §3.2 | Bludit:8–33; Claroline:9–50; ExpressCart:8–40; Joomla:8–44; Kanboard:8–39; MantisBT:8–46; MediaWiki:8–36; PrestaShop:8–44 |
| S-EC | `bewt-original/expresscart/baseline/expresscart-1.19/src/test/java/tests/TestSuite.java`:8–40 | 31 ordered entries |
| G | `bewt-original/<app>/gherkin/**/*.feature` | Counts [C3]; Bludit `bludit-3.13.1/01_AddContentTest.feature`:1–9; Mantis `0_Login.feature`:1–6; PrestaShop `29_AddTag.feature`:1–11 |
| M | `bewt-original/<app>/baseline/<Base-directory>/pom.xml` theo §3.2 | XML scan toàn bộ 33 POM; Base versions/dependencies; Bludit 2.3.4:11–14; Mantis 1.2.0:11–13; Claroline:6,11–14 |
| M-EC | `bewt-original/expresscart/baseline/expresscart-1.19/pom.xml`:15–55 | Dependency versions và compiler mismatch |
| B | `bewt-original/<app>/full_xpath/<version>/build.gradle` (8 files); ba POM absences nêu §3.2; `gradle/libs.versions.toml` của Bludit/Kanboard/Joomla Full-XPath | Gradle sourceCompatibility 1.8; catalogs legacy dependencies |
| D-J | `bewt-original/joomla/baseline/joomla-3.10.11/docker-compose.yml`:3–19 | Joomla, MySQL, ports, links/environment keys |
| D-M | `bewt-original/mantisbt/baseline/mantisbt-2.25.4/docker-compose.yml`:3–19 | Mantis Base+, MariaDB latest, port 8989 |
| D-W | `bewt-original/mediawiki/baseline/mediawiki-1.40.0/docker-compose.yml`:6–35 | MediaWiki, MariaDB, images/db volumes, config comment |
| D | Ba refs D-J/D-M/D-W | Phân biệt Base với Base+; không dump config secret values |
| F | Tám Base `flakiness.bat`; ExpressCart Base `.sh`; ExpressCart Full-XPath `run-docker.sh`:2 và `teardown-docker.sh`:2–3 | Run/reset evidence là source recipe, chưa execution. Mantis Base `.bat`:19 khác README:16; Bludit Base `.bat`:11 browser 138; PrestaShop Base `.bat`:14 browser 140 |
| J-BASE | `bewt-original/expresscart/baseline/expresscart-1.19/src/test/java/tests/BaseTest.java`:20–65 | URL, hooks, native/remote browser, wait, teardown |
| J-ADDUSER | Cùng test directory `AddUserTest.java`:14–32 | First test, create/assert/logout flow, fixed sleep; không tái bản credential values |
| J | ExpressCart Base `src/main/java/po/PageObject.java`:10–12, `Home.java`:12–19,26–66, `SearchResultsPage.java`:19–28; tests `AddProductTest.java`:24–30, `SearchProductTest.java`:15–22 | PageFactory, locators, fluent flow và concrete dependency |
| J-WAIT | `bewt-original/expresscart/explicit_wait/expresscart-1.19/src/main/java/utils/Wait.java`:13–36 | WebDriverWait/ExpectedConditions |
| W1 | [LangGraph JS Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts), đọc 2026-10-29 | Checkpointer, thread ID, interrupt/resume và replay; chỉ xác minh capability documented |
| W2 | [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling), đọc 2026-10-29 | Function declarations và JS tool calls; không xác minh tài khoản/API |

Không dùng kết quả runtime từ checkout/nghiên cứu trước để tính VERIFIED cho repository hiện tại. Không kiểm chứng độc lập bài báo/website BEWT trực tuyến trong audit này; các con số nghiên cứu được đối chiếu với đề cương và artefact local, không tuyên bố đã xác thực mọi phát biểu học thuật của bài báo.

### 11.2. Lệnh kiểm tra đã thực hiện và kết quả

Đây là nhật ký lệnh **đã chạy**, tách biệt với lệnh đề xuất ở §6.2. Các command groups được thực hiện bằng PowerShell, chỉ đọc trừ việc ghi báo cáo.

| Ref | Lệnh / cách kiểm tra | Kết quả quan sát | Trạng thái |
|---|---|---|---|
| C1 | `Get-ChildItem -Force`; `git status --porcelain=v1`; `git rev-parse HEAD`; cùng hai Git lệnh với `git -C bewt-original`; `git submodule status`; `git ls-files --stage bewt-original`; `git check-ignore bewt-original`; `git ls-files` | Hai HEAD ở §2.1; ban đầu cả hai clean; repo ngoài chỉ track `.gitignore` và DOCX; benchmark ignored, không có submodule entry | VERIFIED Git metadata, không mutation |
| C2 | `rg --files --hidden bewt-original` theo filename globs; `Get-ChildItem ... -Recurse -Filter pom.xml/TestSuite.java/BaseTest.java`; parse POM bằng `[xml]` và XML namespace; scan `AGENTS.md`, README, Gradle, Dockerfile/package/license names | 33 POM, 36 suites, 36 BaseTest, 8 Gradle builds; không có modules/aggregator; ba Gradle-only dirs; scan README/instructions/source layout như §2 | VERIFIED static |
| C2b | Với mỗi `TestSuite.java`, regex `\b\w+\.class`, trừ `Suite.class`; kiểm tra referenced class file cùng directory | 36 suites, **1.166 entries**, không in missing class warning; không chứng minh compile | VERIFIED static |
| C2c | Scan `src/test/**/*.java` với `^\s*@Test(?:\s|$|\()` | 1.183 annotation lines, bao gồm helper/installer/tests ngoài suite | VERIFIED text count; không dùng thay 1.166 suite entries hoặc 258 Base business cases |
| C3 | `Get-ChildItem bewt-original -Recurse -Filter '*.feature'`; group theo app; `Select-String` header `Scenario` và `Feature` | 257 files; 234 Scenario headers; 53 Feature headers = 23 Bludit + 30 Kanboard; per-app table §3.1 | VERIFIED counts; parser/semantic mapping NOT_VERIFIED |
| C4 | `java -version`, `mvn -version`, `docker --version`, `docker compose version`, `git --version`, `node --version`, `npm --version` | Versions §5.1; Maven sandbox có Access is denied nhưng exit 0; ngoài sandbox sạch | VERIFIED command results |
| C5a | `docker info --format '{{json .ServerVersion}}'` | Sandbox exit 1 permission denied named pipe; cùng lệnh ngoài sandbox exit 0 `29.8.0` | BLOCKED sandbox / VERIFIED ngoài sandbox |
| C5b | `docker info --format 'OSType={{.OSType}} Architecture={{.Architecture}} CPUs={{.NCPU}} MemTotal={{.MemTotal}}'` | linux/x86_64/16/7157481472 | VERIFIED read-only ngoài sandbox |
| C5c | `docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'`; `docker image ls --format '{{.Repository}}:{{.Tag}}|{{.ID}}'` | Không có BEWT container; ExpressCart image untagged cục bộ, các image BEWT app khác không có trong list | VERIFIED snapshot ngoài sandbox; không liệt kê project khác trong báo cáo |
| C5d | `docker image inspect 36f9dbf2b430 --format '{{json .RepoDigests}}|{{json .Config.ExposedPorts}}|{{json .Config.Volumes}}|{{json .Config.WorkingDir}}|{{json .Config.Entrypoint}}|{{json .Config.Cmd}}'` | Digest/ports/no declared volumes/startup metadata §5.2 | VERIFIED read-only ngoài sandbox; không đọc `.Config.Env` |
| C6 | `Get-Item` Chrome files và ProductVersion; enumerate chỉ `chrome.exe`/`chromedriver.exe` dưới Selenium cache; `Get-Command chromedriver`; `Get-NetTCPConnection -State Listen` lọc năm ports | Chrome 156 installed, Chrome 127 cached, cached driver path hiện diện; không có PATH driver output/listener output | VERIFIED presence/snapshot; browser execution NOT_VERIFIED |
| C7 | DOCX ZIP `word/document.xml` extraction qua `System.IO.Compression.ZipFile` và XPath; `Get-FileHash -Algorithm SHA256` | Đọc đầy đủ proposal; SHA256 và anchors [P] | VERIFIED read-only |
| C8 | `git -C bewt-original diff --exit-code`; `git -C bewt-original diff --cached --exit-code`; `git status --short --untracked-files=all` ở cả hai repo; `git diff --check`; đọc lại HEAD | Sau ghi report: repo ngoài chỉ có `?? docs/audits/BEWT-INITIAL-REPOSITORY-AUDIT.md`; benchmark status/diffs trống; hai HEAD giữ nguyên; không lỗi whitespace được Git báo | VERIFIED Git-detected preservation |

Một lượt `rg` dùng Windows wildcard directory `bewt-original/*/baseline` trả lỗi path syntax; đã thay bằng enumeration directory cụ thể và đọc tám Base scripts. Không dùng kết quả search lỗi làm bằng chứng “không tồn tại”. Các kiểm tra version/browser source chỉ đọc, không mở browser, installer hoặc Selenium session. Không pull/build/run container hoặc gọi Maven compile/test.

## 12. Decision Points for Team Lead

| Quyết định cần duyệt | Đề xuất để xem xét | Lý do / điều kiện trước bước sau |
|---|---|---|
| Baseline source identity và replication | Dùng BEWT SHA `0501249ff3e9a5ea83a06155cd2971dc36197056`; ghi acquisition/provenance ngoài original | Repo ngoài đang ignore benchmark; không tự thêm submodule/vendor/đổi Git layout |
| Canonical 258-case mapping | Duyệt manifest riêng phân biệt Base cases, installers, extra login, missing/mislabelled/versioned Gherkin; normalization trên bản dẫn xuất | Không sửa Gherkin gốc hoặc đổi expected counts của proposal |
| Per-app environment contract | Pin từng Base version/Selenium/JUnit/compiler/browser; giải quyết Mantis image và version evidence ExpressCart | Không nâng dependency hoặc thay Base bằng Base+ |
| Pilot execution authorization | Cho phép disposable copy, Docker run/stop/remove đúng pilot, Maven compile/một Base test và reset/evidence theo §6.2 | Các thao tác này chưa được phép trong audit và chưa thực hiện |
| Extension integration mechanism | Chọn Maven extension/overlay ngoài original, source hash/diff rõ, output ở execution workspace | Tái sử dụng PO main sources; BaseTest test-source cần contract riêng |
| Framework/model/tool policy | Chọn versions/lockfile, Gemini model/budget, allowlisted tools, timeout/resources, human review checkpoints | Chưa có framework/API verification; không cấp raw shell hoặc Docker quyền rộng cho model |
| Research review và release | Chỉ định hai reviewers/tie-break, rubric/oracle policy, 2 repair rounds/3 reruns, license review | Không tự nhận VALIDATED; không tự publish/commit/push |
| Timeline và gate handling | Giữ 8 × 5 theo đề cương; nếu không đạt gate thì báo và xin điều chỉnh riêng | Không giảm scope hoặc cam kết 40 PASS trước thực nghiệm |

**Kết thúc audit:** chỉ thêm `docs/audits/BEWT-INITIAL-REPOSITORY-AUDIT.md`. Đã kiểm tra đủ 12 section bắt buộc, 8 fence markers cân bằng, UTF-8 không có replacement character và không có trailing whitespace. Các original sources, Gherkin, tests, POM, Docker configs và Git history không được sửa; benchmark Git status/diffs trống, hai HEAD giữ nguyên. Chưa có runtime test evidence mới. Dừng tại đây, chờ Team Lead xem xét trước mọi bước triển khai.
