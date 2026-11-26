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

`npm run eval` runs the synthetic gold-set evaluation (SPEC section 13), no AI, measured 2026-11-26. Packs E, F and G are held out: written after the checks, with the checks left unchanged afterwards.

| Metric                                                | Built-with packs | Held-out packs | Total   |
| ----------------------------------------------------- | ---------------- | -------------- | ------- |
| Missing contract clauses found                        | 4 / 4 (B)        | 1 / 3 (E)      | 5 / 7   |
| Look-alike clauses wrongly accepted (lower is better) | 0 / 1 (B)        | 1 / 1 (E)      | 1 / 2   |
| Planted cross-document conflicts flagged              | 5 / 6 (C)        | none yet       | 5 / 6   |
| Questions with the right passage in the top 5         | 41 / 44 (C)      | none yet       | 41 / 44 |
| Planted vendor contradictions found                   | 8 / 8 (D)        | 7 / 11 (F, G)  | 15 / 19 |
| Consistent vendor answers left alone                  | 6 / 6 (D)        | 8 / 9 (F, G)   | 14 / 15 |

Every miss is named, with its reason, on the landing page ("How it was tested") and in `src/data/eval-summary.json`; the eval fails if that list differs from what it measures. AI results will be added after the AI evaluation run.

## Limits and privacy

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/METHOD.md](docs/METHOD.md).

Rules not yet reviewed by a lawyer.
