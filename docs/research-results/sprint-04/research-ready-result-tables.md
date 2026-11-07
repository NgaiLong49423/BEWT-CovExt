# Sprint 04 — Research-ready result tables

## Candidate outcomes

| Candidate | Java class | First invocation | Final candidate result | Invocations | Behavior assertions reached | Repairs | Repeatability |
|---|---|---|---|---:|---:|---:|---|
| EC-C02 | `EmptyCartTest` | Selector error: `.bootbox-accept` absent | **FAIL — application UI:** clear-cart notification appeared, but the expected `Cart empty` message did not render | 2 | 1 | 1 | Not repeated; final behavioral failure |
| EC-C04 | `ForgottenPasswordTest` | **PASS** | **PASS** | 4 | 4 | 0 | 3/3 repeats PASS |
| EC-C01 | `RemoveDiscountCodeTest` | BLOCKED before oracle: checkout total locator absent | **FAIL — application UI:** applying an active coupon did not render `discount-amount` | 3 | 1 | 2 | Not repeated; final behavioral failure |
| EC-C05 | `CreateStaticPageTest` | **FAIL:** content mismatch and cleanup failure | **PASS after repair** | 5 | 5 | 1 | 3/3 repeats PASS; page count returned to zero each time |

## Denominators and stages

| Metric | Result | Definition / limitation |
|---|---:|---|
| Previously accepted Java classes reused | 4/4 | Original LangGraph generation is unchanged; Sprint 04 did not call the model or regenerate tests |
| Final Maven module `test-compile` | PASS | Explicit run plus successful Maven E2E compile stages; 39 Java test source files in the suite |
| Candidate test-method invocations | 14 | Counts one invocation per candidate run; excludes one separate cleanup-helper invocation |
| Candidate behavior oracle reached | 11/14 | Three invocations stopped at selector/fixture preconditions before behavior assertions |
| Behavioral PASS invocations | 8 | Four EC-C04 and four EC-C05 passes |
| Behavioral FAIL invocations | 3 | EC-C02, final EC-C01, and EC-C05 before repair |
| First-invocation PASS | 1/4 candidates | EC-C04 only; EC-C05 passed after repair |
| Final candidate PASS | 2/4 candidates | EC-C04 and EC-C05 |
| PASS after repair | 1 candidate | EC-C05; EC-C04 passed without repair |
| Repeated-run PASS | 6/6 | Three repetitions each for EC-C04 and EC-C05; runs were serial |
| Repair iterations | 4 total | EC-C02: 1; EC-C01: 2; EC-C05: 1; EC-C04: 0 |
| Flaky candidates | 0 observed | Only EC-C04/EC-C05 met the PASS condition and were repeated |
| Environment blockers during candidate runs | 0 | Docker and HTTP readiness were available for all candidate runs |
| Model calls/tokens in Sprint 04 | 0 / not applicable | Sprint 03 LangGraph-generated code was reused |

## Failure classification

| Category | Count / state | Evidence-based interpretation |
|---|---:|---|
| Test selector/setup issues observed | 4 run-level observations, repaired or bypassed | EC-C02 wrong modal selector; EC-C01 missing in-test cart fixture and hidden duplicate total locator; EC-C05 Summernote field synchronization |
| Application behavior failures remaining | 2 candidates | EC-C02 empty-state markup; EC-C01 discount summary not refreshed after apply |
| Cleanup defect observed | 1, repaired | EC-C05 first run left its unique page because the test expected a Bootstrap modal while upstream uses native `confirm()` |
| Generation failures | 0 | No generation was run in this sprint |
| Compilation failures | 0 | Every Maven execution reached Surefire; final module compile passed |
| External environment failures | 0 | Existing experiment remained healthy; no restart/reset was necessary |

## Repeat runs

| Candidate | Initial + repeats | Results | Cleanup evidence |
|---|---|---|---|
| EC-C04 | 1 initial + 3 repeats | PASS, PASS, PASS, PASS | Email generated as a fresh UUID each time; no account created |
| EC-C05 | 1 post-repair + 3 repeats | PASS, PASS, PASS, PASS | Unique page created and deleted via UI; `pages` count 0 before and after each run |

Raw per-invocation values are in [run-metrics.csv](run-metrics.csv); aggregate values are in [metrics.json](metrics.json) and [metrics.csv](metrics.csv). Surefire XML is archived for every official candidate invocation and indexed in [surefire-index.json](surefire-index.json). Four earlier EC-C04 exploratory runs are preserved separately and listed in [exploratory-runs.csv](exploratory-runs.csv); they passed but are excluded because exact email absence was not preflighted. Raw EC-C01 Surefire XML also records `test.discount.code` as a Maven system property; this is seeded demo coupon data, not a credential.
