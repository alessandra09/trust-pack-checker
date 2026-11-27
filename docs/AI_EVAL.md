# AI evaluation

**Status: AI evaluation pending.** No API key was available in the build session, so no model has been measured yet. The landing page says so and shows no AI numbers.

## What is already tested without a key

The whole AI pipeline runs in unit tests against a mock provider (`src/core/llm/mock.ts`) on the synthetic packs:

- every FOUND answer or rule has a quote that is really in the cited passage (`verifyQuote`, unchanged);
- a paraphrased quote is retried once ("copy exactly"), then goes to human review;
- a reply that is not valid JSON goes to human review (zod validation);
- a model that obeys instructions planted in a document never turns them into a found answer: a quote addressed to an AI assistant is not accepted as evidence, even when it is verbatim;
- 429 and 5xx are retried with backoff; a question that keeps failing errors alone and every other result is kept;
- cancel stops the run before any further call;
- the audit log carries the prompt version;
- in the browser (Playwright), nothing leaves the app before the consent dialog is accepted, and afterwards only `api.anthropic.com` is called; with AI off, no request leaves the app.

## How to run it (owner, with a key)

In a terminal with `ANTHROPIC_API_KEY` set (never paste the key in chat or commit it):

```
npm run eval:ai            # both pilot models: claude-haiku-5-5 (cheaper) and claude-sonnet-5-5 (stronger)
npm run record-sample      # recorded run on the synthetic sample for the landing demo
```

Model IDs and prices are in `src/core/llm/models.ts` (checked on 2026-11-27: Haiku 5.5 $0.10 / $0.50, Sonnet 5.5 $2 / $10 per million input / output tokens; Haiku's rate is for prompts up to 100K tokens, far above what one call sends). Results, accuracy and cost will be written here and to the results data file.
