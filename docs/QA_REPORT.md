# QA report (Sprint 2, task 4)

Run on 2026-11-27 against the production build (`npm run build`, `vite preview`) in headless Chromium at 1280 x 800. Every file was uploaded through the real upload screen, checked, exported (HTML report, plus the XLSX copy for questionnaires) and reopened.

**Result: 27 of 27 scenarios pass** after the fixes below. On the first run, 5 scenarios failed because of tool bugs (fixed below); other early failures were mistakes in the test script or fixtures, fixed there.

How to repeat: `python3 eval/fixtures/make_qa_fixtures.py`, then `npm run build && npx vite preview --port 4173` and `npx tsx eval/fixtures/run-qa.ts`. All files are synthetic (fictional companies) and are regenerated, not committed.

## How "expected" is decided

- **DPA files** (MD, TXT, PDF, DOCX): the UI must show the same number of "Not found in text" elements as the core engine gives for the `.md` text of the same document. This checks that each format is read as well as plain text.
- **Questionnaires**: the "questions found" count must equal the number of visible questions in the file (hidden rows and section rows excluded), the run must finish, and the XLSX export must keep every original cell unchanged (results go into new columns).
- **Vendor mode**: the number of contradictions must equal the number on the `.md` and `.csv` sample (10).
- **Edge cases**: the right message must appear, with no crash or page error.

## Scenarios

