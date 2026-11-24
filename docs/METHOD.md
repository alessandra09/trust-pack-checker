# Method

## Evidence model

An answer or finding is "Found in text" only when code verifies its quote verbatim in the cited passage (`verifyQuote`, SPEC 6.2). Normalisation before comparison: Unicode NFKC, soft hyphens removed, bullets removed, smart quotes and dash variants folded to plain characters, whitespace collapsed, lowercase. Quotes must be 12 to 400 characters.

## Benchmark

Synthetic document packs live in `eval/packs/<name>/`. Each has a `SYNTHETIC.md` manifest, the documents in `docs/`, and an answer key in `key/key.json`. Keys are read only by the evaluator, never by the engine or the model.

- Pack A: complete DPA for the fictional processor Northwind Voice Ltd. Every core Art. 28 rule is present.
- Pack B: the same DPA with 12 planted defects (4 missing clauses, 3 partial clauses, 1 vague breach clause, 1 annex incorporated by reference but not provided, 2 contradictions, 1 decoy use of the word "audit").
- Packs C (questionnaire) and D (client mode) follow in M2 and M3.

`eval/verify-key.ts` independently confirms, with plain string checks and no app code, that every keyed quote is in the text and that each planted defect is really there (required phrases present, forbidden phrases absent).

## Metrics (so far)

- Rule passage retrieval: for every rule whose key has a supporting quote, the share of rules where one of the top 3 candidate passages contains that quote. Gate: at least 90% per pack.
- No-AI missing-clause recall (gated from M2): a "missing clause" defect counts as detected only when that rule's status is NOT_FOUND. Vague, contradictory, partial, incorporated and decoy defects are measured only with AI.

Caveat: the packs and the rule hints were written by the same author, so retrieval scores on them are optimistic. Packs C and D and local tests on real documents are the harder check.

## Reproduce

```
npm install
npm run eval
```
