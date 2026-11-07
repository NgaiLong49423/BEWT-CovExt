# Final research tables

**Counting policy:** candidate = unique EC-Cxx scenario; generated test class = Java class for one accepted candidate; source file = one `.java` file (the Maven module also contains baseline files); invocation = one test-method call; repeat = additional invocation of a candidate already passing; repair = recorded code/test repair iteration. BLOCKED is a research classification before application oracle, even if Surefire represents it as JUnit `ERROR` or `FAIL`. Do not sum these units.

## Table 1 — Candidate generation and review (RQ1)

| Stage | Numerator / denominator | Result | Interpretation |
|---|---:|---:|---|
| Original Gherkin candidates | 5 generated | n=5 | Final successful Sprint 01 generation run |
| Gherkin parser success | 5/5 candidates | 100% syntax-valid | Does not establish semantic validity |
| Evidence-reference string check | 5/5 candidates | 100% matched | Lexical check only |
| Lexical duplicate hints | 0 hints / 5 candidates | No lexical hint | Not a novelty evaluation |
| Human ACCEPT | 4/5 candidates | 80% accepted | EC-C03 REVISE; no REJECT |
| Revised Gherkin parser success | 5/5 revised files | 100% syntax-valid | Source/oracle review is separate |
| Source-backed accepted behavior | 4/4 accepted candidates | VERIFIED_BY_STATIC_REVIEW | No claim about E2E behavior |
| Empirical novelty vs BEWT baseline | — | **NOT_EVALUATED** | No behavioral mapping/coverage protocol executed |
| Comparative effectiveness vs another test-generation method | — | **NOT_EVALUATED** | No competing method or controlled comparison executed; BEWT is a benchmark, not a generation algorithm |
| Official Java generation | 4/4 accepted candidates | 100% generated | Official LangGraph path; superseded direct-call history excluded |

Evidence: [S01 metrics](../sprint-01/metrics.json), [S02 review](../sprint-02/CANDIDATE-REVIEW.md), [Team Lead decisions](../sprint-02/human-review-decisions.json), [S03 metrics](../sprint-03/metrics.json).

## Table 2 — Compilation (module-level)

| Compile event | Unit | Result | Evidence / limit |
|---|---|---|---|
| First official Java `test-compile` | One Maven suite module | FAIL | API mismatches; no independent per-class compile runs |
| S03 repair activity | 4 classes in shared module | 5 class-level repair calls/iterations | C02:1, C04:1, C01:1, C05:2 |
| Final S03 `test-compile` | One Maven suite module | PASS | 38 Java test source files in suite; includes generated and baseline sources |
| S04 final module `test-compile` | One Maven suite module | PASS | 39 Java test source files included; module source count, not candidate count |
| First-compile candidate rate | Not a measured unit | **NOT_MEASURED** | Do not report 0/4 or 0% as four independent compile outcomes |

Evidence: [first compile](../sprint-03/compilation-langgraph-first-attempt.log), [final compile](../sprint-03/compilation-langgraph-final.log), [S04 final compile](../sprint-04/compile-final.log), [LangGraph repair history](../sprint-03/langgraph-repair-history.json).

## Table 3 — E2E invocation outcomes

| Sprint scope | Invocations | Research outcome | Oracle reached | Notes |
|---|---:|---|---:|---|
| S03 official attempts | 4 | 4 BLOCKED, 0 PASS, 0 behavior FAIL | 0/4 | App unavailable for two; fixture/config missing for two |
| S04 official batch | 14 | 8 PASS, 3 behavioral FAIL, 3 BLOCKED | 11/14 | 15 Surefire testcase records because one C05 invocation had both assertion and teardown records |
| S05 targeted validation | 2 | C02 assertion observed a transient UI defect; C01 timed out waiting for the discount element and remains INCONCLUSIVE | 1 determinate defect observation; 1 indeterminate timeout | A Selenium wait timeout is not itself a behavioral verdict; these are diagnostic invocations, not new candidates |
| S04 official repeated runs | 6 | 6 PASS | 6/6 repeats | Three per candidate for C04 and C05 |

