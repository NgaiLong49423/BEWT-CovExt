# EC-C03 cleanup contract proposal

**Decision status remains `REVISE`.** This is a Team Lead review package, not an ACCEPT decision or an E2E result.

The Gherkin scenario contains only the product publication behavior. Cleanup is a mandatory test-fixture teardown and must run even when a behavior assertion fails. Before implementation, register teardown using JUnit `@After` (or an equivalent `try/finally`) and retain the unique fixture title and ID from setup.

Required teardown sequence:

1. Navigate through the admin UI to the exact fixture identified by its run-specific title and ID.
2. If the fixture exists and is unpublished, restore its published checkbox through the UI and save.
3. In a `finally` path, delete only that exact fixture through the UI, including the upstream native confirmation dialog.
4. Verify the exact fixture is absent from the admin product list. Record cleanup success or failure separately from the primary assertion result.
5. Preserve the original assertion exception if cleanup also fails; attach cleanup failure as suppressed evidence rather than replacing the original failure.

Setup must create a fresh product for each run, record its exact title/ID before behavior actions, and avoid changing seeded products. No implementation or E2E execution is included in Sprint 04 because EC-C03 remains unaccepted.
