# G2 40-Case Semantic Mapping Audit

## Scope and result

This is a static semantic audit of the latest existing Java revision for each of the 40 registered candidates at task base 8c1abafb5254af73bdc43ef9d2f5849bd5c64b00. The matrix contains 30 R2 and 10 R3 candidates. EC-GAP-002 and KB-GAP-001 remain in the matrix for traceability but were excluded from corrective edits because PR #32 and PR #30 are active.

The machine-readable matrix is 40-CASE-SEMANTIC-MATRIX.json. It records exact Java paths/hashes and line ranges; embedded Gherkin/oracle text; actual actions/assertions; repository and candidate source pins; source review state/detail; and compile/G3 evidence by revision. R2 outcomes are labeled historical when a later R3 exists and are not assigned to that later revision.

The line review classifies 0 as MATCHED, 22 as WRONG_BEHAVIOR, 15 as PARTIALLY_IMPLEMENTED, and 3 as WEAK_ORACLE. This revises the earlier aggregate: KB-GAP-002 actually types and submits the comment (latest Java lines 40-42), but its assertion accepts a generic page title (line 44), so persisted comment visibility is unproven. KB-GAP-008 saves and checks text/list presence (lines 41-46), but uses Subtask 001 instead of the specified title and does not assert TODO status; its corrected classification is partial implementation.

## Source evidence and repair boundary

Proposal source references were checked independently where possible. Missing or mismatched anchors are marked BLOCKED or NOT_VERIFIED and were not used as a correction basis. Examples include Kanboard's proposal repository/commit pin, Claroline's tracking controller path, the PrestaShop StockAvailable path, and source ranges that point to unrelated or incomplete methods. Exact paths, commits, ranges, and dispositions are preserved per case.

Verified observations include Bludit page-status separation/scheduler invocation; Joomla's article model version increment at administrator/components/com_content/models/article.php:275-276 and the history toolbar/modal; and Mantis monitor, note, relationship, and attachment handlers at the pinned source commit. These do not establish missing runtime fixtures, credentials for scenario actors, or observable postconditions. Specifically, the Joomla history modal renders date, author, and character count but does not expose a direct version-number label; the candidate requires a DB-level version-counter assertion. The Mantis baseline test setup authenticates the admin account, while MB-GAP-001's scenario requires dev_dave; that account's credentials/setup are not provided by the candidate test.

No source-backed Java revision was created in this pass: the candidate source and Gherkin review exposed material fixture/oracle gaps, and the source references for other candidates were not consistently sufficient to justify implementation without inventing setup or postconditions. This leaves implementation work open rather than implying acceptance.

## Runtime and acceptance

The matrix preserves declared R2 compile/G3 results as historical evidence and marks latest R3 outcomes NOT_RECORDED where no matching run record exists. Existing runtime provenance does not bind the audited test revision to application commit, test hash, and image digest. This task performed no browser, Docker, VM, application mutation, or G3 runs. No Java source or test was changed.

Human oracle/novelty approval remains pending and was not inferred. No candidate is marked VALIDATED. The artefacts are a static G2 audit addendum only.
