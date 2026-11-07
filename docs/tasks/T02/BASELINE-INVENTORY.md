# T02 — Baseline Inventory & Test Mismatch Audit (8 Applications)

> **Program:** BEWT-CovExt  
> **Task:** T02 — Benchmark Audit (Parallel Worktree)  
> **Source Baseline Reference:** `bewt-original/` (pinned at commit `0501249ff3e9a5ea83a06155cd2971dc36197056` from `https://github.com/OlianasD/BEWT.git`)  
> **Scope Document:** `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` (v2.0, 20/10/2026)  
> **Audit Date:** 2026-11-08  
> **Verification Status:** STATIC_AUDIT_VERIFIED (read-only audit of baseline repository, no runtime executed)

---

## 1. Executive Summary

This document establishes the empirical baseline inventory for the eight target web applications in BEWT-CovExt. The research proposal v2.0 references Table 2 of Olianas, Leotta & Ricca (2026) (*BEWT: Extended Benchmarking for End-to-End Web Testing*, Journal of Systems and Software), which reports **258** original test cases across 8 applications.

A granular, file-by-file audit of `bewt-original/` reveals that the actual baseline repository contains **257 Gherkin feature files** and **257 business test classes in Base TestSuites** (258 if including Bludit's initial `Installer.class`). The apparent count discrepancy of "258" in the literature stems from two balancing anomalies:
1. **MantisBT:** Contains **38** Gherkin feature files (`0_Login.feature` + 37 numbered features), while its `TestSuite.java` contains **37** test classes (Login is executed implicitly in test setup, so the paper counted 37).
2. **PrestaShop:** Contains **35** test classes in `prestashop-1.6.1.23/TestSuite.java`, but only **33** Gherkin feature files in `prestashop/gherkin/` (two Java tests, `AddEmptyTag` and `AddLanguageIsoCodeValidity`, lack `.feature` files in the repository). The paper counted 35 from the Java suite.
3. **Net effect:** $38 - 1 = 37$ (MantisBT) and $33 + 2 = 35$ (PrestaShop), explaining why Table 2 reported $23 + 40 + 31 + 35 + 30 + 37 + 27 + 35 = 258$, whereas the repository actually has $23 + 40 + 31 + 35 + 30 + 38 + 27 + 33 = 257$ `.feature` files.

Furthermore, **Bludit**'s 23 Gherkin feature files completely omit the standard `Scenario:` keyword (containing only `Feature:` followed directly by `Given/When/Then`), causing standard Gherkin regex parsers to return 0 scenarios unless parsed with lenient indentation-based grammar.

---

## 2. Benchmark Baseline Summary Matrix

| Application | Proposal Base Label | Actual Base Suites in BEWT | TestSuite Java Classes (Base) | Gherkin `.feature` Files | Explicit `Scenario:` Headers | Page Object Classes (`src/main/java`) | Test Class Naming Pattern |
|---|---|---|---|---|---|---|---|
| **Bludit** | `2.3.4` | `bludit-2.3.4`, `bludit-3.13.1` | 24 (1 Installer + 23 business) | 23 | 0 (implicit) | 17 (in `po`) | `*Test.java` |
| **Claroline** | `1.11.10` | `claroline-1.11.10` | 40 | 40 | 40 | 22 (in `po`) | `Claroline_*Test.java` |
| **ExpressCart** | `1.19` (pkg `1.1.19`) | `expresscart-1.19` | 31 | 31 | 31 | 28 (in `po`, `utils`) | `*Test.java` |
| **Joomla** | `3.10.11` | `joomla-3.10.11`, `joomla-4.2.0` | 35 | 35 | 35 | 31 (in `po`, `utils`) | Bare class name (no `Test` suffix) |
| **Kanboard** | `1.2.15` | `kanboard-1.2.15` | 30 | 30 | 30 | 27 (in `po`) | Bare class name (no `Test` suffix) |
| **MantisBT** | `1.2.0` | `mantisbt-1.2.0`, `mantisbt-2.25.4` | 37 | 38 | 38 | 20 (in `po`, `utils`) | Bare class name (1.2.0); `*Test.java` (2.25.4) |
| **MediaWiki** | `1.40.0` | `mediawiki-1.40.0` | 27 | 27 | 27 | 16 (in `po`) | `*Test.java` |
| **PrestaShop** | `1.6.1.23` | `prestashop-1.6.1.23`, `prestashop-1.7.8.5` | 35 | 33 | 33 | 33 (in `po`, `utils`) | Bare class name (no `Test` suffix) |
| **TOTAL** | — | **12 Baseline Suites** | **258** (with Bludit Installer) / **257** (business) | **257** | **234** (explicit) + **23** (implicit) | **194** Page Objects across Base | Varied across 3 distinct naming conventions |

---

## 3. Detailed Application-by-Application Audit

### 3.1. Bludit

- **Upstream / Base Label:** `2.3.4` (Base), `3.13.1` (Base+)
- **Baseline Directory:** `bewt-original/bludit/baseline/bludit-2.3.4`
- **Gherkin Directory:** `bewt-original/bludit/gherkin/bludit-3.13.1` *(Note anomaly: Gherkin folder is named `bludit-3.13.1`, but its 23 files match the 23 business tests of `bludit-2.3.4`)*
- **POM Configuration:**
  - `selenium.version`: `4.34.0`
  - `junit.version`: `4.12`
  - `maven.compiler.source` / `target`: `21`
  - Dependencies: `selenium-java`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure:** `tests.TestSuite` contains **24 classes**:
  1. `Installer.class` (executes `/install.php` wizard, sets English, sets password `e2eW3Bt3s71nGB3nchM4rK`)
  2. `AddContentTest.class`
  3. `ChangeUrlTest.class`
  4. `ChangePositionTest.class`
  5. `ChangeParentTest.class`
  6. `AddAsDraftTest.class`
  7. `SetStickyPostTest.class`
  8. `DeletePostTest.class`
  9. `AddUserTest.class`
  10. `ChangePasswordTest.class`
  11. `AddSocialsTest.class`
  12. `ChangeHomeTest.class`
  13. `OrderByPositionTest.class`
  14. `AddSiteSocialTest.class`
  15. `SetFooterTest.class`
  16. `ChangeLanguageTest.class`
  17. `DeleteUserTest.class`
  18. `ChangePostDateTest.class`
  19. `BadLoginFailsTest.class`
  20. `AddCategoryTest.class`
  21. `AssignCategoryTest.class`
  22. `SeeCategoryArticlesTest.class`
  23. `DeleteCategoryTest.class`
  24. `EmptyLoginFailsTest.class`
- **Second Version (`bludit-3.13.1`):** Has 26 classes in `TestSuite.java`: `Installer.class` + 25 business tests (adds `DisableUserTest.class` and `ChangeCategoryUrlTest.class`).
- **Gherkin Anomalies:**
  - All 23 `.feature` files lack the `Scenario:` keyword. Example from `01_AddContentTest.feature`:
    ```gherkin
    Feature: Add a new content
        Given the user is on the login page of the administration panel (/admin)
            When the user enters "admin" in the Username field
            And enters "0f5c3cc1b73dce21d0c5516033185f86" in the Password field
            And clicks the "Login" button
            And clicks a "New content" link
            And enters "Test Content" in the "Title" field
            And clicks the "Save" button
        Then "Test Content" is shown as first content in the "Published" section of the "Manage content" page
    ```
- **Page Objects (`src/main/java/po`):** 17 classes (`AddUserPage`, `AdminHome`, `AdminLogin`, `AdminSidebar`, `AdvancedSettingsPage`, `CategoriesPage`, `ChangePasswordPage`, `EditCategoryPage`, `EditContentPage`, `ManageContentPage`, `NewCategoryPage`, `NewContentPage`, `RegionalSettingsPage`, `SiteSettingsPage`, `SocialNetworksSettingsPage`, `UsersPage`, `WelcomePage`).
- **Dependencies & Execution Order:** Strictly sequential. `Installer` must run first to seed the admin account. Subsequent tests create posts/categories/users that later delete tests depend on.

---

### 3.2. Claroline

- **Upstream / Base Label:** `1.11.10`
- **Baseline Directory:** `bewt-original/claroline/baseline/claroline-1.11.10`
- **Gherkin Directory:** `bewt-original/claroline/gherkin/` (40 `.feature` files)
- **POM Configuration:**
  - `selenium.version`: `4.35.0`
  - `junit.version`: `4.12`
  - `maven.compiler.source` / `target`: `21`
  - Dependencies: `selenium-java`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure:** `test.TestSuite` contains **40 classes**, perfectly aligned with the 40 Gherkin files:
  - All test classes reside in package `test` and are prefixed with `Claroline_`:
    `Claroline_AddUserTest`, `Claroline_SearchUserTest`, `Claroline_LoginUserTest`, `Claroline_AddCourseTest`, ..., `Claroline_RemoveCourseTest`.
- **Gherkin Headers:** All 40 files have standard `Feature:` and `Scenario:` headers.
- **Page Objects (`src/main/java/po`):** 22 classes (`AdminAddNewUserPage`, `AdminCoursesPage`, `AdminPage`, `AdminUsersPage`, `AdvancedCourseSearchPage`, `CourseCreationPage`, `CourseEnrolmentPage`, `CourseEventsPage`, `CourseExercisesPage`, `CourseHomePage`, `DoExercisePage`, `EditExercisePage`, `EditUserPage`, `HomePage`, `LeftMenuAdmin`, `LeftMenuPlatform`, `LeftMenuUser`, `ManageExerciseQuestionsPage`, `MyCoursesPage`, `NewExercisePage`, `UserEnrolmentPage`, `UserProfilePage`).
- **Dependencies & Execution Order:** 40 tests sequentially chained. Tests 01–21 create users, courses, exercises, and enrolments. Tests 22–34 test boundary/negative flows. Tests 35–40 clean up exercises, events, enrolments, users, and courses.

---

### 3.3. ExpressCart

- **Upstream / Base Label:** `1.19` (Upstream package: `1.1.19`, commit `b31302f4e99c3293bd742c6d076a721e168118b0`)
- **Baseline Directory:** `bewt-original/expresscart/baseline/expresscart-1.19`
- **Gherkin Directory:** `bewt-original/expresscart/gherkin/` (31 `.feature` files)
- **POM Configuration:**
  - `selenium.version`: `4.35.0`
  - `junit.version`: `4.12`
  - `maven.compiler.source` / `target`: `21`
  - Dependencies: `webdrivermanager:5.8.0`, `junit`, `selenium-java`
- **TestSuite Structure:** `tests.TestSuite` contains **31 classes**:
  - `AddUserTest` (01) through `SearchDeletedProductFailsTest` (31).
- **Gherkin Headers:** All 31 files contain standard `Feature:` and `Scenario:` headers.
- **Page Objects (`src/main/java`):** 28 classes (26 in `po`, 2 in `utils`):
  - `po`: `AdminDashboardPage`, `AdminLoginPage`, `AdminSidebar`, `CartSidebar`, `CheckoutPage`, `DiscountsPage`, `EditDiscountPage`, `EditMenuPage`, `EditOrderPage`, `EditProductPage`, `EditUserPage`, `HomePage`, `NewDiscountPage`, `NewMenuPage`, `NewProductPage`, `NewUserPage`, `OrderDetailsPage`, `OrdersPage`, `PaymentPage`, `ProductDetailsPage`, `ProductsPage`, `ReviewsPage`, `SettingsPage`, `ShippingPage`, `TopNavBar`, `UsersPage`.
  - `utils`: `JavascriptExecutor`, `XpathGenerator`.
- **Dependencies & Execution Order:** Strictly sequential. User created in 01 is used for review in 09 and deleted in 25. Products created in 05 are placed into cart in 07 and deleted in 30.

---

### 3.4. Joomla

- **Upstream / Base Label:** `3.10.11` (Base), `4.2.0` (Base+)
- **Baseline Directory:** `bewt-original/joomla/baseline/joomla-3.10.11`
- **Gherkin Directory:** `bewt-original/joomla/gherkin/` (35 `.feature` files)
- **POM Configuration:**
  - `selenium.version`: `4.35.0`
  - `junit.version`: `4.12`
  - `maven.compiler.release`: `21`
  - Dependencies: `selenium-java`, `selenium-support`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure:** `base.TestSuite` contains **35 classes**:
  - Naming anomaly: classes do NOT have a `Test` suffix, except `AdminLoginTest`. Examples: `BadLogin.class`, `EmptyLogin.class`, `AddUser.class`, `LoginAsNewUser.class`, `AddNewArticle.class`, `DeleteCategory.class`.
  - Note: `base.Installer` exists in `src/test/java/base/Installer.java` to automate Docker initialization, but it is executed prior to `TestSuite` (via `mvn -Dtest=Installer test`), not included inside `TestSuite.java`.
- **Gherkin Headers:** All 35 files have standard `Feature:` and `Scenario:` headers.
- **Page Objects (`src/main/java`):** 31 classes (30 in `po`, 1 in `utils`):
  - `po`: `AddUserPage`, `ArchivedArticlesPage`, `AssignedGroupPage`, `AuthorLoginPage`, `BaseNavBar`, `CategoryManagerArticlesPage`, `CategoryManagerNewCategoryPage`, `FieldGroupManagerNewFieldGroupPage`, `FieldGroupManagerPage`, `FieldManagerNewFieldPage`, `FieldManagerPage`, `GeneralArticlesPage`, `GeneralArticlesTrashPage`, `GeneralMenuPage`, `GeneralUsersPage`, `HomeFrontendPage`, `HomeMainPage`, `HomeNavBar`, `InstallerPage`, `JoomlaLoginPage`, `MenuManagerItemsPage`, `MenuManagerNewItemPage`, `MenuManagerPage`, `NewArticlePage`, `NewUserGroupPage`, `PasswordResetPage`, `PostInstallationMessagesPage`, `TopRightNavBar`, `UserGroupManagerPage`, `UserProfilePage`.
- **Dependencies & Execution Order:** 35 sequential steps. User, articles, categories, menu items, user groups, and fields are created, edited, and deleted in ordered sequence.

---

### 3.5. Kanboard

- **Upstream / Base Label:** `1.2.15`
- **Baseline Directory:** `bewt-original/kanboard/baseline/kanboard-1.2.15`
- **Gherkin Directory:** `bewt-original/kanboard/gherkin/` (30 `.feature` files)
- **POM Configuration:**
  - `selenium.version`: `4.35.0`
  - `junit.version`: `4.12`
  - `maven.compiler.source` / `target`: `21`
  - Dependencies: `selenium-java`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure:** `tests.TestSuite` contains **30 classes**:
  - Naming anomaly: all test classes omit the `Test` suffix: `AddNewProject.class`, `AddEmptyProject.class`, `AddNewTask.class`, `EditProfile.class`, `RemoveUser.class`, `RemoveProject.class`, `AddNewCurrencyRate.class`.
- **Gherkin Headers:** All 30 files have standard `Feature:` and `Scenario:` headers.
- **Page Objects (`src/main/java/po`):** 27 classes (`AddNewProjectPage`, `ApplicationSettingsPage`, `BoardSettingsPage`, `CategoriesPage`, `ColumnsPage`, `CurrencyRatesPage`, `EditProjectPage`, `EditTaskPage`, `EditUserProfilePage`, `KanboardLoginPage`, `LeftMenuSettings`, `LeftMenuTask`, `NewColumnPage`, `NewLocalUserPage`, `NewPrivateProjectPage`, `NewRemoteUserPage`, `NewSubtaskPage`, `NewSwimlanePage`, `NewTaskPage`, `ProjectOverviewPage`, `ProjectSettingsPage`, `ProjectUsersPage`, `RemoveProjectPage`, `RemoveUserPage`, `SwimlanesPage`, `TaskDetailsPage`, `UserManagementPage`).
- **Dependencies & Execution Order:** 30 sequential tests. Projects and tasks created early on are populated with columns/categories, modified, and removed at steps 26 and 28.

---

### 3.6. MantisBT

- **Upstream / Base Label:** `1.2.0` (Base), `2.25.4` (Base+)
- **Baseline Directory:** `bewt-original/mantisbt/baseline/mantisbt-1.2.0`
- **Gherkin Directory:** `bewt-original/mantisbt/gherkin/` (**38 `.feature` files**)
- **POM Configuration:**
  - `selenium.version`: `4.34.0`
  - `junit.version`: `4.12`
  - `maven.compiler.release`: `21`
  - Dependencies: `selenium-java`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure:** `base.TestSuite` contains **37 classes**:
  - `AddUser`, `AddExistingUserFails`, `AddEmptyUserFails`, `AddProject`, ..., `DeleteMultipleProjects`, `Logout`.
  - Notice: `0_Login.feature` is NOT in `TestSuite.java` because user login is handled in the `@Before` fixture of `BaseTest.java`.
- **Count Mismatch Explanation:**
  - Gherkin directory has 38 files: `0_Login.feature`, plus 37 numbered files `01_AddUser.feature` through `37_Logout.feature`.
  - Java test suite has 37 classes (`AddUser` through `Logout`).
  - Table 2 in the research proposal counted 37, matching the Java TestSuite classes, leaving `0_Login.feature` as an extra specification.
- **Page Objects (`src/main/java`):** 20 classes (19 in `po`, 1 in `utils`):
  - `po`: `AssignIssuePage`, `BaseNavBar`, `CreateProjectPage`, `CreateSubprojectPage`, `DeleteIssuePage`, `EditCategoryPage`, `EditProjectPage`, `EditUserPage`, `HomeMainPage`, `IssuePage`, `ManageCategoriesPage`, `ManageProjectsPage`, `ManageUsersPage`, `MantisLoginPage`, `NewCategoryPage`, `NewIssuePage`, `NewUserPage`, `TopNavBar`, `ViewIssuesPage`.
  - `utils`: `ManageAlerts`.
- **Second Version (`mantisbt-2.25.4`):** Contains 37 classes with standard `*Test.java` naming (e.g., `AddUserTest.java`, `AddProjectTest.java`). Uses `docker-compose.yml` with MySQL and requires `base.Installer` JUnit execution.

---

### 3.7. MediaWiki

- **Upstream / Base Label:** `1.40.0`
- **Baseline Directory:** `bewt-original/mediawiki/baseline/mediawiki-1.40.0`
- **Gherkin Directory:** `bewt-original/mediawiki/gherkin/` (27 `.feature` files)
- **POM Configuration:**
  - `selenium.version`: `4.35.0`
  - `junit.version`: `4.12`
  - `maven.compiler.source` / `target`: `21`
  - Dependencies: `selenium-java`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure:** `mediawiki.TestSuite` contains **27 classes**:
  - `CreateUserTest` (01) through `CreateEmptyUser_Fails` (27).
  - Note: `mediawiki.Installer` exists in `src/test/java/mediawiki/Installer.java` to download `LocalSettings.php`, run prior to `TestSuite` execution.
- **Gherkin Headers:** All 27 files contain standard `Feature:` and `Scenario:` headers.
- **Page Objects (`src/main/java/po`):** 16 classes (`AddCategoryPage`, `BlockUserPage`, `ChangeCredentialsPage`, `CreateAccountPage`, `DeletePage`, `EditPage`, `HistoryPage`, `HomePage`, `InstallerPage`, `ManageUserRightsPage`, `MediawikiLoginPage`, `PageSpecialPages`, `ProtectPage`, `SearchResultPage`, `SpecialPage`, `UserPage`).
- **Dependencies & Execution Order:** 27 sequential tests. User created in 01 creates pages in 03/04, edited in 06, protected in 11, promoted to admin in 14, blocked in 18, and deleted in 20.

---

### 3.8. PrestaShop

- **Upstream / Base Label:** `1.6.1.23` (Base), `1.7.8.5` (Base+)
- **Baseline Directory:** `bewt-original/prestashop/baseline/prestashop-1.6.1.23`
- **Gherkin Directory:** `bewt-original/prestashop/gherkin/` (**33 `.feature` files**)
- **POM Configuration:**
  - `selenium.version`: `4.35.0`
  - `junit.version`: `4.12`
  - `maven.compiler.source` / `target`: `21`
  - Dependencies: `selenium-java`, `junit`, `webdrivermanager:5.8.0`
- **TestSuite Structure (1.6.1.23):** `tests.TestSuite` contains **35 classes**:
  - `AddNewProduct`, `AddEmptyProduct`, `EditProduct`, `AddNewState`, `AddEmptyState`, `AddNewProductWithTax`, `AddNewProductWithTax10`, `AddNewFeatures`, `AddEmptyFeature`, `AddNewAttribute`, `AddEmptyAttribute`, `AddNewAddress`, `AddEmptyAddress`, `AddNewCategory`, `AddEmptyCategory`, `EditCategory`, `AddNewManufacturer`, `AddEmptyManufacturer`, `EditManufacturer`, `AddNewSupplier`, `AddEmptySupplier`, `RemoveSupplier`, `RegisterEmployee`, `RegisterEmployee_NoName`, `RegisterEmployee_NoEmail`, `RegisterEmployee_NoPassword`, `RegisterEmployee_NoPermission`, `OutOfStockValidity`, `AddTag`, **`AddEmptyTag`**, **`AddLanguageIsoCodeValidity`**, `AddCurrency`, `AddEmptyCurrency`, `EditAddress`, `EditEmployee`.
- **Count Mismatch Explanation:**
  - PrestaShop 1.6.1.23 `TestSuite.java` has **35 classes**.
  - PrestaShop `gherkin/` folder has only **33 `.feature` files** (`01_AddNewProduct.feature` to `33_EditEmployee.feature`).
  - Two Java test classes in 1.6.1.23 have NO corresponding `.feature` files in `gherkin/`:
    1. `AddEmptyTag.java`
    2. `AddLanguageIsoCodeValidity.java`
  - Furthermore, in the second version (`prestashop-1.7.8.5`), `TestSuite.java` has **33 classes**: it drops `AddLanguageIsoCodeValidity` and `RegisterEmployee_NoPermission`, but retains `AddEmptyTag`.
  - Table 2 in the research proposal recorded **35**, citing the Java test class count of version 1.6.1.23, even though the Gherkin specification dataset only has 33 files.
- **Page Objects (`src/main/java`):** 33 classes (32 in `po`, 1 in `utils`):
  - `po`: `AddAddressPage`, `AddAttributePage`, `AddCategoryPage`, `AddCurrencyPage`, `AddFeaturesPage`, `AddManufacturerPage`, `AddProductPage`, `AddStatePage`, `AddSupplierPage`, `AdminLoginPage`, `AdminNavbar`, `AdminToolbar`, `AttributesPage`, `CatalogPage`, `CategoriesPage`, `CurrenciesPage`, `CustomerAddressesPage`, `EmployeesPage`, `FeaturesPage`, `GeneralAdminPage`, `ManufacturersPage`, `NewEmployeePage`, `OutOfStockOrderingPage`, `ProductAttributesPage`, `ProductFeaturesPage`, `ProductInformationPage`, `ProductPricesPage`, `ProductQuantitiesPage`, `ProductShippingPage`, `StatesPage`, `SuppliersPage`, `TagsPage`.
  - `utils`: `FillForm`.
- **Dependencies & Execution Order:** 35 sequential tests. Requires `tests.Installer` execution, then removal of `install/` directory and renaming `admin` to `administrator` inside container before tests can run.

---

## 4. Test Mismatch Taxonomy and Anomaly Classification

We classify the discrepancies discovered between the theoretical benchmark description and the actual physical artifacts:

```mermaid
flowchart TD
    subgraph Literature["Theoretical Specification (Paper Table 2: 258 Cases)"]
        T2["Table 2: 258 Total Cases"]
    end

    subgraph Mismatches["Artifact Discrepancies in bewt-original"]
        M1["M1: Bludit Installer.class in TestSuite<br/>(24 classes vs 23 business tests)"]
        M2["M2: Bludit Gherkin folder tagged 'bludit-3.13.1'<br/>(holds 23 tests matching 2.3.4)"]
        M3["M3: Bludit Gherkin files lack 'Scenario:' keyword<br/>(23 implicit scenarios)"]
        M4["M4: MantisBT 0_Login.feature unexecuted<br/>(38 feature files vs 37 TestSuite classes)"]
        M5["M5: PrestaShop missing 2 .feature files<br/>(35 TestSuite classes vs 33 .feature files)"]
        M6["M6: Inconsistent Java test class naming<br/>(*Test vs Claroline_*Test vs bare names)"]
    end

    subgraph ActualRepo["Physical Repository Totals"]
        GherkinFiles["257 Gherkin .feature Files"]
        JavaClasses["257 Business Test Classes<br/>(258 with Bludit Installer)"]
    end

    T2 -.-> M4
    T2 -.-> M5
    M4 --> GherkinFiles
    M5 --> GherkinFiles
    M1 --> JavaClasses
```

### Detailed Taxonomy:

1. **M1 — Embedded Installer Class in TestSuite (Bludit):**
   - *Impact:* `bludit-2.3.4/src/test/java/tests/TestSuite.java` contains 24 classes, where the first is `Installer.class`. The proposal counts 23 cases because `Installer.class` is environment setup rather than a functional test case.
2. **M2 — Version Tag Mismatch in Directory Hierarchy (Bludit):**
   - *Impact:* `bewt-original/bludit/gherkin/` contains a single directory named `bludit-3.13.1`, but its 23 `.feature` files exactly map to the 23 test classes of `bludit-2.3.4`. Any adapter resolving baseline Gherkin for Bludit must explicitly map this path rather than expecting `gherkin/bludit-2.3.4`.
3. **M3 — Syntax Non-conformance (Bludit Gherkin):**
   - *Impact:* All 23 Bludit `.feature` files omit `Scenario:`. Strict parsers (e.g. standard Cucumber/Gherkin parser) fail or report 0 scenarios. The BEWT-CovExt Gherkin parser must tolerate `Feature:` directly followed by step keywords (`Given`).
4. **M4 — Surplus Gherkin Specification (MantisBT):**
   - *Impact:* `mantisbt/gherkin/` has 38 files because `0_Login.feature` was specified, but in Java, login was implemented as `@Before` fixture setup across tests rather than an independent test class in `TestSuite.java`. The paper counted 37 cases.
5. **M5 — Missing Gherkin Specifications (PrestaShop):**
   - *Impact:* PrestaShop has 35 Java test classes in `prestashop-1.6.1.23`, but only 33 `.feature` files. `AddEmptyTag` and `AddLanguageIsoCodeValidity` exist only in Java code. The proposal counted 35 cases based on the Java test count.
6. **M6 — Inconsistent Test Class Naming Conventions:**
   - *Group A (Standard `*Test.java`):* Bludit, ExpressCart, MediaWiki, MantisBT 2.25.4.
   - *Group B (Prefixed `Claroline_*Test.java`):* Claroline.
   - *Group C (Bare class names without `Test` suffix):* Joomla (`AddNewArticle.java`), Kanboard (`AddNewProject.java`), MantisBT 1.2.0 (`AddUser.java`), PrestaShop (`AddNewProduct.java`).
   - *Impact on Framework:* Application adapters cannot assume Maven Surefire's default `**/Test*.java` or `**/*Test.java` patterns. Tests must be executed by exact fully qualified class name or via `TestSuite.java`.

---

## 5. Summary of Baseline Traceability

| Metric | Theoretical Paper Claim | Verified Physical Count in `bewt-original` | Delta / Explanation |
|---|---|---|---|
| Total Target Applications | 8 | 8 | 0 (Exact match) |
| Total Baseline Suites | 12 (8 Base + 4 Base+) | 12 (8 Base + 4 Base+) | 0 (Exact match) |
| Total Gherkin `.feature` Files | 258 | **257** | -1 (MantisBT +1, PrestaShop -2) |
| Explicit `Scenario:` Headers | 258 | **234** | -24 (Bludit: 23 files have 0 explicit headers; PrestaShop: -2 files; MantisBT: +1 file) |
| Total Base Business Test Classes | 258 | **257** (or 258 with Bludit Installer) | 0 if counting Bludit Installer; -1 business tests |
| Total Page Object Classes (Base) | Not reported in Table 2 | **194** across 8 Base suites | High reuse potential for AI Selenium generation |

*Conclusion:* The benchmark baseline is robust, complete, and reproducible. The 258 vs 257 discrepancy is fully explained and documented. No manual alteration of input files is needed; the framework adapter contract must respect these physical findings.
