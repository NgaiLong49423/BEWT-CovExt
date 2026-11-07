# AI generation and change ledger

## Official final source

The official test source is generation/langgraph-run/. Gemini calls were made inside the LangGraph node generate_java; its structured response supplied the Java source. Each prompt contains the accepted Gherkin and baseline comparison. The corresponding response and usage metadata are retained per candidate. Final source was copied into the isolated Maven test suite.

| Candidate | Generation | Agent repair 1 | Agent repair 2 |
|---|---|---|---|
| EC-C02 | LangGraph/Gemini generated EmptyCartTest.java | None | Added explicit fresh-cart-zero setup assertion while preserving the exact notification and hidden-button oracles. |
| EC-C04 | LangGraph/Gemini generated ForgottenPasswordTest.java | Corrected use of inherited appUrl and actual BaseTest APIs surfaced by compile diagnostics. | None |
| EC-C01 | LangGraph/Gemini generated RemoveDiscountCodeTest.java | None | Removed guessed reflection/default URL resolution; uses inherited BaseTest.appUrl, keeps discount fixture fail-fast and all removal assertions. |
| EC-C05 | LangGraph/Gemini generated CreateStaticPageTest.java | Corrected AdminLoginPage setup calls per actual Page Object signatures. | Aligned cleanup with pageName displayed in the admin list, clicks its exact UI delete control, and verifies removal after save submission. |

langgraph-repair-history.json records the repair sequence. No test exceeded two agent repair iterations. The final sources were compiled after the last edit.

## Superseded pre-LangGraph implementation

The sibling generation/ root and earlier e2e/ folders preserve the initial direct Gemini invocation and its repair history. During final audit I found those model calls happened outside LangGraph, despite the script using LangGraph later to write a manifest. They are retained as superseded experiment evidence and are not the official final generation or E2E metrics. No artifacts were deleted.

The initial direct-run C02 source received a manual strict-oracle correction, preserved in generation/EmptyCartTest.review-corrected.java; that source is superseded by the official LangGraph output. No manual edits were passed off as model output.
