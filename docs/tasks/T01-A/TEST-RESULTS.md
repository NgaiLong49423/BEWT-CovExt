# T01-A — Test Results

## Original T01-A baseline

| Check | Command | Result | Evidence |
|---|---|---|---|
| TypeScript type check | `node experiments/expresscart/agent/node_modules/typescript/bin/tsc -p framework/tsconfig.json` | PASS | `evidence/typescript-build.log` |
| Contract/policy unit tests | `node --import ./experiments/expresscart/agent/node_modules/tsx/dist/loader.mjs --test --test-reporter=tap framework/test/contracts.test.ts` | PASS; 15 passed, 0 failed | `evidence/contracts-tests.tap` |
| Maven effective compiler config | `mvn -f experiments/expresscart/bewt-suite/pom.xml help:effective-pom -Doutput=<temporary-file> -q` | PASS; effective `source/target=1.8` | `evidence/maven-effective-compiler-plugin.xml` |

The original tests cover valid/invalid manifests and inventories, source/evidence provenance, workflow transitions, human approval/revision/rejection, replay and run/thread/checkpoint mismatches, tool/path/allowlist/source/app/ownership checks, two-repair limit, validation prerequisites, missing data and sanitization. These baseline logs remain unchanged as historical evidence; the original commands used ExpressCart's then-existing `node_modules` and are superseded by the independent package commands below.

These checks exercise contracts and pure policy. They do **not** verify a LangGraph pause/resume, durable checkpoint store, actual dispatcher, reviewer authentication, Docker ownership or full E2E. No Maven build was run and no POM changed.

## Review-fix verification (new, current)

Run from the independent framework package after `npm ci`:

| Check | Command | Result | Evidence |
|---|---|---|---|
| Dependency install | `npm ci` in `framework/` | PASS; locked packages installed; npm noted its install-script allowlist warning for optional `esbuild` | `evidence/review-fixes-npm-ci.log` |
| TypeScript typecheck | `npm run build` in `framework/` | PASS | `evidence/review-fixes-build.log` |
| Complete framework unit suite | `npm test` in `framework/` | PASS; 18 passed, 0 failed | `evidence/review-fixes-tests.log` |
| Existing ExpressCart Agent unit suite | `npm test` in `experiments/expresscart/agent/` | PASS; 5 passed, 0 failed | `evidence/review-fixes-existing-agent-tests.log` |

New/expanded coverage exercises two REVISE rounds followed by ACCEPT, append-only ledger retention, old checkpoint rejection, stale revision and replay rejection; structured run/decision/evidence validation, duplicate/missing/mismatched records, distinct rerun IDs and per-rerun fixture-reset plus cleanup evidence; Java class syntax and candidate/artifact/class/revision binding; and exact manifest Base suite path enforcement. The previous ExpressCart Agent unit suite also passes.

The package now declares pinned tooling in `framework/package.json`, commits `framework/package-lock.json`, resolves Node types from its own `node_modules`, and exposes `build`/`test` scripts. These checks ran from that package after `npm ci`, without reaching into ExpressCart's `node_modules`.

These remain contract/policy checks. No reviewer identity, referenced evidence contents, Java source/class correspondence, filesystem realpath/symlink boundary, LangGraph checkpoint persistence, Gemini, Docker or full E2E was verified. Those are T01-B runtime acceptance blockers.
