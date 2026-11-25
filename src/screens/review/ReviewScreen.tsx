import { useEffect, useMemo, useRef, useState } from 'react'
import type { Status } from '../../core/types.ts'
import { t } from '../../i18n/t.ts'
import { ScoreRing } from '../../components/ScoreRing.tsx'
import { StatusChip } from '../../components/StatusChip.tsx'
import type { Action } from '../../app/store.ts'
import type { AppState, Tab } from '../../app/types.ts'
import { EvidencePanel } from './EvidencePanel.tsx'
import { ExportMenu } from './ExportMenu.tsx'
import { GapsView } from './GapsView.tsx'
import { filterItems, itemsFor, statusCounts } from './items.ts'
import { RulePanel } from './RulePanel.tsx'
import { ShortcutsDialog } from './ShortcutsDialog.tsx'
import { useReviewKeys } from './useReviewKeys.ts'
import { VendorAsksView } from './VendorAsksView.tsx'
import { VendorPanel } from './VendorPanel.tsx'

const STATUSES: Status[] = ['FOUND', 'PARTIAL', 'NOT_FOUND', 'CONFLICT', 'NEEDS_HUMAN']
const TABS: Record<'company' | 'client', Tab[]> = {
  company: ['questions', 'rules', 'gaps'],
  client: ['vendor', 'rules', 'gaps'],
}
// Decorative segment colours; the labelled filter chips below carry the meaning (SPEC 11.4).
const SEGMENT: Record<Status, string> = {
  FOUND: '#22c55e',
  PARTIAL: '#f59e0b',
  NOT_FOUND: '#71717a',
  CONFLICT: '#ef4444',
  NEEDS_HUMAN: '#8b5cf6',
}

export function ReviewScreen({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: (a: Action) => void
}) {
  const analysis = state.analysis
  const searchRef = useRef<HTMLInputElement>(null)
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
  const client = state.mode === 'client'
  const tabLabel = (tab: Tab) =>
    t(tab === 'gaps' && client ? 'review.tab.gapsClient' : `review.tab.${tab}`)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {state.tab !== 'gaps' ? (
        <section
          className="enter grid gap-4 border-b border-[var(--border)] px-6 py-4 md:grid-cols-[auto_auto_1fr]"
          aria-label={t('overview.distribution')}
        >
          <div className="glass stat">
            <ScoreRing value={reviewed} total={all.length} label={t('overview.reviewed')} />
          </div>
          <div className="glass stat">
            <ScoreRing
              value={counts.FOUND + counts.PARTIAL + counts.CONFLICT}
              total={all.length}
              label={t('overview.found')}
              hint={t('overview.foundHint')}
            />
          </div>
          <div className="glass stat flex flex-col justify-center gap-3">
            <span className="text-[14px] text-[var(--muted)]">{t('overview.distribution')}</span>
            <div className="dist" aria-hidden="true">
              {STATUSES.map((s) =>
                counts[s] > 0 ? (
                  <span
                    key={s}
                    style={{
                      width: `${(100 * counts[s]) / Math.max(all.length, 1)}%`,
                      background: SEGMENT[s],
                    }}
                  />
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--muted)]">
              {STATUSES.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: SEGMENT[s] }}
                    aria-hidden="true"
                  />
                  {t(`status.${s}`)} <span className="tabular-nums">{counts[s]}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-6 py-3">
        <div role="tablist" aria-label="Views" className="tabs">
          {TABS[client ? 'client' : 'company'].map((tab) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={state.tab === tab}
              className="tab"
              onClick={() => dispatch({ type: 'tab', tab })}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {state.tab !== 'gaps' ? (
            <span className="text-[14px] text-[var(--muted)]" aria-live="polite">
              {reviewed} / {all.length} {t('review.progress')}
            </span>
          ) : null}
          <ExportMenu state={state} dispatch={dispatch} onNotice={setNotice} />
        </div>
      </div>
      <p className="sr-only" role="status">
        {notice}
      </p>
      {notice ? <p className="px-6 pt-2 text-[14px] text-[var(--muted)]">{notice}</p> : null}

      {state.tab === 'gaps' ? (
        <div className="px-6 py-6">
          {client ? <VendorAsksView analysis={analysis} /> : <GapsView analysis={analysis} />}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[3fr_2fr]">
          <section
            className="flex min-h-0 flex-col border-r border-[var(--border)]"
            aria-label={tabLabel(state.tab)}
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
            <ul className="min-h-0 flex-1 overflow-y-auto" aria-label={tabLabel(state.tab)}>
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
                <li className="px-6 py-8 text-[var(--muted)]">
                  {state.tab === 'vendor' && all.length === 0
                    ? t(analysis.vendorRows.length ? 'vendor.none' : 'vendor.noAnswers')
                    : t('review.noResults')}
                </li>
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
            {state.selected && state.tab === 'vendor' ? (
              <VendorPanel analysis={analysis} id={state.selected} dispatch={dispatch} />
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
