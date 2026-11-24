import type { Price } from './cost.ts'

// Model choice is the owner's after the Pack C pilot (SPEC 17 #7). Prices in USD per million tokens.
export type ModelInfo = { id: string; label: string; price: Price }

export const MODELS: ModelInfo[] = [
  {
    id: 'claude-haiku-5-5',
    label: 'Claude Haiku 5.5',
    price: { inputPerMTok: 0.1, outputPerMTok: 0.5 },
  },
  {
    id: 'claude-sonnet-5-5',
    label: 'Claude Sonnet 5.5',
    price: { inputPerMTok: 2, outputPerMTok: 10 },
  },
  {
    id: 'claude-opus-5-5',
    label: 'Claude Opus 5.5',
    price: { inputPerMTok: 4, outputPerMTok: 20 },
  },
]

export const PILOT_MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5']

export function modelInfo(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id)
}

export function usageCostUsd(id: string, inputTokens: number, outputTokens: number): number {
  const p = modelInfo(id)?.price
  return p ? (inputTokens * p.inputPerMTok + outputTokens * p.outputPerMTok) / 1_000_000 : 0
}
