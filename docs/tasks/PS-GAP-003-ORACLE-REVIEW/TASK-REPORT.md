# PS-GAP-003 — Payment and stock oracle feasibility review

- Task scope / acceptance gate: Determine whether the existing customer-payment Gherkin oracle is observable in the pinned PrestaShop 1.6.1.23 default theme; do not silently change the approved proposal.
- Base branch + base SHA: `origin/task/final-remediation-audit` at `8c1abafb5254af73bdc43ef9d2f5849bd5c64b00`.
- Working branch: `task/ps-gap003-payment-stock-oracle`
- Head commit (full 40-char SHA): `NOT_COMMITTED`; report is in the working tree.
- PR: `PR_NOT_CREATED: review packet is awaiting Team Lead decision and commit authorization`
- Push status: `NOT_ATTEMPTED: report awaits review and commit authorization`
- Runtime/commit/version tested: Source review only; proposal pins PrestaShop `1.6.1.23`; no runtime or Docker execution.
- Status proposed by Agent: `PARTIAL`

## 1. What changed

No implementation files changed. This report records a source-backed feasibility finding for PS-GAP-003.

| File path (repo-relative) | Change | Why |
|---|---|---|
| `docs/tasks/PS-GAP-003-ORACLE-REVIEW/TASK-REPORT.md` | Source feasibility and decision request | Keep the candidate classified as semantically wrong until its existing oracle is observable or the Team Lead revises the proposal. |

## 2. Actual verification

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| `Get-Content -LiteralPath 'extension\prestashop\selenium\202336fd43c393a7395e8722b9e82c8f\revision-2\T01C_202336fd43c393a7395e8722b9e82c8f_R2.java' -Raw; Get-Content -LiteralPath 'extension\prestashop\selenium\202336fd43c393a7395e8722b9e82c8f\revision-2\scenario.feature' -Raw -ErrorAction SilentlyContinue` | 1 | PARTIAL — Java source read; optional standalone feature file is absent; Gherkin is embedded in the Java source | Candidate source path below |
| `rg -n 'PS-GAP-003|revision-2' docs/final-acceptance/40-CASE-TRACEABILITY.json` | 0 | PASS | `docs/final-acceptance/40-CASE-TRACEABILITY.json` |
| GitHub connector `github_fetch_file` for the three official files at ref `1.6.1.23` | 0 | PASS — exact tag contents and blob SHAs returned | Links below |
| Maven compile / Selenium / Docker G3 | — | NOT_RUN — this report does not add a candidate revision and G0 is still awaiting the user's VM-side credential-ready signal | None |

## 3. Research impact

- App/version: PrestaShop proposal pin `1.6.1.23`; official source inspected at the exact `1.6.1.23` tag in the archived `PrestaShop/PrestaShop-1.6` repository.
- Candidate: `PS-GAP-003` remains `WRONG_BEHAVIOR`; active R2 performs an admin order-creation attempt with quantity `1000` and accepts generic error/page text. It does not execute customer checkout/payment, establish a unique reference, count exactly one order, or verify stock `10 → 8`.
- Source finding: In the official 1.6 default-bootstrap confirmation template, a guest sees a formatted **order ID**; the order reference is only placed in the guest-tracking link URL. A registered customer gets a link to order history, and the confirmation template itself does not print the order reference. The controller assigns `reference_order` only for guests. The `Order` model describes the reference as not globally unique, but unique for a payment.
- Consequently, the current wording “confirmation screen ... with a unique Order Reference” is not directly supported as visible confirmation text by the stock 1.6 default theme. Do not weaken the test to generic confirmation text or substitute the order ID. A new Java revision should wait for a Team Lead decision on whether to revise the Gherkin oracle or whether a different explicitly approved observable meets it.
- No RQ counts, gate status, metrics, or `STATUS.json` values changed. No human novelty/oracle approval is inferred.

## 4. Safety & integrity

- `bewt-original/` touched: NO.
- Docker/project resources touched: NONE.
- Existing unrelated local dirty files preserved: YES; root-level attempt archives and strict G3 evidence directories remain untracked and untouched.
- Secrets staged or logged: NO.
- No candidate source, raw run evidence, database, or application data was modified.

## 5. Evidence and reproduction

- Active candidate source: `extension/prestashop/selenium/202336fd43c393a7395e8722b9e82c8f/revision-2/T01C_202336fd43c393a7395e8722b9e82c8f_R2.java`.
- Official source links:
  - `https://github.com/PrestaShop/PrestaShop-1.6/blob/1.6.1.23/themes/default-bootstrap/order-confirmation.tpl` (blob `ab7c60fe01dad0e6bfe3a22d7f6de75056743f5a`)
  - `https://github.com/PrestaShop/PrestaShop-1.6/blob/1.6.1.23/controllers/front/OrderConfirmationController.php` (blob `1405808a7dc6f2534fece63b7d152507e2b5071c`)
  - `https://github.com/PrestaShop/PrestaShop-1.6/blob/1.6.1.23/classes/order/Order.php` (blob `5d1c12d6545d8c52f795cb5ee8e8466c734c56ab`)
- No runtime evidence or UI screenshots were created.
- Limitation: source files were reviewed at the exact `1.6.1.23` tag, but this packet does not establish a commit-level mapping from that tag to the experiment image digest. Verify the image's source provenance before asserting runtime behavior.

## 6. Review request

- Team Lead decision: Either (A) revise/approve a source-compatible observable for the candidate while preserving the intended payment-and-stock behavior, or (B) reject/return the proposal because its confirmation-screen reference claim is unsupported by the pinned stock UI. After that decision, implement an immutable revision and compile it; do not run G3 until G0 credentials are ready and cleanup gates pass.
- Suggested next task if accepted: Build the customer checkout flow around a disposable fixture, capture confirmation/reference, assert exactly one order and stock decrement, and add scoped cleanup; then run the authorized Docker sequence.
- Candidate remains ineligible for `VALIDATED` pending semantic review and real G3 evidence.
