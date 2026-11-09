# T05-A ExpressCart Vertical Slice

The source-pinned T01-C shared LangGraph workflow was rechecked offline. Focused tests exercise source-linked input, pause-before-effects, synthetic current-revision ACCEPT as test input, fake Java generation, immutable registration, isolated Maven test-compile, bounded synthetic repair, replay protection and checkpoint resume.

Focused integration: 11/11 PASS. Evidence: evidence/t05a-offline-20261109/focused-offline-integration.txt.

The fake provider and test-only review decision exist only within automated tests. They are not a live Gemini result, human decision, benchmark candidate or acceptance record. No generated study artifact was retained.

Not run:
- Gemini, because no fresh D-C1 authorization or valid local credential was supplied.
- Human review, because no live candidate reached a review packet.
- Gemini Java generation, Docker fixture, Selenium E2E or cleanup.
- Three-run validation or G3 status change.

Next controlled step: after fresh approval, make one bounded generation request against pinned source and stop at actual human review. Java generation requires a real decision bound to the candidate's current revision. Docker execution requires a separate exclusive runtime lease.
