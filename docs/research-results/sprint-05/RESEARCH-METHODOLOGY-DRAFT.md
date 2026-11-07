# Methodology draft — BEWT-CovExt feasibility study

## Study design

This work is a single-application **feasibility study** on the pinned ExpressCart upstream source. It examines whether a LangGraph/Gemini workflow can turn baseline-derived coverage analysis into reviewed Gherkin and Java Selenium tests, compile the generated suite, and execute selected tests against a reproducible app instance. It is not a controlled comparison against BEWT and cannot support a claim that the method improves coverage, defect detection, or efficiency over BEWT.

## System under test and baseline

The subject is `mrvautin/expressCart` commit `b31302f4e99c3293bd742c6d076a721e168118b0`, package `1.1.19`, run from a separate Docker Compose project with Node.js 14.21.3 and MongoDB 4.4.29. Java 21.0.12, Maven 3.9.16, Selenium 4.35.0, Chrome 156.0.8078.76, and ChromeDriver 156.0.8078.80 were recorded in the Sprint 01/04 manifests. The 31 ExpressCart baseline scenarios/features were read from `bewt-original/`; no source or test in that directory was edited. Sprint 01's adapted `AddUserTest` was executed before and after an experiment-owned reset and passed both times.

## Candidate generation and review

The final Sprint 01 Gemini run generated five Gherkin candidates. Structural schema, parser validity, source-reference string matching, and lexical duplicate heuristics were recorded as separate checks; none alone establishes behavioral validity or novelty. Sprint 02 performed technical source review and revised Gherkin; the Team Lead accepted EC-C01, C02, C04, C05 and retained C03 as REVISE. The decision permits test implementation only and is not E2E acceptance. Static comparison covered 31 baseline scenarios; absence of an equivalent scenario in that set is a comparison observation, not experimental superiority.

## Java generation, compilation, and execution

LangGraph/Gemini generated Java classes for the four accepted candidates in Sprint 03. The first Maven module test-compile failed, and class-level repairs were performed within the documented limit; final module compilation passed. Because Maven compiled a shared module, compile evidence is reported at module level. Sprint 03 then invoked each test once, but all four were blocked before an application behavior oracle because the app and/or required fixtures were unavailable.

Sprint 04 reused those classes against the recovered pinned ExpressCart environment. It ran 14 official candidate method invocations serially. Each test's fixture, result, repair iteration, whether the behavior oracle was reached, and repeat index were recorded. Four earlier EC-C04 exploratory executions were preserved separately and excluded due missing exact-email absence preflight. Two candidates that passed their final repaired run received three serial repeats each with per-run cleanup checks. No full-volume reset was claimed in Sprint 04.

Sprint 05 performed manual browser UI checks of C01 and C02 in the existing experiment and one independent Java rerun per candidate. UI actions used a disposable session, and cart/discount state was removed through the UI afterward. This was targeted defect triage, not a new candidate-generation sample. No app patch, oracle change, source baseline edit, or Docker reset was made.

## Measures and denominators

Report (1) candidate counts once per unique EC-Cxx; (2) parser and source-review proportions over their explicit candidate set; (3) module compilation attempts separately from candidate-class inclusion; (4) E2E invocation counts with PASS, FAIL, and BLOCKED-before-oracle separated; (5) final candidate outcomes over four accepted candidates; (6) repeatability as per-run results and the number of candidates with repeats; (7) each repair as a class-level or method-level iteration in its own sprint; and (8) model telemetry exactly as provider-reported, noting inconsistent totals and unreported cost. A blocked invocation is excluded from behavioral-failure rates. Multiple invocations of one candidate are not independent candidate observations.

## Replication and evidence

The source pin, image identifiers, runtime versions, fixture preparation, prompt/response, generated Java, compile logs, Surefire records, screenshots, repair history, and metrics JSON/CSV are preserved under the sprint evidence directories. Summaries link to underlying artifacts. Secrets are omitted. The manual UI state trace and independent validation files are in `docs/research-results/sprint-05/`.
