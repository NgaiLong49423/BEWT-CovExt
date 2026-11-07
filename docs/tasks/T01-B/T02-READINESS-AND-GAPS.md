# T02 Readiness and Gaps

T01-B is ready for independent review, but this document does not authorize T02. The research objective remains 8 applications and a 40 new-case target.

## Proven in T01-B

- Shared LangGraph role graph and explicit review/validation routing.
- SQLite checkpoint recovery after the first process exits.
- Current-run ACCEPT gate, append-only REVISE history, new checkpoint per revision, replay/thread/checkpoint protections.
- Fixed dispatcher, path traversal/junction checks, candidate/class/artifact binding, exact source/app pins, bounded repair logic.
- One real EC-C04 compile + isolated fixture + Selenium/JUnit PASS + owned cleanup PASS, using reused Java artifact.
- Dedicated Node process kill after real fixture preflight, SQLite checkpoint replay in a new process, safe cleanup of the prior invocation, and a fresh actual E2E PASS. The stopped invocation and replay invocation have distinct IDs and append-only evidence.
- Nested evidence discovery is invocation-scoped, rejects traversal, skips symlink/junction entries and does not mix invocation references.
- Framework build, 21 unit tests, 15 regular integration tests, the separate crash/replay integration test (1/1), and five legacy ExpressCart Agent unit tests PASS.

## Required before research validation and T02

1. Independent review of T01-B commit; agent must not self-accept G2/D1 or any research gate.
2. Oracle and novelty decisions based on protocol evidence; current run has both `UNVERIFIED`.
3. Three distinct repeat invocations with verified reset/cleanup and source/version pins; current successful run has zero repeats, so technical eligibility stays `UNVERIFIED`.
4. Decide/authorize a real Gemini run, model, quota and token budget. This task made zero Gemini calls; no model-generated Java was tested.
5. Validate remaining seven app adapters/source pins and develop the cross-app plan without reducing 8×5 scope.
6. Verify original BEWT source/data mapping and research baseline provenance under read-only rules; no original checkout was modified or imported into the runtime.
7. Continue review of Docker image provenance: source build context and local IDs are recorded; registry digests remain unverified.

## Risks and follow-up

Earlier runs exposed driver/browser mismatch. The final adapter selects a driver only when its version matches an installed browser version manifest; crash-replay JUnit proves Chrome 156 and driver 156 executed. Selenium still emitted a CDP implementation warning for Chrome 156 although the JUnit case passed. Add deterministic tests around installed-browser manifest selection before broadening adapters. The current OS-principal hash is a local CLI identity boundary, not enterprise authentication. Symlink checks passed but concurrent filesystem replacement/race behavior was not stress-tested. Recovery was tested for an OS process termination only, not host reboot, power loss, Docker daemon crash or filesystem corruption. `npm ci` also reports install-script policy notices for `better-sqlite3` and `esbuild`; clean-machine install reproducibility remains to be independently confirmed.

Do not label this reused-artifact E2E as proof of Gemini generation or a `VALIDATED` benchmark case. Wait for Team Lead/ChatGPT review before starting T02.
