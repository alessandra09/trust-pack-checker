"""SYNTHETIC QA fixtures for SPRINT2 task 4. All companies and text are fictional.
Writes eval/fixtures/out/ (git-ignored; large files are regenerated, not committed).
Run: python3 eval/fixtures/make_qa_fixtures.py  (needs reportlab, python-docx, pypdf, openpyxl)."""
import csv
import io
import re
import zipfile
from pathlib import Path

from docx import Document
from openpyxl import Workbook
from openpyxl.worksheet.datavalidation import DataValidation
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "eval/fixtures/out"
OUT.mkdir(parents=True, exist_ok=True)
PACK_A = (ROOT / "eval/packs/pack-a/docs/dpa.md").read_text()
PACK_D = (ROOT / "eval/packs/pack-d/docs/dpa.md").read_text()
QUESTIONS = [r["Question"] for r in csv.DictReader((ROOT / "eval/packs/pack-c/questionnaire.csv").open())]
VENDOR_ROWS = list(csv.DictReader((ROOT / "eval/packs/pack-d/answers.csv").open()))


def section(md: str, heading: str, body: str | None) -> str:
    """Replaces (or with body=None removes) the section that starts with `heading`."""
    pattern = re.compile(rf"(^## {re.escape(heading)}.*?\n)(.*?)(?=^## |\Z)", re.S | re.M)
    return pattern.sub(lambda m: "" if body is None else f"{m.group(1)}\n{body}\n\n", md, count=1)


VARIANTS = {
    "dpa-complete": PACK_A,
    "dpa-defects": section(section(PACK_A, "4. Confidentiality", None), "10. Deletion", None),
    "dpa-by-reference": section(
        PACK_A,
        "5. Security",
        "5.1 The Processor shall implement the technical and organisational measures set out in "
        "Schedule 4 of the Master Services Agreement, which is incorporated into this DPA by reference.",
    ),
    "dpa-decoy-audit": section(
        PACK_A,
        "11. Information and audits",
        "11.1 The Processor's internal audit team reviews its own financial controls each year. "
        "This internal audit is for the Processor's management only.",
    ),
    "dpa-non-english": PACK_A
    + "\n\n## 14. Sprachfassung\n\nDiese Vereinbarung wird in englischer Sprache geschlossen. "
    "Eine deutsche Übersetzung dient nur der Information und ist nicht verbindlich.\n",
}


def md_lines(md: str):
    for line in md.splitlines():
        if line.strip():
            yield line


def write_pdf(md: str, path: Path, pages: int | None = None):
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    y = height - 60
    count = 1

    def newpage():
        nonlocal y, count
        c.showPage()
        count += 1
        y = height - 60

    for line in md_lines(md):
        if line.startswith("|---"):
            continue
        text = line.lstrip("#").strip().replace("|", "  ")
        font = ("Helvetica-Bold", 12) if line.startswith("#") else ("Helvetica", 10)
        words, cur = text.split(), ""
        for w in words:
            if c.stringWidth(f"{cur} {w}", *font) > width - 120:
                c.setFont(*font)
                c.drawString(60, y, cur)
                y -= 15
                cur = w
                if y < 60:
                    newpage()
            else:
                cur = f"{cur} {w}".strip()
        c.setFont(*font)
        c.drawString(60, y, cur)
        y -= 20
        if y < 60:
            newpage()
    while pages and count < pages:
        newpage()
        c.setFont("Helvetica", 10)
        c.drawString(60, y, f"Schedule page {count}. This page is intentionally left without further terms.")
    c.save()


def write_docx(md: str, path: Path):
    doc = Document()
    table_rows = []
    for line in md_lines(md):
        m = re.match(r"^(#+)\s+(.*)", line)
        if line.startswith("|"):
            if not line.startswith("|---"):
                table_rows.append([c.strip() for c in line.strip("|").split("|")])
            continue
        if table_rows:
            t = doc.add_table(rows=0, cols=len(table_rows[0]))
            t.style = "Table Grid"
            for row in table_rows:
                for cell, v in zip(t.add_row().cells, row):
                    cell.text = v
            table_rows = []
        if m:
            doc.add_heading(m.group(2), level=min(len(m.group(1)), 3))
        elif re.match(r"^\d+\.\d+ ", line):
            doc.add_paragraph(line, style="List Number")
        elif line.startswith("- "):
            doc.add_paragraph(line[2:], style="List Bullet")
        else:
            doc.add_paragraph(line)
    if table_rows:
        t = doc.add_table(rows=0, cols=len(table_rows[0]))
        for row in table_rows:
            for cell, v in zip(t.add_row().cells, row):
                cell.text = v
    doc.save(path)


def numbered(q: str, i: int) -> str:
    """Makes repeated questions unique while keeping the question mark at the end."""
    if i < len(QUESTIONS):
        return q
    return f"{q[:-1]} (item {i + 1})?" if q.endswith("?") else f"{q} (item {i + 1})"


