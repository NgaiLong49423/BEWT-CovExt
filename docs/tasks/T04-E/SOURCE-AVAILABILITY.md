# T04-E — Source availability

Application source was retrieved through GitHub commit, tree and pinned-file APIs. Per-file paths, line ranges, Git blob SHAs and immutable permalinks are recorded in `source-reference-index.json`. No application source files are copied into this public repository.

| App | Version | Pinned source | Availability |
|---|---|---|---|
| Bludit | 2.3.4 | `bludit/bludit@44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` | PINNED_RELEASE_SOURCE_AVAILABLE |
| Claroline | 1.11.10 | `zefredz/claroline@22d852f93081bc36b1d08b93f5e0c14b49a573f6` | PARTIAL_RELEASE_SOURCE_CORE_AVAILABLE |
| ExpressCart | 1.1.19 (BEWT label 1.19) | `mrvautin/expressCart@b31302f4e99c3293bd742c6d076a721e168118b0` | PINNED_SOURCE_AVAILABLE |
| Joomla | 3.10.11 | `joomla/joomla-cms@01deee0a7b8cf91fc503b2cc13359c6e43aac47f` | PINNED_RELEASE_SOURCE_AVAILABLE |
| MantisBT | 1.2.0 | `mantisbt/mantisbt@d06bf60f5ed9f96029bb830a005d4819a4f87b45` | PINNED_RELEASE_SOURCE_AVAILABLE |
| MediaWiki | 1.40.0 | `wikimedia/mediawiki@468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4` | PINNED_RELEASE_SOURCE_AVAILABLE |
| PrestaShop | 1.6.1.23 | `PrestaShop/PrestaShop@475d65fbda93403cd1afde0db09764c5295e952c` | PINNED_RELEASE_SOURCE_AVAILABLE |

Claroline's official 1.11.10 archive hash in T03-B2 is SHA-256 `666b63e3b4cf0d188a7f618c0c65493812f0ba2283e606d8f1ea8236072d9dd6`. Its release archive has 17 CLCHAT files absent from the Git tree, and the pinned runtime image contains one unattributed application-code patch. Candidates cite only inspected core files; source release is not equated with image/runtime behavior. Details: `docs/tasks/T03-B2/CLAROLINE-SOURCE-PROVENANCE.md` and its r12 comparison evidence.

Commit metadata supplies the source tree SHA. File Git blob SHA-1 values were matched at the pinned tree or returned by the pinned-file API; they are not locally recomputed SHA-256 checksums. No source clone, Docker, Gemini, Selenium or application runtime was used. No app is wholly `SOURCE_NOT_AVAILABLE`; Claroline is partial.

## T04-D baseline availability

All six per-app T04-D JSON inputs were parsed and compared with the task reports. The benchmark pin is BEWT `0501249ff3e9a5ea83a06155cd2971dc36197056`, tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`.

- Bludit: 23 features, 0 explicit Scenario headers, 23 suite entries.
- MantisBT: 38 features/scenarios, 37 suite entries; one feature-only.
- PrestaShop: 33 features/scenarios, 35 suite entries; two suite-only.
- Seven-app totals: 228 proposal labels, 227 feature files, 204 scenario headers, 228 suite entries, 226 structural mappings. T02's aggregate projection remains 227; unresolved.
- Behavior denominator remains NOT_ESTABLISHED. T04-D keyword tags are heuristic and were excluded from behavioral claims.

The directional 8–12 proposal/app range was not met: four per app (28 total) are included from the inspected modules. No additional candidates were inferred to fill a target. Further source/function and semantic review is needed before expanding proposals.
