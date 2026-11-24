import { t } from '../../i18n/t.ts'
import type { Action } from '../../app/store.ts'

type Props = {
  id: string
  reviewed: string
  followUp: boolean
  draft: string | undefined
  dispatch: (a: Action) => void
  withEdit?: boolean
}

// Nothing is accepted automatically (SPEC 3.3): every decision is a click or a key press.
export function ReviewActions({ id, reviewed, followUp, draft, dispatch }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn-primary"
        aria-pressed={reviewed === 'accepted'}
        onClick={() => dispatch({ type: 'review', id, reviewed: 'accepted' })}
      >
        {t('action.accept')}
      </button>
      <button
        type="button"
        className="btn-secondary"
        aria-pressed={reviewed === 'edited'}
        onClick={() =>
          dispatch({
            type: 'review',
            id,
            reviewed: 'edited',
            ...(draft !== undefined ? { draft } : {}),
          })
        }
      >
        {t('action.edit')}
      </button>
      <button
        type="button"
        className="btn-secondary"
        aria-pressed={reviewed === 'rejected'}
        onClick={() => dispatch({ type: 'review', id, reviewed: 'rejected' })}
      >
        {t('action.reject')}
      </button>
      <button
        type="button"
        className="btn-link"
        aria-pressed={followUp}
        onClick={() => dispatch({ type: 'followUp', id })}
      >
        {t('action.followUp')}
      </button>
      <span className="text-[14px] text-[var(--muted)]" role="status">
        {t(`review.reviewed.${reviewed as 'pending'}`)}
      </span>
    </div>
  )
}
