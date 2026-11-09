# Claroline 1.11.10 Source Provenance

## Finding

**Decision: `SOURCE_RELEASE_VERIFIED` / image provenance `PARTIAL`.** The historical Claroline source tag `zefredz/claroline@1.11.10` resolves to application commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6`. The official 1.11.10 archive is fully accounted for by this source tree plus the separately published CLCHAT package. The pinned image contains an exact byte-for-byte copy of that archive in its base application layer, then applies one unattributed code patch and adds runtime configuration. The immutable image content is now characterized; do not describe it as a pristine release image or promote a runtime manifest until the patch and runtime gate are reviewed.

The BEWT source repository and pinned commit are verified separately: `OlianasD/BEWT`, commit `0501249ff3e9a5ea83a06155cd2971dc36197056`, subtree `claroline/baseline/claroline-1.11.10`. The isolated suite copy contains 75 files from that pinned subtree. The only intended source adaptation is `experiments/claroline/bewt-suite/src/test/java/test/BaseTest.java`; test classes, Page Objects, and assertions are retained.

## Official release investigation

The [official SourceForge release directory](https://sourceforge.net/projects/claroline/files/Claroline/Claroline_1.11.10/) lists separate `claroline-1.11.10` and `claroline-1.11.10-1` archives. Its release notes distinguish the February 18, 2014 package from the February 28, 2014 `1.11.10-1` package and describe the patch-1 history. Initial direct-download attempts returned an HTML page rather than archive bytes. A later successful HTTPS retrieval measured both official archive variants; see the follow-up evidence below. The base Claroline 1.11.10 image layer was later compared byte-for-byte to the original archive; the image delta is documented in r14.

The current `claroline/Claroline` Git remote had no matching 1.11.10 tag/ref. A historical release tag was subsequently found in `zefredz/claroline`; see the file-level comparison and composite package verification below.

## Evidence levels

| Level | Status | Basis |
|---|---|---|
| `GIT_COMMIT_VERIFIED` | YES — release core | Historical 1.11.10 tag matches the official release archive shared application tree after documented normalization. |
| `OFFICIAL_ARCHIVE_HASH_VERIFIED` | YES | Both listed release archives were retrieved twice over HTTPS with matching SHA-256, gzip magic and successful tar listings; see r10 evidence. |
| `IMAGE_CONTENT_PARTIALLY_MATCHED` | YES | Base image layer is an exact archive copy; one later source-file patch and runtime-generated files are documented in r14. |
| `SOURCE_VERSION_NOT_VERIFIED` | NO for source base; final image is modified | The pinned image base matches 1.11.10 exactly, but one later image layer changes an application-code guard without upstream commit attribution. |
| `IMAGE_PATCH_UNATTRIBUTED` | YES | The changed application file is pinned by the image digest, but its author/source commit is unknown; no runtime manifest is promoted. |

## Working-copy integrity

The benchmark fixture remains in the isolated `experiments/claroline/bewt-suite` working copy. The successful `mvn -B clean test-compile` proves compilation only. It does not prove application-source provenance, runtime readiness, or G0 acceptance. The original business assertion remains: `The new user has been sucessfully created`.

See `BASELINE-ADAPTATION.md`, `PROVENANCE-CONTRACT-CHANGE-PROPOSAL.md`, and preflight records under `evidence/preflight-image-20261109/`.

## Follow-up: official archive byte verification — 2026-11-09

The official SourceForge directory lists two distinct candidates: the original `1.11.10` archive dated 2014-02-18 and the patched `1.11.10-1` archive dated 2014-02-28. Each HTTPS download was retrieved twice; repeated byte counts and SHA-256 values matched. Both responses were `200 application/x-gzip`, had gzip magic bytes, and passed `tar -tzf` listing. Temporary archives were removed after verification; only metadata is retained in `evidence/offline-verification-20261109-r10/source-archive-verification.json`.

| Release candidate | Bytes | SHA-256 | Retrievals |
|---|---:|---|---:|
| `claroline-1.11.10.tar.gz` | 5,855,725 | `666b63e3b4cf0d188a7f618c0c65493812f0ba2283e606d8f1ea8236072d9dd6` | 2, matching |
| `claroline-1.11.10-1.tar.gz` | 5,855,704 | `9e887be39f6de9306ad7c197b723554484eb96d5a1e7aca0abc7d63d8b1d007e` | 2, matching |

This establishes measured archive-byte hashes for both official candidates. At the time of this historical r10 entry, Docker image comparison, release commit verification, and a parser-valid runtime manifest were still unresolved; subsequent r13/r14 evidence below supersedes those findings. No publisher signature or signed checksum is claimed.
The follow-up GitHub API ref queries returned no entries for `git/matching-refs/tags/1.11.10` or `git/matching-refs/heads/1.11`; exact query metadata is in the r10 evidence. This narrows the available Git-reference evidence but does not prove that no historical commit exists.

## GitHub repository probe — 2026-11-09

GitHub returned no refs for the `1.11.10` tag prefix or `1.11` branch prefix. A nearby commit in the `claroline/Claroline` repository dated 2014-02-18 was inspected; its `composer.json` identifies the package as `claroline/core-bundle` / `claroline-core`, a component rather than a full Claroline 1.11.10 application source tree. That commit is therefore not used as `source.commit`. These results narrow the checked references but do not prove no untagged application commit exists. Evidence: `evidence/offline-verification-20261109-r11/github-source-ref-probe.json`.

## Source comparison follow-up — 2026-11-09

A read-only comparison found the historical `zefredz/claroline` tag `1.11.10` at commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6` (commit subject: `merge rev 14718-14723 on release 1.11.10`). The official SourceForge `claroline-1.11.10.tar.gz` archive was retrieved again and matched its recorded SHA-256 `666b63e3b4cf0d188a7f618c0c65493812f0ba2283e606d8f1ea8236072d9dd6`. After normalizing CRLF/LF and expanded CVS keywords, all 1,613 files shared by the release archive and Git tree matched; 323 binary files were byte-identical. The archive has 17 additional files under `module/CLCHAT/`, absent from the Git tree. Therefore the tag is a strong source candidate, but full release tree equivalence remains unverified; `GIT_COMMIT_VERIFIED` and the runtime manifest remain unpromoted pending resolution of that difference and image-to-source comparison. Evidence: `evidence/offline-verification-20261109-r12/source-git-archive-comparison.json`.

