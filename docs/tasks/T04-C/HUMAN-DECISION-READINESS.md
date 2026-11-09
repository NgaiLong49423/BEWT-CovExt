# Human Decision Readiness — Kanboard T04-B Candidates

## Current inputs

The merged static review dataset contains exactly five candidates: `KB-GAP-001`, `KB-GAP-002`, `KB-GAP-003`, `KB-GAP-004`, and `KB-GAP-008`. All remain `PROPOSED` / `PENDING`; reviewer, decision, rationale, oracle/novelty and evidence fields are null. `data/reviews/kanboard/human-review-decisions.jsonl` is zero bytes. Current hashes and emptiness are captured in `evidence/human-review-input-integrity.json`.

The dataset and `data/coverage/kanboard/gap-candidates.json` are static pinned review inputs. Do not edit or regenerate them to make a decision fit. Technical recommendations already recorded in the dataset are not Team Lead decisions. Review focus:

| Candidate | Existing technical recommendation | Review focus |
|---|---|---|
| KB-GAP-001 | RECOMMEND_REVISE | Use Closed → Open as primary oracle; search is supporting corroboration. |
| KB-GAP-002 | RECOMMEND_ACCEPT | Verify the comment persists on the exact task after save/reload. |
| KB-GAP-003 | RECOMMEND_ACCEPT | Verify the subtask links to the intended parent. |
| KB-GAP-004 | RECOMMEND_REVISE | Specify actor role, target membership, stable fixture and permission boundaries; forged `owner_id` rejection remains unverified. |
| KB-GAP-008 | RECOMMEND_ACCEPT | Verify the same column ID displays its changed title after reload. |

These are review prompts only and do not make decisions for the Team Lead.

## Required real decision payload

For each decision, the Team Lead supplies the actual reviewer identity and date/time, decision (`ACCEPT`, `REVISE`, or `REJECT`), rationale, oracle confirmation, novelty assessment, implementation conditions, and at least one reviewer evidence reference (repository-relative path plus matching SHA-256 and description). Bind the payload to candidate ID/version SHA, exact reviewed dataset SHA, and full reviewed Git commit SHA. Review pinned source evidence and the baseline overlap/rubric before deciding.

Use the merged validator only with a Team Lead supplied payload:

```powershell
node docs/tasks/T04-B/tools/human-review-decisions.mjs validate <reviewer-supplied-decision.json>
node docs/tasks/T04-B/tools/human-review-decisions.mjs append <reviewer-supplied-decision.json>
```

A candidate version or dataset hash change makes an earlier decision stale and requires review again. The append-only ledger records correction/revision history; never rewrite existing lines. This task neither creates payloads nor appends to the real ledger.

An `ACCEPT` permits implementation planning only. It does not establish oracle/novelty validation, candidate `VALIDATED`, G1 PASS, or global novelty. G0 acceptance remains a separate Team Lead decision.
