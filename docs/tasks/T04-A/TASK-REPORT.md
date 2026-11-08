# T04-A Task Report

## Outcome

Static Kanboard behavioral inventory and G1 candidate preparation are complete. No Docker, Selenium, browser, Gemini, or application runtime was run. All candidate decisions remain pending human review; G1 is not accepted.

## Verified source inputs

- BEWT repository: https://github.com/OlianasD/BEWT
- BEWT commit: `0501249ff3e9a5ea83a06155cd2971dc36197056`
- BEWT commit tree: `d38fcc0eae8073023c48bb46998741c8c19d4d06`
- Kanboard upstream commit: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`
- 30 Gherkin features; 30 business test classes; 32 files including BaseTest and TestSuite; 30 suite entries; 27 Page Objects.
- All 30 business tests map one-to-one to Gherkin basenames and TestSuite entries. Hash comparison against T03-A working copy: 30/30 Java business tests and 27/27 Page Objects matched.
- Six behavior groups; 43 Java assertion lines; 17 distinct Page Objects imported by the business tests.

Full mapping: [KANBOARD-BASELINE-MAPPING.md](KANBOARD-BASELINE-MAPPING.md). Structured data and provenance: [inventory.json](../../../data/coverage/kanboard/inventory.json), [gap-candidates.json](../../../data/coverage/kanboard/gap-candidates.json), [shortlist.json](../../../data/coverage/kanboard/shortlist.json), and [provenance-index.json](../../../data/coverage/kanboard/provenance-index.json).

## Candidate preparation

Ten source-backed proposals are recorded; five are prioritized for review. All are `PROPOSED`, not accepted. Novelty is not determined by missing titles/tags. No Kanboard-specific record was found in `docs/research-results/final/`; that absence does not prove semantic novelty or exclude overlap elsewhere. Two baseline feature titles conflict with their Java tests, and eleven source Gherkin steps contain the typo `clicks thre`; the mapping records these as review flags without altering source.

## Tooling and verification

The deterministic generator verifies actual Git HEAD and the BEWT tree SHA, uses root-confined real paths, hashes source files, redacts credential/email literals from published Gherkin/Java assertion text, and emits JSON plus the complete mapping table. Utility tests: PASS 7/7. JSON parse, reproducibility, source hash parity, mapping consistency, diff check and secret scan are reported in [TEST-RESULTS.md](TEST-RESULTS.md) and [source-recovery evidence](evidence/source-recovery/SOURCE-RECOVERY-REPORT.md).

## Governance

Shared `docs/program/STATUS.json` was not changed because T03-B is parallel work. Proposed state is in [PROPOSED-STATUS-UPDATE.json](PROPOSED-STATUS-UPDATE.json). No G1/G2/G3/G4 or D1-D8 gate is accepted. T04-B has not started.
