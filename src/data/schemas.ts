import { z } from 'zod'

// Every data file is validated at startup (SPEC 9.1). Legal content carries source and lastVerified.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const docType = z.enum(['dpa', 'privacy', 'security', 'ropa'])
const topicId = z.string().regex(/^T\d{2}$/)

export const ruleSchema = z.object({
  id: z.string().regex(/^(A28|P)-[A-Z0-9-]+$|^A28-[0-9a-z-]+$/),
  article: z.string().min(1),
  class: z.enum(['core', 'practice']),
  topic: topicId,
  title: z.string().min(1),
  requirement: z.string().min(20),
  elements: z.array(z.string().min(1)).min(1),
  hints: z.array(z.string().min(2)).min(1),
  negativeHints: z.array(z.string().min(2)),
  severityIfMissing: z.enum(['HIGH', 'MEDIUM', 'LOW', 'INFO']),
  whyItMatters: z.string().min(20),
  suggestedAsk: z.string().min(10),
  source: z.url(),
  lastVerified: isoDate,
})

export const rulesFileSchema = z.object({
  owner: z.string().min(1),
  source: z.url(),
  lastVerified: isoDate,
  reviewedByLawyer: z.boolean(),
  rules: z.array(ruleSchema).min(1),
})

export const topicsFileSchema = z.object({
  owner: z.string().min(1),
  source: z.string().min(1),
  lastVerified: isoDate,
  topics: z
    .array(
      z.object({
        id: topicId,
        name: z.string().min(1),
        hints: z.array(z.string().min(2)),
        answerableFrom: z.array(docType),
      }),
    )
    .min(1),
})

export const consistencyFileSchema = z.object({
  owner: z.string().min(1),
  source: z.string().min(1),
  lastVerified: isoDate,
  rules: z.array(
    z.object({
      id: z.string().regex(/^C-[A-Z-]+$/),
      compares: z.string().min(1),
      method: z.enum(['duration', 'names', 'locations', 'keywords', 'polarity']),
      result: z.string().min(1),
    }),
  ),
})

export const aiQuestionsFileSchema = z.object({
  owner: z.string().min(1),
  source: z.url(),
  lastVerified: isoDate,
  questions: z.array(
    z.object({
      id: z.string().regex(/^Q\d+$/),
      text: z.string().min(1),
      type: z.enum([
        'yesno',
        'yesnounknown',
        'systems',
        'frequency',
        'text',
        'interaction',
        'emotion',
      ]),
    }),
  ),
  flags: z.array(
    z.object({
      id: z.string().regex(/^F-[A-Z-]+$/),
      trigger: z.string().min(1),
      text: z.string().min(1),
      dateId: z.string().regex(/^D-[A-Z0-9-]+$/),
    }),
  ),
})

export const datesFileSchema = z.object({
  owner: z.string().min(1),
  source: z.url(),
  dates: z.array(
    z.object({
      id: z.string().regex(/^D-[A-Z0-9-]+$/),
      label: z.string().min(1),
      date: isoDate,
      source: z.url(),
      // null until checked against the official text; the UI then shows "not yet verified".
      lastVerified: isoDate.nullable(),
      note: z.string().optional(),
    }),
  ),
})

export type Rule = z.infer<typeof ruleSchema>
export type Topic = z.infer<typeof topicsFileSchema>['topics'][number]
export type ConsistencyRule = z.infer<typeof consistencyFileSchema>['rules'][number]
export type AiQuestion = z.infer<typeof aiQuestionsFileSchema>['questions'][number]
export type AiFlag = z.infer<typeof aiQuestionsFileSchema>['flags'][number]
export type ActDate = z.infer<typeof datesFileSchema>['dates'][number]