## Composite release-source verification — 2026-11-09

The 17 archive-only `module/CLCHAT/` files were verified as a separately distributed Claroline companion module, not unexplained missing core files. The official Claroline packages SourceForge listing contains `CLCHAT.zip` under “Modules for Claroline 1.10” (2011-12-01). The downloaded ZIP was 18,234 bytes with SHA-256 `14f02d486896eb63433c8c6a843f8f6fd06bfd413a3c4e0759aada163a9cda36`; its 17 files matched the 17 files included under `module/CLCHAT/` in the official Claroline 1.11.10 archive byte-for-byte, with no extras or omissions. Together with the 1,613-file core-tree comparison in r12, all 1,630 files in the official 1.11.10 archive are accounted for. Evidence: `evidence/offline-verification-20261109-r13/composite-source-comparison.json`.

This verifies the official release package source composition. At r13, the pinned image had not yet been compared against it; the r14 layer analysis below supersedes that runtime-image mapping status. No Claroline runtime manifest is added.
## Pinned image source-layer comparison — 2026-11-09 (r14)

The Docker Registry manifest for `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` has 15 layers totaling 179,844,983 compressed bytes; every downloaded layer SHA-256 matched its registry descriptor. Layer 8 (one-based) contains 1,630 application files, exactly matching all 1,630 files in the official `claroline-1.11.10.tar.gz` archive byte-for-byte.

Later layers add 24 runtime configuration/cache files, remove the web installer directory, and replace one application source file: `claroline/inc/lib/add_course.lib.inc.php`. The image file SHA-256 is `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8`; the official-release file SHA-256 is `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1`. The later layer comments out the 128-attempt guard, warning, and failure return in repeated course-identifier allocation. Its origin is not identified. Image-to-source status is therefore partial, not a pristine-release match. Evidence: `evidence/offline-verification-20261109-r14/registry-image-manifest.json` and `image-source-layer-comparison.json`.

