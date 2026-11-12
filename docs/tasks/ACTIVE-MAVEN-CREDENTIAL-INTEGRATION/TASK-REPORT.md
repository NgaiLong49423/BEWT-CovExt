# Active Maven Credential Integration

- Status: `PARTIAL`; Claroline and Kanboard candidate classes compile. Runtime/E2E validation remains `NOT_RUN`.
- Worktree branch: `task/active-maven-credential-integration`.
- Starting HEAD for this remediation pass: `31390d7021da34b0e54a424fd7590bbfcde06f51`.
- Earlier integration commit: `04892f44309418f0294381e2d33ea54fda2c24dd`.
- Scope: active Claroline and Kanboard Maven suites; no extension R2 artifact or `bewt-original/` source was modified.

## Active Maven integration

- Added five R3 candidate classes to each suite and tracked their normalized-LF SHA-256 hashes in each `extension-revisions.json`.
- Corrected only the copied R3 comments to identify them as Revision 3 security-only credential-configuration copies; historical extension R2/R3 sources remain unchanged.
- Kept candidates out of each broad `TestSuite`; they require candidate-specific fixture and runtime identity checks before execution.
- Claroline R3 classes require `CLAROLINE_TEST_USERNAME` and `CLAROLINE_TEST_PASSWORD`; Kanboard R3 classes require the configured Kanboard variables recorded in its manifest.

## Claroline credential-only pass

A secret-safe, in-memory comparison classified the 51 active literal-login sites without printing values:

- 37 calls authenticate the same administrator runtime account. They now read `CLAROLINE_TEST_USERNAME` and `CLAROLINE_TEST_PASSWORD` through the required property/environment helper.
- 14 calls authenticate accounts created by the suite's own fixture flows: 10 student, 2 teacher, and 2 administrator test accounts. Their usernames remain test data; the password is supplied through `CLAROLINE_TEST_FIXTURE_USER_PASSWORD`.
- The previous shared password literal was also reused in fixture creation, course-password setup, and the correct-course-password enrollment path. These now use required configuration keys instead of a hardcoded value.
- The mismatched user-password and wrong course-password tests use separately configured values guarded to differ from the corresponding valid fixture value. Their negative checks remain explicit.
- All five active Maven R2 candidate copies now use runtime properties. Their active source hashes are recorded separately from the immutable extension R2 artifacts.
- Added `credential-source-check.mjs`; it checks every Java login call and fails if the password argument is an inline string literal.
- The earlier scan's five extension R2 login lines and five generator literals remain unchanged and outside this active-suite pass. Values were not copied into this report.

## Verification

| Command/action | Result | Evidence |
|---|---|---|
| `node experiments/claroline/bewt-suite/credential-source-check.mjs` | `PASS`; 56 Java login call sites checked, no inline password literals | Reproducible static regression check |
| Historical credential fingerprint check against active Claroline Java sources | `PASS`; 0 matches | Only a boolean/count was emitted; credential value was not printed |
| Active R2 and upstream artifact registration hashes | `PASS`; 5 active source hashes recorded; all 5 upstream hashes match extension registrations | `experiments/claroline/bewt-suite/extension-revisions.json` |
| `mvn -B -ntp -DskipTests test` in `experiments/claroline/bewt-suite/` | `PASS`; 22 main and 52 test sources compiled; Surefire skipped execution | Maven output from this remediation pass |
| `mvn -B -ntp -DskipTests test` in `experiments/kanboard/bewt-suite/` | `PASS` on the preceding integration pass; 27 main and 42 test sources compiled | Same command; no Kanboard source changed during this pass |
| Runtime candidate or full-suite execution | `NOT_RUN` | No verified app/WebDriver ownership or candidate fixture state; full-suite shell scripts have globally named Docker lifecycle commands |

The first Claroline recompile after adding the shared credential helper failed because its name collided with private helpers in the five R3 classes. The helper and active call sites were renamed to `requiredRuntimeCredential`; the subsequent Maven compile passed.

## Rotation risk and remaining work

The removed literal appeared in positive admin runtime logins and was reused by test-created fixture/course inputs. The repository does not establish whether it was only a disposable experiment credential. Assess privately and rotate it if it was reused outside the isolated Claroline fixture environment. No credential values are included here. The historical extension R2 and generator findings remain to be reviewed in their owning tasks.

Compile success does not establish behavioral correctness, human acceptance, or research `VALIDATED` status. Candidate runtime tests still require verified app and WebDriver ownership, approved fixture configuration, source-bound run manifests, and semantic review.
