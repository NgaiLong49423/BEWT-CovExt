# T02 Readiness and Gaps

T01-B is ready for independent review, but this document does not authorize T02. The research objective remains 8 applications and a 40 new-case target.

## Proven in T01-B

- Shared LangGraph role graph and explicit review/validation routing.
- SQLite checkpoint recovery after the first process exits.
- Current-run ACCEPT gate, append-only REVISE history, new checkpoint per revision, replay/thread/checkpoint protections.
- Fixed dispatcher, path traversal/junction checks, candidate/class/artifact binding, exact source/app pins, bounded repair logic.
- One real EC-C04 compile + isolated fixture + Selenium/JUnit PASS + owned cleanup PASS, using reused Java artifact.
- Framework build, 21 unit tests, 13 integration tests, and five legacy ExpressCart Agent unit tests PASS.

## Required before research validation and T02

1. Independent review of T01-B commit; agent must not self-accept G2/D1 or any research gate.
2. Oracle and novelty decisions based on protocol evidence; current run has both `UNVERIFIED`.
3. Three distinct repeat invocations with verified reset/cleanup and source/version pins; current successful run has zero repeats, so technical eligibility stays `UNVERIFIED`.
4. Decide/authorize a real Gemini run, model, quota and token budget. This task made zero Gemini calls; no model-generated Java was tested.
5. Validate remaining seven app adapters/source pins and develop the cross-app plan without reducing 8×5 scope.
6. Verify original BEWT source/data mapping and research baseline provenance under read-only rules; no original checkout was modified or imported into the runtime.
7. Continue review of Docker image provenance: source build context and local IDs are recorded; registry digests remain unverified.

## Risks and follow-up

Earlier runs exposed driver/browser mismatch. The final adapter selects a driver only when its version matches an installed browser version manifest; final run JUnit proves Chrome 156 and driver 156 executed. Add deterministic tests around installed-browser manifest selection before broadening adapters. The current OS-principal hash is a local CLI identity boundary, not enterprise authentication. Symlink checks passed but concurrent filesystem replacement/race behavior was not stress-tested.

Do not label this reused-artifact E2E as proof of Gemini generation or a `VALIDATED` benchmark case. Wait for Team Lead/ChatGPT review before starting T02.
