# SPRINT2: Make Trust Pack Checker pilot-ready and monetizable

Written 27 Nov 2026. Read SPEC.md (sections 0, 3, 6, 15, 17) first; this file adds tasks on top of it and overrides SPEC.md only where it says so.
Owner: Oleksandra Hordieieva. She has very little time. Your job is to finish as much as possible alone, make safe decisions yourself, and ask the owner only for the items in section 2 (OPEN).

## 0. Goal and what "done" means
Within this sprint the product must let the owner (a) send people the live link and run free pilot reviews for DPO consultants and small B2B companies, (b) show a sample report, (c) be trusted at first glance by a privacy professional, and (d) be found by search. Monetization route is a service first (invoice to a Ukrainian sole proprietor, since card-payment SaaS is hard for her), SaaS later.

Primary audience: DPO consultants and external DPO firms (they bill DPA reviews separately and want a faster first pass). Secondary: small B2B SaaS companies answering customer questionnaires.

Done = every task in section 4 passes its acceptance criteria, `npm run verify` is green, a QA report exists (task 4), and the owner got one short summary message (section 7). Deploy to the public site only after the owner says yes (decision 16 in SPEC.md section 17).

## 1. Working rules for this sprint
- Autonomy: decide small things yourself, record each decision in `docs/DECISIONS.md` with one line of reasoning. Do not ask the owner about wording, layout, file names, colours, copy, or test design.
- Never invent legal facts. Legal content stays in `/src/data/*.json` with `source` and `lastVerified`. Anything you cannot verify gets the label "to verify" in the data file and is NOT shown as fact on the site.
- Honesty rules from SPEC.md stay: never "compliant", never FOUND without a verified quote, results shown with N, misses published, "synthetic" labelled, "rules not yet reviewed by a lawyer" stays until the owner confirms in writing.
- No analytics, no third-party scripts, no external fonts or images (decided). Measurement happens through pilot requests, not tracking.
- Allowed new dependencies (pre-approved): `@anthropic-ai/sdk` (pin the exact version, use only inside `src/core/llm`), and dev-only tools for generating test files (`docx`, `pdf-lib` or `pdfkit`, `exceljs`, `sharp` if needed). Ask first for anything else.
- Language: English only for all site copy, documents and generated files.
- After each task: update `CHANGELOG.md`, run `npm run verify`, commit on a branch `s2-<task>`, merge after CI is green (decision 16). Do not enable or trigger public deploy.

## 2. OPEN items (ask the owner once, in one message, at the start; use defaults if unanswered after the first task finishes)
1. Contact email for pilot requests and the "Tell me what's missing" button. Default: use her LinkedIn profile link as the only contact and a `mailto:` placeholder `REPLACE_ME@example.com` flagged in the QA report as BLOCKER before deploy.
2. Product name and domain: default stays "Trust Pack Checker" on github.io.
3. Is the owner's LinkedIn profile URL `https://www.linkedin.com/in/oleksandra-hordieieva-41b143210/` correct for the site? (Seen on her CV; assume yes.)

Everything else is DECIDED below.

## 3. Decisions already made (do not re-ask)
- Pilot turnaround promise: 3 working days. Pilot scope: one DPA or one questionnaire up to 50 questions per request.
- Pilot intake is a static page that builds a `mailto:` link (no backend, no form service).
- No public price on the site yet. Pricing is tested in conversations.
- Currency and payments: not on the site.
- Free pilot requires the sender to remove personal data and confidential commercial terms; the owner deletes files after review. This text appears on the pilot page.
- The tool's own privacy claim ("nothing is uploaded") must stay true. With AI mode on, text snippets go to the AI provider the user chose, with consent (SPEC 12).
- The consultants block exists on the landing page and as a short section on the pilot page.
- AI Act Article 4 (AI literacy) was softened by the 2026 AI Omnibus: providers and deployers must support the development of AI literacy, instead of ensuring a set level. Reflect this wherever the AI module mentions Art. 4 and verify against the final text before shipping.

## 4. Tasks (in this order; each has acceptance criteria)

### Task 1. Landing page: results summary, consultants block, pilot page
1. At the top of the "Early results" section add one plain-English summary sentence generated from the data file, not hardcoded: "On packs the checks had not seen: 3/3 missing clauses found, 3/6 vendor contradictions found, 4/4 clean vendor answers left alone." Numbers must be read from the results data so they cannot drift from the detail tables.
2. Collapse the detail tables (training packs, per-pack lists, results history) behind a native `<details>` toggle labelled "See all packs, misses and version history". Default closed. Keep it printable and keyboard accessible.
3. Add a consultants block under the pilot section, with this text:
   - Heading: "Work with clients on their data protection? Try it on a real DPA."
   - Body: "Trust Pack Checker gives you a first pass on a DPA against GDPR Article 28, with the exact quote and page behind every finding. It runs in your browser, so client documents stay on your machine. Send me one anonymised DPA and I'll show you the result for free. In return I'd like your honest feedback on what is missing."
   - Button: "Request a free pilot review" linking to the pilot page.