Sprint 04 ratios: oracle reach `11/14 = 78.6%`; PASS among invocations that reached oracle `8/11 = 72.7%`; behavioral FAIL among reached `3/11 = 27.3%`; BLOCKED before oracle `3/14 = 21.4%`. These are invocation-level descriptions and include retries/repeats; they are not independent-candidate rates.

The four exploratory EC-C04 invocations in Sprint 04 are preserved but excluded because exact email absence was not preflighted. See [exploratory ledger](../sprint-04/exploratory-runs.csv).

## Table 4 — Candidate-level outcome

| Candidate | Human decision | Java generated | S04 final candidate | S04 repeats | S05 validation | Final classification |
|---|---|---|---|---:|---|---|
| EC-C02 Empty cart | ACCEPT | Yes | FAIL at empty text assertion during AJAX update | 0 | Manual UI and source confirm blank transient AJAX state; after reload `Cart empty` is rendered | **CONFIRMED_APP_DEFECT (transient UI)** |
| EC-C04 Forgotten password | ACCEPT | Yes | PASS | 3/3 | Not rerun | **PASS in S04** |
| EC-C01 Discount removal | ACCEPT | Yes | S04 ledger: FAIL / APPLICATION_UI after discount visibility wait | 0 | S05 manual UI shows totals correct after reload, while Java timeout cannot independently establish app behavior | **INCONCLUSIVE** |
| EC-C05 Static page | ACCEPT | Yes | PASS after repair | 3/3 | Not rerun | **PASS after repair in S04** |

Candidate results: first-attempt PASS `1/4`; final S04 candidate PASS `2/4`; repeated candidates `2/2` with all six repeat invocations passing. C01/C02 are not counted as PASS.

## Table 5 — Repairs and error analysis

| Category | Count/scope | Outcome |
|---|---:|---|
| S03 first module compile | 1 module attempt | FAIL, API mismatch in C04/C05 areas |
| S03 class-level generation/compile repairs | 5 across 4 classes | Final module compile PASS |
| S03 E2E blocked | 4/4 invocations | App unavailable or fixtures missing; not behavior failures |
| S04 test repair iterations | 4 total | C02 1, C01 2, C05 1, C04 0 |
| S04 environment failures | 0 classified invocation | Runtime recovered before official tests |
| S04 pre-oracle setup/selector blockers | 3/14 invocations | C02 wrong confirm selector once; C01 precondition/locator twice |
| S04 initial C05 content/cleanup failure | 1 method invocation | After repair, C05 PASS + 3/3 repeat PASS |
| S05 C02 application issue | One targeted rerun plus manual UI | Transient AJAX empty-state render confirmed; no patch |
| S05 C01 discrepancy | One targeted rerun plus manual UI | Selenium timeout conflicts with manual post-reload behavior; INCONCLUSIVE |

Evidence: [S03 metrics](../sprint-03/metrics.json), [S04 run ledger](../sprint-04/run-metrics.csv), [S04 repair history](../sprint-04/repair-history.json), [S05 defect validation](../sprint-05/DEFECT-VALIDATION.md).

## Table 6 — Agent/model telemetry

| Sprint/run | Calls/responses | Provider input / output / total | Interpretation |
|---|---:|---:|---|
| S01 final Gherkin run | 1 final successful generation request; 4 total attempts across ledger | 6,210 / 1,189 / 9,246 tokens | Provider total differs from input+output (`7,399`); no cost supplied |
| S03 official LangGraph generation/repair path | 9 successful structured responses | 25,180 / 10,500 / 66,750 | Provider totals preserved separately; no cost calculation |
| S03 superseded direct-call history | 12 responses | 28,791 / 16,497 / 84,997 | Excluded from official Java generation success; retained as historical evidence |
| S02, S04, S05 | 0 model calls each | N/A | No model usage during these sprints |

Do not sum provider totals as verified usage or infer cost. Token usage has an internal consistency conflict documented in raw metrics.
