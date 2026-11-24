import aiRaw from './ai.questions.json'
import art28Raw from './art28.rules.json'
import consistencyRaw from './consistency.rules.json'
import datesRaw from './dates.json'
import {
  aiQuestionsFileSchema,
  consistencyFileSchema,
  datesFileSchema,
  rulesFileSchema,
  topicsFileSchema,
} from './schemas.ts'
import topicsRaw from './topics.json'

// Parsed once at import; a malformed data file fails loudly at startup and in tests.
export const art28 = rulesFileSchema.parse(art28Raw)
export const topics = topicsFileSchema.parse(topicsRaw)
export const consistency = consistencyFileSchema.parse(consistencyRaw)
export const aiQuestions = aiQuestionsFileSchema.parse(aiRaw)
export const dates = datesFileSchema.parse(datesRaw)
