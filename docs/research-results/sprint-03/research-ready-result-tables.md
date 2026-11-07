# Sprint 03 research tables

## Candidate review and source validity

| ID | Team Lead decision | Source-backed behavior | BEWT baseline comparison | Empirical novelty |
|---|---|---|---|---|
| EC-C01 | ACCEPT revised | VERIFIED_IN_SOURCE | No equivalent discount-removal behavior found among 31 cases | NOT_VERIFIED; app/discount fixture unavailable |
| EC-C02 | ACCEPT revised | VERIFIED_IN_SOURCE | No cart-empty behavior found among 31 cases | NOT_VERIFIED; app unavailable |
| EC-C03 | REVISE | Revised admin state persistence is source-backed; original search exclusion oracle is CONFLICT | No equivalent publication-toggle persistence behavior found | NOT_VERIFIED; revised Gherkin awaits approval |
| EC-C04 | ACCEPT revised | VERIFIED_IN_SOURCE | No forgotten-password case found among 31 cases | NOT_VERIFIED; app unavailable |
| EC-C05 | ACCEPT revised | VERIFIED_IN_SOURCE | No static-page create/render behavior found among 31 cases | NOT_VERIFIED; admin credentials unavailable |

## Official LangGraph generation and execution

| ID | Java generated inside LangGraph | First module compile | Final compile | Pre-repair E2E | First runnable E2E | Final E2E after repairs | Repair iterations | Repeated run |
|---|---:|---|---|---|---|---|---:|---|
| EC-C02 | Yes | FAIL (module-wide) | PASS | NOT_RUN: compile failed | BLOCKED: app connection refused | BLOCKED: app connection refused | 1 | Not run |
| EC-C04 | Yes | FAIL (API mismatch) | PASS | NOT_RUN: compile failed | BLOCKED: app connection refused | BLOCKED: app connection refused | 1 | Not run |
| EC-C01 | Yes | FAIL (module-wide) | PASS | NOT_RUN: compile failed | BLOCKED: discount fixture missing | BLOCKED: discount fixture missing | 1 | Not run |
| EC-C05 | Yes | FAIL (API mismatch) | PASS | NOT_RUN: compile failed | BLOCKED: admin credentials missing | BLOCKED: admin credentials missing | 2 | Not run |

Maven compiled the suite as one module, so the first compile result is recorded at module level. Compiler diagnostics specifically identified API mismatches in EC-C04 and EC-C05. The pre-repair E2E stage was not run because compilation had failed. The first runnable E2E invocations are also the final E2E results: no E2E-driven repair followed them. All four outcomes are blocks before application assertions, not verified application defects.

## Research totals

| Measure | Official LangGraph run | Superseded direct-call history |
|---|---:|---:|
| Original Sprint 01 candidates | 5 | — |
| Human accepted / revised / rejected | 4 / 1 / 0 | — |
| Java classes generated | 4 | 4 |
| First module compile | FAIL | FAIL |
| Final compile after repair | PASS, 4 classes included | PASS in superseded run |
| E2E PASS | 0/4 | 0/4 |
| Repair calls | 5 class-level calls across max two iterations | 8 class-level calls |
| Repeated-run success | 0 | 0 |
| Successful Gemini structured responses | 9 | 12 |
| Provider input / output / total token sums (all runs) | 53,971 / 26,997 / 151,747 | Included in all-runs total |

The superseded direct-call history is retained but excluded from official candidate pass metrics because its Gemini calls occurred outside the LangGraph generation node. Overall token totals include those responses. Provider-reported total_tokens is shown separately from input/output sums; cost is NOT_CALCULATED.
