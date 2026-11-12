# EC-GAP-002 — Source-backed stock rejection revision

- Task scope / acceptance gate: Replace the semantically incorrect EC-GAP-002 R2 behavior with an immutable source-backed R3; compile and prepare source-bound G3, without changing the human review decision.
- Base branch + base SHA: `task/final-remediation-audit` at `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00`.
- Working branch: `task/ec-gap002-remediation`.
- Head commit (full 40-char SHA): `ffe7fc583b3cebd343e3a0eb148dd8124cbacf3e` (R3 implementation commit; this report records the source snapshot tested).
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/32 (draft; targets `task/final-remediation-audit`).
- Push status: PUSHED; implementation and report follow-up commits are verified on the remote PR branch.
- Runtime/commit/version tested: Compile only; pinned ExpressCart 1.1.19, source commit `b31302f4e99c3293bd742c6d076a721e168118b0`.
- Status proposed by Agent: PARTIAL; G3 pending parent execution, oracle and novelty review pending.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `extension/expresscart/selenium/bcb5b700f06dd8c8ce6c99c01e12cdeb/revision-3/` | Added immutable R3 Java, corrected revision-specific Gherkin, registration and provenance. | R2 only opened product 1, added it and asserted a nonzero badge; it did not update quantity or test stock rejection. |
| `experiments/expresscart/bewt-suite/src/test/java/tests/T01C_bcb5b700f06dd8c8ce6c99c01e12cdeb_R3.java` | Added a focused Selenium implementation and isolated setup/teardown. | Exercises the quantity update route, verifies HTTP 400 and source response, checks server-side cart quantity remains 1, and cleans created data/settings. |
| `docs/final-acceptance/EC-GAP-002-REMEDIATION-ADDENDUM.json` | Added candidate-only source and hash traceability. | Keeps the prior audit snapshot intact while recording this proposed remediation. |
| `docs/program/STATUS.json` | Added EC-GAP-002-only status pointer; overall G3 remains not validated. | Reflects only evidence completed for this candidate. |
| `docs/tasks/EC-GAP-002-REMEDIATION/evidence/` | Added sanitized compile summary and local runtime preflight record. | Makes the compile result and G3 handoff reproducible without exposing credentials. |

R3 preserves R1/R2 and the original candidate proposal. The proposal's expected message (`There is not enough stock to fulfill your order`) does not match the pinned route, which returns `There is insufficient stock of this product.` R3 has a separate corrected Gherkin artifact; this changes no pending human decision and is not an oracle or novelty approval.

The source also shows the original named product is absent from the pinned seed. R3 creates a stock-one product in the isolated app, enables `trackStock` using a JSON boolean through the authenticated admin session, adds one unit through the storefront, triggers the actual `.btn-qty-add` UI action, captures the corresponding XHR status/body, reads `/checkout/cartdata` to verify quantity 1, and attempts all cleanup steps. Admin credentials are read only from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; no values are committed. Cleanup deletes the fixture product, empties the cart, and restores the pinned source default `trackStock:false`.

## 2. Actual verification

| Exact command | Exit code | Result | Evidence |
|---|---:|---|---|
| `mvn -f experiments/expresscart/bewt-suite/pom.xml test-compile` | 0 | PASS; 45 test sources compiled, including R3. | `docs/tasks/EC-GAP-002-REMEDIATION/evidence/maven-test-compile-summary.txt` |
| `mvn -f experiments/expresscart/bewt-suite/pom.xml -Dtest=tests.T01C_bcb5b700f06dd8c8ce6c99c01e12cdeb_R3 test` | NOT_RUN | NOT_RUN_PENDING_ROOT_RUNTIME; parent will run against the authorized VM after push. Required variable names: `ADMIN_EMAIL`, `ADMIN_PASSWORD`. | `docs/tasks/EC-GAP-002-REMEDIATION/evidence/runtime-preflight.json` |

