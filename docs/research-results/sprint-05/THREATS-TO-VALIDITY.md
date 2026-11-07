# Threats to Validity

## Construct validity

- Parser-valid Gherkin is not equivalent to behaviorally valid or novel test design. The 5/5 parser and lexical evidence checks have narrow meanings.
- “PASS” means the recorded Selenium assertions and cleanup passed for that invocation; it does not prove complete behavioral coverage.
- EC-C02's Gherkin does not specify a timing bound. Immediate AJAX state is defective, while state after the automatic reload is correct; classification depends on whether the outcome is required immediately. The report scopes the confirmed defect to transient rendering.
- EC-C01's headless Selenium failure conflicts with manual UI behavior after reload. Until the difference is traced, it is INCONCLUSIVE rather than an application defect.
- No controlled measure establishes novelty or improved coverage versus BEWT.

## Internal validity

- A single app, one pinned version, a small human-accepted set (4), and repeated runs on the same environment limit causal conclusions.
- Repairs change test implementation after failures. First-attempt and final-after-repair outcomes are therefore reported separately.
- Maven compilation is module-level; a shared compilation result cannot be converted into four independent compile trials.
- The four exploratory EC-C04 runs in S04 lack exact-email absence preflight and are excluded from official counts.
- Browser UI interactions and headless Selenium use separate browser sessions. User agent, viewport, animation timing, duplicate IDs, session persistence, and reload behavior may differ.
- Sprint 04 did not verify a pristine full-seed fingerprint; Sprint 05 did not reset volumes. UI fixture cleanup was verified for the session used in manual validation.

## External validity

- Findings concern ExpressCart 1.1.19 and the exact pinned commit/runtime only. The Node and Mongo versions are legacy dependencies.
- Four accepted candidates do not represent all 31 baseline scenarios, other web applications, or the proposed wider benchmark.
- Results cannot support claims about general AI-agent effectiveness or improved performance over BEWT without controlled multi-application comparisons.

## Conclusion validity

- Candidate, invocation, repeat, and repair denominators differ; combining them into a single percentage would be misleading.
- PASS/FAIL counts include repeated executions of the same candidates. Repeat runs establish observed stability for those two tests in this environment, not independent replications.
- S01 provider usage has an internal mismatch (`total_tokens` versus input + output), and Sprint 03 provider totals also are not arithmetically consistent. Token totals and cost should not be normalized or estimated without provider clarification.
- C02's transient fault is reproducible from source and manual UI; C01 remains unresolved. These two cases should not be collapsed into a single application-defect rate.