def questionnaire_xlsx(path: Path, n: int):
    wb = Workbook()
    cover = wb.active
    cover.title = "Cover"
    cover["A1"] = "Supplier security questionnaire (SYNTHETIC: Fernhollow Retail Ltd)"
    cover.merge_cells("A1:E1")
    cover["A3"] = "Please answer every question on the Questions sheet."
    ws = wb.create_sheet("Questions")
    ws["A1"] = "Fernhollow Retail Ltd: supplier review"
    ws.merge_cells("A1:E1")
    ws["A2"] = "Answer Yes or No and add a comment where needed."
    ws.append([])
    ws.append(["Ref", "Category", "Question", "Answer", "Comments"])
    dv = DataValidation(type="list", formula1='"Yes,No,N/A"', allow_blank=True)
    ws.add_data_validation(dv)
    hidden = 0
    for i in range(n):
        if i % 20 == 0:
            ws.append(["", "", f"Section {i // 20 + 1}: data protection", "", ""])
        q = numbered(QUESTIONS[i % len(QUESTIONS)], i)
        ws.append([f"F{i + 1:04d}", "Privacy", q, "", ""])
        dv.add(f"D{ws.max_row}")
        if i in (3, 7):
            ws.row_dimensions[ws.max_row].hidden = True
            hidden += 1
    wb.create_sheet("Notes")["A1"] = "Internal notes for the buyer."
    wb.save(path)
    return n - hidden


def questionnaire_csv(path: Path, n: int, sep: str):
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=sep)
    w.writerow(["ID", "Question", "Answer", "Comments"])
    for i in range(n):
        w.writerow([f"C{i + 1:04d}", numbered(QUESTIONS[i % len(QUESTIONS)], i), "", ""])
    path.write_bytes(("﻿" + buf.getvalue()).encode("utf-8"))


def vendor_xlsx(path: Path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Vendor answers"
    ws.append(["Supplier answers (SYNTHETIC)"])
    ws.append([])
    ws.append(["No.", "Topic", "Question", "Supplier answer"])
    for r in VENDOR_ROWS:
        ws.append([r["ID"], "Privacy", r["Question"], r["Answer"]])
    wb.save(path)


def main():
    for name, md in VARIANTS.items():
        (OUT / f"{name}.md").write_text(md)
    (OUT / "dpa-complete.txt").write_text(re.sub(r"^#+\s*", "", PACK_A, flags=re.M))
    for name in VARIANTS:
        write_pdf(VARIANTS[name], OUT / f"{name}.pdf")
        write_docx(VARIANTS[name], OUT / f"{name}.docx")
    write_docx(PACK_D, OUT / "vendor-dpa.docx")
    write_pdf(PACK_D, OUT / "vendor-dpa.pdf")
    vendor_xlsx(OUT / "vendor-answers.xlsx")

    counts = {}
    for n in (20, 60, 500):
        counts[f"questionnaire-{n}.xlsx"] = questionnaire_xlsx(OUT / f"questionnaire-{n}.xlsx", n)
    questionnaire_csv(OUT / "questionnaire-60-semicolon.csv", 60, ";")
    questionnaire_csv(OUT / "questionnaire-60-comma.csv", 60, ",")
    questionnaire_csv(OUT / "questionnaire-1999.csv", 1999, ",")  # 2,000 rows with the header
    questionnaire_csv(OUT / "questionnaire-2000.csv", 2000, ",")  # 2,001 rows: over the limit
    (OUT / "counts.txt").write_text("\n".join(f"{k}={v}" for k, v in counts.items()))

    # Edge cases
    c = canvas.Canvas(str(OUT / "edge-scanned.pdf"), pagesize=A4)
    for _ in range(3):
        c.setFillGray(0.85)
        for y in range(80, 760, 18):
            c.rect(60, y, 470, 9, stroke=0, fill=1)
        c.showPage()
    c.save()
    reader = PdfReader(str(OUT / "dpa-complete.pdf"))
    writer = PdfWriter()
    for p in reader.pages:
        writer.add_page(p)
    writer.encrypt("synthetic-password")
    with open(OUT / "edge-password.pdf", "wb") as f:
        writer.write(f)
    (OUT / "edge-corrupt.docx").write_bytes(b"PK\x03\x04 this is not a real docx archive " * 20)
    (OUT / "edge-empty.pdf").write_bytes(b"")
    write_pdf(PACK_A, OUT / "edge-300-pages.pdf", pages=300)
    write_pdf(PACK_A, OUT / "edge-301-pages.pdf", pages=301)
    with open(OUT / "edge-26mb.txt", "w") as f:
        line = "Synthetic filler text for a size test. " * 10 + "\n"
        f.write(line * (26 * 1024 * 1024 // len(line) + 1))
    (OUT / "edge-old.doc").write_bytes(bytes.fromhex("D0CF11E0A1B11AE1") + b"\0" * 2048)
    with zipfile.ZipFile(OUT / "edge-file.pages", "w") as z:
        z.writestr("Index/Document.iwa", b"synthetic")


if __name__ == "__main__":
    main()
