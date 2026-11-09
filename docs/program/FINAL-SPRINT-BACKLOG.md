# Final sprint execution backlog

Snapshot: 2026-11-10; fetched `origin/main` at `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`. This is a navigation aid, not gate acceptance. Re-fetch and verify ownership before each task. Branch ownership below is planned unless a PR is linked.

| ID / priority | Scope and dependencies | Evidence and acceptance criteria | Owner / approval / state |
|---|---|---|---|
| FS-00 P0 | Reconcile main, PRs, workspace and offline Kanboard evidence | `docs/tasks/FINAL-P0/`; tests preserve checksum blocker, backlog and handoff | `task/final-sprint-p0`; PARTIAL; review required |
| FS-01 P0 | Kanboard original XML provenance; depends on archive discovery or clean rerun | `docs/tasks/T04-C/G0-INDEPENDENT-ACCEPTANCE-AUDIT.md`; recover both original byte hashes and exact commands, or run fresh isolated protocol with full evidence | New branch; human G0 decision; BLOCKED_EVIDENCE |
| FS-02 P0 | Review offline four-app harness | PR #19 at `39f0f4e0b741be0bdc782c958354be42f24df0c0`; inspect diff, tests, safety and evidence before any integration | Existing PR #19; Team Lead review; DRAFT |
| FS-03 P0 | Claroline G0 | `docs/tasks/T03-B2/TASK-REPORT.md`, `config/apps/claroline.json`; derivative provenance decision, authorized isolated runtime, readiness, Base assertion, two clean runs/reset/cleanup | New branch; runtime lease, network authorization and provenance decision; BLOCKED |
| FS-04 P0 | G1 human decisions and baseline taxonomy | `docs/tasks/T04-G/`, `docs/tasks/T04-B/`; two independent reviewers decide per candidate/revision with evidence; resolve denominator and policy holds | New branch or review workflow; human decisions required; PENDING |
| FS-05 P0 | Model vertical slice | PR #15 and `docs/tasks/T05-A/`; review implementation, fresh explicit model/call/cost authorization, valid credential, approved scenario, actual checkpoint and Java generation | Existing PR #15; DRAFT, live call BLOCKED |
| FS-06 P1 | Bludit and ExpressCart G0 dossiers | `docs/tasks/T03-B1/`, `docs/research-results/final/`; independently verify complete G0 protocol and present evidence | New app-specific branches; Team Lead decision pending |
| FS-07 P1 | Joomla/MantisBT/MediaWiki/PrestaShop G0 | FS-02 review and safe runtime authorization; pinned manifests, HTTP/DB, Base assertion, reset and cleanup | Separate app branches and exclusive runtime lease; NOT_RUN |
| FS-08 P1 | G1 gaps on all eight apps | FS-04 plus source/UI evidence; avoid duplicates; record decisions and revisions, no invented quota | App-specific branches; human approval required; PARTIAL |
| FS-09 P1 | Generation and validation | FS-03/06/07, FS-04/05; approved case, immutable first pass, compile, E2E, bounded repair, three reset reruns and independent review | Per batch branch; NOT_RUN |
| FS-10 P2 | RQ1–RQ4 datasets and D8 | FS-04/09; auditable source-linked denominators, scripts, results and limitations | Separate branches; NOT_EVALUATED |

## Current factual boundaries

- `STATUS.json` is a stale task-progress snapshot and does not establish current acceptance. No accepted G0–G4 gate was verified in this initial audit.
- T04-G records 227 provisional feature records, not unique behaviors; 27 seven-app proposals and 20 shortlist entries. T04-B records five Kanboard candidates pending decisions. Historical ExpressCart pilot has five proposals and four implementations; avoid adding these sets without deduplication.
- PR #15 records one authorized Gemini attempt, HTTP 400 `API_KEY_INVALID`, no returned token telemetry; billed cost unknown. Do not retry without new authorization.
- PR #19 is offline only; its claims and source require independent review. Its historical statement that PR #12 was draft is stale: GitHub reports #12 merged. Merge is not G0 acceptance.
- T03-B2 records Cloud-only runtime policy and no verified runtime lease in that task. This snapshot does not grant local runtime permission or cloud spending.
