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
