# Manual review of four adapted BEWT suites

Compared the 17 test files identified in `../offline-compile-20261110-r11/source-assertion-screen.json` against read-only BEWT commit `0501249ff3e9a5ea83a06155cd2971dc36197056` and task source `59df094130eadc9d6634d04b70e3b4906bb55bd0`. Review examined whitespace-normalized diffs with sensitive string values redacted; literal locator names were compared in memory without publishing values. The other 234 original POM/source files match under that normalization. The four new `ExperimentConfig` classes are additions, not original files.

| App / file | Observed non-whitespace change | Behavior or oracle implication |
|---|---|---|
| Joomla `AddUser.java` | New-user password now comes from admin-password environment input. | Test data and coupling change; source assertion unchanged. Requires fixture validation. |
| Joomla `BaseTest.java` | Admin username/password and URL are environment inputs; native pinned-browser setup replaced by remote WebDriver; malformed endpoint now throws. | Execution and fixture change; browser/version comparability remains unverified. |
| Joomla `ChangePassword.java` | Old/new password literals become admin/alternate environment inputs. | Test data changes; successful change requires suitable, distinct values and correct prior state. |
| Joomla `ChangePasswordDontMatch.java` | Login password becomes alternate environment input; the two mismatch inputs remain unchanged. | Depends on previous password setup; negative assertion remains. |
| Joomla `Installer.java` | Remote WebDriver and configured installer URL, admin/DB inputs; site-name literal changed. | Installer data/execution change; 18 literal locator expressions unchanged as a multiset. Successful install not established. |
| Joomla `LoginAsNewUser.java` | New user's login password becomes admin-password environment input. | Must agree with `AddUser` fixture; source assertion unchanged. |
| MantisBT `AddExistingUserFails.java` | Email test literal changed. | Negative test still uses its pre-existing assertion; actual fixture state and duplicate semantics need runtime review. |
| MantisBT `AddMultipleUsers.java` | Email test literal changed. | Input data changed; test ordering and expected rows remain to be verified. |
| MantisBT `AddUser.java` | Email test literal changed. | Four assertion expressions match original; their actual row behavior and fixture remain unverified. |
| MantisBT `BaseTest.java` | URL/admin credentials now configured; native pinned-browser setup replaced by remote WebDriver; malformed endpoint throws. | Execution and login fixture change; no evidence yet of equivalent runtime behavior. |
| MediaWiki `BaseTest.java` | URL/admin credentials now configured; local browser options replaced by remote WebDriver; malformed endpoint throws. | Execution/browser and login fixture change; exact browser/driver comparability unverified. |
| MediaWiki `ChangePassword_OKTest.java` | New password and confirmation use alternate environment input. | Inputs change together; valid distinct password and prior state need runtime checks; success assertion unchanged. |
| MediaWiki `CreateUserTest.java` | Password/confirmation use admin-password environment input. | User-creation test now shares an input with admin credential; fixture policy and validity need review. |
| MediaWiki `Installer.java` | Remote WebDriver, installer URL and admin/DB settings configured via environment. | Installer execution and fixture change; 34 literal locator expressions unchanged as a multiset. No installer runtime evidence. |
| PrestaShop `AddNewAddress.java` | Address email literal changed. | Address data changes; assertion remains unchanged, but app validation/runtime effect is unverified. |
| PrestaShop `BaseTest.java` | URL/admin email/password now configured; native pinned-browser setup replaced by remote WebDriver; malformed endpoint throws. | Execution and login fixture change; exact browser/driver comparability unverified. |
| PrestaShop `Installer.java` | Remote WebDriver, installer URL/admin/DB settings configured; installer first/last name literals changed; diagnostic text changed. | Installer data/execution change; 21 literal locator expressions unchanged as a multiset. No install/reset evidence. |

In the 251-file screen, regex-extracted assert statements were unchanged after ignoring whitespace outside literals, and the selected Joomla/MantisBT/MediaWiki/PrestaShop Base test classes retain respectively 1/4/2/1 assertion expressions. This is not a Java AST analysis: it can miss assertions expressed through helper methods, inherited behavior, dynamic selectors or changes in application state. Runtime behavior can change because URLs, identities, passwords, fixture values and browser context changed. The evidence supports **no explicit assertion-text change detected**, not a claim of full behavioral or oracle equivalence. Independent business-oracle review and real isolated runtime remain required.

No source, assertions, raw history, Docker or application data were modified during this review. No credentials or original email values are reproduced here.
