import { useEffect, useRef } from 'react'
import { t, type MessageKey } from '../../i18n/t.ts'

const KEYS: [string, MessageKey][] = [
  ['J', 'shortcuts.next'],
  ['K', 'shortcuts.prev'],
  ['A', 'shortcuts.accept'],
  ['E', 'shortcuts.edit'],
  ['R', 'shortcuts.reject'],
  ['/', 'shortcuts.search'],
  ['?', 'shortcuts.help'],
]

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="shortcuts-title" className="dialog">
      <h2 id="shortcuts-title" className="text-[18px] font-semibold">
        {t('shortcuts.title')}
      </h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {KEYS.map(([k, label]) => (
          <div key={k} className="contents">
            <dt>
              <kbd className="kbd">{k}</kbd>
            </dt>
            <dd>{t(label)}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="btn-secondary mt-4" onClick={onClose} autoFocus>
        {t('shortcuts.close')}
      </button>
    </dialog>
  )
}
