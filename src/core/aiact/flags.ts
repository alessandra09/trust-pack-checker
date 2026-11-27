import type { ActDate, AiFlag } from '../../data/schemas.ts'

// SPEC 10: answers are entered by the user, nothing is inferred. The module never classifies or gives a verdict.
export type YesNo = 'yes' | 'no' | ''
export type EmotionGroup = 'customers' | 'callers' | 'employees' | 'students'
export type AiAnswers = {
  q1: YesNo
  /** One AI system per line: purpose, provider or model, personal data in prompts or logs, hosting region. */
  q2: string
  q3: YesNo | 'unknown'
  q4: 'always' | 'sometimes' | 'never' | ''
  /** AI literacy training: description, or "none". */
  q5: string
  q6: YesNo
  q6told: YesNo
  q7: YesNo
  q8: YesNo
  q9: YesNo
  q9groups: EmotionGroup[]
  q10: YesNo
}

export const EMPTY_ANSWERS: AiAnswers = {
  q1: '',
  q2: '',
  q3: '',
  q4: '',
  q5: '',
  q6: '',
  q6told: '',
  q7: '',
  q8: '',
  q9: '',
  q9groups: [],
  q10: '',
}

const WORK_OR_EDUCATION: EmotionGroup[] = ['employees', 'students']

export const isNone = (s: string) => /^\s*(none|no|nothing|n\/a|-)\s*\.?\s*$/i.test(s)

/** Flag ids whose trigger matches the answers (SPEC 10.3 table), in table order. */
export function triggeredFlagIds(a: AiAnswers): string[] {
  const ids: string[] = []
  const workplace = a.q9groups.some((g) => WORK_OR_EDUCATION.includes(g))
  if (a.q9 === 'yes' && workplace) ids.push('F-EMOTION-WORK')
  if (a.q9 === 'yes' && !workplace) ids.push('F-EMOTION-OTHER')
  if (a.q8 === 'yes') ids.push('F-HIGH-RISK')
  if (a.q6 === 'yes' && a.q6told === 'no') ids.push('F-TRANSPARENCY')
  if (isNone(a.q5)) ids.push('F-LITERACY')
  return ids
}

export type ShownFlag = AiFlag & { date: ActDate | null }

/** Flags to show. A date not verified against a source (lastVerified null) is hidden, never shown unverified. */
export function screeningFlags(a: AiAnswers, flags: AiFlag[], dates: ActDate[]): ShownFlag[] {
  const ids = triggeredFlagIds(a)
  return flags
    .filter((f) => ids.includes(f.id))
    .map((f) => {
      const d = dates.find((x) => x.id === f.dateId)
      return { ...f, date: d && d.lastVerified ? d : null }
    })
}

export const verifiedDates = (dates: ActDate[]) => dates.filter((d) => d.lastVerified !== null)
