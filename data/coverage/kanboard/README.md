# Kanboard Coverage Dataset

Inventory and provenance schema version: 1.1. The dataset is `STATIC_VERIFIED` only for the exact pinned BEWT and Kanboard source inputs stated in the manifests. This is a static inventory, not runtime or research acceptance.

## Files

- `inventory.json`: source pins, exact source-integrity counts, 30 mappings, observed behavior groups, raw scenario titles, separate observed-behavior interpretations for KB-023/KB-026, case-level redaction semantics, line-numbered steps, Java assertion lines, imported Page Objects, taxonomy and review flags.
- `provenance-index.json`: source commits/tree; Git blob IDs and SHA-256 for every verified BEWT input and cited upstream input; hashes for 30 business Java classes, 27 Page Objects, all 30 features, BaseTest and TestSuite; and the redaction policy.
- `behavior-taxonomy.json`: six groups with observed baseline case IDs; not a completeness claim.
- `gap-candidates.json`: ten candidate records with stable IDs, category, description, pinned upstream references, baseline comparison, preconditions, proposed observable result, novelty rationale, feasibility/risks and pending review state. KB-GAP-004 adds actor-role, target-membership, stable-fixture and permission-boundary requirements plus a separate engineering recommendation.
- `shortlist.json`: five prioritized candidate IDs, rationale, deferred candidates and pending human review.
- `KANBOARD-BASELINE-MAPPING.md`: human-readable full mapping with raw titles, separately stated observed behavior where needed, Given/When/Then, cleanup, Java assertions, Page Objects, hashes and source links.

## Redaction contract

Only password values entered into a password/confirmation form and email literals used as email fixtures are replaced. Gherkin validation messages, public oracles, and assertion predicates remain intact. Email fixtures use per-case `@example.invalid` placeholders; `logicalFixtureId` and occurrence paths show that the same fixture value appears in setup and the corresponding Java equality assertion. Java string quotes and assertion invocation structure are preserved. Each transformation is recorded at `cases[].redactionSemantics`, `gherkin.redactions`, and assertion-level `redactions`. SHA-256 and Git blob provenance refer to the original pinned source bytes, not transformed text.

Raw titles for KB-023 and KB-026 remain unchanged. `behaviorInterpretation` records their actual observed behavior based on feature oracle and Java assertion; this metadata does not alter the six-group taxonomy or 30-case denominator.

## Integrity and generation

`experiments/kanboard/tools/coverage-inventory.mjs` verifies the repository HEAD and tree pins, rejects symlinked input paths, compares tracked inputs with the pinned commit, and reads authoritative input bytes from the Git object database. A dirty tracked input, missing input, or pin mismatch prevents `STATIC_VERIFIED`. The generator emits deterministic JSON and the Markdown mapping. Run details and review-fix evidence are under `docs/tasks/T04-A/evidence/review-fixes/`.

Candidate states remain `PROPOSED`; review decisions remain `PENDING`. No runtime application execution, novelty decision, G1 acceptance, or T04-B implementation is implied.
