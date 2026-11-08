# Baseline Adaptation

The working copy `experiments/bludit/bewt-suite` was copied from the pinned BEWT commit. A hash comparison of 52 non-generated files found exactly one source change: `src/test/java/tests/BaseTest.java`. The original `bewt-original/` checkout was not modified; its selected Bludit suite was clean.

The adaptation is limited to environment configuration:

- `app.url` is a Java system property with a loopback default, so the runner can target the named container over its isolated network.
- `BLUDIT_TEST_PASSWORD` is required from the test process environment; no password is stored in source or evidence. Installer and business test read the same value within a run.
- WebDriver is remote, with `webdriver.remoteUrl` supplied by the runner. The obsolete fixed Chrome 127 requirement was removed; ChromeOptions retains the baseline browser arguments.

`Installer`, `AddContentTest`, Page Objects, test order, and business assertions were not edited. In particular, the original `AddContentTest` title assertion remains unchanged. See the [source tree comparison](evidence/source-tree-comparison.json) and [BaseTest diff](evidence/BaseTest-adaptation.diff).
