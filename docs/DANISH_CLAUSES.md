# Design note: comparing a DPA against the Danish standard clauses

Research only (SPRINT2 task 10). Nothing here is implemented. Checked on 2026-11-27. Items marked **to verify** were not confirmed from a source I could read.

## 1. What the Danish clauses are

- Article 28(8) GDPR lets a supervisory authority adopt standard contractual clauses for controller–processor contracts, after an EDPB opinion under Article 64.
- The Danish authority (Datatilsynet) sent its draft to the EDPB in early 2019. The EDPB found the file complete on 4 April 2019 and adopted **Opinion 14/2019 on 9 July 2019** ([EDPB opinion PDF](https://edpb.europa.eu/sites/edpb/files/files/file1/edpb_opinion_201914_dk_scc_en.pdf)).
- The opinion asked, among other things, for GDPR wording ("taking into account the state of the art" instead of "with consideration for the current level"; "authorisation" instead of "consent" for sub-processors), a sub-processor list in Appendix B2, clearer options in clause 7.3, and a statement that the clauses are not a transfer tool under Chapter V.
- Datatilsynet took on all the recommendations, and the EDPB published the final clauses in its register of supervisory authority decisions on **11 December 2019** ([Covington, Inside Privacy](https://www.insideprivacy.com/data-privacy/edpb-publishes-article-28-standard-clauses-adopted-by-danish-supervisory-authority/)).
- Structure: a preamble, thirteen substantive sections and appendices. The opinion refers to Appendix A (description of the processing), B1 and B2 (sub-processors), C (instructions, including security, erasure and transfers) and D (breach). The exact appendix list of the final text is **to verify** against the register copy.
- Rules of use: bold clauses are the mandatory minimum, the rest are optional. Parties may add clauses that do not contradict the standard clauses, directly or indirectly. If they change the standard text, they are no longer treated as using the adopted clauses (opinion, paragraphs 6 and 10).
- Related: the European Commission adopted its own Article 28(7) standard clauses on **4 June 2021** ([Commission page](https://commission.europa.eu/publications/standard-contractual-clauses-controllers-and-processors-eueea_en); Implementing Decision (EU) 2021/915). How the two sets relate in practice (which one Danish counterparties expect) is **to verify**.

## 2. How a "compare against standard clauses" mode could work

The aim is to answer a precise, checkable question: "Which standard clauses does this DPA reproduce, which has it changed, and which are missing?" This is a text comparison, not a legal judgement.

1. **Reference data.** Store the clauses as data in `src/data/dk-scc.json`, one entry per clause or sub-clause, with `id`, `text`, `mandatory` (bold or not), `appendix`, `source` and `lastVerified`. Rule wording follows the existing rule files.
2. **Alignment.** For each reference clause, find the best-matching passage in the uploaded DPA with the existing chunker and search (BM25 over passages), then score how similar the texts are with code: normalised token overlap plus a sentence-level diff.
3. **Statuses, decided by code:**
   - _Reproduced_: the text matches after whitespace and punctuation are normalised. The quote is verified with `verifyQuote`, as for FOUND today.
   - _Changed_: the passage is clearly the same clause but the words differ. Show a word diff, and flag changed numbers, durations and names separately, since code compares those.
   - _Missing_: no passage scores above the threshold.
   - _Added_: DPA passages that match no reference clause. Listed so a person can check that they do not contradict the standard text. The tool does not judge this.
4. **Output.** A table of clauses with status, the reference text, the DPA quote and the diff. It goes into the existing report and audit log. Wording stays as today: "found in text", "changed in text", "not found in text". Never "valid" or "uses the standard clauses".
5. **AI (optional).** Only to propose which passage matches a clause when the wording has drifted. The quote gate is unchanged, and the model never decides whether a change matters.
6. **Eval.** Two synthetic packs: a DPA that copies the clauses with planted edits (a changed notice period, a deleted sub-clause, an added contradicting sentence), and a DPA in a different style. Answer keys are written first, as for N2.

## 3. What text we may reuse

- EU institution documents are generally reusable with attribution under the Commission's reuse decision (2011/833/EU). Whether that covers a text adopted by a national authority and published in the EDPB register is **to verify**.
- Datatilsynet's own terms for reusing its clauses are **to verify**. I did not find a statement.
- Until both are confirmed, the safe design is to keep the clause text out of the repository. Instead, the user supplies the reference text (pastes or uploads the official version), and the tool stores only clause ids, headings and a link to the official source.

## 4. What needs a lawyer

- Whether a "changed" clause still counts as using the adopted clauses, and whether an added clause contradicts them. The tool can show the difference but must not decide either point.
- Reuse rights for the clause text (section 3).
- Wording of statuses and the disclaimer for this mode, so a "reproduced" result is not read as a statement that the contract is valid.
- Which clause set to use as the default for Danish customers (Danish clauses or the Commission's 2021 clauses).

## 5. Effort estimate

| Part                                                                        | Estimate                                           |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| Clause data file and schema (from the official text, with source and dates) | 1 day                                              |
| Alignment, statuses and diff in `src/core` with unit tests                  | 2–3 days                                           |
| Review screen tab and report section                                        | 1–2 days                                           |
| Two synthetic eval packs with keys, eval gates, published results           | 1–2 days                                           |
| Lawyer review of wording and reuse                                          | outside the build; 1–2 hours of a lawyer's time    |
| **Total**                                                                   | **about 5–8 working days**, plus the lawyer review |

The main risk is the alignment threshold, since paraphrased clauses can look "missing". The eval packs exist to measure exactly that.
