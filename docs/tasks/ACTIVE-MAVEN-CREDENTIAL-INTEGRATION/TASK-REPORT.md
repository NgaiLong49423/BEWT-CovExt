# Active Maven Credential Integration

- Status: `PARTIAL`; both affected Maven suites compile with credential-safe Revision 3 candidates. No candidate runtime test was executed.
- Base commit: `acfe1272b3af00350ca929a4e4b69aa97c7c7508`.
- Branch: `task/active-maven-credential-integration`.
- Implementation commit: `04892f44309418f0294381e2d33ea54fda2c24dd`.
- Scope: Claroline and Kanboard active Maven test sources and per-suite extension revision registration manifests.

## Changes

- Added five registered Revision 3 test classes to each active Maven suite under `src/test/java/test/` (Claroline) and `src/test/java/tests/` (Kanboard).
- Corrected the copied class comments to identify Revision 3 as a security-only credential-configuration revision. The existing extension Revision 2 and Revision 3 artifacts remain unchanged.
- Added `extension-revisions.json` per suite with candidate IDs, test class names, immutable upstream artifact hashes, active-source SHA-256 hashes, credential variable names, compile outcome, and explicit runtime eligibility limitation.
- Kept candidate classes out of the broad `TestSuite`. The R3 scenarios need candidate-specific fixture and runtime identity verification; the existing shell scripts start and remove globally named Docker containers and were not run.
- The R2 source copies remain in both Maven source trees and are not listed in `TestSuite`. A secret-safe scan found five literal login calls in Claroline active R2 copies; exact values were not read into the report. These copies remain a separate cleanup/rotation investigation while historical extension artifacts are preserved.

## Evidence and verification

| Command/action | Outcome | Evidence |
|---|---|---|
| `mvn -B -ntp -DskipTests test` in `experiments/claroline/bewt-suite/` | `PASS`; 22 main and 52 test Java sources compiled, Surefire skipped tests | Maven output from this task execution |
| `mvn -B -ntp -DskipTests test` in `experiments/kanboard/bewt-suite/` | `PASS`; 27 main and 42 test Java sources compiled, Surefire skipped tests | Maven output from this task execution |
| Revision registration integrity check | `PASS`; all 10 active normalized-LF SHA-256 values match their manifests, and each upstream R3 Java hash matches its extension registration | `experiments/{claroline,kanboard}/bewt-suite/extension-revisions.json` |
| Runtime execution | `NOT_RUN` | No verified app/WebDriver ownership, candidate fixtures, or runtime configuration was available; existing 50-run shell scripts have destructive globally named Docker lifecycle commands |

## Discovery commands

- Existing full legacy suites: `mvn -B -ntp -Dtest=TestSuite test` from either Maven suite root. This runs the explicit `TestSuite` class list, which excludes the candidate R2/R3 classes.
- Claroline candidate revisions after runtime ownership and fixture setup are verified: `mvn -B -ntp -Dtest=T01C_1027165465722d6b6fd9ab1607fba1d8_R3,T01C_6fa57d00aa4eab3729b958a3b4e300c9_R3,T01C_acd2c6ed41c79d11057a038360ef1dba_R3,T01C_ad5f4f7643527d5a497ce6af6e466c2e_R3,T01C_e9eda84d440eec2453ed7ae17199f4d5_R3 test` from the Claroline suite root.
- Kanboard candidate revisions after runtime ownership and fixture setup are verified: `mvn -B -ntp -Dtest=T01C_233eaf16319686f2ab6c351b189cd929_R3,T01C_244fbbc3c7e19c2ceb6a56738e493041_R3,T01C_882860986d9907549f10245367191c30_R3,T01C_ca582c83d0559c38508bf3e1a5420ca9_R3,T01C_e92738fe6f9cb45aecc4349f3b52dff0_R3 test` from the Kanboard suite root. These are not run results; do not infer a candidate pass from compilation.
- Compile test and main sources without executing browser tests: `mvn -B -ntp -DskipTests test`.

## Remaining work

- Verify the approved app and Selenium runtime, fixture ownership, application identity, and credential provisioning before candidate test execution.
- Resolve or rotate the five Claroline R2 literal credential calls if they were used outside disposable experiment fixtures. No literal values are included here.
- Correct the original extension R3 comments/registrations only through an authorized immutable next revision; this task preserves those source artifacts.
- Candidate behavior remains semantically unapproved and not research `VALIDATED`; this integration establishes compile inclusion only.
