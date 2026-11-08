# Claroline 1.11.10 Source Provenance

## Finding

**Decision: `SOURCE_VERSION_NOT_VERIFIED` / `PROVENANCE_BLOCKED`.** No Claroline application Git commit corresponding to 1.11.10 was verified. Do not create `config/apps/claroline.json` under the current parser contract: `source.commit` must be an application-source Git SHA, and the BEWT benchmark commit is not such a SHA.

The BEWT source repository and pinned commit are verified separately: `OlianasD/BEWT`, commit `0501249ff3e9a5ea83a06155cd2971dc36197056`, subtree `claroline/baseline/claroline-1.11.10`. The isolated suite copy contains 75 files from that pinned subtree. The only intended source adaptation is `experiments/claroline/bewt-suite/src/test/java/test/BaseTest.java`; test classes, Page Objects, and assertions are retained.

## Official release investigation

The [official SourceForge release directory](https://sourceforge.net/projects/claroline/files/Claroline/Claroline_1.11.10/) lists separate `claroline-1.11.10` and `claroline-1.11.10-1` archives. Its release notes distinguish the February 18, 2014 package from the February 28, 2014 `1.11.10-1` package and describe the patch-1 history. The direct download attempts returned an HTML download page rather than archive bytes. Therefore no archive size or SHA-256 is claimed, and no byte-level comparison with the image is established.

The current `claroline/Claroline` Git remote had no matching 1.11.10 tag/ref during the investigation. This does not prove no historical commit exists; it means one has not been verified from the available evidence.

## Evidence levels

| Level | Status | Basis |
|---|---|---|
| `GIT_COMMIT_VERIFIED` | NOT ESTABLISHED | No upstream Claroline application commit verified. |
| `OFFICIAL_ARCHIVE_HASH_VERIFIED` | NOT ESTABLISHED | SourceForge returned HTML instead of archive bytes. |
| `IMAGE_CONTENT_PARTIALLY_MATCHED` | NOT ESTABLISHED | No reliable source archive is available for content fingerprints. |
| `SOURCE_VERSION_NOT_VERIFIED` | YES | Image/repository naming alone cannot establish source equivalence. |
| `PROVENANCE_BLOCKED` | YES | Existing parser requires a source Git commit. |

## Working-copy integrity

The benchmark fixture remains in the isolated `experiments/claroline/bewt-suite` working copy. The successful `mvn -B clean test-compile` proves compilation only. It does not prove application-source provenance, runtime readiness, or G0 acceptance. The original business assertion remains: `The new user has been sucessfully created`.

See `BASELINE-ADAPTATION.md`, `PROVENANCE-CONTRACT-CHANGE-PROPOSAL.md`, and preflight records under `evidence/preflight-image-20261109/`.
