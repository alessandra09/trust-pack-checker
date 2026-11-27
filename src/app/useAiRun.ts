import { useRef, useState } from 'react'
import { CONFIRM_ABOVE_CALLS, type CostEstimate } from '../core/llm/cost.ts'
import type { Doc } from '../core/types.ts'
import { draftWithAi, planCost } from './aiRun.ts'
import { AI_MODEL } from './config.ts'
import type { Analysis } from './types.ts'

type Pending = { analysis: Analysis; docs: Doc[]; estimate: CostEstimate }
export type AiNotice = 'failed' | 'authError' | null

// Consent is held in memory for this tab only (SPEC 12.1), never stored.
export function useAiRun(apiKey: string, onResult: (analysis: Analysis) => void) {
  const [enabled, setEnabled] = useState(false)
  const [consented, setConsented] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [notice, setNotice] = useState<AiNotice>(null)
  const abort = useRef<AbortController | null>(null)

  const execute = async (analysis: Analysis, docs: Doc[]) => {
    const ctrl = new AbortController()
    abort.current = ctrl
    setProgress({ done: 0, total: 0 })
    const { createAnthropicProvider } = await import('../core/llm/anthropic.ts')
    const provider = createAnthropicProvider({ apiKey, model: AI_MODEL })
    const res = await draftWithAi(analysis, docs, provider, {
      signal: ctrl.signal,
      onProgress: (done, total) => setProgress({ done, total }),
    })
    setProgress(null)
    abort.current = null
    setNotice(
      res.authError ? 'authError' : res.failed > 0 && !ctrl.signal.aborted ? 'failed' : null,
    )
    onResult(res.analysis)
  }

  /** Called with the no-AI analysis. Either finishes at once, asks for consent, or runs the model. */
  const start = (analysis: Analysis, docs: Doc[]) => {
    setNotice(null)
    if (!enabled || !apiKey) return onResult(analysis)
    const estimate = planCost(analysis, docs, AI_MODEL)
    if (estimate.calls === 0) return onResult(analysis)
    if (consented && estimate.calls <= CONFIRM_ABOVE_CALLS) return void execute(analysis, docs)
    setPending({ analysis, docs, estimate })
  }

  const accept = () => {
    if (!pending) return
    setConsented(true)
    setPending(null)
    void execute(pending.analysis, pending.docs)
  }
  const decline = () => {
    if (!pending) return
    setPending(null)
    onResult(pending.analysis)
  }
  const stop = () => abort.current?.abort()

  return { enabled, setEnabled, pending, progress, notice, start, accept, decline, stop }
}
