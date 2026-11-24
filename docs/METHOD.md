# Method

To be completed in M1-M4. It will describe:

- The evidence model: an answer is "Found in text" only when code verifies its quote verbatim in the cited passage (SPEC 6).
- The benchmark: synthetic document packs A-D with planted defects and separate answer keys, plus an independent script that confirms each planted defect is really in the text (SPEC 13.2).
- Metric definitions, including no-AI recall: a "missing clause" defect counts as detected only when that rule's status is NOT_FOUND.
- How to reproduce: `npm install && npm run eval`.
