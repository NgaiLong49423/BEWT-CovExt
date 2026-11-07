# BEWT-CovExt Emergency Research Sprint 01 — ExpressCart Results

**Status:** PARTIAL — ExpressCart runtime and the adapted `AddUserTest` baseline are verified; AI candidates are waiting for human review.  
**Assessment date:** 2026-11-02  
**BEWT-CovExt repository commit:** `6fd857a0b59a0ff177e32da9334ded66b0745dbe`  
**ExpressCart source:** `mrvautin/expressCart`, commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package version `1.1.19`.

## 1. Executive Summary

The isolated ExpressCart 1.1.19 environment now runs from the pinned upstream source in its own Docker Compose project. HTTP readiness returned 200, MongoDB answered `ping`, and the copied BEWT `AddUserTest` passed once before and once after a scoped storage reset. The post-reset run restored the seeded database state, created the test user, and passed the unchanged expected user text assertion.

The AI MVP collected summaries of 31 baseline test classes, 31 Gherkin features, and 105 application route hints. Gemini produced five candidate scenarios. All five pass the structured schema, Gherkin parser, source-reference string check, and the lexical duplicate heuristic. Those checks do not establish behavioral validity or novelty. All candidates remain **AWAITING_HUMAN_REVIEW**. No AI-generated Selenium Java was created, compiled, or run because the human review gate has not been completed.

Overall acceptance is **PARTIAL**. Runtime, repeatable baseline smoke, reset, version manifest, and candidate generation are evidenced. The sprint is not ready to claim accepted new coverage or any E2E result for AI-generated tests.

## 2. Source and Runtime Manifest

| Component | Observed value | Status |
|---|---|---|
| ExpressCart upstream | `mrvautin/expressCart` | VERIFIED |
| Source commit / package version | `b31302f4e99c3293bd742c6d076a721e168118b0` / `1.1.19` | VERIFIED |
| ExpressCart runtime | Node.js `14.21.3` | VERIFIED |
| Database | MongoDB `4.4.29` | VERIFIED |
| Experiment app image | `bewt-covext/expresscart:1.1.19-b31302f`; local image ID `sha256:3a6d68270a12e255f10bfe83de7a77ed4c47502499ebf1c7c661a0085123f06a` | VERIFIED |
| Mongo image | `mongo:4.4.29`; local image ID `sha256:52c42cbab240b3c5b1748582cc13ef46d521ddacae002bbbda645cebed270ec0` | VERIFIED |
| Runtime readiness | HTTP `200`; Mongo ping `1` | PASS |
| Java / Maven | Java `21.0.12`; Maven `3.9.16` | VERIFIED |
| Selenium | `4.35.0` | VERIFIED |
| Browser / driver | Chrome `156.0.8078.76`; ChromeDriver `156.0.8078.80` | COMPATIBILITY TEST PASS |
| Agent runtime | Node.js `24.19.0`; npm `11.17.0` | VERIFIED |
| Agent model | `gemini-3.8-flash`, temperature `0` | VERIFIED in successful run manifest |

The local ChromeDriver came from the official Chrome for Testing distribution. Its SHA-256 is `95AE04AEBD7DAF845DCE58D42139F0ACBF1A5172FD480DB328EA70BDC6301790`. Selenium launched the installed Chrome successfully. Selenium 4.35 emitted a warning that it has no CDP implementation matching Chrome 156; the tested flow uses WebDriver APIs and passed. No DevTools/CDP feature was required.

See [runtime-manifest.json](../../../experiments/expresscart/evidence/runtime-manifest.json), [SOURCE-LOCK.json](../../../experiments/expresscart/SOURCE-LOCK.json), and [ChromeDriver smoke log](../../../experiments/expresscart/evidence/chromedriver-smoke.log). `bewt-original/` is unchanged; Git reports no changes under that path.

## 3. Docker Architecture and Ownership

The Compose project is `bewt-covext-expresscart-b31302f`. It uses its private network `bewt-covext-expresscart-b31302f_experiment`; the app is published only at `127.0.0.1:3111`; MongoDB has no published host port. Four named volumes are project-owned: `..._mongo-data`, `..._mongo-config`, `..._app-config`, and `..._app-uploads`.

