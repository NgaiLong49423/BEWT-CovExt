# T01-A — Existing Code Reuse Matrix

Classification: `REUSE_AS_IS`, `EXTRACT_SHARED`, `ADAPT`, `DEPRECATE_LATER`, `NOT_IMPLEMENTED`.

| Existing capability | Actual source / symbol | Classification | T01-A decision |
|---|---|---|---|
| LangGraph proposal workflow | `experiments/expresscart/agent/src/workflow.ts`: `RunState`, `State`, `graph`, `runAgent` | `ADAPT` | Reuse the proven node/state pattern, but replace ExpressCart-only state and `collect → propose → record` with reviewed role contracts. It has no configured checkpointer or runtime human interrupt. |
| Sanitized baseline collection | `experiments/expresscart/agent/src/collector.ts`: `collectBaseline`, `safeTestSummary`, `safeFeatureSummary`, `sanitizeLabel` | `EXTRACT_SHARED` | Keep privacy filters and summary-only model input. Move filesystem roots and app-specific collectors behind adapters; original Gherkin is read from ignored `bewt-original/`. |
| Candidate and human decision schemas | `experiments/expresscart/agent/src/schema.ts`: `CandidateSchema`, `CandidateSetSchema`, `ReviewSchema` | `EXTRACT_SHARED` | Reuse Zod/structural-validation conventions, extending records with app/source pins, revision, preconditions, oracle, reviewer timestamp/reason and evidence provenance. T01-A uses dependency-free runtime parsers; no dependency was added. |
| Gherkin parser and similarity hint | `experiments/expresscart/agent/src/validate.ts`: `toGherkin`, `checkCandidates` | `ADAPT` | Preserve parser validation. Lexical overlap and substring evidence checks are hints, not semantic novelty or oracle validation. |
| Gemini structured-output configuration | `workflow.ts`, `sprint03-generator.ts`, repair scripts import `ChatGoogleGenerativeAI` | `EXTRACT_SHARED` | Retain provider adapter, model configuration and usage telemetry; keep credentials/provider behavior outside app contracts. No real Gemini call in T01-A. |
| Java/Selenium generation | `experiments/expresscart/agent/src/sprint03-generator.ts`: `generate_java`, `record_manifest` nodes | `ADAPT` | Reuse structured generation and immutable prompt/response artifacts. Require approval policy and an app adapter instead of hard-coded candidate maps, suite paths and selectors. |
| Compile and source repair | `sprint03-repair.ts`, `sprint03-repair2.ts`, `sprint03-langgraph-repair.ts`, `sprint03-langgraph-repair2.ts` | `EXTRACT_SHARED` | Reuse error classification, evidence-grounded prompts and maximum-two-repair ceiling. Consolidate into Validation & Repair; scripts currently have hard-coded classes/candidates and side effects. |
| Gherkin parser unit tests | `experiments/expresscart/agent/test/validate.test.ts` | `REUSE_AS_IS` | Leave historical pilot tests unchanged. New cross-app contract tests are separate at `framework/test/contracts.test.ts`. |
| ExpressCart Maven suite and Page Objects | `experiments/expresscart/bewt-suite/pom.xml`, `src/test/java/tests/BaseTest.java`, `src/main/java/po/` | `ADAPT` | Keep as one app-specific implementation and future vertical-slice adapter. Do not move or rewrite in T01-A. |
| Other seven app runtimes/manifests/adapters | No tracked `config/apps`, `adapters`, or `extension` inventory found at T00 | `NOT_IMPLEMENTED` | T02/T03 provision and audit these one app at a time; not part of T01-A. |
| Existing static Docker evidence and reset policy | `experiments/expresscart/compose.yaml`, `SOURCE-LOCK.json`, `evidence/runtime-manifest.json` | `REUSE_AS_IS` | Preserve as historical ExpressCart provenance. T01-A starts no containers and does not change runtime data. |
| Old standalone ExpressCart generation/repair entrypoints | `experiments/expresscart/agent/src/sprint03-*.ts` | `DEPRECATE_LATER` | Do not delete or rewrite. After T01-B parity is proven, propose a separate retirement plan while preserving historical artifacts. |

## New boundary added in T01-A

`framework/src/contracts.ts` provides cross-app records and fail-closed parsers; `framework/src/policy.ts` provides state/approval/tool policy. Neither imports a file from `experiments/expresscart/`.
