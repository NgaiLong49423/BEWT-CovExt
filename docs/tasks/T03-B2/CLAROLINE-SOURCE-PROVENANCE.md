# Claroline 1.11.10 Source Provenance

## Finding

**Decision: `SOURCE_VERSION_NOT_VERIFIED` / `PROVENANCE_BLOCKED`.** No Claroline application Git commit corresponding to 1.11.10 was verified. Do not create `config/apps/claroline.json` under the current parser contract: `source.commit` must be an application-source Git SHA, and the BEWT benchmark commit is not such a SHA.

The BEWT source repository and pinned commit are verified separately: `OlianasD/BEWT`, commit `0501249ff3e9a5ea83a06155cd2971dc36197056`, subtree `claroline/baseline/claroline-1.11.10`. The isolated suite copy contains 75 files from that pinned subtree. The only intended source adaptation is `experiments/claroline/bewt-suite/src/test/java/test/BaseTest.java`; test classes, Page Objects, and assertions are retained.

## Official release investigation

The [official SourceForge release directory](https://sourceforge.net/projects/claroline/files/Claroline/Claroline_1.11.10/) lists separate `claroline-1.11.10` and `claroline-1.11.10-1` archives. Its release notes distinguish the February 18, 2014 package from the February 28, 2014 `1.11.10-1` package and describe the patch-1 history. Initial direct-download attempts returned an HTML page rather than archive bytes. A later successful HTTPS retrieval measured both official archive variants; see the follow-up evidence below. Image-to-archive comparison remains unestablished.

The current `claroline/Claroline` Git remote had no matching 1.11.10 tag/ref during the investigation. This does not prove no historical commit exists; it means one has not been verified from the available evidence.

## Evidence levels

| Level | Status | Basis |
|---|---|---|
| `GIT_COMMIT_VERIFIED` | NOT ESTABLISHED | No upstream Claroline application commit verified. |
| `OFFICIAL_ARCHIVE_HASH_VERIFIED` | YES | Both listed release archives were retrieved twice over HTTPS with matching SHA-256, gzip magic and successful tar listings; see r10 evidence. |
| `IMAGE_CONTENT_PARTIALLY_MATCHED` | NOT ESTABLISHED | No reliable source archive is available for content fingerprints. |
| `SOURCE_VERSION_NOT_VERIFIED` | YES | Image/repository naming alone cannot establish source equivalence. |
| `PROVENANCE_BLOCKED` | YES | Existing parser requires a source Git commit. |

## Working-copy integrity

The benchmark fixture remains in the isolated `experiments/claroline/bewt-suite` working copy. The successful `mvn -B clean test-compile` proves compilation only. It does not prove application-source provenance, runtime readiness, or G0 acceptance. The original business assertion remains: `The new user has been sucessfully created`.

See `BASELINE-ADAPTATION.md`, `PROVENANCE-CONTRACT-CHANGE-PROPOSAL.md`, and preflight records under `evidence/preflight-image-20261109/`.

## Follow-up: official archive byte verification — 2026-11-09

The official SourceForge directory lists two distinct candidates: the original `1.11.10` archive dated 2014-02-18 and the patched `1.11.10-1` archive dated 2014-02-28. Each HTTPS download was retrieved twice; repeated byte counts and SHA-256 values matched. Both responses were `200 application/x-gzip`, had gzip magic bytes, and passed `tar -tzf` listing. Temporary archives were removed after verification; only metadata is retained in `evidence/offline-verification-20261109-r10/source-archive-verification.json`.

| Release candidate | Bytes | SHA-256 | Retrievals |
|---|---:|---|---:|
| `claroline-1.11.10.tar.gz` | 5,855,725 | `666b63e3b4cf0d188a7f618c0c65493812f0ba2283e606d8f1ea8236072d9dd6` | 2, matching |
| `claroline-1.11.10-1.tar.gz` | 5,855,704 | `9e887be39f6de9306ad7c197b723554484eb96d5a1e7aca0abc7d63d8b1d007e` | 2, matching |

This establishes measured archive-byte hashes for both official candidates; it does not establish which variant is represented by the pinned runtime image. Docker was unavailable for image-content comparison, and neither a Claroline Git commit nor a parser-valid runtime manifest was established. The current `parseApplicationManifest()` contract still requires a verified full Git commit, so the task remains `PROVENANCE_BLOCKED`. No publisher signature or signed checksum is claimed.
The follow-up GitHub API ref queries returned no entries for `git/matching-refs/tags/1.11.10` or `git/matching-refs/heads/1.11`; exact query metadata is in the r10 evidence. This narrows the available Git-reference evidence but does not prove that no historical commit exists.

## GitHub repository probe — 2026-11-09

GitHub returned no refs for the `1.11.10` tag prefix or `1.11` branch prefix. A nearby commit in the `claroline/Claroline` repository dated 2014-02-18 was inspected; its `composer.json` identifies the package as `claroline/core-bundle` / `claroline-core`, a component rather than a full Claroline 1.11.10 application source tree. That commit is therefore not used as `source.commit`. These results narrow the checked references but do not prove no untagged application commit exists. Evidence: `evidence/offline-verification-20261109-r11/github-source-ref-probe.json`.