4. Create `/pilot` page (static route) with: what you get (a short report with findings, quotes, questions for the other side), what you send (one DPA or one questionnaire, up to 50 questions, personal data and confidential commercial terms removed), turnaround (3 working days), what is asked in return (15 minutes of feedback and, if the person agrees, permission to quote), the line "Completeness check and draft, not legal advice.", and a small form (fields: name, company, role, I am a [DPO consultant / B2B company / procurement / other], what I want checked, checkbox "I removed personal data and confidential terms") that builds a `mailto:` link with a prefilled subject and body when submitted. The page must work with JavaScript failing (show the plain email address as a fallback).
5. Fix the mobile header: the title must not wrap to two lines next to "Best on a desktop screen." (move the notice below the title on narrow screens).
Acceptance: Playwright test on 360, 390, 768 and 1280 px widths; axe clean; the summary numbers equal the detail numbers (unit test reads the same data file); the pilot form produces a correct `mailto:` (test); no layout overflow.

### Task 2. Pilot kit (documents the owner will use)
Create `docs/pilot-kit/` with these files (Markdown, plus XLSX for the tracker), all in English and copy-paste ready:
- `01_reply_to_interested.md`: reply to someone who wants the pilot (use: "Thank you for your interest. Here is how the free review works: send me one DPA or questionnaire (please remove personal data and confidential commercial terms first). Within 3 working days you get a short report with what I found, quotes from the document, and questions to send the other side. I delete the file after the review. In return I'd ask for 15 minutes of honest feedback and, if you are happy with it, permission to quote you. This is a completeness check and draft, not legal advice.")
- `02_pilot_checklist.md`: step by step for the owner (receive, check redaction, run the tool, review every result by hand, fix tool errors in the report, write the report, send, delete the file, log it), with time budget 1 to 2 hours.
- `03_report_template.md`: the report structure (summary, findings with quotes and pages, gaps, questions to send the other side, what the tool did not check, disclaimer).
- `04_feedback_questions.md`: 4 questions (time spent today, what is checked first, what is missing, would you pay and how much), plus a testimonial permission line.
- `05_followup_messages.md`: day 3 and day 7 follow-ups, short, polite, one ask each.
- `06_consultant_outreach.md`: three versions of a first message to a DPO consultant, critique of each, best final (follow the owner's rule: three versions, critique, best final; the context line must say her role grew from billing reconciliation into leading GDPR compliance).
- `07_founder_outreach.md`: same structure for founders of small B2B SaaS companies who just received a customer questionnaire.
- `08_pilot_tracker.xlsx` with columns: date, contact, company, type, channel, source link, document type, hours spent, result summary, feedback, would pay (Y/N), amount said, quote permission, follow-up date, status. Include data validation dropdowns and a second sheet "Summary" with formulas counting conversations, pilots, would-pay answers and average hours.
- `09_one_pager.html` (and a PDF render via Playwright): a one-page leaflet for consultants with the key points, a screenshot of the evidence panel, the measured results with N, and the contact link.
Acceptance: files exist and open; the XLSX formulas calculate on sample rows (include 3 fake rows marked EXAMPLE that the owner deletes); no claim in any file that is not on the site.

### Task 3. HTML report export and sample report
1. Implement "Export report" in both modes: a single self-contained HTML file (no external requests) that prints well to PDF. Contents: title, date, mode, documents analysed (names only), summary counts per status, findings table with status chips, verified quotes with page, gaps, questions for the other side (vendor mode), a "What this tool did not check" section, the disclaimer ("Draft for human review. Not legal advice. Rules not yet reviewed by a lawyer.") and tool version and prompt version.
2. Add a public `/sample-report` page showing the report generated from the synthetic pack, with the banner "Sample on fictional documents".
3. Link the sample report from the landing page and the pilot page.
Acceptance: Playwright opens the exported file offline; print-to-PDF snapshot is one clean document; every FOUND item still shows its verified quote; unit test confirms the export contains no quote that failed verification.

### Task 4. Test files and end-to-end QA through the real UI (important, do this before more features)
Generate realistic synthetic test files yourself with scripts in `eval/fixtures/` (fictional companies only, written originally, marked synthetic) and run them through the actual app in a browser with Playwright. Do not stop at unit tests.
Files to generate:
- DPAs as text PDF, DOCX (with headings, numbered clauses, tables, annexes), TXT and MD: complete, with planted defects, with "incorporated by reference", with a decoy "audit" clause, with a non-English paragraph.
- Questionnaires as XLSX (several sheets, merged cells, hidden rows, header rows, section rows, dropdown yes/no cells, question column not first) and CSV (semicolon and comma, UTF-8 with BOM), 20, 60 and 500 rows, and one at 2,000 rows.
- Edge cases that must fail gracefully with the right message: scanned (image-only) PDF, password-protected PDF, corrupted DOCX, zero-byte file, a 300-page PDF, a file above 25 MB, an old `.doc`, a `.pages` file.
- Vendor mode: vendor DPA plus vendor answers (XLSX and pasted text) with planted contradictions (breach notice 24h vs 72h, sub-processors "none" vs listed, "EU only" vs a US sub-processor, audit rights, AI training).
For each file: upload through the UI, run the flow, take a screenshot of the result screen, check exported XLSX/HTML reopens, check the original questionnaire cells are unchanged byte for byte in value, and record time taken.
Write `docs/QA_REPORT.md`: a table of every scenario (file, expected, actual, pass/fail, screenshot link), the bugs found, and what you fixed. Fix bugs you find (with a regression test) before moving on. Keep screenshots in `docs/qa/`.
Acceptance: all non-edge scenarios pass; every edge case shows a clear human message without a crash; the report lists any remaining known issue honestly.

### Task 5. Trust pages, SEO and two content pages
1. Pages: `/privacy` (what stays in the browser, what is sent with AI mode and to whom, what is stored: nothing, how pilot files are handled: deleted after review), `/terms` (draft for human review, not legal advice, no warranty, synthetic documents note), `/about` (who built it and why: her role grew from billing reconciliation into leading GDPR compliance; keep it short and factual, from SPEC), `/how-it-was-tested` already exists on the landing page: add a stable anchor and link from the footer.
2. SEO basics: unique `<title>` and meta description per page; canonical URLs; Open Graph and Twitter card tags; an OG image 1200x630 generated by a Playwright script from the site's own design (headline plus the quote card), saved to `public/og.png` and regenerated by `npm run og`; `sitemap.xml`; `robots.txt`; JSON-LD `SoftwareApplication` on the landing page (no fake ratings, no prices); one `<h1>` per page; descriptive link text; alt text for every image; fast load (Lighthouse performance and accessibility at least 95 on mobile).
3. Two static content pages for search, each 700 to 1,000 words, original, factual, English only, with "last verified" date, a "Not legal advice" line and links to sources (the GDPR text on an official or well-known source, EDPB guidance):
   - "GDPR Article 28 checklist for processor agreements (DPA)": list the elements of Art. 28(2), 28(3)(a)-(h) and 28(4) in plain words with what to look for, a short "common gaps" section, and a call to try the checker on sample data. Use only the rule data from `/src/data/art28.rules.json` as the single source so site text and tool never differ.
   - "How to answer a customer security questionnaire without guessing": steps (collect your documents, map questions to topics, answer only from evidence, mark gaps, get sign-off), and the evidence-first approach, with a link to the tool. No invented statistics.
Acceptance: pages render and are linked in the footer; Lighthouse scores meet the target; unit test confirms the checklist page lists exactly the rules in the data file; axe clean.

### Task 6. Fresh unseen pack and honest results update
1. Write a new synthetic pack ("pack-n2") in a different drafting style from all existing packs (different clause order, different vocabulary, mixed numbering, one clause hidden in an annex, one split across two paragraphs, one expressed negatively). Plant defects and write the answer key BEFORE running the checks, store the key separately and do not look at rule files while writing the pack.
2. Run the checks once without AI and record results exactly. Do not tune rules on this pack afterwards: after the run it becomes a training pack. Record this in `docs/METHOD.md` (how held-out packs are used once).
3. Update the results data file (so the landing summary and tables update), add the version history entry, and publish every miss with a short reason.
Acceptance: results on the site equal the run output (unit test compares the data file to `eval/results/latest.json`); the miss list is complete; no rule changed in the same commit as the new results.

### Task 7. AI mode (BYO key) with the evidence gate
Implement SPEC.md section 12 fully: Anthropic SDK (pinned, only inside `src/core/llm`, behind the provider interface), the user's own key in memory (optional remember on this device with warning), consent dialog before the first call naming the provider and what is sent, "Use without AI" as an equal button, cost estimate and confirmation above 200 calls, concurrency 3, backoff on 429 or 5xx, cancel, partial results kept on error, structured JSON output validated with zod, `verifyQuote` gate unchanged (a model answer is never FOUND without a verified quote), prompt injection tests, prompt versioning in audit logs.
Testing without a key: implement a mock provider and test the whole pipeline (including injection and failure cases). If `ANTHROPIC_API_KEY` is set in the environment: run the AI evaluation on all packs, run two models (a cheaper and a stronger one, model IDs in `config.ts`, checked against current Anthropic docs), and write accuracy and cost to `docs/AI_EVAL.md` and the results data file. If the key is not set: mark "AI evaluation pending" and continue; never block other tasks.
Record sample: `npm run record-sample` creates the recorded AI run on the synthetic pack for the landing demo, labelled "Recorded run on synthetic documents, not live" with date and model ID, and the loader re-verifies every quote.
Acceptance: all unit and e2e tests pass with the mock; gates in SPEC 13.2 hold; the app works fully with AI off; no network request leaves the app except to the chosen provider and only after consent (Playwright network assertion).

### Task 8. AI Act module (SPEC section 10) with corrected facts
Build the AI use declaration form and the five screening flags. Verify every date and article against official or high-quality legal sources and record `source` and `lastVerified` in `dates.json`. Required corrections: Art. 4 AI literacy wording per the 2026 omnibus (support the development of AI literacy), prohibited practices in application since 2 Feb 2025 (Art. 5(1)(f): inferring emotions of people at work or in education is prohibited except for medical or safety reasons), transparency obligations Art. 50 and the 2 Dec 2026 grace point for existing systems under Art. 50(2) as reported for the omnibus, high-risk Annex III 2 Dec 2027 and Annex I 2 Aug 2028. If any item cannot be verified, mark it "to verify", hide it from the UI and list it in the QA report. The module never gives a classification verdict.
Acceptance: flags appear only on their triggers; every date shows "last verified on"; unit tests for each trigger; copy reviewed against SPEC 11.5 forbidden words.

### Task 9. Content kit for Instagram, TikTok and LinkedIn (low priority, do last, time-box to half a day)
Goal: reusable carousel posts the owner can publish in minutes. Not video.
- Generate 3 carousels of 6 to 8 slides each, 1080x1350 PNG, from HTML templates rendered with Playwright, using the site's design tokens (dark and light variants), in `content/carousels/<name>/slide-XX.png` plus `caption.md` and `alt-text.md`. Topics: (1) "What Article 28 requires in a DPA, in 7 slides", (2) "Found in text: why every answer needs proof", (3) "Eight clauses I check first in a processor agreement" (use only items from the rules data). Final slide of each: soft call to action ("Try the free checker, link in bio").
- Cover slide has a clear large title, and a free area (about 40 percent of the slide) reserved for the owner's photo; provide the template with a placeholder box so she can drop a photo in without redesign.
- Caption rules from current guidance: main keyword phrase in the first line, 1 to 2 specific hashtags (maximum 5, no generic ones), descriptive alt text on each slide, on-screen text with the keyword on slide 1, one clear save-worthy takeaway (a checklist), no claims that are not on the site, "Not legal advice" in the caption footer. English only.
- Also produce the same 3 carousels as a PDF document for a LinkedIn document post.
- Create `content/README.md` explaining how to post, with a posting cadence of one carousel per week and a note that this is optional.
Acceptance: PNGs render without overflow; text passes contrast checks; facts match the rules data; captions have no forbidden words; the owner's photo placeholder is obvious.

### Task 10. Design note: Danish standard clauses (research only, do not implement)
Write `docs/DANISH_CLAUSES.md`: what the Danish supervisory authority's Article 28 standard contractual clauses are (EDPB Opinion 14/2019 on the draft), how a "compare against standard clauses" mode could work in the tool, what text we may legally reuse, what would need a lawyer, and an effort estimate. No code.

## 5. Quality bar for every change
- Types strict, tests for each new module, `npm run verify` green.
- Accessibility: keyboard, visible focus, no colour-only status, axe clean, `prefers-reduced-motion` respected.
- Copy: plain English, no hype, no forbidden words (compliant, certified, safe, guaranteed).
- Numbers on the site come from data files, never typed into components.
- Legal facts have a source and a verified date or are hidden.

## 6. Stop conditions
Stop and tell the owner only if: a quality gate fails twice and you cannot fix it; a legal fact cannot be verified and a task depends on it (mark it and continue with the rest); a task requires a decision not listed in sections 2 and 3. Otherwise continue to the next task.

## 7. Final report to the owner (one message, short, plain language, Ukrainian is not required: write English; the owner will read it with translation)
Include: what is done per task (one line each); the three most important numbers (latest unseen-pack results, QA scenarios passed out of total, Lighthouse scores); blockers before deploy (for example the missing contact email); what she needs to do (maximum five items); the exact text she can paste to approve the deploy. Do not paste code or logs into the message; link files instead.
