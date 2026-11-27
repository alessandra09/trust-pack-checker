import { buildAuditLog } from '../core/export/audit.ts'
import { exportXlsx } from '../core/export/xlsx.ts'
import {
  buildLibraryMatcher,
  exportLibrary,
  importLibrary,
  type LibraryEntry,
} from '../core/library/library.ts'
import { download } from './files.ts'
import { buildReport } from './report.ts'
import type { AppState } from './types.ts'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const today = () => new Date().toISOString().slice(0, 10)

export async function exportQuestionnaire(s: AppState): Promise<void> {
  const a = s.analysis
  if (!a) return
  const rows = a.questions.flatMap((q) => {
    const answer = a.answers[q.qid]
    return answer ? [{ question: q, answer }] : []
  })
  const bytes = await exportXlsx(
    s.files.questionnaire?.bytes ?? null,
    rows,
    s.mapping?.headerRow ?? null,
  )
  download(`questionnaire-draft-${today()}.xlsx`, bytes, XLSX)
}

export function exportAudit(s: AppState): void {
  const a = s.analysis
  if (!a) return
  const documents = Object.values(s.files).flatMap((f) =>
    f?.doc ? [{ name: f.doc.name, kind: f.doc.kind, pages: f.doc.pages.length }] : [],
  )
  const log = buildAuditLog({
    model: null,
    mode: s.mode ?? 'company',
    documents,
    answers: Object.values(a.answers),
    findings: a.findings,
    ...(s.mode === 'client' ? { consistency: a.consistency } : {}),
  })
  download(`audit-log-${today()}.json`, JSON.stringify(log, null, 2), 'application/json')
}

export function exportAcceptedLibrary(s: AppState, reviewer: string): number {
  const a = s.analysis
  if (!a) return 0
  const entries: LibraryEntry[] = a.questions.flatMap((q) => {
    const ans = a.answers[q.qid]
    if (!ans || (ans.reviewed !== 'accepted' && ans.reviewed !== 'edited') || !ans.draft) return []
    const ev = ans.evidence.find((e) => e.verified)
    return [
      {
        question: q.text,
        topic: ans.topic,
        answer: ans.draft,
        quote: ev?.quote ?? '',
        sourceDocument: ev?.docName ?? '',
        dateApproved: today(),
        reviewer,
      },
    ]
  })
  if (entries.length > 0)
    download(`trust-library-${today()}.json`, exportLibrary(entries), 'application/json')
  return entries.length
}

export function matchLibrary(
  s: AppState,
  json: string,
): Record<string, { answer: string; date: string; supported: boolean }> | null {
  const lib = importLibrary(json)
  const a = s.analysis
  if (!lib || !a) return null
  const match = buildLibraryMatcher(lib.entries)
  const notes: Record<string, { answer: string; date: string; supported: boolean }> = {}
  for (const q of a.questions) {
    const ans = a.answers[q.qid]
    const sug = ans ? match(q.text, ans.topic, a.chunks) : null
    if (sug)
      notes[q.qid] = {
        answer: sug.entry.answer,
        date: sug.entry.dateApproved,
        supported: sug.stillSupported,
      }
  }
  return notes
}

export function exportReport(s: AppState): void {
  const a = s.analysis
  if (!a) return
  const documents = Object.values(s.files).flatMap((f) => (f?.name ? [f.name] : []))
  const html = buildReport({ analysis: a, mode: s.mode ?? 'company', documents, date: today() })
  download(`report-${today()}.html`, html, 'text/html')
}
