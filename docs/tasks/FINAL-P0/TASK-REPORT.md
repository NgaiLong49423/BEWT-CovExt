# FINAL-P0 — Initial execution checkpoint

- Scope: current main, PR and Docker read-only preflight; repeat Kanboard evidence and reviewer-boundary checks.
- Base: `origin/main` `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`; branch `task/final-sprint-p0`.
- Proposed status: PARTIAL. Full commit and PR are supplied in the external handoff; a file cannot contain its own commit hash.
- Repository status before switch: one untracked `experiments/expresscart/bewt-suite/docs/`; preserved. No `bewt-original/` changes.
- GitHub: #21 merged at base; #12 and #11 merged; #15 and #19 open draft. PR description is not independent evidence; detailed audit remains open.
- Docker: read-only inspection found Engine 29.8.0, 7,157,481,472 bytes configured memory, existing ExpressCart containers and other projects' resources. No resource changed, no runtime run or cleanup performed. Historical Cloud-only runtime policy needs verification before any workload.
- Kanboard: preserved T04-C report describes two XML hash mismatches and missing original exact Maven command. Offline audit asserts these remain blocked. Tests verify stored evidence consistency; they do not establish original bytes or a new G0 PASS.
- Claroline: T03-B2 records no completed Base tests, derivative image patch and isolation/authorization prerequisites. No gate promoted.
- Bludit: historical two Installer and AddContent runs report PASS, subject to independent G0 review; no new run here.
- G1: T04-G documents 27 proposals for seven apps, five Kanboard proposals separately, pending human decisions. ExpressCart historical pilot counts overlap with later proposals; aggregate unique counts unverified. RQ2 denominator not accepted.
- Gemini: no call in this task; cost attributable to this task zero. PR #15 reports earlier attempted call with billed cost unknown.

## Verification

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| `node --test docs/tasks/T04-C/test/g0-audit.test.mjs` | 0 | 8 PASS, 0 FAIL | `evidence/kanboard-audit-after-restore.txt` |
| `node --test docs/tasks/T04-B/test/*.test.mjs` | 0 | 12 PASS, 0 FAIL | `evidence/review-regression.txt` |

No Maven, Selenium, new candidate, provider, or runtime experiment was executed. G0–G4 and D1–D8 acceptance remain unverified. `docs/program/STATUS.json` deliberately unchanged; a proposed status is provided separately.

## Next actions

1. Independently review PR #19 source, safety and evidence at its exact HEAD; do not merge without Team Lead.
2. Search for archived original Kanboard XML and original command; if unavailable prepare isolated fresh evidence run under current runtime policy.
3. Present candidate-specific G1 review packets and obtain actual decisions; settle Claroline provenance/isolation and fresh Gemini budget separately.
4. Re-fetch `origin/main`, inspect `git status`, PR heads and runtime lease before resuming.