This agent did not access or change Docker/Cloud resources. The parent will bind G3 evidence to the pushed branch and use `docs/tasks/EC-GAP-002-REMEDIATION/evidence/g3/`.

## 3. Runner credential handoff follow-up

The PR follow-up removes ExpressCart's hard-coded admin identity from the G0 runner. `ADMIN_EMAIL` and `ADMIN_PASSWORD` must both be present and nonblank in the runner process environment; the runner fails before creating evidence or touching Docker if either is absent. The fixture passes those environment keys to its in-container setup process and uses them to set the seeded owner account. The same resolved environment is passed to Maven. No `.env` file or credential values are committed. Other applications' existing configuration is outside this ExpressCart-scoped follow-up.

Focused verification:

| Exact command | Result | Evidence |
|---|---|---|
| `node --test experiments/tools/unified-g0-runner.test.mjs` | PASS; 3 tests cover missing/blank values, propagation of synthetic values, and absolute Maven executable/path validation. | `docs/tasks/EC-GAP-002-REMEDIATION/evidence/runner-credential-tests.txt` |
| `node --check experiments/tools/unified-g0-runner.mjs` and `node --check experiments/tools/unified-g0-runner.test.mjs` | PASS. | Command output was empty (exit 0). |
| `mvn -f experiments/expresscart/bewt-suite/pom.xml test-compile` | PASS; 45 test sources compiled. | `docs/tasks/EC-GAP-002-REMEDIATION/evidence/maven-test-compile-summary.txt` |

This follow-up did not execute the runner, Docker, Cloud, or VM. Parent runtime remains `NOT_RUN_PENDING_ROOT_RUNTIME`; provide the two required variables securely in the authorized runtime environment.

SonarCloud's PR check reported 2 duplicated new-code lines in the Bludit/Joomla installer setup blocks (18-line duplicated block pair); after that reached 0%, the next analysis flagged `javascript:S4036` on child-process PATH handling. The runner now shares the Maven invocation while retaining Joomla-only environment values and installation cleanup. The shared installer path requires `BEWT_MAVEN_EXECUTABLE` as an absolute file, verifies its location, and replaces inherited `PATH` with validated Java and fixed system directories (including Windows batch-file support). The R3 Java/Gherkin artifacts and content are unchanged; local focused tests, syntax checks, and Maven test compilation pass. SonarCloud check run `131216484209` passed on head `f9d123bb822fd660dd45742b28c6ab2a5938c202`: 0 new issues, 0 accepted issues, 0 security hotspots, and 0.0% duplication on new code.

Canonical R3 hashes were reconciled to the UTF-8/LF Git file bytes using the Linux VM SHA-256 values supplied by the parent, which also confirmed the extension Java and Maven-suite copies match. Java: `cbaf93858f0c8a72cf9d89899c09603558dcd86be088ced79be3794f032f2595`; Gherkin: `a961fb109f0a4ec10dccf4bcc0ffaccf1d02d2fcb787c30fabee88e8ae1cbf9f`. The former Windows-checkout byte hashes are retained in the registration, provenance, and traceability addendum under `windowsCheckoutHashes`; no Java or Gherkin content changed.

## 4. Research impact

- App/candidate: ExpressCart 1.1.19 / EC-GAP-002.
- R2 semantic status: WRONG_BEHAVIOR (add-to-cart only).
- R3 status: IMPLEMENTED; compile PASS; runtime NOT_RUN_PENDING_ROOT_RUNTIME; `VALIDATED=false`.
- Human decision: `APPROVED_FOR_IMPLEMENTATION` only; `reviewStatus=PENDING_HUMAN_SIGNATURE`; reviewer remains unassigned. No human record was modified.
- Research impact: no novelty, coverage gain, execution, stability, or validation claim is made.

## 5. Safety & integrity

- `bewt-original/` touched: NO.
- Docker/project resources touched: NONE.
- Historical R1/R2, proposal, old run records, and review decision preserved.
- Credentials/secrets: no values in R3; only environment variable names appear.
- Prior G3 records are not attributed to R3.

