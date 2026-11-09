# T05 Entry Criteria

T05 must not start until the Team Lead approves entry and applicable prerequisites are evidenced:

1. The Team Lead records a G0 decision for Kanboard after resolving the Run A/B Surefire hash discrepancy or explicitly deciding how the missing integrity link is handled. The agent recommendation is not a gate result.
2. The Team Lead completes real human review records for candidates selected to proceed. Each decision validates against the pinned candidate version, exact dataset and reviewed commit. Revisions require new hashes and renewed review.
3. Primary oracle, novelty rationale, actor permissions, stable fixture, reset ownership and expected observable result are clear for every selected candidate. For KB-GAP-004, forged `owner_id` rejection remains unverified until separately evidenced.
4. T05 scope, eligible candidate IDs, evaluation protocol, run limits, allowed tools, environment and evidence locations are approved. The study's 8-app / target-40 scope remains intact.
5. Runtime readiness and cleanup implementation are checked against current code. Historical Run A/B cleanup cannot prove that the later corrected implementation ran at that time.
6. Test artifacts and result schema distinguish generation, compile, fixture, E2E, cleanup, rerun and inconclusive states. Required reruns have unique invocation IDs and reset/cleanup evidence.
7. No candidate is called `VALIDATED` until human oracle/novelty approval, E2E PASS, required repeats and provenance are all present.

Until these conditions are met, T05 is `NOT_READY`. This task does not initiate T05.
