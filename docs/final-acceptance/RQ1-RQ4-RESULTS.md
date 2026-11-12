# RQ1–RQ4 Evidence Reconciliation

## RQ1 — Scenario novelty and validity

The engine at the audit baseline printed 40/40 syntactic, human-approved, and novel. That result was invalid: its Gherkin check used line-regex parsing; it treated implementation authorization as human approval; and it inferred novelty from a proposal label plus source references. Current review ledgers show 0 signed oracle/novelty approvals, and the independent semantic mapping audit found 0/40 matching Java implementations. Human acceptance and confirmed semantic novelty are therefore **not established**.

## RQ2 — Behavioral coverage gain

The historical +22.22% nominal and +6.11% empirically validated gains are not supported. The prior metrics code defaulted the baseline to 180, added all 40 candidates as distinct UBUs, and fell back to 11 validated candidates if G3 evidence was absent. The source-coverage audit records the baseline behavioral denominator as not established. Reported validated behavioral gain: **not established**; do not publish a percentage.

## RQ3 — Executability and stability

The consolidated G3 artifacts report 40 candidate attempts, 13 initial passes, 11 candidates with 3/3 passing reruns, 2 flaky cases, and 27 failures. These are raw execution claims from the historical run package, not semantically valid candidate outcomes. Run-to-source identity is incomplete, and one cleanup check failed. Static audit status: 0/40 behaviorally validated; raw run classifications remain historical and require provenance reconciliation.

## RQ4 — Agent workflow utility

The checked-in usage report records five failed `gemini-3.1-flash-lite` attempts, no returned token usage, no successful candidate, and unknown actual cost. No manual comparison was measured. Model calls with successful generation: 0 evidenced; successful response tokens and actual cost: `UNKNOWN`; savings: `NOT_MEASURED`. The `gemini-3.8-flash` cost-efficiency PASS is unsupported.

The fail-closed recomputation now emits RQ1 `BLOCKED`, RQ2/RQ3 `NOT_EVALUATED`, and RQ4 `PARTIALLY_VERIFIED` for the limited failed-attempt record. See the machine-readable output files in this directory.