Before reset, both container labels and all four volume labels matched the exact Compose project. The pre-reset app and Mongo container IDs, volume references, network, and data counts are in [pre-reset-ownership-and-data.json](../../../experiments/expresscart/evidence/pre-reset-ownership-and-data.json). The scoped reset removed only this project's containers, network, and four named volumes. The project was then recreated from the pinned local image and fresh volumes. Current container IDs and image IDs are in the runtime manifest.

No old `olianasd` image, old ExpressCart container, or old experimental data was reused. No MamXanh or other project's Docker resource was changed; no global prune was run. The post-reset labels and port bindings were verified again in [post-reset-ownership.json](../../../experiments/expresscart/evidence/post-reset-ownership.json). The ExpressCart experiment remains running at `http://127.0.0.1:3111` for review.

## 4. Baseline Build and Selenium Smoke Test

The copied suite at `experiments/expresscart/bewt-suite/` was adapted without changing `bewt-original/`:

1. `BaseTest` uses the experiment localhost URL, the local ChromeDriver path can be supplied through the WebDriver property, and a failure screenshot/context is retained.
2. Admin sidebar links use the current `/admin/user/new` and `/admin/users` anchors instead of stale XPath locators.
3. `AdminLoginPage` waits for successful admin navigation after the asynchronous login request.
4. `UsersPage` retrieves the created user row by email instead of assuming it is the third row. `AddUserTest` still asserts the same full user name/email/role text.
5. `ChromeDriverCompatibilityTest` was added to this copy only.

The first app-level attempt reached the login page but did not authenticate. A read-only POST diagnostic classified it as `INVALID_PASSWORD`: the seeded owner account had admin/owner roles, but its stored hash did not match the credential already embedded in the copied BEWT test. The experiment-only [prepare-bewt-admin.ps1](../../../experiments/expresscart/tools/prepare-bewt-admin.ps1) updates only that seeded owner hash after checking the exact Compose project label. It reads the existing test fixture internally and prints only update counts. No assertion was changed.

| Check | Result | Evidence |
|---|---|---|
| Maven test compilation | PASS (also compiled as part of test runs) | [first successful AddUser run](../../../experiments/expresscart/evidence/addusertest-admin-fixture-run1.log) |
| ChromeDriver startup against Chrome | PASS, 1/1 | [ChromeDriver Surefire log](../../../experiments/expresscart/evidence/chromedriver-smoke.log) |
| `AddUserTest` before reset | PASS, 1 run / 0 failures / 0 errors | [run log](../../../experiments/expresscart/evidence/addusertest-admin-fixture-run1.log) |
| Clean seed after reset | 2 users, 8 products, 0 orders, 1 session | [post-reset seed counts](../../../experiments/expresscart/evidence/post-reset-clean-seed-counts.json) |
| `AddUserTest` after reset | PASS, 1 run / 0 failures / 0 errors | [repeat run log](../../../experiments/expresscart/evidence/addusertest-post-reset-run2.log), [Surefire XML](../../../experiments/expresscart/bewt-suite/target/surefire-reports/TEST-tests.AddUserTest.xml) |
| Post-test DB | 3 users, 8 products, 0 orders, 2 sessions; expected new user present | [runtime manifest](../../../experiments/expresscart/evidence/runtime-manifest.json) |

The app's own seed script emits warnings about circular dependencies in the legacy Mongo client package; it completed successfully. The reset used the exact scoped command `docker compose -p bewt-covext-expresscart-b31302f -f experiments/expresscart/compose.yaml down --volumes`, after ownership checks. The image was retained; storage was recreated and repopulated from ExpressCart's pinned test data before rerunning the test.

## 5. AI Agent MVP and Research Measurements

The isolated TypeScript project is under `experiments/expresscart/agent/`. It uses LangGraph JS, Gemini through LangChain, Zod structured output, and the Cucumber Gherkin parser. The collector sends only allowlisted summaries (test names, method/action hints, locator hints, sanitized Gherkin labels/steps, route paths); it excludes configuration files, `.env`, credentials, database documents, and logs. A unit test checks redaction behavior.

The implemented vertical slice is: collect sanitized baseline → ask Gemini for exactly five structured candidates → validate schema and parse each Gherkin scenario → record route/test/feature string matches and lexical duplicate hints → write artifacts and leave the human review gate pending. It does not call a model-provided command or execute model-produced code.

