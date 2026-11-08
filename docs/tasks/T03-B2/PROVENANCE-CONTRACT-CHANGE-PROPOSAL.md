# Proposal: Archive-based application source provenance

**Status: `PROVENANCE_DECISION_REQUIRED`; proposal only.** No contract or framework change is made in this task.

Claroline 1.11.10 is distributed as historical SourceForge archives, while no matching upstream Git commit and no downloadable archive bytes/hash have been verified. The current `parseApplicationManifest()` contract requires `source.commit` to be a full Git SHA and cannot represent an archive-only source honestly.

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

Until an approved contract exists and source bytes are available, keep Claroline as a draft and report provenance as `PROVENANCE_BLOCKED`. Any isolated runtime feasibility result is separate from a parser-valid manifest and G0 readiness.