## 6. Evidence and reproduction

- Pinned route: `experiments/expresscart/source/routes/index.js:603-643`; 400/message at `:606-610`; cart mutation after checks at `:641-643`.
- App stock mode: `experiments/expresscart/source/app.js:528-530`; source seed stock: `experiments/expresscart/source/bin/testdata.json:12`; source default `trackStock:false`: `experiments/expresscart/source/config/settings.json:25`.
- Upstream source was independently fetched at commit `b31302f4e99c3293bd742c6d076a721e168118b0`; it agrees with the vendored source used for the pin.
- Compile command: `mvn -f experiments/expresscart/bewt-suite/pom.xml test-compile`.
- G3 command for the parent VM: `mvn -f experiments/expresscart/bewt-suite/pom.xml -Dtest=tests.T01C_bcb5b700f06dd8c8ce6c99c01e12cdeb_R3 test`; provide `ADMIN_EMAIL`/`ADMIN_PASSWORD` securely and set `expresscart.baseUrl` if required by the authorized runtime.
- Known limitation: the original proposal's literal error oracle is source-inaccurate. R3 records the corrected message but requires Team Lead oracle review before scientific acceptance.

## 7. Review request

- Review whether the corrected R3 Gherkin/oracle should replace the original proposed oracle for implementation review; do not treat this agent-authored correction as human approval.
- Verify the exact pushed source, run R3 on the authorized VM, and preserve initial plus three clean-state rerun records only after a passing, semantically eligible initial run.
- Suggested status: R3 compile PASS, G3 pending root VM execution, human oracle/novelty review pending, not VALIDATED.


## 8. 2026-11-12 VM runtime follow-up

The existing VM was already running, so no restart was performed. Verified identity: project `gen-lang-client-0311012609`, `bewt-covext-runner`, instance `3042402845209891905`, zone `asia-southeast1-a`, machine `c4d-highmem-8`. Docker Engine 29.9.3 was active with 8 CPUs, 61.8 GiB RAM, and 174 GiB root-disk space available at verification. Image IDs, Java/Maven/Selenium/Chrome versions, source/test hashes, execution time, and cleanup evidence are in `docs/tasks/EC-GAP-002-REMEDIATION/evidence/g3/r3-initial-20261112/runtime-provenance.json`.

Exactly one initial R3 Docker/Selenium attempt ran from clean VM worktree commit `f9d123bb822fd660dd45742b28c6ab2a5938c202`. The app and Selenium readiness checks passed before Maven. JUnit reported 1 test, 0 failures, 1 error; Maven exited 1. The error was a 15-second Selenium visibility timeout waiting for `.cart-product-quantity` at the cart-page step. The test did not send the stock update request, so this establishes neither a stock-oracle PASS nor a stock-behavior FAIL. Cleanup verified zero residual containers, networks, and volumes. Only sanitized JUnit XML and structured JSON evidence were copied; Maven stdout/stderr and runner console output were excluded. See `docs/tasks/EC-GAP-002-REMEDIATION/evidence/g3/r3-initial-20261112/`.

R4 is registered as a new immutable revision. It reads the cart line from the pinned `/checkout/cartdata` endpoint, submits the same URL-encoded fields used by the pinned storefront to `/product/updatecart` from the browser session, and verifies HTTP 400, the source-backed message, and unchanged server-side quantity. The original Gherkin behavior is unchanged. R4 compiled successfully with 46 test sources on Windows; its VM G3 has not run and awaits branch push. This remains preliminary engineering evidence; novelty and oracle review are pending, and `VALIDATED=false`.

The runner's Maven evidence command previously omitted the `clean` goal despite invoking it. The command record is corrected for future runs. The R3 record is preserved unchanged and the discrepancy is noted in its runtime provenance.

