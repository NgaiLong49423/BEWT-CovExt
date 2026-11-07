# T02 — Upstream & Version Provenance Matrix (8 Applications)

> **Program:** BEWT-CovExt  
> **Task:** T02 — Benchmark Audit (Parallel Worktree)  
> **Source Baseline Reference:** `bewt-original/` (commit `0501249ff3e9a5ea83a06155cd2971dc36197056`)  
> **Base Commit of main:** `7e27950b44473cf4d6a5d7d5222bc8dac9b3a266` (following merge of PR #3 / T01-B)  
> **Scope Document:** `De_cuong_BEWT_CovExt_AI_Agent_8_Web_40_Kich_Ban.docx` (v2.0, 20/10/2026)  
> **Audit Date:** 2026-11-08  
> **Verification Status:** STATIC_AUDIT_VERIFIED (static provenance audit, no Docker containers spawned)

---

## 1. Objectives & Provenance Principles

In benchmark engineering, reproducibility requires establishing exact **upstream provenance** and **runtime provenance**:
1. **Upstream Source Pin:** The canonical source code repository, release tag, or commit SHA of the web application.
2. **Peeled Commit Verification:** For annotated Git tags, the object pointed to by `refs/tags/<tag>` is a tag object, whereas the actual code commit is `refs/tags/<tag>^{}`. Verification must confirm the dereferenced commit SHA on the canonical GitHub remote.
3. **Release Tag vs Image Provenance Distinction:** A verified Git tag or release commit does **NOT** automatically prove that a Docker Hub image (especially third-party or historical images like `olianasd/*`) was built from that exact commit. Image provenance requires independent inspection of image history, layers, or source rebuild recipes.
4. **Archival & Reproducibility Risk:** Images hosted under user namespaces (`olianasd/*`, `dockercontainervm/*`) pose archival fragility. If Docker Hub removes these layers, external researchers cannot reproduce the environment without an independent source-build recipe.

---

## 2. Upstream & Version Matrix

| Application | BEWT Base Label | Upstream Repository | Verified Release Tag | Canonical Dereferenced Commit SHA | Upstream Status | BEWT Referenced Docker Image | Image Provenance / Publisher | Database Bundling | Archival Risk Level |
|---|---|---|---|---|---|---|---|---|---|
| **Bludit** | `2.3.4` | [`bludit/bludit`](https://github.com/bludit/bludit) | `2.3.4` | [`44de235a5eedda9b80d9f0babd9fd5cb8c6943bd`](https://github.com/bludit/bludit/commit/44de235a5eedda9b80d9f0babd9fd5cb8c6943bd) | **VERIFIED** | `bludit/docker:2.3.4` | Official vendor image (`bludit`) | None (flat-file JSON/PHP) | **Low** (Official Docker Hub repo) |
| **Claroline** | `1.11.10` | [`claroline/Claroline`](https://github.com/claroline/Claroline) | `1.11.10` (Legacy SourceForge) | `NOT_VERIFIED` | **NOT_VERIFIED** | `olianasd/claroline-strongpsw` | BEWT author personal namespace (`olianasd`) | Internal MySQL bundled in container | **High** (Personal image, no published Dockerfile) |
| **ExpressCart** | `1.19` (pkg `1.1.19`) | [`mrvautin/expressCart`](https://github.com/mrvautin/expressCart) | Commit pin | [`b31302f4e99c3293bd742c6d076a721e168118b0`](https://github.com/mrvautin/expressCart/commit/b31302f4e99c3293bd742c6d076a721e168118b0) | **VERIFIED** | `olianasd/expresscart-strongpsw` *(BEWT-CovExt source-built `bewt-covext/expresscart:1.1.19-b31302f`)* | Upstream source build + isolated `mongo:4.4.29` | Separate MongoDB container | **Resolved** (Local source build with Dockerfile.experiment) |
| **Joomla** | `3.10.11` | [`joomla/joomla-cms`](https://github.com/joomla/joomla-cms) | `3.10.11` | [`01deee0a7b8cf91fc503b2cc13359c6e43aac47f`](https://github.com/joomla/joomla-cms/commit/01deee0a7b8cf91fc503b2cc13359c6e43aac47f) | **VERIFIED** | `joomla:3.10.11` + `mysql:5.6` | Official Docker Official Images (`library/joomla`, `library/mysql`) | Separate MySQL container via Compose | **Low** (Official library images) |
| **Kanboard** | `1.2.15` | [`kanboard/kanboard`](https://github.com/kanboard/kanboard) | `v1.2.15` | [`00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`](https://github.com/kanboard/kanboard/commit/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b) | **VERIFIED** | `kanboard/kanboard:v1.2.15` | Official vendor image (`kanboard`) | Internal SQLite inside container | **Low** (Official Docker Hub repo) |
| **MantisBT** | `1.2.0` | [`mantisbt/mantisbt`](https://github.com/mantisbt/mantisbt) | `release-1.2.0` | [`d06bf60f5ed9f96029bb830a005d4819a4f87b45`](https://github.com/mantisbt/mantisbt/commit/d06bf60f5ed9f96029bb830a005d4819a4f87b45) | **VERIFIED** | `dockercontainervm/mantisbt:1.2.0` / `olianasd/mantisbt-strongpsw:1.2.0` | Community archival / BEWT author namespace | Internal MySQL bundled in container | **High** (Community / personal images) |
| **MediaWiki** | `1.40.0` | [`wikimedia/mediawiki`](https://github.com/wikimedia/mediawiki) | `1.40.0` | [`468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4`](https://github.com/wikimedia/mediawiki/commit/468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4) | **VERIFIED** | `mediawiki:1.40.0` + `mariadb` | Official Docker Official Images (`library/mediawiki`) | Separate DB container via Compose | **Low** (Official library images) |
| **PrestaShop** | `1.6.1.23` | [`PrestaShop/PrestaShop`](https://github.com/PrestaShop/PrestaShop) | `1.6.1.23` | [`475d65fbda93403cd1afde0db09764c5295e952c`](https://github.com/PrestaShop/PrestaShop/commit/475d65fbda93403cd1afde0db09764c5295e952c) | **VERIFIED** | `prestashop/prestashop:1.6.1.23` + `mysql:5.7` | Official vendor image (`prestashop`) | Separate MySQL container via network | **Medium** (PrestaShop 1.6 image archived on Hub) |

---

## 3. Detailed Upstream Tag and Dereferenced Commit Verification

Each upstream tag was queried against GitHub's Git server using `git ls-remote`:

```text
44de235a5eedda9b80d9f0babd9fd5cb8c6943bd   refs/tags/2.3.4 (bludit/bludit)
6669cab412231f6c25c8385b8797646987be504e   refs/tags/3.10.11 (joomla/joomla-cms, annotated tag)
01deee0a7b8cf91fc503b2cc13359c6e43aac47f   refs/tags/3.10.11^{} (joomla/joomla-cms, peeled commit)
f9de5edffcfdd213464a43a102a34d1df9599356   refs/tags/v1.2.15 (kanboard/kanboard, annotated tag)
00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b   refs/tags/v1.2.15^{} (kanboard/kanboard, peeled commit)
951f31886ea1a68bb2e4403d27e56eece42f5ca9   refs/tags/release-1.2.0 (mantisbt/mantisbt, annotated tag)
d06bf60f5ed9f96029bb830a005d4819a4f87b45   refs/tags/release-1.2.0^{} (mantisbt/mantisbt, peeled commit)
e203c91abc705d73f4d2698d7b1e76c0604c2cc0   refs/tags/1.40.0 (wikimedia/mediawiki, annotated tag)
468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4   refs/tags/1.40.0^{} (wikimedia/mediawiki, peeled commit)
475d65fbda93403cd1afde0db09764c5295e952c   refs/tags/1.6.1.23 (PrestaShop/PrestaShop)
```

- **Bludit:** Lightweight tag `2.3.4` points directly to commit `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd`.
- **Joomla:** Annotated tag `3.10.11` resolves to commit `01deee0a7b8cf91fc503b2cc13359c6e43aac47f`.
- **Kanboard:** Annotated tag `v1.2.15` resolves to commit `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`.
- **MantisBT:** Annotated tag `release-1.2.0` resolves to commit `d06bf60f5ed9f96029bb830a005d4819a4f87b45`.
- **MediaWiki:** Annotated tag `1.40.0` resolves to commit `468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4`.
- **PrestaShop:** Lightweight tag `1.6.1.23` points directly to commit `475d65fbda93403cd1afde0db09764c5295e952c`.
- **Claroline:** Querying `refs/tags/1.11.10*` on `claroline/Claroline` yields zero matches. Upstream Claroline 1.11.10 was historically distributed as a tarball release via SourceForge before the repository transitioned to Claroline Connect. We mark this commit as **`NOT_VERIFIED`** rather than inventing a synthetic commit.

---

## 4. Critical Distinction: Source Commit vs Image Provenance

It is an elementary principle of empirical software engineering that **a source code release commit does NOT automatically prove Docker image identity**:
1. For **ExpressCart**, BEWT-CovExt established verifiable image identity by compiling the Docker image directly from upstream commit `b31302f4e99c3293bd742c6d076a721e168118b0` using `experiments/expresscart/source/Dockerfile.experiment`, calculating its build context digest and recording image ID.
2. For **vendor images** (`bludit/docker:2.3.4`, `kanboard/kanboard:v1.2.15`, `joomla:3.10.11`, `mediawiki:1.40.0`), the images were produced by upstream vendors, but their internal commit alignment is subject to vendor build processes.
3. For **author-provided images** (`olianasd/claroline-strongpsw`, `olianasd/mantisbt-strongpsw:1.2.0`), the images contain pre-configured databases, custom startup scripts, and pre-seeded user accounts. The exact Git commit used when packaging those layers cannot be inferred from the tag name alone and must be treated as archival artifacts.
4. Therefore, draft manifests (`docs/tasks/T02/manifests/*.draft.json`) must remain distinctly labelled as **DRAFT**, with `imageDigest: "NOT_PULLED_STATIC_AUDIT"`. Only upon runtime verification in Task T03 can an immutable image digest be pulled and verified.
