# Verification

- `python docs/tasks/T04-K/tools/verify_batch.py`: PASS exit 0; exact source file and canonical candidate hashes checked for three inputs, packet objects exist. Output `evidence/input-verification.json`. Packet contents, scientific claims and human reviewer identity are not validated by this check.
- `python docs/tasks/T04-K/tools/test_verify_batch.py`: PASS exit 0, 5/5 tests; missing-packet negative test intentionally emits a Git error. Output `evidence/test-output.txt`, exit `evidence/test-exit.txt`.
- Human decisions and runtime checks NOT_RUN. Pattern scan is limited, not a comprehensive secret scan.
