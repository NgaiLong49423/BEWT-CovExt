# Review Rubric

For each proposed candidate, reviewers should:

1. Confirm the pinned upstream source implements the described behavior and inspect the cited line ranges.
2. Compare semantics against all 30 cases, especially related baseline assertions and the two title/assertion conflicts.
3. Inspect historical Sprint 01-05 evidence and other project records; absent Kanboard labels do not establish novelty.
4. Decide whether the expected result is observable and stable through the UI.
5. Specify actor permissions, fixture identity, reset/cleanup, and repeatability.
6. Assess Selenium locator and interaction risks (notably drag/drop, AJAX and date/time).
7. Keep one coherent behavior per candidate; do not split behavior only to reach a target count.

Team Lead should record ACCEPT, REVISE, or REJECT and rationale in the review packet. ACCEPT permits implementation planning only. It is not VALIDATED, G1 PASS, or research acceptance. No human decision was created in T04-A.
