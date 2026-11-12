# Springer Nature manuscript

The authoritative source is `bewt-covext-paper.tex`; `bewt-covext-references.bib`, `sn-jnl.cls`, and `sn-mathphys-num.bst` are required in the same directory. The supplied Springer class and style are unmodified. Research evidence is pinned to repository snapshot `0c7f1e35fc0ad82ccf37df82c86b08863e83b9cf`; the final engineering checks were run on `55a3a3a6c3ea9fbffa72e773aaab57496e84a93f`.

## Build

With a current TeX installation, run `pdflatex bewt-covext-paper`, `bibtex bewt-covext-paper`, and `pdflatex bewt-covext-paper` twice more. Alternatively, Tectonic 0.17.0 was used with `tectonic --keep-logs --keep-intermediates bewt-covext-paper.tex`; it uses XeTeX while preserving the requested class option. Network or a populated bundle cache is required. Build warnings and remaining quality limitations are recorded in `MANUSCRIPT-QUALITY-REVIEW.md`.

The editable DOCX was generated from the same source using Pandoc 3.14 with a conversion-only input that expands the Springer abstract macro and substitutes the architecture image for the LaTeX minipage figure. The conversion input is included for audit, but the `.tex` manuscript is canonical. Rebuild with `pandoc --from=latex --to=docx --citeproc --bibliography=bewt-covext-references.bib --output=bewt-covext-paper.docx docx-conversion-input.tex`. Regenerate that input after any source edit; it is not an independent manuscript. The Word bibliography currently uses Pandoc's default citation style and must be harmonized for submission. The figure's editable draw.io source is `figures/architecture.drawio`.

Consult `PAPER-EVIDENCE-MATRIX.md` for claim provenance and `SUBMISSION-CHECKLIST.md` for unresolved information. No fresh application execution is implied by producing this paper.