The runner follow-up also passes `-Dexperiment.evidence.dir` with a run-specific repository-relative path, so failure screenshots do not overwrite earlier attempts. The R3 failure screenshot was captured after JUnit teardown had navigated back to the admin dashboard; it was not promoted into public evidence. Future `maven-exit.json` records the complete sanitized Maven argv, including the evidence path and all goals. Focused runner checks remain 3/3 PASS.

## 9. R4 pre-Maven failure and R5 registration

A second clean Docker attempt, now against candidate R4 at commit `fb5be00a86b8d41a0ce3fb43cbce7d2291722881`, created the ExpressCart, MongoDB, and Selenium containers and then failed before Maven. The runner threw `ReferenceError: relative is not defined` while assembling the Maven arguments. No JUnit file or Maven exit record was produced. Cleanup again verified zero residual containers, networks, and volumes. Structured evidence is in `docs/tasks/EC-GAP-002-REMEDIATION/evidence/g3/r4-initial-20261112/`; raw runner failure/console output remains only on the VM and was not copied.

The runner now imports the path helper. Because R4 is immutable, R5 is registered with a distinct Java class/method and the same Gherkin behavior. R5 removes neither historical attempt; its clean local compile compiled 47 test sources, and runner checks passed 3/3. R5 has not yet run on Docker. Latest status is preliminary engineering only; no oracle/novelty approval or `VALIDATED` claim is made.

## 10. R5 Docker/Selenium execution and three clean-state reruns

R5 was executed at VM checkout commit `f39272d363ec94b51a978f53c6231174c67140e2` after a clean Linux compilation of 28 main and 47 test sources. The initial attempt and three sequential clean-state reruns all passed: 4/4 total, each JUnit 1 test / 0 failures / 0 errors / 0 skipped, Maven exit 0, and cleanup verified zero residual containers, networks, and volumes. Exact run timestamps, network/container IDs, image IDs, source hashes, versions, JUnit XML, exit records, cleanup results, and per-file integrity hashes are under `docs/tasks/EC-GAP-002-REMEDIATION/evidence/g3/r5-runs-20261112/`. Raw Maven stdout/stderr and runner console files were excluded from public evidence.

The R5 implementation exercised the stock-one fixture through the browser session, submitted quantity 2 to the pinned update route, observed HTTP 400 and the pinned source message, and verified the server cart remained at quantity 1. This is preliminary engineering verification; human oracle and novelty reviews are still pending, so `VALIDATED=false`.

## 11. R6 exact response-message oracle

R5 compared the stock rejection body with `contains(STOCK_ERROR)`, which could pass if an unrelated response text merely embedded the expected sentence. R6 preserves the stock-one fixture, cart interaction, HTTP 400 check, server-cart quantity check, pinned source behavior, and the R5 Gherkin artifact. It strengthens the business oracle to extract the response JSON `message` property and require an exact equality with `There is insufficient stock of this product.` as implemented at `experiments/expresscart/source/routes/index.js:603-643`.

R6 is a new immutable revision; R1-R5 and their historical evidence remain unchanged. Maven `test-compile` passed with 48 test sources on the R6 working-tree content hash `cf2e3a502ed19b5cbc6078ea966e0f8c10263a690a15777821b5be62242b1189`. The captured compile was performed before the R6 commit; its evidence records that limitation. R6 has no G3 execution or reruns. R5's four preliminary passes are not transferred to R6, and the candidate remains pending independent human oracle/novelty approval and R6 runtime verification. `VALIDATED=false`.

R6 artifact commit: `91f8f809dbb57710cb176a3db6124a73ac8734b4`.

Compile evidence: `docs/tasks/EC-GAP-002-REMEDIATION/evidence/r6/maven-test-compile-summary.json`.

During evidence review, the R5 runner's path sanitizer was found to misclassify the `p://` segment of HTTP URLs as a Windows drive path in the recorded Maven command. The executed run source, exit code, and tests are preserved; each run also includes a clearly labeled command reconstruction derived from the runner source and recorded ports. The path rule has been corrected and a 4th focused regression test passes; this metadata-only runner fix was made after R5 execution and does not alter R5 test behavior.
