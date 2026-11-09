# T04-D seven-application static baseline counts

BEWT commit: 0501249ff3e9a5ea83a06155cd2971dc36197056; tree: d38fcc0eae8073023c48bb46998741c8c19d4d06. This indexes benchmark files; it does not establish all application behavior.

| App | Proposal entries | .feature files | Explicit Scenario headers | TestSuite business entries | Structural matches | Feature only | Suite only |
|---|---:|---:|---:|---:|---:|---:|---:|
| bludit | 23 | 23 | 0 | 23 | 23 | 0 | 0 |
| claroline | 40 | 40 | 40 | 40 | 40 | 0 | 0 |
| expresscart | 31 | 31 | 31 | 31 | 31 | 0 | 0 |
| joomla | 35 | 35 | 35 | 35 | 35 | 0 | 0 |
| mantisbt | 37 | 38 | 38 | 37 | 37 | 1 | 0 |
| mediawiki | 27 | 27 | 27 | 27 | 27 | 0 | 0 |
| prestashop | 35 | 33 | 33 | 35 | 33 | 0 | 2 |
| TOTAL | 228 | 227 | 204 | 228 | 226 | 1 | 2 |

Proposal, physical feature, explicit scenario and Java suite counts are distinct denominators. Bludit has 23 feature files but 0 explicit Scenario headers; MantisBT has one feature without a suite class; PrestaShop has two suite classes without feature files. RQ2 behavioral denominator, novelty and oracle alignment remain NOT_EVALUATED; all seven G1 gates remain NOT_VERIFIED. See per-app data/coverage records for source paths and blob SHAs.

## Java source mapping

The pinned TestSuite references 228 business test methods with 316 matched assertion-call source lines in those methods/classes. Per-class method and assertion line numbers are listed in baseline-mapping.json. These code locations do not by themselves prove semantic agreement with the Gherkin oracle.
