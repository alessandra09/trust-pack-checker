# Changelog

## Unreleased (Sprint 2)

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

## v1.3 (2026-11-27, deployed)

- One-sentence held-out results, consultant block, pilot form, HTML report export and sample report, privacy and terms drafts.

## v1.2 (2026-11-26, deployed)

- Approved Art. 28 rule-hint changes measured on held-out Pack I; results split into new and training packs.
