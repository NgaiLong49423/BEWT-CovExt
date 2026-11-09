# Proposal: Archive-based application source provenance

**Status: `SUPERSEDED` for source-version representation; proposal only.** No contract or framework change is made in this task.

> **Superseded for source-version representation:** r13 verified the official 1.11.10 package from a historical application Git tag plus the exact separate CLCHAT package. r14 also verified the pinned image base layer against that package byte-for-byte; one later application-code patch remains unattributed. No archive-only parser extension is currently required, and no framework change was made.

Claroline 1.11.10 is distributed as historical SourceForge archives; SHA-256 values for both official 1.11.10 archive variants are recorded in `CLAROLINE-SOURCE-PROVENANCE.md`. The historical application commit and full release package composition are verified. The pinned image base layer matches the official archive, while a later image layer changes one application guard without identified source attribution. The `parseApplicationManifest()` contract accepts the verified source commit; a candidate object passed in memory, but no runtime manifest was promoted.

Proposed future contract option, subject to Team Lead approval:

```json
"source": {
  "kind": "archive",
  "url": "<official release URL>",
  "fileName": "<exact archive file name>",
  "sizeBytes": 0,
  "sha256": "sha256:<64 lowercase hex characters>",
  "version": "1.11.10"
}
```

Acceptance should require fetched archive bytes, exact URL/file identity, measured size and SHA-256, a documented extraction method, source fingerprint comparison where image contents permit, and parser tests rejecting absent/placeholder hashes. An archive SHA-256 must never be represented as a Git commit SHA. A separate optional upstream commit may be recorded only after independent content verification.

No archive-based contract extension is requested by this task. Keep Claroline unpromoted while the image patch remains unattributed and runtime has not passed. Any isolated runtime feasibility result is separate from manifest validation and G0 readiness.
