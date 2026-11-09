# T05-A Test Results

Commands ran in the T05-A worktree at source HEAD ae149842185877bcd4a97cf99ebdb3fc099e040b on 2026-11-09. Logs are in evidence commit fdf3ba216a0c9e03d9f979c2e252cbda1b9c012b. At this audit, PR HEAD was 97b28250425c213095d01dcb81e16b288ca223d1, a metadata-only handoff update; tests were not rerun after it. Node v24.19.0 and Java 21.0.12 were available. Maven 3.9.16 was installed; focused offline integration successfully ran synthetic isolated Maven test-compile. Docker Desktop Linux engine was unavailable.

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| Framework npm ci | 0 | PASS, 71 packages, 0 vulnerabilities | Installation result recorded here |
| Framework npm run build | 0 | PASS | framework-build.txt |
| Framework npm test | 0 | PASS, 45/45 | framework-unit.txt |
| Framework npm run test:integration | 1 | 18 PASS, 1 FAIL, 1 opt-in SKIP; adapter lifecycle received BLOCKED while preparing Docker fixture | framework-integration.txt |
| Framework npx tsx --test test/integration/t01c-model-generation.test.ts test/integration/t01c-offline-approved-java-pipeline.test.ts test/integration/workflow.test.ts test/integration/tool-boundaries.test.ts | 0 | PASS, 11/11; synthetic Maven compile only | focused-offline-integration.txt |
| ExpressCart Agent npm ci | 0 | PASS, 34 packages, 0 vulnerabilities | Installation result recorded here |
| ExpressCart Agent npm run build | 0 | PASS | agent-build.txt |
| ExpressCart Agent npm test | 0 | PASS, 5/5 | agent-unit.txt |

The full integration failure is runtime-dependent: framework/test/integration/expresscart-adapter-lifecycle.test.ts calls prepareFixture at lines 64–65 and expects Docker-backed startup. Docker was unavailable, so no retry, installation or resource change was attempted. One opt-in process-crash E2E was skipped by default. Focused offline tests passed separately.

No Gemini request, credential probe or Selenium E2E was run. Docker was queried only for client/daemon availability; no Docker runtime resource was started or changed. npm reported package install scripts pending its allow-scripts policy; build and executed tests passed.

## Local generated outputs outside task scope

The Docker-dependent integration test wrote untracked diagnostics under T01-B:
- docs/tasks/T01-B/evidence/adapter-lifecycle-1977b9cd-299f-473a-9d2c-cbe836ab5706/
- docs/tasks/T01-B/evidence/adapter-lifecycle-c2856340-1d47-449c-8f03-e109a1054373/

Offline Maven integration wrote these untracked result JSON files under T01-C:
- docs/tasks/T01-C/evidence/t01c-offline-approved-028ca315-e8b7-4f1c-83e3-a9d59eb574c1/isolated-maven-compile.json
- docs/tasks/T01-C/evidence/t01c-offline-approved-c46bafbd-f2af-491f-8238-c4a5ca48d3b8/isolated-maven-compile.json
- docs/tasks/T01-C/evidence/t01c-offline-approved-e38899d8-fb33-4cf4-a5fd-f7ad1d77bba9/isolated-maven-compile.json

These paths were absent from the worktree status before tests. Automated review denied removal because they are outside T05-A; they remain untracked and are excluded from the commit. No tracked file outside T05-A remains changed.
Captured output has trailing line whitespace and excess final blank lines normalized for Git diff hygiene; test messages, counts, and exit results are unchanged.
