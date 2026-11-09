# T04-B Task Report — Kanboard Candidate Review

## Scope and outcome

This task prepares an evidence-linked static review of the five shortlisted Kanboard candidates against all 30 accepted T04-A baseline cases. It does not make a Team Lead decision, run UI tests, alter the shared program status, or qualify G1. All five remain `PROPOSED`; every official human decision field is null.

The deterministic dataset at `data/reviews/kanboard/t04b-review-dataset.json` contains 5 candidates and 150 candidate/baseline comparisons, an 80-entry evidence/provenance index, pair-specific rationales, candidate oracle/fixture conditions, a risk register, and a qualitative non-aggregating rubric. Current pair classification is 142 `DISTINCT_BEHAVIOR_SUPPORTED` and 8 `PARTIAL_SEMANTIC_OVERLAP`; these are static comparison labels, not novelty acceptance. Candidate-by-candidate packets are under `docs/tasks/T04-B/review-packets/`. Recommendations are engineering opinions, not official candidate decisions.

## Source and evidence basis

- Accepted inputs: `data/coverage/kanboard/inventory.json`, `gap-candidates.json`, `shortlist.json`, and `provenance-index.json` (T04-A accepted at main commit `87c56c6b1bee2c6b550fbb0ce3f002bd18027f18`).
- BEWT benchmark pin: `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Kanboard upstream pin: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.
- Source integrity/regeneration logs: `evidence/provenance/` and `evidence/verification/`; files are sanitized for repository-relative paths.
- Historical comparison inspected Sprint 01–05 and final ExpressCart reports. No Kanboard-specific record was found in the inspected corpus; this absence does not prove global novelty.
- Supplemental pinned source/hash evidence for task-status model, comment persistence/rendering, and subtask parent-scoped rendering is listed in the dataset and `evidence/provenance/supplemental-source-hashes.json`.
- T03-A reset and G0 reports provide historical feasibility context only. Shared `docs/program/STATUS.json` remains authoritative and Kanboard G0/G1 remains `NOT_VERIFIED`.

## Technical recommendations

| Candidate | Recommendation | Key qualification |
|---|---|---|
| KB-GAP-001 | RECOMMEND_REVISE | Make reopening/status the primary oracle; `status:open` filter facility overlaps KB-017/018/027. |
| KB-GAP-002 | RECOMMEND_ACCEPT | Comment creation and task-scoped comment history are absent from mapped baseline actions/oracles. |
| KB-GAP-003 | RECOMMEND_ACCEPT | Preserve parent-child identity as the oracle; generic title creation overlaps KB-003/004. |
| KB-GAP-004 | RECOMMEND_REVISE | Partial role/membership overlap with KB-013; pin actor role, same-project active target, fixture and negative role control. Forged non-member `owner_id` rejection is `INSUFFICIENT_EVIDENCE`. |
| KB-GAP-008 | RECOMMEND_ACCEPT | Existing-column update is distinct from baseline create-column cases KB-006/007. |

These opinions must not be read as candidate decisions or novelty acceptance.

## Verification

The generator and focused test results are recorded in `TEST-RESULTS.md`. Source integrity was independently checked against pinned Git objects in a temporary detached clone; the exact results and hashes are preserved in `evidence/`. No Gemini, Docker, browser, Selenium, or destructive source operation was used.

## Gate and handoff

G1 remains `NOT_VERIFIED`; G0 remains a separate Team Lead review dependency. No shared `STATUS.json` update is proposed. Proposed status stays in `PROPOSED-STATUS-UPDATE.json`. Stop here for Team Lead review; do not begin T05.
