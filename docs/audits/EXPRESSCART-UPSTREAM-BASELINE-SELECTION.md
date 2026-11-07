# Đánh giá upstream và lựa chọn baseline ExpressCart

Ngày kiểm tra: **2026-10-29**. Phương pháp: đọc GitHub upstream chính thức, file nguồn thô trên `master`, website chính thức liên kết từ repository và source/config local của BEWT. Không clone, pull, build, cài dependency hay chạy/xóa Docker resource. `bewt-original/` không chỉnh sửa.

Trạng thái phát hiện dùng như sau: **VERIFIED** = quan sát trực tiếp nguồn được trích; **NOT_VERIFIED** = chưa có bằng chứng đủ; **BLOCKED** = endpoint/cách truy cập cụ thể không cho lấy dữ liệu; **CONFLICT** = các nguồn đưa ra thông tin không khớp.

## 1. Upstream Verification

### Repository chính thức và ranh giới với fork/image

**VERIFIED:** Repository upstream có liên kết nguồn package là [mrvautin/expressCart](https://github.com/mrvautin/expressCart). GitHub page xác nhận repository công khai, chủ sở hữu `mrvautin`, mô tả ExpressCart, hiển thị license MIT và có cây source gồm `app.js`, `package.json`, `package-lock.json`, `Dockerfile`, `docker-compose.yml`, `routes/`, `views/`, `config/` [U1]. `package.json` tại raw upstream tự khai báo repository URL trỏ về cùng GitHub repo, author Mark Moffat, package `express-cart`, version `1.1.19`, Node engine `>=10.16.0`, license MIT [U2].

Image pilot [`olianasd/expresscart-strongpsw`](https://hub.docker.com/r/olianasd/expresscart-strongpsw) là image bên thứ ba, không phải tên GitHub owner/upstream. Image ID cục bộ được kiểm tra trong báo cáo audit Docker trước là `36f9dbf2...`; digest xác định image binary nhưng không chứng minh repository commit hoặc package version. Không dùng image này làm nguồn baseline mới.

Kết quả Google/GitHub search còn chứa repository fork `reactDev037/Express-Cart`. Trang đó tự ghi nó là ExpressCart nhưng khác owner và không phải URL repository do upstream `package.json` công bố [U3]. Không lấy fork đó làm upstream chính thức. Kết luận chính thức được xác định từ provenance bên trong package gốc và chủ repo; GitHub repository không có trường VERIFIED độc lập về danh tính pháp lý của tác giả.

### Tags, releases, cập nhật và maintenance

| Câu hỏi | Bằng chứng | Trạng thái |
|---|---|---|
| Có GitHub Releases? | Tab Releases của repository hiện nói không có releases [U4] | VERIFIED: không thấy GitHub Releases tại ngày snapshot |
| Có Git tags? | Tab Tags được mở nhưng trang trả nội dung Releases/không có danh sách tag cụ thể [U5] | **BLOCKED**: danh sách tag/tag dates không đọc được; không khẳng định không có Git tags |
| Version cao nhất? | `master/package.json` hiện quan sát được là `1.1.19` [U2] | VERIFIED: version trên master snapshot; **NOT_VERIFIED** đây có phải version được release/tag cuối cùng hoặc version cao nhất có tag |
| Ngày cập nhật gần nhất? | GitHub Commits page có timeline lịch sử; phần đọc được cho thấy commit trong 2021, trong khi repository activity/search snapshot hiển thị hoạt động gần nhất khoảng 2023 nhưng không có commit cụ thể kèm SHA/date trong response [U1], [U6] | **NOT_VERIFIED** chính xác latest commit SHA/date. Không gọi ngày `master/package.json` được crawl là ngày cập nhật |
| Maintenance | GitHub page cho thấy Issues/PRs và commit history, nhưng không hiển thị archived status trong response; source hiện đại hoá README còn liên kết wiki; activity evidence không đủ xác định maintainer đang bảo trì release [U1], [U6] | **NOT_VERIFIED** trạng thái chính thức “maintained/discontinued”. Có thể nói releases không có và maintenance cadence chưa được chứng minh |
| License | Repository hiển thị MIT; LICENSE page ghi MIT License/copyright 2018 Mark Moffat [U1], [U7]; package cũng `MIT` [U2] | VERIFIED metadata/license file; pháp chế dự án vẫn tự đánh giá phạm vi sử dụng |

Không dùng tuổi của kết quả crawler, số sao/forks, hay ngày của một commit bất kỳ thay cho release metadata. Trước khi freeze baseline phải lấy full immutable commit SHA và tag listing từ upstream; hiện hai giá trị đó chưa được xác minh trong lần kiểm tra này.

## 2. Available Versions

### Nguồn chính thức

| Tham chiếu | Phiên bản/identity | Ý nghĩa và giới hạn |
|---|---|---|
| BEWT original | Directory/POM `expresscart-1.19`; Base POM Selenium 4.35.0, JUnit 4.12 | Directory version là tên benchmark, không tự chứng minh npm package version hay source commit |
| Upstream `master` snapshot | `package.json` version `1.1.19`, Node `>=10.16.0`, MongoDB driver `^3.3.3`, MIT | Version chính thức được khai báo trực tiếp trong source hiện hành đã đọc [U2]. Branch có thể thay đổi; snapshot chưa có commit SHA |
| Upstream GitHub Releases | Không có release entries được hiển thị [U4] | Không có official release version để xếp hạng bằng GitHub Releases |
| Upstream Git tags | Tab Tags không trả danh sách đọc được [U5] | NOT_VERIFIED; không tạo danh sách/tag mới bằng suy đoán |
| Image cũ | `olianasd/expresscart-strongpsw@sha256:36f9dbf2b4307c99e8e033e7715848097de748932673c89436fe0fcf5434eb16` | Third-party cache; phiên bản source/runtime provenance chưa chứng minh; loại khỏi lựa chọn mới |
| Fork `reactDev037/Express-Cart` | GitHub search result cho một fork khác owner | Không phải canonical upstream theo `package.json`; không coi là candidate chính thức [U3] |

“Phiên bản mới nhất” được phát biểu có giới hạn: **1.1.19 là version trong package manifest của `master` snapshot đã xem.** Vì không đọc được tag list hoặc GitHub API Releases/Tags, version release/tag mới nhất và ngày phát hành gần nhất là `NOT_VERIFIED`. `master` không phải version đã pin. Không ghi nhận official release mới hơn 1.1.19 bằng chứng cụ thể.

### Runtime, database và Docker source

- Upstream `package.json` khai báo Node `>=10.16.0`; Dockerfile `master` lại chọn `mhart/alpine-node:8` và đặt `NODE_VERSION 8.9.4` [U2], [U8]. **CONFLICT:** Dockerfile runtime pin không thỏa package engine requirement hiện được công bố. Dockerfile còn chạy `npm install`, không `npm ci` từ lockfile; vì thế dependency tree có thể drift.
- Compose upstream `master` chọn `mongo:3.4.10`, app port `1111`, database port `27017`, named volume `expresscart-mongo-data` và `depends_on` [U9]. `depends_on` theo cấu hình không chứng minh Mongo đã healthy/readied trước app. Compose tự build app image và cũng khai báo `image: node:8`, cần kiểm tra semantics bằng Compose version/tooling đã pin trước deployment.
- Wiki upstream mô tả Express/Node/MongoDB [U10]. Source `config/settings.json` trên master chứa database connection default tới `127.0.0.1:27017/expresscart`; field SMTP/email cũng có trong tracked config [U11]. Các giá trị nhạy cảm không được sao chép vào báo cáo. Environment mới phải override config/secrets bằng file riêng không tracked hoặc cơ chế secret phù hợp, và xác nhận app container dùng Mongo service hostname.
- `master/Dockerfile` đặt `VOLUME /var/expressCart/data`, expose `1111`, entrypoint npm start [U8]. Do đó container recreation đơn thuần có thể không reset app data/session/file storage. Reset phải xác định riêng named volume, Mongo volume và mọi bind mount trong experiment namespace.
- Upstream branch README hiện rất ngắn và trỏ tới Wiki [U12]; Wiki “How to install” có thời điểm chỉnh sửa 2020 [U10]. Đây là tài liệu nguồn project nhưng không đủ để chứng minh hướng dẫn còn khớp `master` snapshot hay Docker setup chạy được ngày hiện tại.

## 3. BEWT Compatibility Assessment

Các đường dẫn trong bảng đều thuộc `bewt-original/expresscart/`; giữ nguyên file. Các finding tương thích là static source review, không phải execution.

| Khía cạnh | BEWT baseline hiện tại | Upstream master `1.1.19` | Tác động/ước lượng |
|---|---|---|---|
| Admin route | Base `BaseTest.goToAdminHome()` mở `/admin`; app URL `http://localhost:3000` [`baseline/expresscart-1.19/src/test/java/tests/BaseTest.java`:20,58–60] | Upstream Wiki xác nhận admin ở `/admin`, app Docker mặc định port 1111 [U10] | Route có vẻ khớp; đổi port map có thể giữ host-side port 3000. Cần runtime check sau này |
| Login flow | `AdminLoginPage.java`:10,13,16 dùng IDs `email`, `password`, `loginForm`; methods setEmail/setPassword/doLogin ở :24–36. Tests dùng seeded owner account (không đưa credential vào report) | README/Wiki nói admin tạo mới qua admin UI; source master cần đối chiếu markup/installer [U10], [U12] | Medium: có thể khác bootstrap flow/default admin credentials. Cần dedicated seed/init adapter và locator check |
| User selectors | `NewUserPage.java`:10–31 dùng IDs `usersName`, `userEmail`, `userPassword`, `btnUserAdd`; `UsersPage.java`:10–14 có absolute XPath; `AddUserTest.java`:14–32 tạo user rồi đọc third row | Upstream source layout có routes/views, nhưng không xác minh được HTML của deployed branch trong audit | High risk: absolute row XPath và “third user” phụ thuộc seed/order; dự kiến kiểm tra và điều chỉnh 2–4 user/admin locators/assertions |
| Product selectors | `NewProductPage.java`:9–24 IDs `productTitle`, `productPrice`, XPath editor/save; `ProductsPage.java`:10–24 absolute XPath cho first product | Upstream version có product/admin features nhưng exact markup chưa kiểm tra live/source line-by-line | Medium-high: 2–4 locators/assertions có thể cần adapt; rich-text editor/timing có thể đổi |
| Search/assertion | `SearchProductTest.java`:15–22 kiểm tra search key và first product name, literal `NewProduct000` | Upstream project cùng mục tiêu ecommerce/search nhưng inventory/query UI chưa chứng minh tương đương | Low-to-medium nếu product creation/query behavior còn giữ; phải validate exact result/empty state |
| Page Objects | PO Java dưới `baseline/.../src/main/java/po/`; PageFactory; tests trong JUnit 4 `src/test` | Upstream là Node/Express/Handlebars, không cung cấp Selenium Java Pages | Framework PO vẫn tái dùng/điều chỉnh ở adapted extension; gần như không có production-code reuse |
| Test data | Fixed names `TestUser000`, `NewProduct000`; AddProduct tạo record và SearchProduct dùng record; suite order trong `TestSuite.java`:13–16 | DB state MongoDB; upstream Compose khai báo persistent database volume | High reproducibility risk nếu DB/image seed không reset. Cần unique fixture namespace hoặc deterministic seed per run |
| Assertions | Assert user row exact text; assert product first item exact title; search exact key/title | Expected messages, roles, sorting/order, defaults có thể đổi | Oracle review bắt buộc; không sửa assertion để “pass” trước khi xác nhận behavior |
| Database/deployment | README Base image `olianasd/expresscart-strongpsw`, host `3000:1111`; Base scripts recreate app container. Full-XPath uses other third-party image `olianasd/expresscart-mongodb` | Official source: Node/Express + Mongo; official Compose master uses Mongo 3.4.10 and app 1111 [U9], wiki [U10] | Dễ tạo adapted Compose; pinning/health/reset hiện cần tự xây. Không dùng image bên thứ ba cũ |
| Java/browser | Base POM Selenium 4.35.0/JUnit 4.12; Java properties 21 nhưng compiler plugin source/target 1.8; BaseTest pins Chrome 127, implicit wait 30s | Không áp dụng cho SUT Node; Selenium/browser harness vẫn chạy độc lập | Pin Java 21, resolve compiler mismatch trong disposable extension build; Selenium 4.35.0 + Chrome/driver 127 là initial harness candidate, cần handshake/evidence |

**Adapted baseline effort estimate (inference from static source differences):** expected **low-to-medium** if admin routes/core flows remain: about **4–8 test/PO methods** needing review or edit, plus login/admin seed and reset tooling. If product/user admin workflows or selectors changed substantially, estimate **8–15 methods** and possible oracle redesign. This is a planning range only; no upstream markup execution or test has been run. Keep original BEWT 31-test snapshot immutable and track each adapted test against old scenario ID.

## 4. Baseline Alternatives

| Phương án | Deployability | Reproducibility | BEWT compatibility | Test adaptation | Technical risk | Research value |
|---|---|---|---|---|---|---|
| **A. Upstream source version 1.1.19** | Source manifest and Docker recipe exist; recipe has Node 8 vs engine >=10 conflict, so requires controlled build adaptation | High if commit SHA, lockfile, Node/Mongo digests and generated image pinned; low if use floating `master`/tags | Closest by manifest/package name and expected legacy features; still not proven runtime-equivalent to third-party BEWT image | Estimated 4–8 methods if flows preserved (inference) | Medium: legacy Node 8/10 ecosystem, mutable dependencies, Mongo 3.4.10, unverified current compatibility | Best for direct methodological continuity and an adapted Baseline |
| **B. Version newer than 1.1.19** | No newer official release/tag verified; upstream master currently declares 1.1.19 | NOT_VERIFIED until a concrete newer upstream commit/tag is identified | Unknown; newer fork/release may change behavior | Cannot estimate responsibly without exact candidate | High until provenance/version established | None for now; do not choose based on “latest” assumption |
| **C. A pinned upstream commit chosen by source/date/testability** | Build from official source at a full commit SHA after verifying remote tag/commit | Highest when commit, package-lock, base image digests and DB digest are fixed | Can select a commit whose package is 1.1.19 or another proven revision and build adapted baseline | Same expected 4–8 methods for 1.1.19 source; verify on exact pin | Lower reproducibility risk than floating branch; maintenance/security age remains | Strongest for experiment validity: exact provenance and controlled adaptation |

Version 1.19 in BEWT directory is an **application/build label**, while official npm package manifest observed is `express-cart@1.1.19`. Their numeric forms differ; do not equate without comparing source commit/image. There is no evidence in this audit that the cached `olianasd` image was built from a particular official commit.

## 5. Recommended Version

**Recommend option C, with upstream source package version 1.1.19 as the candidate baseline and a full commit SHA as the actual pin.** This chooses reproducibility and testability rather than “latest”. It is an evidence-backed candidate because `master/package.json` says 1.1.19 and BEWT calls its suite 1.19; it remains a candidate because official tag list/latest commit SHA could not be verified, Dockerfile conflicts with current package engine declaration, and Selenium compatibility has not been executed.

Before Team Lead freezes it, obtain read-only upstream refs for the full commit SHA and tags using GitHub API or another authoritative interface, compare `package.json`/`package-lock.json`/Dockerfile at that commit, and confirm no newer official tag exists. If upstream commit corresponding to 1.1.19 cannot be identified, choose the current `master` full SHA (whose manifest reports 1.1.19) only after explicit review of its source changes and Node/Mongo runtime adaptation. Do not build from a moving branch name.

No evidence-backed newer official version was found; therefore **option B is not recommended now**. If Team Lead prioritizes supported runtimes over direct continuity, pick a specific fork/commit only under a separately documented provenance and scope decision; do not call a fork official ExpressCart.

## 6. Fresh Environment Architecture

Proposed topology; nothing has been created or started:

```text
BEWT-CovExt experiment namespace (unique run/project ID)
  ├─ expresscart app: image built from pinned mrvautin/expressCart commit
  ├─ MongoDB: fixed major/minor/patch image digest; internal network only
  ├─ fresh app-data storage + fresh Mongo data volume per baseline run
  └─ Selenium runner: Java 21 / Maven / Selenium 4.35 / pinned Chrome+driver
```

| Concern | Recommendation |
|---|---|
| Source identity | `mrvautin/expressCart`, exact full Git commit SHA and source archive checksum; package manifest/lockfile checked against selected commit. Current SHA/tag remains NOT_VERIFIED |
| Docker build | Build a project-owned experiment image from source; use Node base image compatible with package engine and pin its digest. Do not copy the official Node 8 Dockerfile unchanged because manifest requires >=10.16.0. Record this build adaptation and rationale |
| Database | MongoDB is required. Official Compose snapshot uses `mongo:3.4.10`; treat it as a historical compatibility candidate only. Verify app Mongo driver compatibility and image provenance, then pin exact image digest; do not use `mongo:latest` |
| Runtime | Use explicit Node version selected from app compatibility validation; currently Node >=10.16.0 by package manifest. Legacy dependency install may fail on modern Node; inspect lockfile/install/build offline before choosing. Secrets/config injected at runtime from ignored secret file, never copied into source/image/evidence |
| Java/test harness | Java 21, Maven 3.9.16 are present locally from previous audit. Preserve Selenium 4.35.0/JUnit 4.12 initial baseline. Reconcile Maven compiler plugin 1.8 vs POM properties 21 only in extension build; do not alter original POM |
| Browser | Chrome 127 is selected by BaseTest while host Chrome observed was 156 and cached binary 127. Pin runner image/browser/driver to a mutually compatible exact build; record `chrome --version`, `chromedriver --version`, capabilities before experiment |
| Namespace | Unique Compose project name e.g. `bewt-covext-expresscart-<commit-short>-<run-id>`; service/container/network/volume names scoped to that namespace. Bind web port to loopback and a dedicated free host port; Mongo is internal-only, not published |
| Data initialization | Deterministic seed script/fixture for admin and minimal product catalog, sourced from a reviewed test-data manifest. Never copy old database volume. Disable outbound email/payment integrations; use fake/local adapters |
| Reset | Tear down only exact Compose project resources and experiment-scoped app/Mongo volumes; recreate from pinned images and seed; verify counts/fixture fingerprint before each run. Keep a protected baseline manifest and never issue global prune |
| Evidence | Append-only run manifest: source SHA, image digests, lockfile hash, Node/Java/Maven/Selenium/browser versions, Compose config hash with secrets redacted, seed hash, commands, exit codes, Surefire XML/logs/screenshots, test case mapping, reset fingerprint and reviewer decisions |

Fresh app storage is required in addition to a fresh Mongo volume because upstream Dockerfile declares `/var/expressCart/data` [U8]. Distinct names and a private Compose network avoid MamXanh containers/volumes/networks. Existing ExpressCart image is not part of this graph.

## 7. Risks

| Risk | Evidence/status | Control |
|---|---|---|
| Official tags/API metadata inaccessible through page renderer | Releases empty; tags page no list; GitHub API request blocked by browsing tool [U4–U5] | Fetch metadata with an approved read-only GitHub API method before freezing SHA |
| No verified newer release than 1.1.19 | `master/package.json` says 1.1.19; no releases visible | Report newest manifest version with scope; do not label it newest release |
| Docker recipe pins Node 8 despite package engine >=10.16 | Conflict between Dockerfile and package.json [U2], [U8] | Adapt runtime intentionally and record; validate compatibility on the pinned commit |
| Old runtime/dependencies/database | Dockerfile Node 8; Compose Mongo 3.4.10; dependencies include older Express/Mongo driver generations [U2], [U8–U9] | Isolate offline/test environment; pin images; assess security and buildability before deployment |
| BEWT tests assume fixed selectors, ordering, seed and exact strings | Static Base sources and suite order in §3 | Adapt test methods with traceability and reviewed oracle; preserve original suite |
| Unstable or insufficient upstream seed | Wiki shows admin setup flow but reproducible seed/reset not verified [U10] | Implement deterministic seed and assert clean-state fingerprint |
| Readiness race | Compose only declares `depends_on` [U9] | Healthcheck/wait-for-ready gate before Selenium |
| Data persists in two locations | Mongo named volume and app `/data` volume [U8–U9] | Reset both experiment-scoped stores and verify them |
| Third-party cache provenance | Legacy image owner differs from official source | Exclude old image entirely from new benchmark source |
| Exact latest commit date/maintenance | Upstream commit page partially rendered, no confirmed current SHA/date | Record NOT_VERIFIED pending API/tag query; do not infer “maintained” status |

## 8. Team Lead Decision Points

1. Chấp nhận **upstream package 1.1.19** làm candidate, pending xác minh Git tag/full commit SHA; hay ưu tiên revision khác sau khi có source evidence?
2. Duyệt adapted baseline có thay đổi Docker runtime Node 8→compatible Node và thêm deterministic Mongo/app-data reset, trong extension workspace riêng.
3. Duyệt MongoDB image version/digest sau khi xác thực driver compatibility; official Compose `3.4.10` là historical config, không mặc định an toàn/khả dụng.
4. Duyệt mức test adaptation dự kiến 4–8 methods và tiêu chí giữ lại/loại case; yêu cầu review oracle cho từng assertion thay đổi.
5. Duyệt isolated namespace, loopback host port, internal-only Mongo, fresh volumes, seed/reset protocol và evidence retention.
6. Cho phép một giai đoạn tiếp theo chỉ đọc truy vấn GitHub tags/releases/commit API để khóa source identity trước khi có bất kỳ clone/build/run action nào.

**Kết thúc:** báo cáo này là nội dung duy nhất được tạo. Không clone, pull, build, chạy hoặc xóa resource; không thay đổi `bewt-original/` hay dependency. Dừng để Team Lead quyết định.

## Evidence References

- **U1** — [Official upstream repository page](https://github.com/mrvautin/expressCart): owner, public repo, tree files, MIT, current visible repository metadata.
- **U2** — [Official upstream `package.json` on master](https://raw.githubusercontent.com/mrvautin/expressCart/master/package.json): package version 1.1.19, engines >=10.16.0, Mongo driver, repository URL and MIT metadata.
- **U3** — [Other repository `reactDev037/Express-Cart`](https://github.com/reactDev037/Express-Cart): separate owner/repo, not provenance named in U2.
- **U4** — [Official Releases page](https://github.com/mrvautin/expressCart/releases): no GitHub Releases shown in snapshot.
- **U5** — [Official Tags page](https://github.com/mrvautin/expressCart/tags): page loaded without a readable list; do not infer tag absence.
- **U6** — [Official master commit history](https://github.com/mrvautin/expressCart/commits/master/): history page, partial timeline; retrieved view includes commits in Nov 2021. Exact current tip SHA/date not verified.
- **U7** — [Official LICENSE file](https://github.com/mrvautin/expressCart/blob/master/LICENSE): MIT License, copyright 2018 Mark Moffat.
- **U8** — [Official upstream Dockerfile on master](https://raw.githubusercontent.com/mrvautin/expressCart/master/Dockerfile): Node base/version, `npm install`, workdir, data volume, port and entrypoint.
- **U9** — [Official upstream Compose file on master](https://raw.githubusercontent.com/mrvautin/expressCart/master/docker-compose.yml): app/Mongo services, ports, dependency and Mongo data volume.
- **U10** — [Official ExpressCart Wiki](https://github.com/mrvautin/expressCart/wiki): Node/Express/Mongo description, admin and installation guidance; some pages last edited 2020.
- **U11** — [Upstream settings file](https://raw.githubusercontent.com/mrvautin/expressCart/master/config/settings.json): localhost app/database defaults and config shape. Secret-bearing values were excluded from this report.
- **U12** — [Upstream README](https://raw.githubusercontent.com/mrvautin/expressCart/master/README.md): directs users to project Wiki/demo.
- **L1** — `bewt-original/README.md`:14–68: BEWT suite variants, Selenium 4.35/Chrome 127, Maven, ordering/reset and remote browser instructions.
- **L2** — `bewt-original/expresscart/README.md`:9–27: third-party image deployment and Maven commands.
- **L3** — `bewt-original/expresscart/baseline/expresscart-1.19/pom.xml`:8,15–20,25–42,44–54: artifactId, dependency versions and compiler configuration conflict.
- **L4** — `bewt-original/expresscart/baseline/expresscart-1.19/src/test/java/tests/BaseTest.java`:20–65: host URL, `/admin`, browser version, waits, lifecycle.
- **L5** — `.../src/test/java/tests/TestSuite.java`:8–40: 31-class execution order.
- **L6** — `.../src/main/java/po/AdminLoginPage.java`:8–51; `NewUserPage.java`:8–87; `UsersPage.java`:8–34: admin selectors and Page Object flow.
- **L7** — `.../src/main/java/po/NewProductPage.java`:7–67; `ProductsPage.java`:8–40; `Home.java`:15–22,59–66; `SearchResultsPage.java`:8–28: product/search selectors and assertions.
- **L8** — `.../src/test/java/tests/AddUserTest.java`:14–32; `AddProductTest.java`:14–32; `SearchProductTest.java`:10–23: data and behavior linkage; credentials intentionally omitted.
- **L9** — prior read-only local Docker inventory (report `docs/audits/EXPRESSCART-CLEAN-REBUILD-ASSESSMENT.md`): ExpressCart image digest/ID, no current ExpressCart container; must re-query before any future Docker action.

External facts reflect pages retrieved on 2026-10-29; live branch, tag list and package may change.
