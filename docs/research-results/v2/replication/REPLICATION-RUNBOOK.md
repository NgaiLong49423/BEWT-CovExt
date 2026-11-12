# BEWT-CovExt — Offline Evidence Audit Runbook

## Scope and evidence pins

This runbook reproduces the current offline audit and its metrics outputs. It does **not** reproduce the historical Docker/Google Cloud G0 or G3 executions, establish human approval, or generate a new model response.

- Source/data snapshot: `main` commit `da6399536ff75a1edf4417819eb4d166cc1d781c` (confirmed as `origin/main` on 12 November 2026).
- Metrics computation revision: `569ca47d40dcc8dd8d5138718078c5f4ec7217bc` (the checked-in RQ metrics artifact records this commit as `auditBaselineCommit`). Its tracked research inputs descend from the source/data snapshot above.
- The later approved Gemini attempt and its failure evidence were introduced in `3c6ca2014ef60384e3c23a9dcd4c0880af76f099`; it failed with `expected object, received null`, with zero retries and no review packet or Java artifact.
- Runtime: Node.js 22 or newer. Framework package versions are pinned in `framework/package-lock.json`.

## Reproduce the offline audit

```bash
git clone https://github.com/NgaiLong49423/BEWT-CovExt.git
cd BEWT-CovExt
git checkout 569ca47d40dcc8dd8d5138718078c5f4ec7217bc
git status --short

cd framework
npm ci --ignore-scripts
npm test
npm run test:integration
npm run build
cd ..

node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs docs/research-results/v2/replication/test/audit-g3-run-accounting.test.mjs
node docs/research-results/v2/replication/audit-g3-run-accounting.mjs
node docs/research-results/v2/replication/recompute-metrics.mjs
```

The metrics command writes `docs/final-acceptance/RQ1-RQ4-results.json` and `.csv`. On the pinned analysis revision, the evidence-supported outcomes are RQ1 `BLOCKED`, RQ2 `NOT_EVALUATED`, RQ3 `NOT_EVALUATED`, and RQ4 `PARTIALLY_VERIFIED`. The RQ3 command preserves the historical raw run counts separately; none is eligible as a source-bound validated candidate.

## Interpreting historical app results

The repository contains historical Maven reports, G0/G3 manifests, JUnit XML, and cleanup records. Their presence does not bind every execution to the exact application commit/image, test and Gherkin hashes, runtime, fixture, reset, and cleanup evidence required by the current protocol. Do not interpret a historical `BUILD SUCCESS` as semantic validation or rerun stability.

No active authorized Google Cloud project/VM was available to the current audit. Do not run the Cloud controller or Docker cleanup commands without verifying the live account, project, VM, and experiment-owned resource identities. This runbook therefore makes no claim that G0 or G3 has been reproduced.

## Research limits

- There are 40 parseable candidate Gherkin scenarios, but 0/40 evidenced signed oracle-and-novelty approvals and 0/40 approved semantic mappings.
- The historical `180` UBU denominator is not verified; do not calculate a coverage-gain percentage from it.
- The consolidated G3 summary lists 79 runs; 84 run-record files and 85 JUnit XML files exist. These are preserved as raw historical accounting, not current validated outcomes.
- The latest authorized live Gemini call failed; token usage and actual billing are unknown. No retries are covered by that approval.
- The checked-in PDF is a compiled draft. Its author and affiliation placeholders remain; it is not a final accepted manuscript.

## Draft manuscript PDF build

The paper uses the Springer Nature `sn-jnl` class. The Springer class and bibliography style are build-time dependencies and are not tracked in this repository. Download the official Springer Nature LaTeX template package from [Springer Nature LaTeX author support](https://www.springernature.com/in/authors/campaigns/latex-author-support), and use its `sn-article-template` class and bibliography style files. Keep those files outside the repository or in a disposable build directory; do not commit the vendor class/style.

This audit rebuilt the checked-in draft with Tectonic 0.17.0 (Windows x86_64 release; official releases are listed at [Tectonic releases](https://github.com/tectonic-typesetting/tectonic/releases)). From the repository root, with `tectonic` on `PATH` and the Springer template files temporarily available under `docs/paper`, run:

```powershell
tectonic --keep-logs --keep-intermediates docs/paper/bewt-covext-paper.tex
```

The build produced a 33-page A4 PDF. It emitted nonfatal font configuration, encoding, overfull/underfull layout, and duplicate destination warnings; visual inspection found no clipping on the inspected pages. Check the PDF metadata and render pages before distributing a revised manuscript. A clean, independent rerun may need network access to fetch Tectonic's TeX bundle. The output remains a draft until verified author and affiliation details are supplied and the remaining warnings/layout are reviewed.
