import { useEffect, useRef, useState } from 'react'
import { verifyQuote } from '../../core/llm/verifyQuote.ts'
import type { Evidence } from '../../core/types.ts'
import { t } from '../../i18n/t.ts'
import { StatusChip } from '../../components/StatusChip.tsx'
import { chunkById } from '../../app/analyze.ts'
import type { Action } from '../../app/store.ts'
import type { Analysis, ReviewAnswer } from '../../app/types.ts'
import { Passage, readSelection } from './Passage.tsx'
import { ReviewActions } from './ReviewActions.tsx'

type Props = { analysis: Analysis; qid: string; dispatch: (a: Action) => void; editRequest: number }

export function EvidencePanel({ analysis, qid, dispatch, editRequest }: Props) {
  const q = analysis.questions.find((x) => x.qid === qid)
  const a: ReviewAnswer | undefined = analysis.answers[qid]
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const [selError, setSelError] = useState(false)
  useEffect(() => {
    if (editRequest > 0) draftRef.current?.focus()
  }, [editRequest])
  if (!q || !a) return null

  const useSelection = () => {
    const sel = readSelection()
    const chunk = sel ? chunkById(analysis, sel.chunkId) : undefined
    if (!sel || !chunk || !verifyQuote(sel.text, chunk.text)) {
      setSelError(true)
      return
    }
    const ev: Evidence = {
      chunkId: chunk.id,
      docName: analysis.docNames[chunk.docId] ?? chunk.docId,
      page: chunk.page,
      quote: sel.text,
      verified: true,
    }
    setSelError(false)
    dispatch({ type: 'evidence', id: qid, status: 'FOUND', evidence: [ev] })
  }
  const verified = a.evidence.filter((e) => e.verified)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[14px] text-[var(--muted)]">{q.qid}</span>
          <StatusChip status={a.status} />
        </div>
        <h2 className="text-[18px] font-semibold">{q.text}</h2>
      </div>

      {a.libraryAnswer ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[14px]">
          <p className="font-semibold">
            {t('evidence.library')} {a.libraryDate}
          </p>
          <p className="mt-1">{a.libraryAnswer}</p>
          {a.libraryNote === 'outdated' ? (
            <p className="mt-1 text-[var(--partial-fg)]">{t('evidence.libraryOutdated')}</p>
          ) : null}
          <button
            type="button"
            className="btn-link mt-1"
            onClick={() => dispatch({ type: 'draft', id: qid, draft: a.libraryAnswer ?? '' })}
          >
            {t('evidence.libraryUse')}
          </button>
        </div>
      ) : null}

      <label className="field">
        {t('evidence.draft')}
        <textarea
          ref={draftRef}
          rows={4}
          value={a.draft ?? ''}
          placeholder={t('evidence.draftPlaceholder')}
          onChange={(e) => dispatch({ type: 'draft', id: qid, draft: e.target.value })}
        />
      </label>
      {a.warnings?.includes('draft-details-not-in-evidence') ? (
        <p className="text-[14px] text-[var(--partial-fg)]">{t('evidence.detailsNotInEvidence')}</p>
      ) : null}

      <ReviewActions
        id={qid}
        reviewed={a.reviewed}
        followUp={!!a.followUp}
        draft={a.draft}
        dispatch={dispatch}
      />

      {a.status === 'CONFLICT' ? (
        <p className="text-[14px] font-medium text-[var(--conflict-fg)]">
          {t('evidence.conflict')}
        </p>
      ) : null}
      {a.note === 'needs-doc' ? (
        <p className="text-[14px]">
          {t('evidence.needsDoc')} {a.neededDocs.map((k) => t(`upload.slot.${k}`)).join(', ')}
        </p>
      ) : null}
      {a.note === 'unclassified' ? (
        <p className="text-[14px]">{t('evidence.unclassified')}</p>
      ) : null}
      {a.warnings?.includes('quote-not-verified') ? (
        <p className="text-[14px] text-[var(--human-fg)]">{t('evidence.unverified')}</p>
      ) : null}

      {verified.length > 0 ? (
        <section
          aria-label={t('evidence.quote')}
          className={a.status === 'CONFLICT' ? 'grid gap-3 lg:grid-cols-2' : 'flex flex-col gap-3'}
        >
          {verified.map((e) => {
            const chunk = chunkById(analysis, e.chunkId)
            return chunk ? (
              <Passage
                key={e.chunkId + e.quote}
                chunk={chunk}
                docName={e.docName}
                query={q.text}
                quote={e.quote}
              />
            ) : null
          })}
        </section>
      ) : null}

      {a.status !== 'FOUND' && a.passages.length > 0 ? (
        <section className="flex flex-col gap-3" aria-labelledby={`passages-${qid}`}>
          <div>
            <h3 id={`passages-${qid}`} className="font-semibold">
              {t('evidence.passages')}
            </h3>
            <p className="text-[14px] text-[var(--muted)]">{t('evidence.passagesHelp')}</p>
          </div>
          {a.passages.map((c) => (
            <Passage
              key={c.id}
              chunk={c}
              docName={analysis.docNames[c.docId] ?? c.docId}
              query={q.text}
            />
          ))}
          <div>
            <button type="button" className="btn-secondary" onClick={useSelection}>
              {t('evidence.useSelection')}
            </button>
            {selError ? (
              <p role="alert" className="mt-1 text-[14px] text-[var(--conflict-fg)]">
                {t('evidence.selectionInvalid')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
      {a.status === 'NOT_FOUND' && a.passages.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">{t('evidence.noPassages')}</p>
      ) : null}
    </div>
  )
}
