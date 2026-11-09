# T04-H — Source-backed MediaWiki overlap review packet

- Base: `origin/main` `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`; branch `task/t04h-behavior-review`.
- Status proposed: READY_FOR_REVIEW as engineering artifact; no scientific acceptance. Commit and PR SHA supplied in handoff.
- Scope: MW-GAP-004 version 1, MediaWiki 1.40.0, BEWT source `0501249ff3e9a5ea83a06155cd2971dc36197056`. T04-E previously linked baseline cases 06 and 16; inspect additionally case 15 and the declared adjacency of 15 and 16. This is a new reviewer input, not a determination of novelty.
- [Review packet](MW-GAP-004-REVIEW.md) distinguishes Gherkin intent, Java assertions, possible suite dependency, candidate oracle uncertainty and concrete reviewer decisions.
- `tools/check_mw_overlap.py` reads pinned Git objects only, checks the expected Git tree, selected assertions and suite adjacency, and screens 27 feature blobs without emitting raw source or credentials. `evidence/mw-bounded-screen.json` retains blob IDs and SHA-256.
- Verification: `python docs/tasks/T04-H/tools/check_mw_overlap.py <BEWT-git-root>` exit 0; `python docs/tasks/T04-H/tools/test_mw_overlap.py <BEWT-git-root>` exit 0, 5 grouped checks pass (determinism, scope/anchors, decision boundary, output scan, missing-source rejection). Evidence: `evidence/test-output.txt`, `evidence/test-exit.txt` and `evidence/mw-bounded-screen.json`. No browser, application, Docker, Gemini or runtime test.
- Research impact: candidate 004 remains PROPOSED; human decisions remain null; behavioral denominator and RQ2 gain remain NOT_EVALUATED; no G0–G4 or deliverable accepted. No new scenario count or Java case.
- Safety: `bewt-original/` read via Git only; no write, reset, stage or cleanup there. No Docker resources or provider calls; no shared STATUS file or historical evidence changed. Check staged files and sensitive patterns before publishing.
- Human review: two independent reviewers should assess candidate revision and evidence, resolve overlap and oracle questions in the packet, and record actual decisions. Do not use this task as approval to generate Java.
