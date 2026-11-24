import type { Status } from '../core/types.ts'
import { t } from '../i18n/t.ts'

// Colour is never the only signal: every chip has an icon and a text label (SPEC 6.3, 11.4).
const STYLE: Record<Status, { icon: string; cls: string }> = {
  FOUND: { icon: '✓', cls: 'bg-[var(--found-bg)] text-[var(--found-fg)]' },
  PARTIAL: { icon: '◐', cls: 'bg-[var(--partial-bg)] text-[var(--partial-fg)]' },
  NOT_FOUND: { icon: '○', cls: 'bg-[var(--notfound-bg)] text-[var(--notfound-fg)]' },
  CONFLICT: { icon: '≠', cls: 'bg-[var(--conflict-bg)] text-[var(--conflict-fg)]' },
  NEEDS_HUMAN: { icon: '?', cls: 'bg-[var(--human-bg)] text-[var(--human-fg)]' },
}

export function StatusChip({ status, count }: { status: Status; count?: number }) {
  const s = STYLE[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[14px] font-medium whitespace-nowrap ${s.cls}`}
    >
      <span aria-hidden="true">{s.icon}</span>
      {t(`status.${status}`)}
      {count !== undefined ? <span className="tabular-nums">· {count}</span> : null}
    </span>
  )
}
