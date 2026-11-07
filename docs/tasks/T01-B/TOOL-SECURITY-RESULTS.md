# Tool Security Results

## Implemented and tested

- [`framework/src/runtime/tool-dispatcher.ts`](../../../framework/src/runtime/tool-dispatcher.ts) accepts only declared tool schemas, validates manifest/app/source pins and policy state, checks owned paths and routes to fixed implementations.
- [`framework/src/runtime/safe-path.ts`](../../../framework/src/runtime/safe-path.ts) realpath checks containment before read/write and rejects traversal, symlink and junction escape. Tests create an outside junction and assert both input/output paths fail: [`tool-boundaries.test.ts`](../../../framework/test/integration/tool-boundaries.test.ts), [`dispatcher.test.ts`](../../../framework/test/integration/dispatcher.test.ts).
- Maven calls are fixed to manifest `pom.xml`, `test-compile`, or the approved fully qualified class. The class maps to EC-C04’s current candidate/artifact revision and source hash; request input cannot add shell text or selectors. Test request schema and class mismatch cases are in [`dispatcher.test.ts`](../../../framework/test/integration/dispatcher.test.ts).
- Fixture and cleanup use a random run-specific Compose project, local generated Compose content, loopback port, exact image IDs and owner labels. Cleanup refuses resources without matching project labels. The final run’s `cleanup.json` is PASS.
- Driver selection checks an installed Chrome version directory manifest against an exact-version cached ChromeDriver executable. Final `webdriver-pin.json` records versions and hashes without persisting local executable paths.

## Remaining verification and risk

The symlink/junction containment checks run in unit/integration tests. They were not race-tested against concurrent filesystem replacement between resolution and a later external process access. Docker image identity remains source-built local image IDs rather than registry digests, as documented in the manifest. OS-user-derived reviewer pseudonym is a local trust assumption, not centralized identity proof. No request can provide arbitrary commands, paths outside the configured roots, or Maven selectors.

No Docker global cleanup, existing Compose project change, ExpressCart source/test/POM edit, or `bewt-original/` operation occurred. A read-only Compose listing showed the pre-existing ExpressCart project still running after scoped run cleanup.
