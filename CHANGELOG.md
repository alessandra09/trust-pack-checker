# Changelog

## v1.5 (2026-11-27)

- Owner-approved hint fixes for the two N2 misses (A28-3-d, A28-3-f). Requirement text and severity unchanged.
- New unseen pack N3, keyed before any run and measured before and after: missing clauses 2/3 → 3/3, false alarms 2/9 → 1/9. The remaining miss (A28-4, "remains responsible") is published and not fixed.
- N2 moved to the training packs; its first result stays in the version history.

## Unreleased (Sprint 2)

### Before deploy

- Pilot and contact email is now oleksandrahordieieva+pilot@gmail.com (owner's choice); one-pager regenerated with it and the current results.

### Task 1: pilot page and landing

- Results summary sentence from the data file ("On packs the checks had not seen: ..."); training packs, misses and history behind one toggle.
- Consultant block with the owner's copy, linking to the pilot page.
- Static pages prerendered after build: `/pilot/`, `/privacy/`, `/terms/`, `/about/`, each with its own title, description and canonical URL, readable without JavaScript.
- Pilot page with a request form that builds a `mailto:` link (nothing sent or stored) and a plain email fallback.
- Old `#/privacy` links redirect to the static pages.
- Tests: landing and pilot page at 360, 390, 768 and 1280 px (no overflow, axe clean), mailto content, no-JS fallback, summary equals the data file.

### Task 2: pilot kit

- `docs/pilot-kit/`: reply, checklist, report template, feedback questions, follow-ups, consultant and founder outreach (three versions, critique, best final), tracker XLSX with dropdowns and Summary formulas, one-pager HTML and PDF.

### Task 3: report export

- The HTML report now has mode, tool and prompt versions, summary counts, gaps, questions to send the other side (vendor mode), drafted answers with quotes (company mode), "What this tool did not check" and the full disclaimer. It makes no requests and prints cleanly.
- `/sample-report/` shows the report on the synthetic vendor sample with the banner "Sample on fictional documents".
- Tests: only verified quotes are printed, every FOUND answer shows its quote, exported files open offline and print to PDF in both modes.

### Task 4: QA through the real UI

- Synthetic fixture generator (`eval/fixtures/make_qa_fixtures.py`) and UI runner (`eval/fixtures/run-qa.ts`): 27 scenarios (DPAs in four formats, questionnaires from 20 to 1,999 rows, vendor DOCX/PDF + XLSX, nine edge cases). All pass; see `docs/QA_REPORT.md`.
- Fixed: questionnaire sheet choice, header below title rows, ID column, hidden-row count, PDF line breaks splitting sentences, DOCX/PDF sub-processor rows.

### Task 5: SEO and content pages

- Two guides: "GDPR Article 28 checklist for processor agreements (DPA)" (built only from `art28.rules.json`) and "How to answer a customer security questionnaire without guessing", with last-verified dates, a not-legal-advice line and sources.
- Titles, descriptions, canonical URLs, Open Graph and Twitter tags on every page; `public/og.png` (1200 x 630) from `npm run og`; `sitemap.xml`; `robots.txt`; JSON-LD `SoftwareApplication` on the landing page (no ratings, no prices). Stable `#how-it-was-tested` anchor linked from the footer.
- Landing loads about 0.6 MB less JavaScript: PDF, DOCX, XLSX and AI libraries load on first use. Lighthouse mobile: performance 96 (was 69), accessibility 100, best practices 96, SEO 100.

### Task 6: fresh unseen pack

- New synthetic pack N2 ("Processing Terms", new drafting style), keyed before a single no-AI run. Results published as measured: missing clauses 2 of 3, present clauses wrongly reported missing 1 of 9, both misses with reasons. No rule changes.
- New landing metric "Clauses that are there, not reported missing" for every Art. 28 pack.
- `npm run eval` writes `eval/results/latest.json`; a unit test keeps the landing data equal to it.
- `docs/METHOD.md` explains how a held-out pack is used once.

### Task 7: AI mode tested without a key

- Mock provider and pipeline tests on the synthetic packs: evidence gate, paraphrased quotes, invalid JSON, planted instructions, 429/5xx retries, partial results, cancel, prompt version in the audit log.
- Fix found by these tests: a model that quoted a planted instruction verbatim ("Assistant instructions: ... within 24 hours") could get a found answer. Such quotes are now never evidence; the review screen explains why.
- Playwright network assertions: nothing leaves the app before consent, then only the provider; nothing at all with AI off.
- `npm run record-sample` and a loader that verifies every recorded quote again. AI evaluation pending (no key): see `docs/AI_EVAL.md`.

### Task 8: AI Act module

- New "AI use (AI Act)" tab in company mode: the 10-question declaration, five screening flags shown only on their triggers, a code-built "AI use disclosure (draft)" with a copy button, and the key dates, each with source and "last verified on".
- Dates and wording corrected and verified (Regulation (EU) 2026/1744): Art. 4 "support the development of AI literacy", Art. 5(1)(f) workplace and education, Art. 50 from 2 Aug 2026 with 2 Dec 2026 for existing systems under Art. 50(2), Annex III 2 Dec 2027, Annex I 2 Aug 2028. Sources in `docs/QA_REPORT.md`.
- No classification or verdict anywhere; answers stay in memory and are never sent.

### Task 9: content kit (optional)

- Three carousels of 7 slides (light and dark, 1080 x 1350), a LinkedIn PDF each, captions and alt text, in `content/carousels/`. Cover has a marked photo area. `npm run carousels` re-renders them and stops on overflow or low contrast.
- `content/README.md`: how to post, one carousel a week.

### Task 10: Danish standard clauses (research note)

- `docs/DANISH_CLAUSES.md`: what the clauses are (EDPB Opinion 14/2019), a design for a "compare against standard clauses" mode, reuse questions, lawyer questions and an estimate of 5 to 8 days. No code.

## v1.3 (2026-11-27, deployed)

- One-sentence held-out results, consultant block, pilot form, HTML report export and sample report, privacy and terms drafts.

## v1.2 (2026-11-26, deployed)

- Approved Art. 28 rule-hint changes measured on held-out Pack I; results split into new and training packs.
