import type { Status } from '../../core/types.ts'
import { art28, consistency, topics } from '../../data/load.ts'
import type { AppState } from '../../app/types.ts'

export type Item = {
  id: string
  label: string
  text: string
  status: Status
  topic: string
  reviewed: string
  followUp: boolean
}

const topicName = (id: string) => topics.topics.find((t) => t.id === id)?.name ?? id

export function itemsFor(state: AppState): Item[] {
  const a = state.analysis
  if (!a) return []
  if (state.tab === 'vendor') {
    return a.consistency.map((f) => {
      const row = a.vendorRows.find((r) => r.qid === f.qid)
      return {
        id: f.id,
        label: f.qid,
        text: row?.question ?? f.qid,
        status: f.status,
        topic: consistency.rules.find((r) => r.id === f.ruleId)?.title ?? f.ruleId,
        reviewed: f.reviewed,
        followUp: !!f.followUp,
      }
    })
  }
  if (state.tab === 'rules') {
    return a.findings.map((f) => {
      const rule = art28.rules.find((r) => r.id === f.ruleId)
      return {
        id: f.id,
        label: rule?.article ?? f.ruleId,
        text: rule?.title ?? f.ruleId,
        status: f.status,
        topic: rule?.class ?? '',
        reviewed: f.reviewed,
        followUp: !!f.followUp,
      }
    })
  }
  return a.questions.flatMap((q) => {
    const ans = a.answers[q.qid]
    return ans
      ? [
          {
            id: q.qid,
            label: q.qid,
            text: q.text,
            status: ans.status,
            topic: topicName(ans.topic),
            reviewed: ans.reviewed,
            followUp: !!ans.followUp,
          },
        ]
      : []
  })
}

export function filterItems(items: Item[], status: string, search: string): Item[] {
  const s = search.trim().toLowerCase()
  return items.filter(
    (i) =>
      (status === 'all' || i.status === status) &&
      (s === '' || `${i.label} ${i.text}`.toLowerCase().includes(s)),
  )
}

export function statusCounts(items: Item[]): Record<Status, number> {
  const c: Record<Status, number> = {
    FOUND: 0,
    PARTIAL: 0,
    NOT_FOUND: 0,
    CONFLICT: 0,
    NEEDS_HUMAN: 0,
  }
  for (const i of items) c[i.status]++
  return c
}
