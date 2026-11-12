from docx import Document
from docx.shared import Inches, Mm
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph
p='bewt-covext-paper.docx'
d=Document(p)
for s in d.sections:
    s.page_width=Mm(210); s.page_height=Mm(297)
for para in d.paragraphs:
    if para.style.name=='Author' and not para.text:
        para.add_run('Author details and affiliation pending')
    if para.style.name=='Bibliography':
        e=OxmlElement('w:p'); para._p.addprevious(e)
        heading=Paragraph(e,para._parent); heading.style='Heading 1'; heading.add_run('References')
        break
for table in d.tables:
    for i,row in enumerate(table.rows):
        for cell in row.cells:
            for para in cell.paragraphs:
                para.paragraph_format.keep_with_next=(i<len(table.rows)-1)
t=d.tables[1]; t.autofit=False
widths=[1.55,1.05,0.9,0.5,0.5,0.5]
for col,w in zip(t.columns,widths): col.width=Inches(w)
for row in t.rows:
    for cell,w in zip(row.cells,widths): cell.width=Inches(w)
d.save(p)
