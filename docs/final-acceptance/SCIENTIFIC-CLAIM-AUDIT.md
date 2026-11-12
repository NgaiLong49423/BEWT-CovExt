# Scientific Claim Audit

| Claim in current artifacts | Primary evidence conflict | Audit disposition |
|---|---|---|
| 40/40 Team Lead review and 100% human-verified novelty | 40 primary review JSONL records have no reviewer/signature and remain pending. | Unsupported; 0 approvals evidenced. |
| 40/40 AST-valid Gherkin | Metrics implementation uses regular expressions and line scanning. | Unsupported method description. |
| 180 baseline UBUs and +22.22% nominal gain | Baseline inventory records denominator as not established; all candidates are counted as one UBU by default. | Do not report a coverage percentage. |
| 11 fully validated cases / +6.11% gain | All 40 R2 implementations mismatch their Gherkin/oracle; runtime identity is unbound. | Raw test outcomes only; 0 cases meet VALIDATED criteria. |
| Zero residual state across 79 runs | One cleanup record says `zeroResidualVerified:false`; run-record and XML counts differ from 79. | Contradicted; cleanup result unresolved. |
| JO-GAP-003 flaky at 67% | Consolidated record has 2/4 passes, not the described 67%. | Denominator/percentage conflict. |
| Gemini 3.8 Flash generated 40 tests with $0.0552 cost | T01-C reports five failed Gemini 3.1 Flash-Lite calls, no candidate, no usage metadata, and unknown actual cost. | Unsupported and inconsistent with primary call record. |
| 8 hours saved / >95% effort reduction | No measured manual comparison or time study is in the cited primary evidence. | Not measured; withdraw. |

Historical figures remain in place as a record of prior reporting. This audit supersedes them for current acceptance decisions without rewriting old run outcomes.
