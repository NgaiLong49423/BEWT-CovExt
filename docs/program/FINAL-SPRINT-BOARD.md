# Final sprint orchestration board

Snapshot 2026-11-10. Base `origin/main`: `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`. This board is a coordination snapshot, not gate acceptance; refresh remote HEAD and lease state before action.

| Agent | Ownership and initial assignment | Branch/worktree and status | Dependencies / next action |
|---|---|---|---|
| 0 `/root` | Coordination, independent engineering review, proposed program status | `task/t03a1-independent-review`; current checkout | Review actual worker diffs and evidence, record findings, coordinate corrections |
| 1 `/root/g0_runtime` | G0, runtime, Docker exclusive owner | PR #19 `task/t03-offline-g0-agent1`; correction HEAD `04e0049a6cdc803a593b9b758ff42ed3090d01cd`; correction ENGINEERING_PASS, full PR review pending | PR #26 HEAD `90289e103dde97d3ce70680fa8c16194e64dd0da` engineering PASS; write-once capture development underway, no workload until policy and safety preflight verified |
| 2 `/root/g1_coverage` | G1 baseline, candidate source mapping and human review packets | PR #24 `task/t04h-behavior-review`, HEAD `5e09e93407f3abd622e73af40c367eabb1a0dd5f`; engineering review PASS for packet; another independent G1 task IN_PROGRESS | Existing T04-A–G; no self-approval, hand off only actual human-approved revisions |
| 3 `/root/g2_framework` | Framework, provider and G2–G4 offline work | PR #25 `task/g2-offline-integrity`, HEAD `ea28d3093dab173d8e93d42a7cf31cec95a1f898`; engineering review PASS for budget fix; resuming PR #15 preflight | PR #15 already covers provider work; Gemini authorized without an aggregate cap by Team Lead; preflight and ledger required; no Docker until lease release |

## Runtime lease

- Assigned coordinator: Agent 1. Host: UNVERIFIED; run ID: NONE; exact resources: NONE assigned for this session; cleanup state: NOT_APPLICABLE for newly created resources because no run has been authorized or reported.
- This assignment is a scheduling reservation, not evidence that any prior runtime lease was released, that the Docker host is isolated, or that existing resources were cleaned. Agent 1 must establish host, run ID, scope, policy and ownership before any run. Agent 3 must receive explicit release and verified cleanup before shared Docker use.
- Historical T04-G report records a Cloud-only policy for that task; scope and current authorization must be confirmed before local workloads. No firewall change, privileged command or cloud spending is authorized by this board.

## Critical path and review queue

G0 source/image/isolated reset evidence and G1 human novelty/oracle decisions gate real Java execution and validation. A model-backed vertical slice needs a valid credential and per-run preflight. On 2026-11-10 the Team Lead authorized Gemini calls until project completion without an aggregate cost limit; maintain per-run bounds and telemetry and do not switch model to bypass quota. This approval does not authorize Cloud resource spending. G3/G4 require real E2E, clean reruns, independent approval and provenance before dataset/RQ synthesis. Offline framework work and source-backed G1 preparation may proceed in parallel.

PR #19 remains DRAFT: original HEAD `39f0f4e` received `REQUEST_CHANGES`; correction HEAD `04e0049` passed independent review for those corrections only (10 focused tests, synthetic boundary reproduction and 12 evidence hashes); full PR review remains pending. PR #15 remains DRAFT at `036e3d4ce6b6bf583e479fb1177ffe9943cdff0a`; its single live call failed `API_KEY_INVALID`, consumed authorization and returned no usage; billed cost unknown. PR #22–#26 have been integrated after engineering review; this does not imply human acceptance or G0–G2 gate acceptance. No PR may be merged by an agent without Team Lead approval.

## Gemini authorization and auto-review

Team Lead approved one concrete 7,900-character public source/baseline prompt to Google Gemini (gemini-3.1-flash-lite), no retry, estimated max USD 0.0109, after auto-review rejected the earlier execution attempt for lack of explicit payload/destination approval. That attempt never started and caused no call or charge. Await the retried approval mechanism and actual ledger before recording a result. No cloud-resource spending authorization is inferred.

## Integration checkpoint

The Team Lead subsequently authorized Agent 0 to integrate reviewed engineering changes. Main advanced from `65c3f6ef92d7e4f4fdf202f65b70ed4198929261` through #25 `4532c176986a9e2ad1622e39a65bf3d7925465cf`, #24 `7e58578b7c1d6a8172b99c699e44c7152436ee64`, #26 `33ebd2bd96e6570f8008d7abcc578cf4483c022e`, #22 `8a3c0524321adac867a8bee1eae007435afe2550`, and #23 `99811537e81d01f25f9210939a78800251662981`. Post-merge checks: framework ledger 3/3; MediaWiki extractor reproduction PASS; Kanboard 29/29; checkpoint hashes 3/3; isolated T04-B/T04-C regression 20/20. These integrations do not imply research approval or runtime gate acceptance.

Open PRs #19 and #15 remain under review. #19's four earlier Maven logs report incremental `Nothing to compile`; Agent 1 conducted fresh offline compiles and is preparing exact evidence. #15's latest Gemini call remains `API_KEY_INVALID`, and its SonarCloud check is failing due to duplicated historical preflight evidence; preservation and a reviewed resolution are required. Team Lead requested a newer Gemini model; model configuration is being developed with price and telemetry guards. Do not infer credential validity from that request.
