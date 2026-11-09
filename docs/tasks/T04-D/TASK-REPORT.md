# T04-D seven-application static G1 coverage inventory

- Scope: Bludit, Claroline, ExpressCart, Joomla, MantisBT, MediaWiki, PrestaShop; G1 NOT_VERIFIED.
- BEWT-CovExt base SHA: ae149842185877bcd4a97cf99ebdb3fc099e040b; branch feature/t04d-seven-app-coverage; worktree D:\Github-Projects\BEWT-CovExt-worktrees\t04d-seven-app-coverage.
- Full local and remote HEAD SHA, PR URL, and push verification: recorded in the PR description and coordinator handoff after publication.
- Source pin: BEWT 0501249ff3e9a5ea83a06155cd2971dc36197056; tree d38fcc0eae8073023c48bb46998741c8c19d4d06.

## What changed

Per-app inventory, structural feature-to-TestSuite mapping, expected-outcome and Java assertion line references, source blob SHA index, and honest gap/shortlist status. Task docs cover denominators, gaps and human-review boundary. No STATUS.json or Kanboard files were changed.

## Actual verification

See TEST-RESULTS.md and evidence/verification/verify-inventory.txt. Static source analysis only; no application runtime, Docker, Selenium, Gemini or live application behavior was tested.

## Research impact

- T02 proposal label counts for the seven-app slice sum to 228; independently measured pinned-source denominators: 227 feature files, 204 explicit Scenario headers, 228 TestSuite business entries, 226 structural filename/class mappings. These are distinct metrics; heuristic tags are not used as the RQ2 denominator.
- Feature-only: 1 (MantisBT login feature); suite-only: 2 (PrestaShop).
- Static Java inspection found 228 @Test methods and 316 assertion-call source lines across TestSuite classes; exact method/assertion line references are in the mapping records. This is static evidence, not runtime validation.
- Gap candidates and human decisions: none asserted/created; novelty, oracle alignment and RQ2 denominator NOT_EVALUATED.
- All seven G1 gates remain NOT_VERIFIED.

## Integrity and limits

bewt-original absent and untouched. Source was fetched at a pinned public GitHub commit using the connector; shell clone was blocked by DNS, so local git cat-file verification was NOT_RUN. No raw source content is redistributed. Docker/Gemini NONE. Shared STATUS and Kanboard decision data unchanged. Review the source mappings and decide whether exact application source can be supplied for follow-up gap analysis.

- Secret/scope scan: PASS; zero known credential-token-prefix matches; staged paths limited to T04-D and the seven assigned apps. Evidence: docs/tasks/T04-D/evidence/verification/secret-and-scope-scan.txt.

## T02 cross-audit comparison

T02 reports 257 business Java test classes overall, or 258 TestSuite entries including the Bludit Installer helper. Its seven-app table rows imply 229 Java entries including Installer, or 228 business classes after excluding it; subtracting Kanboard (30) from the T02 aggregate gives 227. T04-D independently measured 228 business TestSuite entries from BEWT commit 0501249ff3e9a5ea83a06155cd2971dc36197056, excluding the Installer helper. The aggregate projection and row arithmetic therefore differ by one; this report preserves the discrepancy instead of reconciling or substituting denominators. Proposal labels also sum to 228 but are not class counts.

T02 records Bludit M2: Gherkin folder label bludit-3.13.1 versus baseline suite label bludit-2.3.4. That label mismatch is recorded in the Bludit artifacts and does not establish version equivalence. All filename-based class links are structural only, not semantic equivalence. Behavior tags are heuristic inference from Gherkin step keywords, not verified application functionality, and are not the RQ2 denominator.
