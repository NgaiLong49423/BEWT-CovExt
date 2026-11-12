# Metrics Recalculation Audit

At the audit baseline, `docs/research-results/v2/replication/recompute-metrics.mjs` was not an evidence-validating engine despite its header claims. That version ran successfully but reported false PASS values.

- Gherkin uses home-grown line/regex checks, not the Cucumber parser shipped in `framework`.
- The override path marks every row's `approved` field true and treats implementation approval as human approval.
- Production review parsing discards reviewer identity, signature, status, and timestamp; novelty is inferred from proposal classification plus any source reference.
- RQ2 defaults to 180 UBUs and 11 validated cases; nominal coverage adds all candidates as independent UBUs.
- RQ3 returns PASS from revision-1 directory count and repair-budget checks, without requiring correct oracle or a qualifying execution.
- RQ4 substitutes a fixed estimated token profile when the invocation ledger is absent, attributes it to Gemini 3.8 Flash, and unconditionally reports cost efficiency.
- At the audit baseline, negative controls did not cover pending signatures, false timestamps, hash mismatches, semantic overlap, missing raw runtime evidence, or fabricated model telemetry.

The remediation replaces those checks with the pinned Cucumber parser, primary review-signature requirements, per-record review-ledger SHA-256 integrity checks, case traceability, live Java/registration hash checks, and raw-run provenance counts. It no longer substitutes fixed denominators, candidate counts, or synthetic usage estimates. A later SonarCloud review also found that the CLI retrieved `HEAD` by spawning `git` through the inherited `PATH` (`javascript:S4036`); this revision reads Git metadata directly, so no command is launched through `PATH`. The historical `Number.NaN` code smell (`javascript:S7773`) is also corrected. Local regression tests cover detached HEAD and linked-worktree refs; the hosted SonarCloud gate has not yet rerun. Current evidence still yields RQ1 `BLOCKED` pending real human decisions; RQ2 `NOT_EVALUATED` pending a defensible behavioral denominator; RQ3 `NOT_EVALUATED` for semantic validation (0/40 eligible); RQ4 `PARTIALLY_VERIFIED` for five failed attempts, with tokens and actual cost `UNKNOWN`.

The negative-control suite passes 17/17 tests, including malformed Gherkin, unsigned implementation authorization, missing semantic/runtime evidence, a stale candidate hash, deterministic recomputation, and direct HEAD resolution for detached and linked worktrees. Reproduce with `node --test docs/research-results/v2/replication/test/recompute-metrics-negative.test.mjs` and `node docs/research-results/v2/replication/recompute-metrics.mjs`. The latter regenerates `docs/final-acceptance/RQ1-RQ4-results.json` and `.csv`.

The historical `evaluation-metrics-rq1-rq4.json` figures remain superseded for acceptance decisions until independently recomputed against complete raw evidence and human decisions.
