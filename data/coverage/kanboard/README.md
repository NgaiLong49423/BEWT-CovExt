# Kanboard Coverage Dataset

Schema version: 1.0. Source status: STATIC_VERIFIED for the pinned inputs only.

## Files

- `inventory.json`: source pins, counts, observed groups and 30 case records: stable case ID, feature path/title/scenario count/line-numbered steps/full SHA-256, cleanup steps, Java path/class/suite order/assertion lines/full SHA-256, imported Page Objects, category, Given preconditions, When actions, Then oracle and review flags.
- `provenance-index.json`: source commits and BEWT tree SHA; hashes for 30 business Java classes, 27 Page Objects, all 30 features, BaseTest and TestSuite; 22 upstream source paths/permalinks/hashes; T03-A working-copy parity.
- `behavior-taxonomy.json`: six groups with observed baseline case IDs; not a completeness claim.
- `gap-candidates.json`: ten candidate records with stable IDs, category, description, pinned upstream file/line references, baseline comparison, preconditions, proposed observable result, novelty rationale, feasibility/risks and pending review state.
- `shortlist.json`: five prioritized candidate IDs, rationale, deferred candidates and pending human review.
- `KANBOARD-BASELINE-MAPPING.md`: human-readable full case mapping with Given/When/Then, separated cleanup, Java assertions, Page Objects, hashes and pinned source links.

## Contract

IDs are unique within each collection. Every case maps one-to-one to a suite class and has 64-character lowercase SHA-256 values. Candidate states are `PROPOSED` or `INSUFFICIENT_EVIDENCE`; human decisions remain `PENDING`. No tool infers novelty from tag/title absence or self-accepts a candidate. Fixture emails/passwords are redacted from published text; source hashes and pinned links preserve traceability. Line numbers are one-based.

The generator is `experiments/kanboard/tools/coverage-inventory.mjs`. It verifies actual Git HEADs and the BEWT tree SHA and confirms each input path is the expected path under the pinned repositories. It writes deterministic JSON and the Markdown mapping. No runtime application execution is implied.
