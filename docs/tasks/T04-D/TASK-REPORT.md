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

- Proposal labels: 228; physical features: 227; explicit Scenario headers: 204; TestSuite business entries: 228; structural mappings: 226.
- Feature-only: 1 (MantisBT login feature); suite-only: 2 (PrestaShop).
- Static Java inspection found 228 @Test methods and 316 assertion-call source lines across TestSuite classes; exact method/assertion line references are in the mapping records. This is static evidence, not runtime validation.\n- Gap candidates and human decisions: none asserted/created; novelty, oracle alignment and RQ2 denominator NOT_EVALUATED.
- All seven G1 gates remain NOT_VERIFIED.

## Integrity and limits

bewt-original absent and untouched. Source was fetched at a pinned public GitHub commit using the connector; shell clone was blocked by DNS, so local git cat-file verification was NOT_RUN. No raw source content is redistributed. Docker/Gemini NONE. Shared STATUS and Kanboard decision data unchanged. Review the source mappings and decide whether exact application source can be supplied for follow-up gap analysis.

- Secret/scope scan: PASS; zero known credential-token-prefix matches; staged paths limited to T04-D and the seven assigned apps. Evidence: docs/tasks/T04-D/evidence/verification/secret-and-scope-scan.txt.
