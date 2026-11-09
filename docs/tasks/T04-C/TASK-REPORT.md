# T04-C Task Report — Kanboard G0 Audit and G1 Readiness

## Outcome

**Task status: READY_FOR_TEAM_LEAD_REVIEW.** This task independently audited the existing Kanboard T03-A Run A/B records and checked whether the merged T04-B review inputs are ready for human decisions. It did not rerun Docker, Selenium, Maven, Gemini, or a research experiment.

**Recommendation:** defer Kanboard G0 acceptance as `BLOCKED_EVIDENCE`. Both preserved runs report successful execution, but the recorded original Surefire hashes do not match their corresponding preserved XML, and the exact Maven command was not recorded. No G0/G1 acceptance was written. `docs/program/STATUS.json` remains unchanged.

## Scope and provenance

- Repository branch: `feature/t04c-kanboard-g0-g1-readiness`
- Audit base: `ae149842185877bcd4a97cf99ebdb3fc099e040b` (fetched `origin/main`; the SHA in the task prompt was stale).
- Runtime evidence examined: `t03a-a-20261108-r2`, `t03a-b-20261108-r2`.
- Pinned BEWT source: `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Pinned Kanboard source: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.
- Pinned image: `kanboard/kanboard:v1.2.15@sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e`.

## Findings

1. Both run records describe HTTP 200/login readiness, loopback-only ports, the same image digest, and per-run labels. Each used a separate container/network/three volumes, a 768 MiB memory limit, 256 PID limit and 1.5 CPU limit.
2. Both sanitized Surefire XML files report `tests.AddNewProject`: one test, zero failures/errors/skips. Maven logs include `BUILD SUCCESS`; each sentinel moved from 0 to 1. Run B's pre-test sentinel is zero after Run A teardown.
3. The independently computed LF-normalized XML SHA-256 values differ from their recorded original hashes: Run A `63d0f796…` recorded vs `17fa89bd…` preserved XML; Run B `cd0c77ab…` recorded vs `035f275f…` preserved XML. These mismatches are not explained by CRLF normalization. The exact original Maven command is also absent; the documented command is explicitly reconstructed.
4. Cleanup first pass is recorded PASS for both runs; Run B's repeated cleanup is PASS/idempotent. No repeated-cleanup artifact exists for Run A. The before/after Docker inventory evidence reports unchanged protected resource signatures and stable global counts.
5. The original executions predate the fail-closed cleanup correction. Later offline fault-injection tests cover corrected cleanup behavior, but they do not prove that corrected code ran during the historical executions.
6. Selenium logs warn that CDP implementation matching Chrome 156 was unavailable. The ordinary WebDriver test and assertions nevertheless report PASS. The warning is non-fatal for this run; the ChromeDriver binary/version hash is not pinned, limiting exact reproduction.
7. The T04-B dataset contains the five expected candidates, all `PROPOSED`/`PENDING`; the decision ledger is zero bytes. No acceptance is inferred from technical recommendations.

## Deliverables

- [G0 independent audit](G0-INDEPENDENT-ACCEPTANCE-AUDIT.md)
- [G0 evidence matrix](G0-EVIDENCE-MATRIX.md)
- [G0 recommendation](G0-ACCEPTANCE-RECOMMENDATION.md)
- [Human decision readiness](HUMAN-DECISION-READINESS.md)
- [G1 blocker register](KANBOARD-G1-BLOCKER-REGISTER.md)
- [T05 entry criteria](T05-ENTRY-CRITERIA.md)
- [Test results](TEST-RESULTS.md)
- [Proposed status update](PROPOSED-STATUS-UPDATE.json), proposal only
- [Evidence index](evidence/g0-evidence-index.json)
- [Human-review input integrity](evidence/human-review-input-integrity.json)

## Verification and limits

Offline audit tests and T04-B decision-validator regression tests are reported in `TEST-RESULTS.md`. Tests verify evidence binding and intentionally pass only when the hash discrepancy remains classified as blocked. No live services or Docker resources were touched. No raw/historical evidence, `bewt-original/`, candidate definitions, human decisions, or shared program status were changed.

The audit establishes consistency of stored files as checked at this commit; it cannot reconstruct missing contemporaneous command capture or recover the intended original Surefire bytes. The Team Lead must decide whether an independently archived original artifact can resolve the checksum discrepancy or whether G0 remains deferred pending a separately authorized evidence run.

## Team Lead decisions requested

1. Decide whether G0 acceptance is deferred on the current `BLOCKED_EVIDENCE` record or whether there is contemporaneous source evidence that resolves both Surefire hash mismatches.
2. If human review proceeds, supply actual decision payloads for the five pinned candidates; no record is prepared or appended by this task.
3. Approve any T05 start only after the G0 decision and the candidate/oracle/fixture prerequisites in `T05-ENTRY-CRITERIA.md` are met.
