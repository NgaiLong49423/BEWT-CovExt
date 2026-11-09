# Cleanup and resource protection

Cleanup implementation: `experiments/claroline/tools/cleanup-claroline-g0.mjs`; reusable ownership/run helpers: `experiments/claroline/tools/claroline-g0.mjs`; native-command policy: `experiments/claroline/tools/child-process-policy.mjs`; CLI wrapper: `experiments/claroline/tools/cleanup-run.mjs`.

Before mutation the cleanup validates the complete task labels, recorded full IDs, exact names and immutable image references; requires no mounts/binds, no privileged/host networking, loopback-only dynamic expected port bindings, an internal bridge, and exact recorded endpoints. It accepts only exact Docker NOT_FOUND messages as idempotent missing. Daemon, permission, transport, malformed response, stale ID/name, ownership mismatch, or unknown failures return BLOCKED/nonzero before unsafe deletion. It removes only validated recorded containers and network, never volumes or images, never invokes prune, checks residual resources by run ID/full labels, and checks that all pre-run inventory remains present.

Fault-injection suite: `node --test experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` — **18 passed, 0 failed** (partial startup 0/1/2 containers, network/app/Selenium create/start failure recording, exact NOT_FOUND vs unknown errors, stale IDs, image/labels/mount/ports/endpoints, partial teardown, run-scoped residual resources, no unrelated ExpressCart/Kanboard removal, idempotency, Surefire, sanitization, run ID validation, write-once evidence directories, and explicit native tool paths).

Runtime cleanup is `NOT_RUN` because the host RAM gate did not pass. The earlier image preflight-only container was removed; its cleanup record and exact NOT_FOUND follow-up remain under `evidence/preflight-image-20261109/`.
