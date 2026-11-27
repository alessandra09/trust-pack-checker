import { t } from '../i18n/t.ts'

type Step = 'match' | 'verify' | 'ai'

// The running state of a check (DESIGN2 section 5): the real steps of the run, the current one marked,
// and skeleton rows where the results will appear. The no-AI checks run in one go, so they show as
// active together until they finish; the AI step reports real progress and can be stopped.
export function RunProgress({
  ai,
  onStop,
}: {
  ai: { done: number; total: number } | null
  onStop: () => void
}) {
  const steps: Step[] = ai ? ['match', 'verify', 'ai'] : ['match', 'verify']
  const state = (s: Step): 'done' | 'active' => (ai && s !== 'ai' ? 'done' : 'active')
  const pct = ai && ai.total ? (100 * ai.done) / ai.total : 0
  return (
    <div role="status" className="panel flex w-full flex-col gap-4 p-5">
      <ol className="flex flex-col gap-2 text-[15px]">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`run-dot ${state(s) === 'done' ? 'run-dot-done' : 'run-dot-active'}`}
            />
            <span className={state(s) === 'done' ? 'text-[var(--muted)]' : 'font-medium'}>
              {t(`run.step.${s}`)}
              {s === 'ai' && ai ? (
                <span className="tabular-nums">
                  {' '}
                  {ai.done}/{ai.total}
                </span>
              ) : null}
            </span>
            <span className="sr-only">
              {t(state(s) === 'done' ? 'run.state.done' : 'run.state.active')}
            </span>
          </li>
        ))}
      </ol>
      {ai ? (
        <div className="flex items-center gap-3 text-[14px]">
          <span className="progress" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
          <button type="button" className="btn-link" onClick={onStop}>
            {t('ai.cancel')}
          </button>
        </div>
      ) : null}
      <div aria-hidden="true" className="flex flex-col gap-2">
        {[92, 78, 85].map((w) => (
          <span key={w} className="skeleton block h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}
