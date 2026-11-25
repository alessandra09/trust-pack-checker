import { useEffect, useMemo, useRef, useState } from 'react'
import type { Status } from '../../core/types.ts'
import { t } from '../../i18n/t.ts'
import { StatusChip } from '../../components/StatusChip.tsx'
import {
  exportAcceptedLibrary,
  exportAudit,
  exportQuestionnaire,
  matchLibrary,
} from '../../app/exports.ts'
import type { Action } from '../../app/store.ts'
import type { AppState, Tab } from '../../app/types.ts'
import { EvidencePanel } from './EvidencePanel.tsx'
import { GapsView } from './GapsView.tsx'
import { filterItems, itemsFor, statusCounts } from './items.ts'
import { RulePanel } from './RulePanel.tsx'
import { ShortcutsDialog } from './ShortcutsDialog.tsx'
import { useReviewKeys } from './useReviewKeys.ts'

const STATUSES: Status[] = ['FOUND', 'PARTIAL', 'NOT_FOUND', 'CONFLICT', 'NEEDS_HUMAN']
const TABS: Tab[] = ['questions', 'rules', 'gaps']

export function ReviewScreen({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: (a: Action) => void
}) {
  const analysis = state.analysis
  const searchRef = useRef<HTMLInputElement>(null)
  const libRef = useRef<HTMLInputElement>(null)
  const [help, setHelp] = useState(false)
  const [editRequest, setEditRequest] = useState(0)
  const [notice, setNotice] = useState('')
  const all = useMemo(() => itemsFor(state), [state])
  const items = useMemo(
    () => filterItems(all, state.statusFilter, state.search),
    [all, state.statusFilter, state.search],
  )
  const counts = statusCounts(all)
  const reviewed = all.filter((i) => i.reviewed !== 'pending').length
  useReviewKeys({
    items,
    state,
    dispatch,
    focusSearch: () => searchRef.current?.focus(),
    onEdit: () => setEditRequest((n) => n + 1),
    onHelp: () => setHelp(true),
  })
  useEffect(() => {
    document
      .querySelector(`[data-item-id="${CSS.escape(state.selected ?? '')}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [state.selected])
  if (!analysis) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-6 py-3">
        <div role="tablist" aria-label="Views" className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={state.tab === tab}
              className="tab"
              onClick={() => dispatch({ type: 'tab', tab })}
            >
              {t(`review.tab.${tab}`)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {state.tab !== 'gaps' ? (
            <span className="text-[14px] text-[var(--muted)]" aria-live="polite">
              {reviewed} / {all.length} {t('review.progress')}
            </span>
          ) : null}
          <details className="menu">
            <summary className="btn-primary">{t('review.export')}</summary>
            <div className="menu-panel">
              <button type="button" onClick={() => void exportQuestionnaire(state)}>
                {t('review.export.xlsx')}
              </button>
              <button type="button" onClick={() => exportAudit(state)}>
                {t('review.export.json')}
              </button>
              <button
                type="button"
                title={t('review.export.libraryWarning')}
                onClick={() =>
                  setNotice(
                    exportAcceptedLibrary(state, '') > 0
                      ? t('review.export.libraryWarning')
                      : t('gaps.none'),
                  )
                }
              >
                {t('review.export.library')}
              </button>
              <button type="button" onClick={() => libRef.current?.click()}>
                {t('review.import.library')}
              </button>
            </div>
          </details>
          <input
            ref={libRef}
            type="file"
            accept=".json"
            className="sr-only"
            aria-label={t('review.import.library')}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const notes = matchLibrary(state, await f.text())
              if (notes) dispatch({ type: 'library', notes })
              setNotice(notes ? '' : t('review.import.failed'))
            }}
          />
        </div>
      </div>
      <p className="sr-only" role="status">
        {notice}
      </p>
      {notice ? <p className="px-6 pt-2 text-[14px] text-[var(--muted)]">{notice}</p> : null}

      {state.tab === 'gaps' ? (
        <div className="px-6 py-6">
          <GapsView analysis={analysis} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[3fr_2fr]">
          <section
            className="flex min-h-0 flex-col border-r border-[var(--border)]"
            aria-label={t(`review.tab.${state.tab}`)}
          >
            <div className="sticky top-0 flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-6 py-3">
              <button
                type="button"
                className="chip-filter"
                aria-pressed={state.statusFilter === 'all'}
                onClick={() => dispatch({ type: 'filter', status: 'all' })}
              >
                {t('review.filter.all')} · {all.length}
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip-filter"
                  aria-pressed={state.statusFilter === s}
                  onClick={() => dispatch({ type: 'filter', status: s })}
                >
                  <StatusChip status={s} count={counts[s]} />
                </button>
              ))}
              <input
                ref={searchRef}
                type="search"
                className="input ml-auto w-56"
                placeholder={t('review.filter.search')}
                aria-label={t('review.filter.search')}
                value={state.search}
                onChange={(e) => dispatch({ type: 'filter', search: e.target.value })}
              />
            </div>
            <ul
              className="min-h-0 flex-1 overflow-y-auto"
              aria-label={t(`review.tab.${state.tab}`)}
            >
              {items.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    data-item-id={i.id}
                    aria-current={state.selected === i.id}
                    className="row"
                    onClick={() => dispatch({ type: 'select', id: i.id })}
                  >
                    <span className="font-mono text-[14px] text-[var(--muted)]">{i.label}</span>
                    <span className="truncate">{i.text}</span>
                    <StatusChip status={i.status} />
                    <span className="hidden text-[14px] text-[var(--muted)] xl:inline">
                      {i.topic}
                    </span>
                    <span className="text-[14px] text-[var(--muted)]">
                      {t(`review.reviewed.${i.reviewed as 'pending'}`)}
                      {i.followUp ? ' ⚑' : ''}
                    </span>
                  </button>
                </li>
              ))}
              {items.length === 0 ? (
                <li className="px-6 py-8 text-[var(--muted)]">{t('review.noResults')}</li>
              ) : null}
            </ul>
          </section>
          <section className="min-h-0 overflow-y-auto px-6 py-6" aria-label={t('evidence.quote')}>
            {state.selected && state.tab === 'questions' ? (
              <EvidencePanel
                analysis={analysis}
                qid={state.selected}
                dispatch={dispatch}
                editRequest={editRequest}
              />
            ) : null}
            {state.selected && state.tab === 'rules' ? (
              <RulePanel
                key={state.selected}
                analysis={analysis}
                id={state.selected}
                dispatch={dispatch}
              />
            ) : null}
            {!state.selected ? <p className="text-[var(--muted)]">{t('review.empty')}</p> : null}
          </section>
        </div>
      )}
      <ShortcutsDialog open={help} onClose={() => setHelp(false)} />
    </div>
  )
}
