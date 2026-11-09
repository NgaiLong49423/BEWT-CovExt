# Human Review Protocol

For each packet, the Team Lead should apply every dimension in `HUMAN-REVIEW-RUBRIC.md`, inspect pinned source permalinks and hashes, review all 30 baseline comparisons, validate the primary oracle and fixture/permission controls, and inspect the limited historical-corpus search caveat. Record reviewer identity, review date, exact commit reviewed, decision (`ACCEPT`, `REVISE`, or `REJECT`), rationale, oracle confirmation, novelty assessment, implementation conditions, and reviewer evidence only after human review. Keep these fields null until then. Independent reviewers must submit separate records; do not simulate a second reviewer or collapse disagreement.

An `ACCEPT` permits candidate implementation planning only. It does not establish `VALIDATED`, G1 PASS, or research acceptance. The Team Lead must separately decide how the unresolved Kanboard G0 review dependency is handled. No G1 status should be upgraded by this task.
