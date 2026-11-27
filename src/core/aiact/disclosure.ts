import { isNone, type AiAnswers } from './flags.ts'

// SPEC 10.4: "AI use disclosure (draft)" built by code from the user's own answers, never by a model.
// Only what the user stated is written; unanswered questions are left out.
export function buildDisclosure(a: AiAnswers): string {
  if (a.q1 === '') return ''
  if (a.q1 === 'no') return 'We do not use AI systems in our service or internal operations.'
  const out: string[] = ['We use AI systems in our service or internal operations.']
  const systems = a.q2
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (systems.length) out.push(`The systems in use are: ${systems.join('; ')}.`)
  if (a.q3 === 'no') out.push('Customer data is not used to train or fine-tune any model.')
  if (a.q3 === 'yes') out.push('Customer data is used to train or fine-tune a model.')
  if (a.q3 === 'unknown')
    out.push(
      'We have not yet confirmed whether customer data is used to train or fine-tune a model.',
    )
  if (a.q4 === 'always')
    out.push('A person reviews AI output before it affects a person or a customer.')
  if (a.q4 === 'sometimes')
    out.push('A person reviews AI output in some cases before it affects a person or a customer.')
  if (a.q4 === 'never')
    out.push('AI output is not reviewed by a person before it affects a person or a customer.')
  if (a.q5.trim() && !isNone(a.q5))
    out.push(`Staff AI literacy: ${a.q5.trim().replace(/\.$/, '')}.`)
  if (isNone(a.q5)) out.push('We do not yet provide AI literacy training to staff.')
  if (a.q6 === 'yes')
    out.push(
      a.q6told === 'yes'
        ? 'Users who interact directly with an AI system are told that they are interacting with AI.'
        : 'Users interact directly with an AI system.',
    )
  if (a.q7 === 'yes')
    out.push('Our systems generate synthetic content that is published to others.')
  if (a.q8 === 'yes')
    out.push(
      'AI outputs are used in decisions about employees, applicants, credit, insurance, education or access to essential services.',
    )
  if (a.q9 === 'yes')
    out.push(
      `A system infers emotions or sentiment of people${a.q9groups.length ? ` (${a.q9groups.join(', ')})` : ''}.`,
    )
  if (a.q10 === 'yes') out.push('We maintain an inventory of AI systems and their owners.')
  if (a.q10 === 'no') out.push('We do not yet maintain an inventory of AI systems.')
  return out.join(' ')
}
