# Finalization Readiness Review

**Final status: READY_FOR_SUPERVISOR_REVIEW_WITH_EXPLICIT_LIMITATIONS.** The research report, denominator-aware tables, eight-slide content, demo runbook, defense Q&A and evidence index are complete. No new candidates or experiments were produced in this finalization pass.

## Research audit decisions

| Audit item | Final treatment | Rationale/evidence |
|---|---|---|
| Candidate vs invocation vs repeat vs repair | Reported as four separate units | S04 14 official invocations include runs of the same four candidates; six repeats belong to two cases; repairs are code-edit iterations |
| First compile | One Maven module attempt failed; final module attempt passed after repairs | Maven did not compile/test each candidate as an independent module |
| Empirical novelty | **NOT_EVALUATED** | No novelty protocol or coverage comparison ran; lexical duplicate hint 0/5 remains only a separate heuristic |
| Exploratory EC-C04 runs | Excluded from official S04 count | Exact email absence was not preflighted; raw evidence retained |
| BLOCKED | Excluded from behavioral FAIL | Three S04 invocations did not reach application oracle; S03 four invocations were all blocked |
| C02 | **CONFIRMED_APP_DEFECT (transient UI)** | AJAX empty state blank due malformed source markup; state correct after automatic reload |
| C01 | **INCONCLUSIVE** | Manual UI totals correct after reload; independent headless Selenium timed out; root cause not isolated |
| Coverage gain vs BEWT baseline | **NOT_EVALUATED** | BEWT là benchmark/baseline, không phải thuật toán sinh test; không có protocol coverage |
| Comparative effectiveness vs another test-generation method | **NOT_EVALUATED** | Không chạy phương pháp cạnh tranh hoặc controlled comparison |
| Scope | ExpressCart only | 8-app/40-case target from proposal remains uncompleted |

## Interpretation corrections made

| Earlier wording/field | Final wording | Why | Raw data changed? |
|---|---|---|---|
| Sprint 03 report described empirical novelty as `0` | Updated summary interpretation to **NOT_EVALUATED**; explains JSON field `noveltyEmpiricallyVerified: 0` means no case was verified in that sprint | No novelty experiment/measurement was performed; absence of evidence is not measured zero novelty | No; Sprint 03 metrics JSON remains unchanged |
| Sprint 05 synthesis described “0 candidates empirical novelty demonstrated” | Changed to **NOT_EVALUATED**, preserving 0/5 lexical duplicate hints as a distinct heuristic | Avoids presenting an unmeasured variable as a 0% result | No Sprint 01–04 raw numbers changed |
| Possible reading of first module compile as 0/4 | Final tables say one Maven module FAIL then one final module PASS; first per-candidate compile rate NOT_MEASURED | Four generated test classes shared one module build; no four independent compile attempts exist | No; original compile logs remain intact |
| Potential aggregate of runs as test sample size | Final tables separate 4 candidates, 14 S04 official invocations, 6 repeats, 4 S03 blocked invocations and 2 S05 diagnostics | Repetition and repair do not increase unique candidate count | No |

## Acceptance checklist

| Criterion | Status | Evidence |
|---|---|---|
| Complete report, not outline | PASS | `FINAL-RESEARCH-REPORT.md`, 12 requested sections, conclusions and references |
| RQ1, RQ2, RQ3 answered to evidence | PASS | Sections 7–9 of final report |
| Denominators separated | PASS | `FINAL-RESULTS-TABLES.md` |
| Eight slides with notes | PASS | `FINAL-PRESENTATION-CONTENT.md` |
| Demo procedures and fixture checks | PASS | `DEMO-RUNBOOK.md` |
| Defense Q&A covers 2/4 PASS, repairs, C02, coverage limits | PASS | `DEFENSE-QA.md` |
| Traceability to S01–S05 evidence | PASS | `EVIDENCE-INDEX.md` |
| No unsupported novelty/superiority claims | PASS | Novelty, coverage gain vs BEWT and comparative effectiveness are separately NOT_EVALUATED |

## Related Work limitation

The report uses traceable sources for BEWT benchmark context, feature-driven LLM E2E generation and LangGraph implementation mechanics. The review is targeted, not systematic. It does not establish a novel method relative to the complete E2E test generation literature. Before journal/conference submission, the authors should add a systematic search strategy, inclusion criteria and broader primary studies if the venue requires a related-work survey.

## C01 diagnostic decision

No further C01 run was conducted in finalization because Sprint 05 already has a targeted Java rerun and a manual UI trace, while the next useful comparison requires instrumenting and preserving an exact matched session/DOM timeline for headed and headless execution. Doing that would be a new diagnostic experiment, not a report-only check. The report preserves **INCONCLUSIVE** and does not claim PASS/FAIL behavior validity for C01.

## Submission package check

`final.zip` was not present in the repository at review time. The ZIP under `experiments/expresscart/tools/` is a ChromeDriver distribution, not a research submission. Final documents link to Sprint 01–05 and experiment evidence by repository-relative paths, so `docs/research-results/final/` alone is not standalone. Submit either the repository checkout/commit with evidence paths intact, or an archive containing the final documents plus cited sprint metrics/raw reports, source lock/runtime manifests, generated sources/prompts/repairs, relevant Surefire/log/screenshot evidence and pinned source snippets. Exclude `.env`, credentials, real-user data, unrelated build artifacts and the ChromeDriver archive. No ZIP was created in this polish pass.

## Integrity and environment

- ExpressCart source HEAD remains the pinned commit; no source patch or dependency change was made.
- `bewt-original/` was not modified. Its 50 existing dirty build/Gradle entries remain untouched; provenance remains NOT_VERIFIED.
- No Docker container/image/volume/network was created, reset, deleted, restarted, or pruned in finalization.
- No secrets were copied to final deliverables.
- No commit or push was made.
- No Sprint 04/05 tests were rerun during finalization; current acceptance is for document/evidence readiness, not a fresh runtime certification.
