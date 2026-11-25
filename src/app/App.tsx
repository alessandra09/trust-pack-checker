import { useEffect, useReducer, useState } from 'react'
import { detectTable } from '../core/qa/detect.ts'
import type { Doc } from '../core/types.ts'
import { t } from '../i18n/t.ts'
import { ModeScreen } from '../screens/ModeScreen.tsx'
import { UploadScreen } from '../screens/UploadScreen.tsx'
import { ReviewScreen } from '../screens/review/ReviewScreen.tsx'
import { analyzeCompany } from './analyze.ts'
import { analyzeClient } from './analyzeClient.ts'
import { sampleFiles, vendorSampleFiles } from './sample.ts'
import { initialState, reducer } from './store.ts'
import { useAiRun } from './useAiRun.ts'
import { useApiKey } from './useApiKey.ts'
import { AiPanel } from '../components/AiPanel.tsx'
import { ConsentDialog } from '../components/ConsentDialog.tsx'
import { Icon } from '../components/Icon.tsx'
import { DOC_SLOTS, type AppState, type Mode } from './types.ts'

// Client mode makes no model calls: every check is code (SPEC 9.3).
function clientAnalysis(files: AppState['files'], mapping: AppState['mapping']) {
  const dpa = files.dpa?.doc
  if (!dpa) return null
  return analyzeClient({
    dpa,
    table: files.questionnaire?.table ?? null,
    mapping,
    answersName: files.questionnaire?.name ?? 'Vendor answers',
  })
}

type Theme = 'system' | 'light' | 'dark'

function useTheme(): [boolean, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme | null) ?? 'system',
  )
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    if (theme === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', theme)
  }, [theme])
  const prefersDark =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  return [isDark, () => setTheme(isDark ? 'light' : 'dark')]
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [running, setRunning] = useState(false)
  const [isDark, toggleTheme] = useTheme()
  const apiKey = useApiKey()
  const ai = useAiRun(apiKey.key, (analysis) => {
    dispatch({ type: 'analysis', analysis })
    setRunning(false)
  })

  const run = () => {
    setRunning(true)
    // Let the busy state paint before the synchronous analysis runs.
    setTimeout(() => {
      const docs = DOC_SLOTS.flatMap((s) =>
        state.files[s.id]?.doc ? [state.files[s.id]?.doc as Doc] : [],
      )
      const table = state.files.questionnaire?.table ?? null
      const mapping = state.mapping ?? (table ? detectTable(table) : null)
      dispatch({ type: 'mapping', mapping })
      if (state.mode === 'client') {
        const analysis = clientAnalysis(state.files, mapping)
        if (analysis) dispatch({ type: 'analysis', analysis })
        setRunning(false)
        return
      }
      ai.start(analyzeCompany({ docs, table, mapping }), docs)
    }, 0)
  }

  const sample = (mode: Mode) => {
    const files = mode === 'client' ? vendorSampleFiles() : sampleFiles()
    const table = files.questionnaire?.table ?? null
    const mapping = table ? detectTable(table) : null
    const docs = DOC_SLOTS.flatMap((s) => (files[s.id]?.doc ? [files[s.id]?.doc as Doc] : []))
    const analysis =
      mode === 'client' ? clientAnalysis(files, mapping) : analyzeCompany({ docs, table, mapping })
    if (analysis) dispatch({ type: 'sample', mode, files, mapping, analysis })
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen">
      <a href="#main" className="skip-link">
        {t('nav.skip')}
      </a>
      <header className="app-header flex items-center gap-4 px-6 py-3">
        <span className="flex min-w-0 items-center gap-2.5 text-[16px] font-semibold tracking-tight whitespace-nowrap">
          <span className="brand-mark">
            <Icon name="mark" size={18} />
          </span>
          {t('app.name')}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {state.step !== 'mode' ? (
            <button type="button" className="btn-link" onClick={() => dispatch({ type: 'reset' })}>
              {t('nav.startOver')}
            </button>
          ) : null}
          <button
            type="button"
            className="btn-secondary btn-icon"
            onClick={toggleTheme}
            aria-label={t('theme.toggle')}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </header>
      <p className="border-b border-[var(--border)] px-6 py-1.5 text-center text-[13px] text-[var(--muted)] md:hidden">
        {t('mobile.notice')}
      </p>
      <main id="main" className="flex min-h-0 flex-1 flex-col md:overflow-y-auto">
        {state.step === 'mode' ? (
          <ModeScreen onMode={(mode) => dispatch({ type: 'start', mode })} onSample={sample} />
        ) : null}
        {state.step === 'upload' ? (
          <UploadScreen
            state={state}
            dispatch={dispatch}
            onRun={run}
            running={running}
            aiPanel={
              state.mode === 'client' ? null : (
                <AiPanel
                  enabled={ai.enabled}
                  onEnabled={ai.setEnabled}
                  apiKey={apiKey.key}
                  onKey={apiKey.setKey}
                  remember={apiKey.remember}
                  onRemember={apiKey.setRemember}
                />
              )
            }
            progress={
              ai.progress ? (
                <span role="status" className="flex items-center gap-3 text-[14px]">
                  <span className="progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${ai.progress.total ? (100 * ai.progress.done) / ai.progress.total : 0}%`,
                      }}
                    />
                  </span>
                  {t('ai.progress')}: {ai.progress.done}/{ai.progress.total}
                  <button type="button" className="btn-link" onClick={ai.stop}>
                    {t('ai.cancel')}
                  </button>
                </span>
              ) : null
            }
          />
        ) : null}
        {state.step === 'review' && ai.notice ? (
          <p role="alert" className="border-b border-[var(--border)] px-6 py-2 text-[14px]">
            {t(ai.notice === 'authError' ? 'ai.authError' : 'ai.failed')}
          </p>
        ) : null}
        {state.step === 'review' ? <ReviewScreen state={state} dispatch={dispatch} /> : null}
        {ai.pending ? (
          <ConsentDialog estimate={ai.pending.estimate} onSend={ai.accept} onNoAi={ai.decline} />
        ) : null}
      </main>
      <footer className="flex flex-wrap gap-x-6 gap-y-0.5 border-t border-[var(--border)] bg-[var(--bg)] px-6 py-1.5 text-[13px] text-[var(--muted)]">
        <span>{t('footer.disclaimer')}</span>
        <span>{t('footer.rulesNotReviewed')}</span>
        <span title={t('notChecked.body')}>
          {t('notChecked.title')}: {t('notChecked.body')}
        </span>
      </footer>
    </div>
  )
}
