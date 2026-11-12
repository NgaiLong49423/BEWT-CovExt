# SCIENTIFIC-PAPER-20261113 — Scientific manuscript

- Scope: author a Springer Nature research manuscript from the final closure evidence without advancing research gates.
- Base: `origin/main` at `0c7f1e35fc0ad82ccf37df82c86b08863e83b9cf`; tested acceptance source `55a3a3a6c3ea9fbffa72e773aaab57496e84a93f`.
- Branch: `docs/scientific-paper`. Head and PR are recorded in the Git/PR history and handoff, avoiding a self-referential commit hash.
- Proposed status: `PARTIAL`, pending DOCX layout verification, author metadata and Team Lead review.

## Changes

The English manuscript, bibliography, Springer dependencies, PDF, editable DOCX, figure sources, evidence matrix, quality review, and submission checklist are in `docs/paper/springer-nature/`. `docs/program/STATUS.json` records paper authoring only; existing gates and acceptance decisions are unchanged.

## Verification

| Check | Result | Evidence and limitation |
|---|---|---|
| Tectonic 0.17.0 with Springer class and BibTeX | PASS | Ten-page PDF generated; no final overfull or undefined-reference warning. Underfull, Fontconfig and one bibliography sort warning remain. |
| PDF rendering | PARTIAL | Ten pages rendered and contact sheet reviewed; detailed full-resolution inspection remains. |
| Pandoc 3.14 DOCX conversion | PARTIAL | Abstract, three tables and one figure present in OOXML; citation style differs from PDF. |
| DOCX visual render | BLOCKED | `render_docx.py` could not find LibreOffice; layout and parity are not yet verified. |
| Research checks | PARTIAL | Evidence matrix separates historical audit and source revisions; independent human scientific review pending. |
| Live app/Docker/Selenium | NOT RUN | Out of scope for manuscript authoring; no new execution claimed. |

## Safety and research impact

`bewt-original/` and Docker resources were not touched. Existing unrelated untracked files were preserved. No research gate or candidate was promoted. The evidence does not support a behavioural coverage gain, measured model cost or human productivity gain. Author metadata and declarations are unconfirmed; see `docs/paper/springer-nature/SUBMISSION-CHECKLIST.md`.
