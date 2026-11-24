import { z } from 'zod'

// Every model reply is validated (SPEC 5.1, 12.2). The JSON Schemas are sent to the provider as the output format.
export const answerReplySchema = z.object({
  status: z.enum(['FOUND', 'PARTIAL', 'NOT_FOUND']),
  draft: z.string(),
  chunkId: z.string(),
  quote: z.string(),
  missingElements: z.array(z.string()),
})
export const ruleReplySchema = answerReplySchema.omit({ draft: true })

export type AnswerReply = z.infer<typeof answerReplySchema>
export type RuleReply = z.infer<typeof ruleReplySchema>

export const answerReplyJsonSchema = z.toJSONSchema(answerReplySchema)
export const ruleReplyJsonSchema = z.toJSONSchema(ruleReplySchema)

export function parseReply<T>(schema: z.ZodType<T>, text: string): T | null {
  const json = /\{[\s\S]*\}/.exec(text)?.[0]
  if (!json) return null
  try {
    const parsed = schema.safeParse(JSON.parse(json))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