| Metric | Observed result | Interpretation |
|---|---:|---|
| Baseline test summaries | 31 | Includes BEWT ExpressCart baseline tests only |
| Baseline Gherkin features | 31 | Read-only source in `bewt-original/` |
| Application route hints | 105 | Static route path extraction |
| Agent unit tests | 5 passed, 0 failed | `npm test` |
| Final successful Gemini generation | 1 request, 5 candidates | Run `2026-11-02T07-06-24-329Z-b9a90ab1` |
| Gherkin parser valid | 5 / 5 | Syntax only; does not prove executable step definitions |
| Evidence reference string matches | 5 / 5 | Exact string presence in supplied route/test/feature identifiers; not semantic proof |
| Lexical duplicate hints | 0 / 5 | Heuristic only; not proof of novelty |
| Human-accepted candidates | 0 | **AWAITING_HUMAN_REVIEW**; no reviewer decision recorded |
| Selenium Java generated / compiled / executed | 0 / 0 / 0 | **NOT_RUN** pending human selection |

Candidate titles in the designated final run are `EC-C01` removing an applied discount code, `EC-C02` clearing the cart, `EC-C03` hiding an unpublished product from search, `EC-C04` forgotten-password request handling, and `EC-C05` creating and viewing a static page. The actual output is [CANDIDATES-UNREVIEWED.feature](../../../docs/research-results/sprint-01/runs/2026-11-02T07-06-24-329Z-b9a90ab1/CANDIDATES-UNREVIEWED.feature); structured details are in [candidates.json](../../../docs/research-results/sprint-01/runs/2026-11-02T07-06-24-329Z-b9a90ab1/candidates.json). The request configuration and sanitized input are recorded alongside those files. The review state is [human-review.json](../../../docs/research-results/sprint-01/runs/2026-11-02T07-06-24-329Z-b9a90ab1/human-review.json). Sprint 02 found that EC-C03's proposed search-exclusion assertion conflicts with the pinned search implementation; see the technical review before accepting it.

The successful provider usage metadata reported `input_tokens=6210`, `output_tokens=1189`, `total_tokens=9246`, with `cache_read=4338`. The reported total does not equal input plus output; the raw values are preserved and should be treated as provider-reported telemetry with an internal inconsistency. No cost amount was supplied, so cost is **NOT_REPORTED**; no estimate is substituted. Two earlier attempts did not yield usable candidate output (one explicit invalid-key response and one model/output failure); one intermediate successful candidate run lacked captured usage metadata. See the [attempt ledger](agent-attempt-ledger.md). No credential value was written to run artifacts or logs.

## 6. Acceptance Status

| Acceptance criterion | Status | Evidence / limitation |
|---|---|---|
| ExpressCart runs in Docker | PASS | HTTP 200, Mongo ping 1, pinned source-built app image |
| No old image/data reused | PASS | Fresh volumes created after scoped reset; source-built local image |
| `AddUserTest` passes with valid unchanged assertion | PASS | PASS before and after reset |
| Reset is verified | PASS | Exact project ownership checked; clean seed counts recorded; repeat test passed |
| Smoke test passes again after reset | PASS | Surefire log and XML |
| Evidence and version manifest exist | PASS | Runtime manifest, image IDs, test logs, source lock, agent run artifacts |
| No other project resources changed | PASS | All Docker mutations targeted the exact experiment Compose project only |
| At least one candidate reviewed by a human | NOT_VERIFIED | All five remain pending review |
| Generated Java compiles and runs | NOT_RUN | Blocked by the mandatory review gate; no code was generated or executed |

## 7. Risks and Next Decision

1. ExpressCart 1.1.19 runs on legacy Node 14 and MongoDB 4.4; treat this as a pinned research benchmark, not a supported production service.
2. Selenium logs a Chrome 156/CDP version warning. The tested WebDriver flow works, but any future DevTools-specific test requires a compatible Selenium DevTools artifact or a pinned browser/driver pair.
3. Route evidence and lexical duplication metrics are candidate triage signals only. Reviewers must verify actual application behavior, selectors, setup/data prerequisites, oracle quality, and distinctness from all 31 baseline scenarios.
4. The next required action is human review of `EC-C01`–`EC-C05`. Record reviewer, rationale, and accepted IDs in the review artifact. Only accepted candidates should proceed to Selenium code generation and compile/runtime checks.
5. Do not claim research benefit from the candidate count alone. After review, report acceptance/rejection reasons and run generated tests only against this isolated project.

The app and experiment Docker resources remain running. No commit or push was performed.
