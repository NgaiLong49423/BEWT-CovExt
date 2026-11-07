# BEWT-CovExt Sprint 02 — Technical Candidate Review

**Status: AWAITING_TEAM_LEAD.** Technical review of all five candidates and a revised Gherkin file per candidate are complete. No candidate has been human-accepted. The required single Team Lead decision is the remaining gate before Java generation.

## What was verified

- Reviewed all 31 baseline BEWT ExpressCart scenarios against the five candidates from the pinned Sprint 01 model run.
- Confirmed routes, UI controls, result handling, setup data, and cleanup paths against pinned ExpressCart source `b31302f4e99c3293bd742c6d076a721e168118b0` (`1.1.19`).
- Performed read-only GET checks against the running app. The storefront and forgotten-password page returned HTTP 200. After a temporary fixture login, the admin page editor and product list returned HTTP 200 and contained the expected controls; logout returned HTTP 200. No application form was submitted.
- Read-only database counts showed 8 products (all published), 2 active discounts, 2 customers, and 0 static pages.
- Revised Gherkin files are parsed with the Cucumber parser by [validate-revised-features.mjs](scripts/validate-revised-features.mjs): 5/5 valid, with one scenario each. The captured result is [gherkin-validation.json](evidence/gherkin-validation.json). Parser validity is syntax evidence only, not Selenium execution evidence.

## Candidate recommendations

| ID | Recommendation | Technical finding |
|---|---|---|
| EC-C01 | PROPOSE_ACCEPT | Removal endpoint clears the session discount and recalculates totals. Revised Then steps compare the original total and verify the discount UI is cleared. |
| EC-C02 | PROPOSE_ACCEPT | Empty-cart UI includes a confirmation modal; the route clears cart/session state and the page exposes an empty-cart state. Revised assertions name the visible message, zero count, and hidden controls. |
| EC-C03 | REVISE | The original claim that unpublished products disappear from public search conflicts with the pinned route: search queries indexed IDs without filtering publication state. Revised case checks that the admin unchecked state persists after reload. |
| EC-C04 | PROPOSE_ACCEPT | Unknown customer email deliberately receives HTTP 200 and the same generic success text; it is not rejected with an account-not-found message. Revised scenario asserts that exact response. |
| EC-C05 | PROPOSE_ACCEPT | Admin page form saves `pageName`, `pageSlug`, `pageEnabled`, and `pageContent`; the storefront resolves enabled slugs. Revised scenario asserts document title and visible content and includes a delete cleanup path. |

These are technical recommendations only. The detailed evidence, baseline mapping, and test data/cleanup notes are in [CANDIDATE-REVIEW.md](CANDIDATE-REVIEW.md). Revised scenarios are under [revised/](revised/). Sprint 01's original candidates and evidence remain intact.

## Human decision and execution status

The pending decision record is [human-review-decisions.json](human-review-decisions.json). Its accepted and rejected ID lists are empty. Until a reviewer records decisions:

- Java tests generated: **0**
- Java compilation: **NOT_RUN**
- Candidate E2E executions: **0**
- Candidate pass/fail/blocked counts: **0 / 0 / 0** (no candidates were executed)
- Gemini calls during Sprint 02: **0**

Metrics and denominators are in [metrics.json](metrics.json). There is no runtime failure rate because no candidate Selenium test ran. The ExpressCart environment remains available at `http://127.0.0.1:3111`; no Docker resources were changed, no Git commit/push occurred, and `bewt-original/` remains untouched.

## Team Lead action

Please review the technical table and submit one decision with the IDs to accept, reject, or revise. After that decision is recorded, accepted candidates can proceed to Java generation, test compilation, serial E2E execution, and cleanup verification.
