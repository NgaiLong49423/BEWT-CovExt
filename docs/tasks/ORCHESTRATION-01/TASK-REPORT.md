# ORCHESTRATION-01 — Initial independent review

- Base `origin/main`: `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`; branch `task/t03a1-independent-review`.
- Review target: PR #19 original HEAD `39f0f4e0b741be0bdc782c958354be42f24df0c0`. Engineering verdict: REQUEST_CHANGES. This is not a G0 acceptance decision.
- F01: `assertContainerIdentityAndMounts` treats missing `container.Mounts` as `[]`. Synthetic `assertOwnedContainer` invocation with absent `Mounts` and expected empty volume list returned `true`. Incomplete Docker inspection therefore passes a safety prerequisite rather than failing closed. No real Docker call was made. Require an explicitly present array and test missing/null/invalid mount inventories through full and partial cleanup paths.
- F02: `docs/tasks/T03-A1/IMPLEMENTATION-GAP-MATRIX.md` reports PR #12 OPEN/DRAFT though GitHub now reports merged; its Kanboard row omits the later T04-C checksum/exact-command blocker. Update current decision-facing matrix while preserving historical run evidence.
- A static read of `record-baseline-provenance.mjs` shows its user-supplied output path is not restricted from the read-only source tree. This is a concern for review; no write to that tree was attempted. Confirm whether that tool is intended for untrusted output paths before deciding a fix.
- Independent regression: PR #19 worktree HEAD test command `node --test experiments/g0-safety/test/offline-runtime-safety.test.mjs experiments/g0-safety/test/baseline-adapter.test.mjs` produced 9 PASS, 0 FAIL, exit 0. Existing tests do not cover F01. Full review of 400+ files is not complete.
- Search for original Kanboard XML in T03-A and T04-C worktrees found only already-known sanitized Surefire files by relevant filename. This limited search does not prove the originals do not exist elsewhere. G0 remains BLOCKED_EVIDENCE.
- `bewt-original/`, Docker resources, provider, and shared `STATUS.json` unchanged. No new gate, candidate review or validation is claimed. Existing untracked directory in root checkout preserved.

See `docs/program/FINAL-SPRINT-BOARD.md` for worker assignments, critical path and lease boundaries. Review of updated worker changes remains pending.

## Correction review

Agent 1 submitted PR #19 correction HEAD `04e0049a6cdc803a593b9b758ff42ed3090d01cd`. Independent review inspected source diff and tests, verified 12 LF-normalized evidence hashes against Git blobs, ran the three focused suites with 10/10 PASS, and reran synthetic absent/null/non-array Mounts checks against the exact corrected blob. All three invalid records were rejected and an explicit empty array was accepted. The correction is ENGINEERING_PASS; this does not endorse the entire 400+ file PR or establish G0 runtime. Provenance guard test covers source root and nested output; see PR's r9 logs. No Docker run occurred.

## G1 and framework reviews

PR #24 HEAD `5e09e93407f3abd622e73af40c367eabb1a0dd5f`: inspected source-backed packet and selected pinned BEWT feature, Java and suite; independently reran the extractor tests, reproduced identical JSON, and verified 3 Git blob evidence hashes. ENGINEERING_PASS for this packet only; novelty and oracle remain pending human review. One first attempt to create a temp fixture in the sandbox temp directory failed PermissionError; retry using the writable visualization workspace passed.

PR #25 HEAD `ea28d3093dab173d8e93d42a7cf31cec95a1f898`: inspected validator/test diff, independently ran 3/3 focused ledger tests, checked five evidence hashes and reviewed the disclosed initial SQLite integration failure. ENGINEERING_PASS for the budget-ledger change only; G2 remains NOT_VERIFIED and integration evidence is local with a copied matching-version native binding.

PR #26 HEAD `90289e103dde97d3ce70680fa8c16194e64dd0da`: inspected helper and tests; independently reran 29/29 offline tests and verified four normalized Git blob hashes. ENGINEERING_PASS for mount-inventory hardening; original XML and exact Maven command remain missing in a bounded four-worktree search and G0 remains BLOCKED_EVIDENCE.

Branch `task/t04i-address-review` HEAD `34812340917c6bf6d37c48535ce55c828f990dff`: independently inspected order and instore source, reran pinned extractor tests with matching evidence JSON, verified four Git blob hashes. ENGINEERING_PASS for the review packet; actor, oracle and novelty need human decisions. Integration waits for the open-PR phase.

## PR #19 final integration

PR #19 HEAD `c7901908ad8d32cb11c87aeaca3fd45860c20216` passed SonarCloud and was merged as `22d3813bd92cc6ec0c5b2d0d766b6ba3fcb72170`. Independently checked 18 evidence hashes and 255 input blobs for clean builds on tested source `59df094130eadc9d6634d04b70e3b4906bb55bd0`; an additional limited token-pattern scan across 350 changed files had no matches. Post-merge 34/34 focused offline safety tests passed. Automated assertion-line screening found no differences, but cannot establish semantic equivalence; the manual review documents fixture and browser changes. The four G0 runtimes and E2E remain unverified.
