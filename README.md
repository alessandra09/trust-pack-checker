# Trust Pack Checker

Check a DPA against GDPR Article 28 and draft security questionnaire answers, each backed by a verbatim quote that code has verified in your own documents. Runs entirely in the browser. Not legal advice.

> Status: company mode (questionnaire answers, Art. 28 check, exports) and client mode (vendor DPA vs vendor answers) work without AI. The AI drafting pilot and the AI Act module are not done yet. See [SPEC.md](SPEC.md) for the plan.

## How it works

1. Upload your DPA and policies (PDF, DOCX, TXT) and a questionnaire (XLSX, CSV).
2. The tool splits documents into clauses and finds candidate passages for each question and each Art. 28 rule.
3. Optionally, an AI model (your own Anthropic key) drafts an answer and must quote the passage it relied on.
4. Code checks that the quote exists verbatim. No verified quote, no "Found in text".
5. You review, accept or edit, and export a filled copy of the questionnaire.

Reviewing a vendor (client mode): upload the vendor's DPA and the vendor's answers (XLSX or CSV). Code compares them (breach notice and deletion periods, sub-processor names, EU/EEA claims, audit rights, AI training, security claims), shows both quotes side by side, and drafts questions to send the vendor. No AI is used in client mode.

## Develop

Requires Node 22 or newer.

```
npm install
npm run dev        # local dev server
npm run verify     # lint + typecheck + unit tests + synthetic-pack check + eval + build
npm run e2e        # Playwright end-to-end and axe accessibility checks
```

Pinned toolchain: Vite 8.3, React 19.3, TypeScript 6.0 (TypeScript 7 is not yet supported by typescript-eslint), Tailwind CSS 4.3, Vitest 5.1, Playwright 1.65, ESLint 10.

## Evaluation

`npm run eval` runs the synthetic gold-set evaluation (SPEC section 13). No-AI results, measured 2026-11-25 on synthetic packs (copied from `npm run eval`; the same numbers are on the landing page and the eval fails if they drift):

| Metric                                                 | Result                                                 |
| ------------------------------------------------------ | ------------------------------------------------------ |
| Missing-clause defects found (Pack B)                  | 4 / 4                                                  |
| Look-alike clauses wrongly accepted (Pack B)           | 0 / 1                                                  |
| Planted cross-document conflicts flagged (Pack C)      | 5 / 6                                                  |
| Questions with the right passage in the top 5 (Pack C) | 41 / 44                                                |
| Planted vendor contradictions found (Pack D)           | 8 / 8 (numeric 3 / 3, 0 findings on 6 consistent rows) |

These packs were written by the same author as the checks, so the numbers are optimistic. AI results will be added after the AI evaluation run, with date, model ID and prompt version.

## Limits and privacy

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/METHOD.md](docs/METHOD.md).

Rules not yet reviewed by a lawyer.
