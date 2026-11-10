# Test results

- `node docs/tasks/T04-L/tools/validate_gherkin.mjs <framework-directory>`: exit 0; three v2 features parsed as one scenario each with Cucumber Gherkin 42.0.1 and Messages 34.2.1. `evidence/gherkin-parse.txt`, `gherkin-parse-exit.txt`. Parser was loaded from an existing local framework install; rerun requires those pinned packages installed in a framework directory.
- `python docs/tasks/T04-L/tools/verify_revisions.py`: exit 0; three v1 lineage and three feature hashes bound to the exact copied receipt, with no approvals. `evidence/lineage-verification.json`, `lineage-exit.txt`.
- `python docs/tasks/T04-L/tools/test_verify_revisions.py`: exit 0, 6/6 PASS. Checks valid lineage, modified receipt and feature, unauthorized approval, wrong v1 hash and source-pin mismatch. `evidence/test-output.txt`, `test-exit.txt`.
- These checks establish syntax and record integrity only; semantic validity, novelty, runtime, actual email isolation and scientific acceptance remain NOT_VERIFIED or NOT_RUN.