| Scenario                       | Files                                            | Expected                                                                                                 | Actual                                                                              | Result | Time  | Screenshot                                   |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------ | ----- | -------------------------------------------- |
| dpa-complete-md                | dpa-complete.md                                  | 1 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.8 s | [png](qa/dpa-complete-md.png)                |
| dpa-complete-txt               | dpa-complete.txt                                 | 1 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.7 s | [png](qa/dpa-complete-txt.png)               |
| dpa-complete-pdf               | dpa-complete.pdf                                 | 1 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.9 s | [png](qa/dpa-complete-pdf.png)               |
| dpa-complete-docx              | dpa-complete.docx                                | 1 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.8 s | [png](qa/dpa-complete-docx.png)              |
| dpa-defects-pdf                | dpa-defects.pdf                                  | 2 of 20 Art. 28 elements not found, same as the .md text (confidentiality and deletion removed)          | as expected                                                                         | PASS   | 0.9 s | [png](qa/dpa-defects-pdf.png)                |
| dpa-defects-docx               | dpa-defects.docx                                 | 2 of 20 Art. 28 elements not found, same as the .md text (confidentiality and deletion removed)          | as expected                                                                         | PASS   | 0.8 s | [png](qa/dpa-defects-docx.png)               |
| dpa-by-reference-docx          | dpa-by-reference.docx                            | 1 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.9 s | [png](qa/dpa-by-reference-docx.png)          |
| dpa-decoy-audit-pdf            | dpa-decoy-audit.pdf                              | 2 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.9 s | [png](qa/dpa-decoy-audit-pdf.png)            |
| dpa-non-english-docx           | dpa-non-english.docx                             | 1 of 20 Art. 28 elements not found, same as the .md text                                                 | as expected                                                                         | PASS   | 0.8 s | [png](qa/dpa-non-english-docx.png)           |
| dpa-300-pages-pdf              | edge-300-pages.pdf                               | 1 of 20 Art. 28 elements not found, same as the .md text (300 pages, at the limit)                       | as expected                                                                         | PASS   | 1.1 s | [png](qa/dpa-300-pages-pdf.png)              |
| questionnaire-20-xlsx          | dpa-complete.md + questionnaire-20.xlsx          | 18 questions found; export keeps every original cell outside the answer column                           | as expected; export: original cells unchanged; 18 rows got a status in new columns  | PASS   | 1 s   | [png](qa/questionnaire-20-xlsx.png)          |
| questionnaire-60-xlsx          | dpa-complete.md + questionnaire-60.xlsx          | 58 questions found; export keeps every original cell outside the answer column                           | as expected; export: original cells unchanged; 58 rows got a status in new columns  | PASS   | 1 s   | [png](qa/questionnaire-60-xlsx.png)          |
| questionnaire-500-xlsx         | dpa-complete.md + questionnaire-500.xlsx         | 498 questions found; export keeps every original cell outside the answer column                          | as expected; export: original cells unchanged; 498 rows got a status in new columns | PASS   | 1.3 s | [png](qa/questionnaire-500-xlsx.png)         |
| questionnaire-60-comma-csv     | dpa-complete.md + questionnaire-60-comma.csv     | 60 questions found; export keeps every original cell outside the answer column                           | as expected; export: XLSX copy created from CSV                                     | PASS   | 0.8 s | [png](qa/questionnaire-60-comma-csv.png)     |
| questionnaire-60-semicolon-csv | dpa-complete.md + questionnaire-60-semicolon.csv | 60 questions found; export keeps every original cell outside the answer column                           | as expected; export: XLSX copy created from CSV                                     | PASS   | 0.8 s | [png](qa/questionnaire-60-semicolon-csv.png) |
| questionnaire-1999-csv         | dpa-complete.md + questionnaire-1999.csv         | 1999 questions found; export keeps every original cell outside the answer column                         | as expected; export: XLSX copy created from CSV                                     | PASS   | 2.7 s | [png](qa/questionnaire-1999-csv.png)         |
| vendor-docx-xlsx               | vendor-dpa.docx + vendor-answers.xlsx            | 10 contradictions, as on the .md and .csv sample                                                         | as expected                                                                         | PASS   | 0.9 s | [png](qa/vendor-docx-xlsx.png)               |
| vendor-pdf-xlsx                | vendor-dpa.pdf + vendor-answers.xlsx             | 10 contradictions, as on the .md and .csv sample                                                         | as expected                                                                         | PASS   | 0.8 s | [png](qa/vendor-pdf-xlsx.png)                |
| edge-scanned                   | edge-scanned.pdf                                 | message: "This PDF looks scanned. v1 cannot read scanned PDFs. Export a text version or paste the text." | message shown, no crash                                                             | PASS   | 0.7 s | [png](qa/edge-scanned.png)                   |
| edge-password                  | edge-password.pdf                                | message: "is password-protected. Remove the password and try again."                                     | message shown, no crash                                                             | PASS   | 0.7 s | [png](qa/edge-password.png)                  |
| edge-corrupt                   | edge-corrupt.docx                                | message: "could not be read. The file may be damaged."                                                   | message shown, no crash                                                             | PASS   | 0.5 s | [png](qa/edge-corrupt.png)                   |
| edge-empty                     | edge-empty.pdf                                   | message: "contains no text."                                                                             | message shown, no crash                                                             | PASS   | 0.6 s | [png](qa/edge-empty.png)                     |
| edge-301-pages                 | edge-301-pages.pdf                               | message: "has more than 300 pages."                                                                      | message shown, no crash                                                             | PASS   | 0.7 s | [png](qa/edge-301-pages.png)                 |
| edge-26mb                      | edge-26mb.txt                                    | message: "is larger than 25 MB."                                                                         | message shown, no crash                                                             | PASS   | 0.6 s | [png](qa/edge-26mb.png)                      |
| edge-old                       | edge-old.doc                                     | message: "is not a supported file type."                                                                 | message shown, no crash                                                             | PASS   | 0.6 s | [png](qa/edge-old.png)                       |
| edge-file                      | edge-file.pages                                  | message: "is not a supported file type."                                                                 | message shown, no crash                                                             | PASS   | 0.5 s | [png](qa/edge-file.png)                      |
| questionnaire-2000             | questionnaire-2000.csv                           | message: "has more than 2,000 rows."                                                                     | message shown, no crash                                                             | PASS   | 0.5 s | [png](qa/questionnaire-2000.png)             |

## Bugs found and fixed (each with a regression test)

1. **Questionnaire with a cover sheet read as one question.** The detector took the first sheet that looked like a questionnaire, so an instruction line on a cover sheet ("Please answer every question...") won. It now takes the sheet with the most questions. Test: `qa.test.ts` "picks the sheet with the most questions".
2. **Header row below title rows not found.** Only the first row was checked for a header, so the answer column was guessed from title rows. The first 10 rows are now searched. Test: "finds the header below title rows".
3. **Category column used as the question ID.** The column left of the question was always the ID; with a "Category" column every question got the same ID, so answers overwrote each other. The ID is now a column named ID/Ref/No., or the nearest column with unique values. Test: "does not use a repeated category column as the ID".
4. **Hidden rows counted in "questions found".** The upload screen counted hidden rows that the check then skips (20 shown, 18 checked). The count now shows only checked questions and says how many hidden rows are skipped.
5. **PDF line breaks split sentences.** PDF text kept every visual line break, so "train its machine / learning models" was two units and the AI-training and audit checks missed them in PDFs (8 of 10 contradictions found). Lines that do not end a sentence are now joined when the next starts in lower case. Test: `ingest.test.ts` "unwrapLines".
6. **Sub-processor table rows from DOCX and PDF not read as locations.** The EU-only check needed a leading `|`; DOCX rows have inner pipes only and PDF rows have none. Rows with `|` and rows under a sub-processor heading now count. Tests: `consistency.test.ts` "QA regressions: DOCX and PDF text".

