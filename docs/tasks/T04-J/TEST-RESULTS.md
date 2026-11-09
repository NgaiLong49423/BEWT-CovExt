# Verification

- `python docs/tasks/T04-J/tools/check_cl_group.py`: PASS, exit 0. Uses read-only GitHub API, verifies commit/tree, tree not truncated, path-to-blob identity, recomputed Git blob SHA-1 and source anchors. Output `evidence/source-anchors.json`.
- `python docs/tasks/T04-J/tools/test_cl_group.py`: PASS, exit 0; 5/5 tests covering valid/tampered blob, repeated/missing anchor, wrong tree, truncated tree and missing path. Evidence `evidence/test-output.txt`, `evidence/test-exit.txt`.
- No runtime, G0, oracle validation, novelty decision or human approval occurred. Pattern-based checks are not a comprehensive secret scan.
