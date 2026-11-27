# Method

## Evidence model

An answer or finding is "Found in text" only when code verifies its quote verbatim in the cited passage (`verifyQuote`, SPEC 6.2). Normalisation before comparison: Unicode NFKC, soft hyphens removed, bullets removed, smart quotes and dash variants folded to plain characters, whitespace collapsed, lowercase. Quotes must be 12 to 400 characters.

## Benchmark

Synthetic document packs live in `eval/packs/<name>/`. Each has a `SYNTHETIC.md` manifest, the documents in `docs/`, and an answer key in `key/key.json`. Keys are read only by the evaluator, never by the engine or the model.

- Pack A: complete DPA for the fictional processor Northwind Voice Ltd. Every core Art. 28 rule is present.
- Pack B: the same DPA with 12 planted defects (4 missing clauses, 3 partial clauses, 1 vague breach clause, 1 annex incorporated by reference but not provided, 2 contradictions, 1 decoy use of the word "audit").
- Pack C: a 60-question customer questionnaire answered from Northwind's DPA, security policy and privacy notice (10 unanswerable questions, 6 cross-document conflicts, 4 prompt-injection passages).
- Pack D (client mode): the DPA of the fictional vendor Harbourline Payroll Ltd and its answers to 15 questions. 8 planted contradictions (3 numeric: breach notice, deletion period, backup retention; sub-processors "none" vs a list of 4; an unlisted sub-processor; "EU only" vs a US sub-processor; on-site audits vs audit rights limited to a report; "never used for AI training" vs a training clause), 6 consistent rows that must not be flagged (two with matching numbers), 1 security claim the DPA does not mention, 1 prompt-injection passage.

`eval/verify-key.ts` independently confirms, with plain string checks and no app code, that every keyed quote is in the text and that each planted defect is really there (required phrases present, forbidden phrases absent).

## Metrics (so far)

- Rule passage retrieval: for every rule whose key has a supporting quote, the share of rules where one of the top 3 candidate passages contains that quote. Gate: at least 90% per pack.
- No-AI missing-clause recall (gated from M2): a "missing clause" defect counts as detected only when that rule's status is NOT_FOUND. Vague, contradictory, partial, incorporated and decoy defects are measured only with AI.

- Held-out packs E, F and G were written after the checks existed, in different wording, and the engine and rule hints were not changed after seeing their results. Their metrics are published and their misses are listed on the landing page, but they do not fail the build (except the safety gates: no FOUND without a verified quote, every client finding quotes both sides). One key quote in Pack G (G04) was corrected after the first run because it pointed at the question instead of the vendor's answer; the expected rule and status did not change.
- v1.1 (2026-11-26): the v1 misses on packs F and G were fixed (calendar days, sub-processors left out of a list, "all data ... within the EU", audits offered through a report, a shared topic word such as "backup" counts towards matching). F and G then became regression tests; new pack H, written after the fixes, is the held-out test (3 of 6 found). The headline vendor number on the landing page counts only held-out packs. The Art. 28 rule hints were not changed (rule changes need the owner's approval), so Pack E stays held out for the contract check.
- v1.2 (2026-11-26): owner-approved hint changes only (A28-3-a2 gains "infringes the gdpr" and "infringes data protection"; A28-3-b loses "personnel"); requirement text and severity unchanged. Pack I was written before the change and measured before and after: missing clauses 2/3 → 3/3, present core clauses reported NOT_FOUND 1/9 → 0/9. Packs A to E: no new false NOT_FOUND. Caveat: Pack I was written by the same author who knew which hints would change. Pack E shaped the change and now counts as a training pack (reported, not gated).
- How a held-out pack is used (from v1.4): the pack and its answer key are written first, the key is checked by `eval/verify-key.ts`, and then the checks run on it once without AI. That run is published as measured, every miss with a reason. No rule, hint or engine change goes into the same commit as the new results. After that single run the pack is no longer unseen: any later fix that its misses suggest is measured on another new pack, and the pack moves to the training group once a fix is tuned on it.
- v1.4 (2026-11-27): pack N2, a "Processing Terms" document in a new drafting style (Parts with lettered clauses, sub-processor wording "subcontracted processor", one clause in an annex, one split across two paragraphs, one negative). Single run, no rule changes: missing clauses 2/3 (A28-3-f missed: the breach notice clause was taken as a possible passage); present core clauses reported NOT_FOUND 1/9 (A28-3-d: the hints expect "sub-processor" wording). The new metric "clauses that are there, not reported missing" makes these false alarms visible on the landing page for every Art. 28 pack.
- `npm run eval` writes `eval/results/latest.json`; a unit test fails if the landing data differs from it.
- The landing page shows held-out ("new") packs first and training packs separately, labelled "tuned on these, not a fair test".
- Published metrics add up across packs, and `src/data/eval-summary.json` must list exactly the misses the eval measures, so the page cannot hide one. Pack E also shows one present clause reported as not found (A28-3-a2, wording "believes that an instruction ... infringes").
- Client mode (Pack D): a contradiction counts as found only when the finding has the keyed rule, status and question, and both quotes (answer and DPA) contain the keyed text. Gates: numeric contradictions 100%, zero findings on consistent rows, every finding quotes both sides verbatim.

## Client mode checks

Every client-mode finding is decided by code (SPEC 9.3); no model is called. Durations are parsed and converted to hours, then compared. The DPA sentence used for the comparison must carry the rule's topic words and share at least two content words (numbers excluded) with the question and answer. Sub-processor names are capitalised phrases ending in a company form (Ltd, Inc., GmbH, BV, Oy and others) found in the DPA's sub-processor clauses or annex; the contracting party is excluded. "EU/EEA only" claims are compared with non-EEA countries in sub-processor rows or location sentences. Audit claims are compared with DPA sentences that exclude audits or limit them to reports. AI training statements are compared by polarity (a negation word in the sentence). Security claims (encryption, MFA, ISO 27001, SOC 2, penetration testing) not mentioned in the DPA are shown as "Not found in text", never as a conflict.

Caveat: the packs, the rule hints and the client-mode checks were written by the same author, so scores on them are optimistic. Pack D was written together with the client-mode checks. Local tests on real documents are the harder check.

## Reproduce

```
npm install
npm run eval
```
