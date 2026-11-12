# Final Acceptance Report

## Recommendation

`ACCEPTANCE_BLOCKED`

The current evidence does not support engineering or scientific acceptance. The target remains eight applications and 40 proposed cases; no scope reduction is proposed.

## Results at audit baseline

- Repository baseline: `da6399536ff75a1edf4417819eb4d166cc1d781c`.
- Candidate count: 40.
- Semantic mappings matching Gherkin/oracle: 0/40.
- Human oracle/novelty approvals evidenced: 0/40.
- Raw G3 summary claims: 11 passing all reruns, 2 flaky, 27 failing; these do not qualify as validated research cases because code semantics and runtime identity are insufficient.
- Cases currently meeting `VALIDATED`: 0/40.
- RQ1/RQ2/RQ3/RQ4: no published PASS is supported by the audited primary evidence.
- G0: partial evidence only; execution identity is incomplete.
- Cleanup: one false zero-residual record contradicts the aggregate claim.
- Model: five failed attempts; successful generation, token usage, and actual cost are unverified/unknown.

## Work completed

Fetched current `origin/main`, read required scope/governance documents, inspected the 40 candidate registry and Java mappings, all 40 primary human-review records, the metric engine, G0/G3 manifests and summary records, model usage report, and ignored BEWT source status. Created the case-level traceability JSON and evidence-based audit package in this directory. Replaced the metrics script's false-PASS behavior with a Cucumber-parser, review-signature, hash, and raw-evidence audit; its 15 negative/determinism tests pass and it generates JSON/CSV outputs. Added ten immutable security-only Revision 3 copies that require Claroline/Kanboard credentials through runtime configuration; these are not yet compiled or run.

## Required next decisions

The Team Lead must review and sign or reject the 40 oracle/novelty packets, decide how to handle proposals incompatible with pinned app behavior, and confirm whether credential literals are test-only or require rotation. Once those decisions exist, engineering can register corrected revisions and run the exact G0/G3 protocol. The metrics engine and scientific manuscript must then be reconciled against those verified results.
