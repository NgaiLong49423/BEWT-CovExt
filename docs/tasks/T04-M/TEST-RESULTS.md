# Verification

- `python docs/tasks/T04-M/tools/verify_review_inputs.py`: PASS exit 0; three v2 input/feature hashes match the exact T04-L Git commit and all six reviewer slots are blank. Evidence `evidence/input-check.json`, `input-check-exit.txt`.
- `python docs/tasks/T04-M/tools/test_review_inputs.py`: PASS exit 0, 7/7 tests; positive binding plus filled/extra reviewer fields, stale metadata, feature tampering, packet hash omission and candidate-set rejection. Evidence `evidence/test-output.txt`, `test-exit.txt`.
- Git, filesystem and static content checks do not establish novelty, oracle correctness, runtime, review independence or policy. No human review and no Docker/email/model/runtime executed.