No container was created or started during this registry-layer inspection. Host RAM remained below the runtime gate and Docker Engine remained unavailable; see r14 `runtime-preflight.json`.

The `parseApplicationManifest()` parser accepted a candidate manifest object in memory with the verified source commit and pinned image digest. This is parser evidence only: no `config/apps/claroline.json` file was created or promoted because the image contains an unattributed application-code patch and runtime remains incomplete. See `evidence/offline-verification-20261109-r14/manifest-candidate-parser.json`.

**Pending Team Lead decision (historical at r14):** explicitly accept or reject the pinned customized image derivative, including its unattributed patch to `claroline/inc/lib/add_course.lib.inc.php`, as an eligible G0 runtime. The exact image digest preserves the reviewed bytes but does not establish patch authorship or upstream equivalence. No manifest promotion or G0 acceptance was made at r14.

## Team Lead Decision P1 & Manifest Promotion — 2026-11-10 (r76 / r77 / d-r6)

**Decision: `P1 — Accept Pinned BEWT Benchmark Image` (`BEWT_BENCHMARK_DERIVATIVE_PINNED`).**

1. **Official Team Lead Decision P1**: The Team Lead officially approved accepting `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` as the pinned BEWT benchmark derivative runtime image for Claroline `1.11.10`, with the 1-file modification in `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` explicitly recorded as a divergence from pristine upstream Claroline `1.11.10`.
2. **Exact Re-verified Layer 8 vs Layer 13 Diff and SHA-256 Reconciliation**:
   - **Layer 8 (1-based; blob `sha256:d33f1c16adf9e589e8a0501b33b99d1cd8f73e1c4ec6e753d05a3c076e7d302f`)**: Contains all 1,630 files of the official `claroline-1.11.10.tar.gz` release archive (`sha256:666b63e3b4cf0d188a7f618c0c65493812f0ba2283e606d8f1ea8236072d9dd6`) byte-for-byte. In Layer 8, `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` is **23,010 bytes** with SHA-256 `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1`.
   - **Layer 13 (1-based; blob `sha256:a48416c0ca244a9138ac9e537426ed037f4373a85160ffc43514a7a6b4e7501a`)**: Modifies `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` to **23,040 bytes** (`+30` bytes from adding `// ` to 10 lines) with SHA-256 `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8`.
   - **Exact Code Diff in `add_course.lib.inc.php`** (correcting both the earlier r14 summary phrase about a 128-attempt guard and the earlier PR summary text that misquoted the hashes as `722cc95...` / `c743513...`):
     - Lines **382–389** inside `create_course_tables($courseDbName)`: prefixes 4 lines with `// `, commenting out the `CREATE TABLE` statements for `$tbl_mdb_names['course_description']` and `$tbl_mdb_names['course_properties']`.
     - Lines **557–562** inside `fill_Db_course(...)`: prefixes 6 lines with `// `, commenting out the two initial `INSERT INTO ... course_description` seed statements.
     - Zero impact on `Claroline_AddUserTest` (which exercises admin login and user creation in `cl_user`), while documented as a benchmark-image divergence for course-creation/course-description workflows.
3. **Runtime Manifest Promotion**:
   - Promoted `config/apps/claroline.json` conforming to `framework/src/contracts.ts::parseApplicationManifest` (`appId: "claroline"`, `source.commit: "22d852f93081bc36b1d08b93f5e0c14b49a573f6"`, `source.packageVersion: "1.11.10-bewt-derivative"`, `runtime.version: "1.11.10-bewt-derivative-php-5.5.9-apache-2.4.7-mysql-5.5.61"`, `runtime.imageDigest: "sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af"`).
   - Validated via `docs/tasks/T02/evidence/review-fixes/verify-config-apps.test.mjs` (3/3 PASS) and `experiments/claroline/tools/test/cleanup-claroline-g0.test.mjs` (46/46 PASS in `offline-verification-20261110-r76` and `offline-verification-20261110-r77`).
