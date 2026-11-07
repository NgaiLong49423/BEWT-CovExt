# T01-A — Test Results

| Check | Command | Result | Evidence |
|---|---|---|---|
| TypeScript type check | `node experiments/expresscart/agent/node_modules/typescript/bin/tsc -p framework/tsconfig.json` | PASS | `evidence/typescript-build.log` |
| Contract/policy unit tests | `node --import ./experiments/expresscart/agent/node_modules/tsx/dist/loader.mjs --test --test-reporter=tap framework/test/contracts.test.ts` | PASS; 15 passed, 0 failed | `evidence/contracts-tests.tap` |
| Maven effective compiler config | `mvn -f experiments/expresscart/bewt-suite/pom.xml help:effective-pom -Doutput=<temporary-file> -q` | PASS; effective `source/target=1.8` | `evidence/maven-effective-compiler-plugin.xml` |

Tests cover valid/invalid manifests and inventories, source/evidence provenance, workflow transitions, separation of workflow and research status, human approval/revision/rejection, replay and run/thread/checkpoint mismatches, tool/path/allowlist/source/app/ownership checks, two-repair limit, VALIDATED prerequisites, missing data and sanitization.

These checks exercise contracts and pure policy. They do **not** verify a LangGraph pause/resume, durable checkpoint store, actual dispatcher, reviewer authentication, Docker ownership or full E2E. No Maven build was run and no POM changed.
