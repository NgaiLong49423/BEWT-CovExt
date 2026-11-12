# Semantic Oracle Audit

## Result

The audit compared each Revision 2 class's embedded Gherkin steps and oracle with the actual Selenium actions and assertions. **0 of 40 mappings match.** The classifications are 22 `WRONG_BEHAVIOR`, 14 `PARTIALLY_IMPLEMENTED`, and 4 `WEAK_ORACLE`. None is eligible for `VALIDATED` on the current evidence.

The full case-by-case result, source path, source hash, line ranges, mismatch, and raw declared execution outcome are in `40-CASE-TRACEABILITY.json`.

## Confirmed critical cases

| Candidate | Required behavior | Actual behavior | Finding |
|---|---|---|---|
| EC-GAP-002 | Reject quantity above stock and preserve quantity with a specific error | Adds one product and checks cart count is at least one | Wrong behavior |
| EC-GAP-003 | Save shipping address and verify checkout prefill | Opens checkout after adding an item | Wrong behavior |
| BL-GAP-002 | Select cover image, persist selection, render it publicly | Creates content and checks a generic row/container | Weak oracle |
| JO-GAP-004 | Edit article and verify version/history increments | Reads category/listing state | Wrong behavior |
| PS-GAP-003 | Complete payment/order and verify stock decrement | Creates admin order with excessive quantity and expects an error | Opposite behavior |

The same defect appears across all eight applications: visible UI elements or generic text often replace the specified business transition. The anti-trivial gate rejects selected placeholder patterns but does not compare actions and assertions to the candidate's scenario/oracle.

## Remediation boundary

The current human records authorize attempts to implement candidates but do not approve semantic novelty or the business oracle. For each candidate, the appropriate next step is a source-backed reviewer packet. If the reviewer confirms the oracle and pinned application behavior, preserve Revision 2 and register a new immutable revision with explicit setup, actions, exact postconditions, and cleanup. If the proposal is unsupported by the pinned app, return it for revision or rejection; do not silently rewrite the Gherkin oracle.

No production application behavior was changed. No E2E rerun was performed in this audit.
