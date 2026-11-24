import { useEffect } from 'react'
import type { Action } from '../../app/store.ts'
import type { AppState } from '../../app/types.ts'
import type { Item } from './items.ts'

type Opts = {
  items: Item[]
  state: AppState
  dispatch: (a: Action) => void
  focusSearch: () => void
  onEdit: () => void
  onHelp: () => void
}

// SPEC 11.2 keyboard: J/K next/previous, A accept, E edit, R reject, / search, ? shortcuts.
export function useReviewKeys({ items, state, dispatch, focusSearch, onEdit, onHelp }: Opts) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const idx = items.findIndex((i) => i.id === state.selected)
      const move = (d: number) => {
        const next = items[Math.max(0, Math.min(items.length - 1, idx + d))]
        if (next) dispatch({ type: 'select', id: next.id })
      }
      const id = state.selected
      switch (e.key) {
        case 'j':
          move(idx < 0 ? 0 : 1)
          break
        case 'k':
          move(-1)
          break
        case 'a':
          if (id) dispatch({ type: 'review', id, reviewed: 'accepted' })
          break
        case 'r':
          if (id) dispatch({ type: 'review', id, reviewed: 'rejected' })
          break
        case 'e':
          onEdit()
          break
        case '/':
          focusSearch()
          break
        case '?':
          onHelp()
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, state.selected, dispatch, focusSearch, onEdit, onHelp])
}
