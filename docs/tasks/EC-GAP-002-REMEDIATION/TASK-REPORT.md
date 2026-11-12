# EC-GAP-002 — Source-backed stock rejection revision

- Task scope / acceptance gate: Replace the semantically incorrect EC-GAP-002 R2 behavior with an immutable source-backed R3; compile and prepare source-bound G3, without changing the human review decision.
- Base branch + base SHA: `task/final-remediation-audit` at `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00`.
- Working branch: `task/ec-gap002-remediation`.
- Head commit (full 40-char SHA): `ffe7fc583b3cebd343e3a0eb148dd8124cbacf3e` (R3 implementation commit; this report records the source snapshot tested).
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/32 (draft; targets `task/final-remediation-audit`).
- Push status: PUSHED; current PR head is `14fbdb669b65e874b45c19c808cd048dd6fd540f`.
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

## 3. Research impact

- App/candidate: ExpressCart 1.1.19 / EC-GAP-002.
- R2 semantic status: WRONG_BEHAVIOR (add-to-cart only).
- R3 status: IMPLEMENTED; compile PASS; runtime NOT_RUN_PENDING_ROOT_RUNTIME; `VALIDATED=false`.
- Human decision: `APPROVED_FOR_IMPLEMENTATION` only; `reviewStatus=PENDING_HUMAN_SIGNATURE`; reviewer remains unassigned. No human record was modified.
- Research impact: no novelty, coverage gain, execution, stability, or validation claim is made.

## 4. Safety & integrity

- `bewt-original/` touched: NO.
- Docker/project resources touched: NONE.
- Historical R1/R2, proposal, old run records, and review decision preserved.
- Credentials/secrets: no values in R3; only environment variable names appear.
- Prior G3 records are not attributed to R3.

## 5. Evidence and reproduction

- Pinned route: `experiments/expresscart/source/routes/index.js:603-643`; 400/message at `:606-610`; cart mutation after checks at `:641-643`.
- App stock mode: `experiments/expresscart/source/app.js:528-530`; source seed stock: `experiments/expresscart/source/bin/testdata.json:12`; source default `trackStock:false`: `experiments/expresscart/source/config/settings.json:25`.
- Upstream source was independently fetched at commit `b31302f4e99c3293bd742c6d076a721e168118b0`; it agrees with the vendored source used for the pin.
- Compile command: `mvn -f experiments/expresscart/bewt-suite/pom.xml test-compile`.
- G3 command for the parent VM: `mvn -f experiments/expresscart/bewt-suite/pom.xml -Dtest=tests.T01C_bcb5b700f06dd8c8ce6c99c01e12cdeb_R3 test`; provide `ADMIN_EMAIL`/`ADMIN_PASSWORD` securely and set `expresscart.baseUrl` if required by the authorized runtime.
- Known limitation: the original proposal's literal error oracle is source-inaccurate. R3 records the corrected message but requires Team Lead oracle review before scientific acceptance.

## 6. Review request

- Review whether the corrected R3 Gherkin/oracle should replace the original proposed oracle for implementation review; do not treat this agent-authored correction as human approval.
- Verify the exact pushed source, run R3 on the authorized VM, and preserve initial plus three clean-state rerun records only after a passing, semantically eligible initial run.
- Suggested status: R3 compile PASS, G3 pending root VM execution, human oracle/novelty review pending, not VALIDATED.
