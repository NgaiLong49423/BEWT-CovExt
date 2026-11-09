# T04-B-ISOLATION — Keep review-regeneration tests out of the working tree

- Base: `origin/main` `65c3f6ef92d7e4f4fdf202f65b70ed4198929261`; branch `task/t04b-isolate-regeneration`.
- Proposed status: READY_FOR_REVIEW for test isolation only. Commit/PR identifiers are supplied in the handoff.
- Root cause: the T04-B regression test executed the generator with the real repository as cwd. The generator writes the review dataset and five packets there. Checkout line endings affect input byte hashes, and the generated dataset then changes the hash checked by the T04-C audit.
- Change: copy the four inputs into a unique temporary root, invoke the unchanged generator there, assert its candidate hashes and five packets, retain a synthetic ledger sentinel, and verify byte hashes of the real ledger, dataset and five packets remain unchanged. Cleanup targets only the directory created by the test.
- Verification: `node --test docs/tasks/T04-B/test/review-dataset.test.mjs docs/tasks/T04-C/test/g0-audit.test.mjs` exit 0, 20 passed, none failed/skipped; captured in `evidence/node-tests.txt` and `evidence/exit-code.txt`. Both suites ran in the same invocation; no tracked generated artifacts changed. The previously observed intermediate failure and restore are recorded in PR #22 at `docs/tasks/FINAL-P0/TEST-RESULTS.md`.
- No `bewt-original/`, Docker, cloud, provider, candidate decision, or official program status was changed. Pre-existing untracked `experiments/expresscart/bewt-suite/docs/` was preserved. No G0–G4 acceptance is implied.
- Review: inspect the isolation test, evidence and staged diff; do not treat a passing test as a human decision or runtime result.

## Other work in progress

PR #19 HEAD `39f0f4e0b741be0bdc782c958354be42f24df0c0` remains draft. Initial source inspection found `docs/tasks/T03-A1/IMPLEMENTATION-GAP-MATRIX.md` still states PR #12 is open/draft and describes Kanboard G0 as ready for review, while GitHub now reports #12 merged and T04-C identifies unresolved original XML hash and command provenance. Its `G0-RUNTIME-RESULTS.md` correctly says the four-app runtime is NOT_RUN. Reconcile the matrix before using it as current decision evidence; this is a partial review, not an endorsement of the full PR.

Next: independently inspect the rest of #19 and its tests, search for original Kanboard run artifacts, and pursue app runtime only after confirming current runtime policy and ownership.
