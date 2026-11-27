import { useId, type ReactNode } from 'react'
import { detectTable, extractQuestions, type ColumnMapping } from '../core/qa/detect.ts'
import { t, tf } from '../i18n/t.ts'
import { DropZone } from '../components/DropZone.tsx'
import { Icon } from '../components/Icon.tsx'
import { loadDocFile, loadTableFile } from '../app/files.ts'
import type { Action } from '../app/store.ts'
import { DOC_SLOTS, type AppState } from '../app/types.ts'

type Props = {
  state: AppState
  dispatch: (a: Action) => void
  onRun: () => void
  running: boolean
  /** Optional AI settings panel and the AI progress line, owned by App. */
  aiPanel?: ReactNode
  progress?: ReactNode
}

function colName(i: number): string {
  return `${t('upload.mapping.column')} ${String.fromCharCode(65 + (i % 26))}`
}

function Mapping({ state, dispatch }: Pick<Props, 'state' | 'dispatch'>) {
  const ids = { sheet: useId(), q: useId(), a: useId() }
  const table = state.files.questionnaire?.table
  if (!table) return null
  const m: ColumnMapping | null = state.mapping ?? detectTable(table)
  const sheet = table.sheets.find((s) => s.name === m?.sheet) ?? table.sheets[0]
  const cols = sheet ? sheet.rows.reduce((n, r) => Math.max(n, r.cells.length), 0) : 0
  const base: ColumnMapping = m ?? {
    sheet: sheet?.name ?? '',
    headerRow: sheet?.rows[0]?.index ?? null,
    questionCol: 0,
    answerCol: null,
    idCol: null,
  }
  const all = m ? extractQuestions(table, m) : []
  // Hidden rows are skipped by the analysis, so the count shows only what will be checked (QA fix).
  const count = all.filter((q) => !q.hidden).length
  const hidden = all.length - count
  const set = (patch: Partial<ColumnMapping>) =>
    dispatch({ type: 'mapping', mapping: { ...base, ...patch } })
  return (
    <section className="panel p-5" aria-labelledby={`${ids.q}-title`}>
      <h2 id={`${ids.q}-title`} className="font-semibold">
        {t('upload.mapping.title')}
      </h2>
      <p className="mt-1 text-[14px] text-[var(--muted)]" role="status">
        {m ? `${count} ${t('upload.mapping.found')}` : t('upload.mapping.notDetected')}
        {hidden > 0 ? ` ${tf('upload.mapping.hidden', { count: String(hidden) })}` : ''}
        {state.mode === 'client' && base.answerCol === null
          ? ` ${t('upload.mapping.needAnswer')}`
          : ''}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label htmlFor={ids.sheet} className="field">
          {t('upload.mapping.sheet')}
          <select
            id={ids.sheet}
            value={base.sheet}
            onChange={(e) => set({ sheet: e.target.value })}
          >
            {table.sheets.map((s) => (
              <option key={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
        <label htmlFor={ids.q} className="field">
          {t('upload.mapping.question')}
          <select
            id={ids.q}
            value={base.questionCol}
            onChange={(e) => set({ questionCol: Number(e.target.value) })}
          >
            {Array.from({ length: cols }, (_, i) => (
              <option key={i} value={i}>
                {colName(i)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={ids.a} className="field">
          {t('upload.mapping.answer')}
          <select
            id={ids.a}
            value={base.answerCol ?? -1}
            onChange={(e) =>
              set({ answerCol: Number(e.target.value) < 0 ? null : Number(e.target.value) })
            }
          >
            <option value={-1}>{t('upload.mapping.none')}</option>
            {Array.from({ length: cols }, (_, i) => (
              <option key={i} value={i}>
                {colName(i)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}

/** Client mode needs the vendor's DPA and an answers table with an answer column. */
function ready(state: AppState): boolean {
  if (!state.files.dpa?.doc) return false
  if (state.mode !== 'client') return true
  const table = state.files.questionnaire?.table
  const m = table ? (state.mapping ?? detectTable(table)) : null
  return !!m && m.answerCol !== null
}

export function UploadScreen({ state, dispatch, onRun, running, aiPanel, progress }: Props) {
  const canRun = ready(state) && !running
  const client = state.mode === 'client'
  const slots = client ? DOC_SLOTS.filter((s) => s.id === 'dpa') : DOC_SLOTS
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="enter text-[32px] font-semibold tracking-tight">
        {t(client ? 'upload.titleClient' : 'upload.title')}
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        {slots.map((slot) => (
          <DropZone
            key={slot.id}
            label={t(client ? 'upload.slot.vendorDpa' : `upload.slot.${slot.id}`)}
            hint={t('upload.hint.docs')}
            required={slot.required}
            accept=".pdf,.docx,.txt,.md"
            file={state.files[slot.id]}
            onFile={async (f) =>
              dispatch({
                type: 'file',
                slot: slot.id,
                file: await loadDocFile(f, slot.id, slot.kind),
              })
            }
            onRemove={() => dispatch({ type: 'file', slot: slot.id, file: undefined })}
          />
        ))}
        <DropZone
          label={t(client ? 'upload.slot.answers' : 'upload.slot.questionnaire')}
          hint={t(client ? 'upload.hint.answers' : 'upload.hint.table')}
          required
          accept=".xlsx,.csv"
          file={state.files.questionnaire}
          onFile={async (f) =>
            dispatch({ type: 'file', slot: 'questionnaire', file: await loadTableFile(f) })
          }
          onRemove={() => dispatch({ type: 'file', slot: 'questionnaire', file: undefined })}
        />
        <aside className="rounded-[10px] border border-[var(--border)] bg-[var(--accent-soft)] p-5 text-[14px]">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon name="lock" size={16} />
            {t('privacy.title')}
          </h2>
          <p className="mt-1">{t('privacy.note')}</p>
          <p className="mt-1 text-[var(--muted)]">{t('privacy.body')}</p>
        </aside>
      </div>
      <Mapping state={state} dispatch={dispatch} />
      {aiPanel}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'back' })}>
          {t('upload.back')}
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!canRun}
          onClick={onRun}
          aria-busy={running}
        >
          {running ? t('upload.running') : t('upload.run')}
        </button>
        {progress}
      </div>
    </div>
  )
}
