import { useRef } from 'react'
import { t } from '../../i18n/t.ts'
import {
  exportAcceptedLibrary,
  exportAudit,
  exportQuestionnaire,
  matchLibrary,
} from '../../app/exports.ts'
import type { Action } from '../../app/store.ts'
import type { AppState } from '../../app/types.ts'

// Client mode has no drafted answers, so it offers only the audit log.
export function ExportMenu({
  state,
  dispatch,
  onNotice,
}: {
  state: AppState
  dispatch: (a: Action) => void
  onNotice: (text: string) => void
}) {
  const libRef = useRef<HTMLInputElement>(null)
  const company = state.mode !== 'client'
  return (
    <>
      <details className="menu">
        <summary className="btn-primary">{t('review.export')}</summary>
        <div className="menu-panel">
          {company ? (
            <button type="button" onClick={() => void exportQuestionnaire(state)}>
              {t('review.export.xlsx')}
            </button>
          ) : null}
          <button type="button" onClick={() => exportAudit(state)}>
            {t('review.export.json')}
          </button>
          {company ? (
            <>
              <button
                type="button"
                title={t('review.export.libraryWarning')}
                onClick={() =>
                  onNotice(
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
            </>
          ) : null}
        </div>
      </details>
      {company ? (
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
            onNotice(notes ? '' : t('review.import.failed'))
          }}
        />
      ) : null}
    </>
  )
}