## Known issues (not fixed)

- **A planted defect is still missed without AI.** In `dpa-defects`, removing the deletion clause (Art. 28(3)(g)) leaves it "Partly found", because other sentences mention deletion. Removing confidentiality (28(3)(b)) is caught. Changing rule hints needs the owner's approval, so this stays as a published limitation.
- **A single non-English paragraph gives no warning.** The language warning looks at the whole document; one German clause in an English DPA passes silently. Acceptable for v1, noted.
- **Pasted vendor answers are not supported.** Vendor answers must be a CSV or XLSX file; there is no paste box. Listed for a later version.
- **The 2,000-row limit counts every row in every sheet**, including headers and cover sheets. A CSV with a header and 1,999 questions works; one with 2,000 questions is refused with a clear message.
- **The incorporated-by-reference DPA** gets "Partly found" for security, with the reference sentence as the passage; the report's "What this tool did not check" says referenced documents are not checked.

## Lighthouse (mobile, production build, 2026-11-27)

| Page                                   | Performance | Accessibility | Best practices | SEO |
| -------------------------------------- | ----------- | ------------- | -------------- | --- |
| Landing                                | 96          | 100           | 96             | 100 |
| /pilot/                                | 99          | 100           | 96             | 100 |
| /guides/gdpr-article-28-dpa-checklist/ | 99          | 100           | 96             | 100 |

Run locally with `npx lighthouse` against `vite preview`; Lighthouse is not a project dependency. Best practices stays at 96 on every page because Chrome logs a "Content security policy" item in its Issues panel. It does not block anything the site needs (the e2e suite checks for CSP violations and console errors); it is left as a known issue to look into.

## Not covered by this run

Real customer documents (none are used, by rule), browsers other than Chromium, and AI mode (task 7).

## AI Act facts (Sprint 2, task 8), checked 2026-11-27

Every date shown in the AI use tab has a source and a "last verified on" date (`src/data/dates.json`). Nothing was hidden: every item was confirmed by at least one official or well-known legal source. Where the EUR-Lex body text could not be fetched, that is said in the item's note.

| Item                                                               | Value                                                                                                | Checked against                                                            |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Amending act                                                       | Regulation (EU) 2026/1744 (Digital Omnibus on AI), 8 July 2026, in force 27 July 2026                | EUR-Lex record (title and dates)                                           |
| Prohibited practices (Art. 5)                                      | since 2 Feb 2025                                                                                     | Commission AI Act Service Desk, FPF, Gibson Dunn                           |
| Art. 5(1)(f)                                                       | inferring emotions in the workplace and education institutions, except for medical or safety reasons | Commission AI Act Service Desk (consolidated text, 27 July 2026), verbatim |
| AI literacy (Art. 4)                                               | "take measures to support the development of AI literacy", since 2 Feb 2025                          | FPF (quotes the amended text); Gibson Dunn agrees in substance             |
| Transparency (Art. 50)                                             | 2 Aug 2026                                                                                           | FPF, Gibson Dunn                                                           |
| Art. 50(2) marking, systems placed on the market before 2 Aug 2026 | 2 Dec 2026 (new Art. 111(4))                                                                         | Gibson Dunn, euai-act.com                                                  |
| High-risk, Annex III                                               | 2 Dec 2027                                                                                           | FPF, Gibson Dunn                                                           |
| High-risk, Annex I                                                 | 2 Aug 2028                                                                                           | FPF, Gibson Dunn                                                           |

To do before relying on this: read Art. 4, Art. 111(4) and Art. 113 in the EUR-Lex text of Regulation (EU) 2026/1744 (the automated fetch returned only the record page). Not shown in the tool: the new Art. 5(1)(ba)/(bb) prohibitions (intimate imagery without consent, child sexual abuse material, from 2 Dec 2026), because no question in SPEC 10.2 covers them.
