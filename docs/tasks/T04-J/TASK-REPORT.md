# T04-J — Claroline group-policy review packet

- Base `origin/main` `99811537e81d01f25f9210939a78800251662981`; branch `task/t04j-claroline-policy`; commit supplied in handoff, no PR opened by default.
- Proposed engineering status READY_FOR_REVIEW; candidate `CL-GAP-002` version 1 remains PROPOSED with null human decision, oracle INSUFFICIENT_EVIDENCE and novelty NOT_VERIFIED.
- `CL-GAP-002-REVIEW.md` distinguishes ordinary access guard, registration exceptions, privacy settings, quotas and document-access uncertainty; it also notes later P1 derivative-image decision recorded in T03-B2 without claiming G0 or policy acceptance.
- Source `22d852f93081bc36b1d08b93f5e0c14b49a573f6`, tree `f10d5b9747f13e0256b3f52f7663a1475340bfe4`. GitHub API source extractor checked commit/tree, nontruncated tree, exact path/blob IDs, independently recomputed Git object hashes and anchors for three blobs; exit 0. Output `evidence/source-anchors.json` contains hashes and anchors only.
- Offline negative tests: `python docs/tasks/T04-J/tools/test_cl_group.py`, exit 0, 5/5 PASS; evidence `test-output.txt` and `test-exit.txt`. Tested wrong tree, truncated tree, missing path, blob tampering and anchor behavior. The checks do not establish runtime or business policy.
- No application, Docker, provider, cloud resources or human approval; no cleanup task required. No changes to `bewt-original/`, `STATUS.json`, candidate records or historical evidence. RQ2 denominator remains unestablished.
- Review: independently validate source ranges, chronology and limits, then request actual reviewer decisions on policy, fixture and candidate revision; no Java generation is authorized by this packet.
