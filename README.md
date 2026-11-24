# Trust Pack Checker

Check a DPA against GDPR Article 28 and draft security questionnaire answers, each backed by a verbatim quote that code has verified in your own documents. Runs entirely in the browser. Not legal advice.

> Status: M0 (setup). The checker is not usable yet. See [SPEC.md](SPEC.md) for the plan.

## How it works (planned)

1. Upload your DPA and policies (PDF, DOCX, TXT) and a questionnaire (XLSX, CSV).
2. The tool splits documents into clauses and finds candidate passages for each question and each Art. 28 rule.
3. Optionally, an AI model (your own Anthropic key) drafts an answer and must quote the passage it relied on.
4. Code checks that the quote exists verbatim. No verified quote, no "Found in text".
5. You review, accept or edit, and export a filled copy of the questionnaire.

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

`npm run eval` runs the synthetic gold-set evaluation (SPEC section 13). Measured results will be copied here from real runs, with date, model ID and prompt version. No numbers are published before they are measured.

## Limits and privacy

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/METHOD.md](docs/METHOD.md).

Rules not yet reviewed by a lawyer.
