# Verification

- Initial extraction: FAIL, exit 1. The tool assumed an address-assignment anchor was unique; it occurs in more than one handler. `evidence/initial-attempt.txt` records the cause. The corrected tool records every match for contextual review.
- Corrected `python docs/tasks/T04-I/tools/check_ec_address.py <app-git-root>`: PASS, exit 0; six pinned source blob hashes and source anchors in `evidence/source-anchors.json`.
- `python docs/tasks/T04-I/tools/test_ec_address.py <app-git-root>`: PASS, exit 0. Five grouped checks cover repeatability, expected source file set, hash shape, nonempty source anchors, review-status boundary and missing-source rejection. These checks do not exercise ExpressCart behavior or establish an oracle.
- Docker, cloud, provider, browser, email, E2E and business review: NOT_RUN.
