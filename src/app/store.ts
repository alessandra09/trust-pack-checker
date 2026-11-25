import type { Evidence, Status } from '../core/types.ts'
import type { AppState, Analysis, LoadedFile, Mode, SlotId, Tab } from './types.ts'
import type { ColumnMapping } from '../core/qa/detect.ts'

export const initialState: AppState = {
  step: 'mode',
  mode: null,
  files: {},
  mapping: null,
  analysis: null,
  selected: null,
  tab: 'questions',
  statusFilter: 'all',
  search: '',
  sample: false,
}

type Reviewed = 'accepted' | 'edited' | 'rejected'
export type Action =
  | { type: 'start'; mode: Mode }
  | {
      type: 'sample'
      mode: Mode
      files: AppState['files']
      mapping: ColumnMapping | null
      analysis: Analysis
    }
  | { type: 'file'; slot: SlotId; file: LoadedFile | undefined }
  | { type: 'mapping'; mapping: ColumnMapping | null }
  | { type: 'analysis'; analysis: Analysis }
  | { type: 'back' }
  | { type: 'reset' }
  | { type: 'select'; id: string | null }
  | { type: 'tab'; tab: Tab }
  | { type: 'filter'; status?: string; search?: string }
  | { type: 'review'; id: string; reviewed: Reviewed; draft?: string }
  | { type: 'followUp'; id: string }
  | { type: 'evidence'; id: string; status: Status; evidence: Evidence[] }
  | { type: 'library'; notes: Record<string, { answer: string; date: string; supported: boolean }> }
  | { type: 'draft'; id: string; draft: string }

function patchAnswer(
  s: AppState,
  id: string,
  patch: (a: Analysis['answers'][string]) => Analysis['answers'][string],
): AppState {
  const a = s.analysis
  const cur = a?.answers[id]
  if (!a || !cur) return s
  return { ...s, analysis: { ...a, answers: { ...a.answers, [id]: patch(cur) } } }
}

// A finding id is either an Art. 28 rule finding or a client-mode consistency finding.
function patchFinding(
  s: AppState,
  id: string,
  patch: (f: Analysis['findings'][number]) => Analysis['findings'][number],
): AppState {
  const a = s.analysis
  if (!a) return s
  return { ...s, analysis: { ...a, findings: a.findings.map((f) => (f.id === id ? patch(f) : f)) } }
}

type Flags = { reviewed: Reviewed | 'pending'; followUp?: boolean }
function patchFlags(s: AppState, id: string, patch: <T extends Flags>(f: T) => T): AppState {
  const a = s.analysis
  if (!a) return s
  if (a.consistency.some((c) => c.id === id))
    return {
      ...s,
      analysis: { ...a, consistency: a.consistency.map((c) => (c.id === id ? patch(c) : c)) },
    }
  return patchFinding(s, id, patch)
}

function firstItem(a: Analysis, mode: Mode | null): { selected: string | null; tab: Tab } {
  if (mode === 'client')
    return a.consistency.length
      ? { selected: a.consistency[0]?.id ?? null, tab: 'vendor' }
      : { selected: a.findings[0]?.id ?? null, tab: 'rules' }
  if (a.questions.length) return { selected: a.questions[0]?.qid ?? null, tab: 'questions' }
  return { selected: a.findings[0]?.id ?? null, tab: 'rules' }
}

export function reducer(s: AppState, action: Action): AppState {
  switch (action.type) {
    case 'start':
      return { ...initialState, step: 'upload', mode: action.mode }
    case 'sample':
      return {
        ...initialState,
        step: 'review',
        mode: action.mode,
        files: action.files,
        mapping: action.mapping,
        analysis: action.analysis,
        sample: true,
        ...firstItem(action.analysis, action.mode),
      }
    case 'file':
      return {
        ...s,
        files: { ...s.files, [action.slot]: action.file },
        ...(action.slot === 'questionnaire' ? { mapping: null } : {}),
      }
    case 'mapping':
      return { ...s, mapping: action.mapping }
    case 'analysis':
      return {
        ...s,
        step: 'review',
        analysis: action.analysis,
        ...firstItem(action.analysis, s.mode),
      }
    case 'back':
      return { ...s, step: s.step === 'review' ? 'upload' : 'mode' }
    case 'reset':
      return initialState
    case 'select':
      return { ...s, selected: action.id }
    case 'tab':
      return { ...s, tab: action.tab, selected: null }
    case 'filter':
      return {
        ...s,
        statusFilter: action.status ?? s.statusFilter,
        search: action.search ?? s.search,
      }
    case 'review': {
      const next = patchAnswer(s, action.id, (a) => ({
        ...a,
        reviewed: action.reviewed,
        ...(action.draft !== undefined ? { draft: action.draft } : {}),
      }))
      return next !== s
        ? next
        : patchFlags(s, action.id, (f) => ({ ...f, reviewed: action.reviewed }))
    }
    case 'followUp': {
      const next = patchAnswer(s, action.id, (a) => ({ ...a, followUp: !a.followUp }))
      return next !== s ? next : patchFlags(s, action.id, (f) => ({ ...f, followUp: !f.followUp }))
    }
    case 'draft':
      return patchAnswer(s, action.id, (a) => ({ ...a, draft: action.draft, reviewed: 'edited' }))
    case 'evidence': {
      const next = patchAnswer(s, action.id, (a) => ({
        ...a,
        status: action.status,
        evidence: action.evidence,
        note: '',
      }))
      return next !== s
        ? next
        : patchFinding(s, action.id, (f) => ({
            ...f,
            status: action.status,
            evidence: action.evidence,
            severity: 'INFO',
            basis: 'user',
            missingElements: [],
          }))
    }
    case 'library': {
      let next = s
      for (const [id, n] of Object.entries(action.notes)) {
        next = patchAnswer(next, id, (a) => ({
          ...a,
          libraryAnswer: n.answer,
          libraryDate: n.date,
          libraryNote: n.supported ? 'supported' : 'outdated',
        }))
      }
      return next
    }
  }
}
