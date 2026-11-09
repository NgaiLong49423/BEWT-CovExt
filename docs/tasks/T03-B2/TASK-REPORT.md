# T03-B2 — Claroline 1.11.10 G0 Runtime Verification

- Task scope / acceptance gate: Isolated Claroline G0 feasibility, source/image provenance, baseline compilation and safe runtime harness; no G1–G4.
- Base branch + base SHA: `main` — `464d9e2fb5d1a3705d1d7d6f4dc9a2782bde4a1d`.
- Working branch: `feature/t03b2-claroline-g0`.
- Previous implementation commit: `58618c758f4ed3ef4b1e43493d51a1a61ebb0cf9` (harness, suite, evidence and initial report).
- Head commit (full 40-char SHA): this report update follows the implementation commit; see the final verified HEAD SHA in PR #9 and the handoff.
- PR: [https://github.com/NgaiLong49423/BEWT-CovExt/pull/9](https://github.com/NgaiLong49423/BEWT-CovExt/pull/9).
- Push status: `PUSHED`; final branch, remote ref, and PR head are verified together after this report update.
- Runtime/commit/version tested: BEWT suite copied from commit `0501249ff3e9a5ea83a06155cd2971dc36197056`; Claroline 1.11.10 source commit not verified; app image digest pinned to `sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af`.
- Status proposed by Agent: `PARTIAL` / provenance `PROVENANCE_BLOCKED`; runtime `NOT_RUN` because the latest user-authorized RAM check measured 3.64 GiB free (<4 GiB preflight requirement) and the Docker Desktop engine pipe was unavailable.

## 1. What changed

| File path (repo-relative) | Change | Why |
|---|---|---|
| `experiments/claroline/bewt-suite/` | Isolated 75-file baseline suite; only `BaseTest.java` environment adaptation | Retain baseline oracle while supporting remote headless Selenium |
| `experiments/claroline/tools/` | Pinned-run helpers, fail-closed partial-start cleanup, write-once wrapper, runtime harness, explicit signed-tool/path policy | Reproducible, ownership-safe, and avoids PATH search in child processes |
| `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | Cleanup fault injection and Surefire/run identity/sanitization tests | Verify failure paths without touching Docker |
| `docs/tasks/T03-B2/` | Provenance, image risk, preflight, adaptation, cleanup and partial result reports | Preserve auditable current state and limitations |
| `docs/tasks/T03-B2/evidence/preflight-image-20261109/` | Image-only inspection and preflight resource evidence | Preserve actual read-only image inspection and stopped-container cleanup records |
| `.gitignore` | Narrow allow rule for T03-B2 sanitized evidence `.log` files | Allow sanitized future Maven output while retaining general log ignore |

No official `config/apps/claroline.json` was added: current parser requires a verified full source Git commit. The existing draft is not promoted.

## 2. Actual verification

| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| Six Node `--check` commands | 0 | PASS | `docs/tasks/T03-B2/evidence/offline-verification-20261109-r7/node-syntax-check.json` |
| Six Node `--check` commands | 0 | PASS | [syntax checks](evidence/offline-verification-20261109-r8/node-syntax-check.log) |
| `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` | 0 | PASS — 18 passed, 0 failed | [fault tests](evidence/offline-verification-20261109-r8/node-fault-tests.log) |
| `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile` | 0 | PASS — 22 main + 42 test sources using fixed child PATH | [Maven compile log](evidence/offline-verification-20261109-r7/maven-test-compile.log) |
| In-memory `parseApplicationManifest()` with pinned image and `source.commit=NOT_VERIFIED` | 0 | PASS — parser rejected with full 40-character Git SHA requirement | [parser negative check](evidence/offline-verification-20261109-r2/manifest-parser-negative.json); `framework/src/contracts.ts` unchanged |
| Docker image pull/inspect and stopped preflight container inspection | 0 | PASS — image identity and metadata recorded | [image preflight evidence](evidence/preflight-image-20261109/) |
| Read-only Docker CLI/RAM preflight after last check | 1 for Docker daemon query; RAM query 0 | BLOCKED — daemon pipe unavailable; free RAM 3.64 GiB | [preflight result](evidence/offline-verification-20261109-r7/docker-and-memory-preflight.json) |
| Runtime A/B and Selenium | — | NOT_RUN — latest free RAM 3.64 GiB (<4 GiB) and daemon pipe unavailable | [runtime status](G0-RUNTIME-RESULTS.md) |

## 3. Research impact

- Apps affected: Claroline feasibility setup only. The BEWT upstream test source is not an independently verified Claroline release archive.
- Candidate statuses before → proposed after: Claroline remains draft/provenance-blocked; no candidate or research metric is promoted.
- RQ1/RQ2/RQ3/RQ4 measurable changes: none; no runtime test data collected.
- Gate status before → proposed after: no acceptance change; proposed Claroline status is `PROVENANCE_BLOCKED`, runtime `NOT_RUN`.
- Dataset/metrics artifacts updated: none.
- Denominator and sampling caveats: no runtime sample; compilation and fault-injection tests are not application outcome observations.

## 4. Safety & integrity

- `bewt-original/` touched? NO. Exact BEWT source was fetched to a temporary location and copied into the isolated working copy; original research source remains read-only.
- Docker/project resources touched? One preflight-only Claroline container was created stopped with unique task labels and no mounts/network, inspected, removed, and confirmed absent by exact NOT_FOUND follow-up. App/Selenium service containers were NOT started. No other Docker resources were removed.
- Final read-only T03-B2 ownership scan: zero containers, networks, or volumes; evidence is `docs/tasks/T03-B2/evidence/preflight-image-20261109/final-resource-scan.json`.
- Existing unrelated local dirty files preserved? YES; this is a dedicated clean task worktree.
- Secret scan / staged diff review result: pending final review; runner sanitizes local paths, fixture-like secret strings, Surefire properties and console output. No credentials are stored in the evidence.
- Failed/blocked tasks: runtime A/B is BLOCKED by the measured RAM gate; parser-valid manifest is BLOCKED by missing verified source commit/archive bytes.

## 5. Evidence and reproduction

- Source/test paths: `experiments/claroline/bewt-suite/src/test/java/test/Claroline_AddUserTest.java`, `experiments/claroline/tools/`, `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`; [baseline source comparison](evidence/offline-verification-20261109-r3/baseline-source-comparison.json).
- Raw run/log/XML/screenshot paths: none for runtime; no Maven/Selenium outcome log was fabricated. Final offline Node logs are under `docs/tasks/T03-B2/evidence/offline-verification-20261109-r8/`; Maven compile and RAM/daemon preflight logs are under `docs/tasks/T03-B2/evidence/offline-verification-20261109-r7/`; image preflight is under `docs/tasks/T03-B2/evidence/preflight-image-20261109/`.
- Fixture/database before/after and cleanup: no app database was started. Preflight-container cleanup evidence is retained with its initial blocked checker record and exact NOT_FOUND follow-up.
- Reproducible commands: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`; Maven `mvn -B -f experiments/claroline/bewt-suite/pom.xml clean test-compile`; runtime requires a fresh never-used `t03b2-<letter>-YYYYMMDD-rN` ID and ≥4 GiB free memory.
- Known limitations: Both official SourceForge archive candidate hashes are recorded; runtime image-to-archive match and upstream Claroline Git commit remain unverified; runtime and DB reset not evaluated; image is legacy and has unknown build provenance.

## 6. Review request

- Team Lead decisions: approve/decline the proposed archive-based source provenance contract separately; review whether to defer runtime until adequate host memory and archive/source provenance are available.
- Suggested next task if accepted: resolve source provenance and rerun the isolated G0 runtime with two independent clean states, then request review; do not infer G0 acceptance from compilation.
- GitHub PR diff URL: [PR #9 diff](https://github.com/NgaiLong49423/BEWT-CovExt/pull/9/files). Main review paths: `experiments/claroline/tools/run-claroline-g0.mjs`, `experiments/claroline/tools/cleanup-claroline-g0.mjs`, `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs`, `docs/tasks/T03-B2/CLAROLINE-SOURCE-PROVENANCE.md`, and `docs/tasks/T03-B2/G0-RUNTIME-RESULTS.md`.

## Review follow-up — 2026-11-09

- Narrow SonarCloud security follow-up: removed inherited `TEMP`/`TMP` from the child-process allowlist and shared Docker/Maven environment. The targeted test now asserts both variables are absent in both child environments. This avoids forwarding host-configured shared temporary paths; Windows temp resolution can fall back to `USERPROFILE`.
- Verification: six syntax checks PASS; 18 cleanup/fault-injection tests PASS; Maven `clean test-compile` PASS (22 main and 42 test sources) with `TEMP`/`TMP` omitted. Sanitized logs and SHA-256 metadata: `evidence/offline-verification-20261109-r9/`.
- Latest read-only runtime gate recheck: 2.35 GiB free of 13.79 GiB and Docker daemon query exit 1 because `desktop-linux` pipe is absent. No Docker resources were changed. Runtime A/B remains `NOT_RUN`; source provenance remains `PROVENANCE_BLOCKED`.
- SonarCloud Quality Gate was verified PASS on code HEAD `0e98de03ae44c4e56760fa52cc5cd242b54a44ef`, with 0 new issues and 0 security hotspots. This result applies to that exact code commit.

## Provenance and gate follow-up — 2026-11-09

- Retrieved both official SourceForge archives twice over HTTPS. The byte counts and SHA-256 values matched across each pair; gzip and tar listing checks passed. Only metadata is retained; temporary archive files were removed. Details: `evidence/offline-verification-20261109-r10/source-archive-verification.json`.
- The two candidate archive hashes do not prove which release variant the pinned image contains. No Git commit was verified, and the parser still cannot represent archive-only provenance. Claroline remains `PROVENANCE_BLOCKED`; no runtime manifest was promoted.
- Latest read-only runtime preflight: 2.98 GiB free of 13.79 GiB; Docker daemon query exit 1 because the `desktop-linux` named pipe is unavailable. No Docker resources changed. Runs A/B remain `NOT_RUN`; evidence: `evidence/offline-verification-20261109-r10/runtime-preflight.json`.