# Human Review Protocol

For each packet, the Team Lead should apply every dimension in `HUMAN-REVIEW-RUBRIC.md`, inspect pinned source permalinks and hashes, review all 30 baseline comparisons, validate the primary oracle and fixture/permission controls, and inspect the limited historical-corpus search caveat. Record reviewer identity, review date, exact commit reviewed, decision (`ACCEPT`, `REVISE`, or `REJECT`), rationale, oracle confirmation, novelty assessment, implementation conditions, and reviewer evidence only after human review. Keep these fields null until then. Independent reviewers must submit separate records; do not simulate a second reviewer or collapse disagreement.

An `ACCEPT` permits candidate implementation planning only. It does not establish `VALIDATED`, G1 PASS, or research acceptance. The Team Lead must separately decide how the unresolved Kanboard G0 review dependency is handled. No G1 status should be upgraded by this task.

## Durable decision records

`data/reviews/kanboard/t04b-review-dataset.json` and the candidate definitions in T04-A are static review inputs. The static builder writes neither the decision ledger nor its schema. Actual decisions belong only in the separate append-only `data/reviews/kanboard/human-review-decisions.jsonl`; it is currently a zero-byte file, so no human decision has been recorded.

Each appended record must include a candidate ID/version SHA-256, exact reviewed dataset SHA-256, reviewed commit SHA, reviewer identity, reviewer-supplied ISO date/time, decision (`ACCEPT`, `REVISE`, or `REJECT`), rationale, oracle confirmation, novelty assessment, implementation conditions, and reviewer evidence references. The ledger adds a sequence number, previous-record hash, and prior decision ID for that candidate. Records are never edited or removed; corrections are new records linked to the previous one.

The contract is in `data/reviews/kanboard/human-review-decision.schema.json`. The corresponding runtime validator and append-only writer are in `docs/tasks/T04-B/tools/human-review-decisions.mjs`. The validator checks required schema fields plus cross-object integrity: current candidate hash against the accepted T04-A definition, exact dataset hash, commit existence, evidence path/hash, unique IDs, contiguous sequence, previous-record hash, and candidate revision links. It rejects a decision for a stale candidate or dataset version; the review state becomes `REVIEW_REQUIRED_CANDIDATE_VERSION_CHANGED` or `REVIEW_REQUIRED_DATASET_VERSION_CHANGED` until a new decision is supplied for the exact current hashes.

Commands, to be used only after the Team Lead supplies a real decision payload:

```powershell
node docs/tasks/T04-B/tools/human-review-decisions.mjs validate <reviewer-supplied-decision.json>
node docs/tasks/T04-B/tools/human-review-decisions.mjs append <reviewer-supplied-decision.json>
```

Do not call `append` with test data, inferred approval, or an agent-generated reviewer identity/date/rationale. Regression tests use explicitly labeled synthetic fixtures in temporary files only; those fixtures are not decisions and never enter the tracked ledger. Rebuilding the static dataset must leave the ledger byte-identical.
