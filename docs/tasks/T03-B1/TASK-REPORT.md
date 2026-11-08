# T03-B1 — Bludit 2.3.4 G0 Runtime Verification

- Task scope / acceptance gate: Bludit 2.3.4 G0 only.
- Base branch + base SHA: `main` / `f1b22548fd37f577638856bcc9707c79cf288bc1`.
- Working branch: `feature/t03b1-bludit-g0`.
- Initial implementation commit (full SHA): `f9521c34d473b04c729bdf0a051bc605a8d759e8`; this PR branch also contains the report metadata update.
- PR: [#7](https://github.com/NgaiLong49423/BEWT-CovExt/pull/7) — separate PR to `main`.
- Push status: `PUSHED`; verify the live PR head before review.
- Runtime/commit/version tested: Bludit `2.3.4`, image `bludit/docker:2.3.4@sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9`; BEWT source commit `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Status proposed by Agent: `READY_FOR_REVIEW` for G0 only. No `ACCEPTED` or `VALIDATED` claim.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `config/apps/bludit.json` | Promoted the verified Bludit runtime manifest with immutable registry digest and observed nginx runtime. | Enable parser-validated app configuration. |
| `experiments/bludit/bewt-suite/` | Working copy from the pinned BEWT suite; only `BaseTest.java` changed for app URL, environment password, and remote WebDriver. | Run original Installer and business Base test against isolated containers. |
| `experiments/bludit/tools/` | Added manifest promotion, Docker ownership/cleanup helpers, fault-injection tests, and repeatable G0 runner. | Fail-closed cleanup and reproducible execution. |
| `docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs` | Active isolation test now expects multiple valid runtime manifests. Historical TAP/JSON evidence was not regenerated. | Permit the Bludit runtime manifest while retaining draft and duplicate rejection. |
| `docs/tasks/T03-B1/` | Added G0 report, provenance, preflight, adaptation, run outcomes, cleanup, test results, status proposal, and sanitized evidence. | Reviewable handoff with source links and run evidence. |

## 2. Actual verification

| Exact command | Exit code | Outcome | Evidence |
|---|---:|---|---|
| `mvn -B -f experiments/bludit/bewt-suite/pom.xml clean test-compile` | 0 | PASS; 17 production + 26 test source files compiled | [Maven compile log](evidence/verification/maven-clean-test-compile.log) |
| `node --experimental-strip-types --test experiments/bludit/tools/test/bludit-g0.test.mjs experiments/bludit/tools/test/cleanup-bludit-g0.test.mjs` | 0 | PASS; 17 tests after review corrections | [Final Node results](evidence/final-review-fixes-20261109/node-tests-final-after-fixture-fix.txt) |
| `node --experimental-strip-types --test docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs` | 0 | PASS; 3 tests | [T02 isolation results](evidence/verification/active-t02-isolation-tests.txt) |
| Run A: original `tests.Installer` then `tests.AddContentTest` | 0 / 0 | PASS; each 1 test, 0 failures/errors/skips; sentinel absent → present; cleanup PASS | [Run A evidence](evidence/t03b1-a-20261108-r4/) |
| Run B: original `tests.Installer` then `tests.AddContentTest` | 0 / 0 | PASS; each 1 test, 0 failures/errors/skips; sentinel absent → present; cleanup PASS | [Run B evidence](evidence/t03b1-b-20261108-r1/) |

Each Maven invocation and exit code is recorded in the run-specific `maven-command-results.json`; Maven stdout/stderr and sanitized JUnit XML are linked from the same run. Both runs used a separate app/browser/network set and fresh writable layer. `parseApplicationManifest()` validation is part of the 17-test final suite.

## 3. Research impact

- Apps affected: Bludit only; benchmark Base `2.3.4`; source commits and image digest are in [provenance](BLUDIT-SOURCE-AND-IMAGE-PROVENANCE.md).
- Candidate IDs/status: none; no G1–G4 work.
- RQ1/RQ2/RQ4: NOT_EVALUATED.
- RQ3: G0 environment and original Base smoke are ready for Team Lead review; no new cases were implemented or validated.
- Gate status before → proposed after: G0 `NOT_VERIFIED` → `READY_FOR_REVIEW`; G1–G4 remain `NOT_VERIFIED`.
- `docs/program/STATUS.json` and roadmap were not changed. Proposed-only snapshot: [PROPOSED-STATUS-UPDATE.json](PROPOSED-STATUS-UPDATE.json).

## 4. Safety and integrity

- `bewt-original/` touched: NO. The selected source suite was clean before copy; only its working copy changed.
- Docker resources: only two run-owned app containers, two run-owned Selenium containers, and two run-owned networks were created and removed. No volumes were declared; no unrelated resource was removed. Pre/post inventories and Docker events are preserved per run.
- Docker actions: pulled the pinned Bludit image and Selenium helper image; no global prune, no fixed host port, no LAN exposure.
- T01-C, framework, ExpressCart, original BEWT source, `STATUS.json`, and roadmap: no changes.
- Secrets: the test password was random and process-only; no password/token/API key was written to Git evidence. Raw Surefire XML copies remain local and are not staged; sanitized XML is staged with original hashes.
- Source/image equivalence is not claimed. The upstream GitHub remote-ref check was blocked by DNS; the pinned source commit came from the task input and the runtime version was observed in-container.

## 5. Evidence and reproduction

- Runtime manifest/parser: [config/apps/bludit.json](../../../config/apps/bludit.json), copied with SHA-256 into both run directories.
- Source diff and tree comparison: [BaseTest-adaptation.diff](evidence/BaseTest-adaptation.diff), [source-tree-comparison.json](evidence/source-tree-comparison.json).
- Raw run outputs: the final A/B evidence directories contain Maven logs, sanitized Surefire XML, original XML hashes, runtime manifest copies, HTTP sentinel state, ownership records, Docker events, before/after inventories, and cleanup results.
- Reproduction: `powershell -NoProfile -ExecutionPolicy Bypass -File experiments/bludit/tools/run-bludit-g0.ps1 -RunId <new-unique-run-id>` with Docker Desktop running; it creates only labeled resources and requires `BLUDIT_TEST_PASSWORD` only inside the process.
- Known limitations: image publisher does not provide a source attestation here; remote GitHub tag lookup was unavailable. The two clean runs establish G0 smoke/reset evidence, not all-suite compatibility, G1–G4, or research validation.

## 6. Review request

Please review the runtime manifest, source adaptation, fail-closed cleanup implementation/tests, Run A/B raw logs and sanitized JUnit, sentinel before/after, and Docker pre/post comparisons. No merge is requested by the agent; no T03-B2 work is included.


## Final review corrections

The final review findings were corrected and verified. See [FINAL-REVIEW-CORRECTIONS.md](FINAL-REVIEW-CORRECTIONS.md) for the immutable Run C attempt history, final r3 evidence, 17-case fault-injection results, Maven verification, and safety checks. Historical Run A/B outcome files were not modified.