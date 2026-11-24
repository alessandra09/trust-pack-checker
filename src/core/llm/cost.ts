// SPEC 12.1 cost guard: characters / 4 as a token estimate; confirmation above 200 calls.
export const CONFIRM_ABOVE_CALLS = 200
// Includes thinking tokens (on by default on current models, billed as output). Recalibrate from the pilot.
export const REPLY_TOKENS = 800

export type CostEstimate = {
  calls: number
  inputTokens: number
  outputTokens: number
  lowUsd: number
  highUsd: number
}
export type Price = { inputPerMTok: number; outputPerMTok: number }

export function estimateCost(promptChars: number[], price: Price): CostEstimate {
  const inputTokens = Math.ceil(promptChars.reduce((a, b) => a + b, 0) / 4)
  const outputTokens = promptChars.length * REPLY_TOKENS
  const usd = (inputTokens * price.inputPerMTok + outputTokens * price.outputPerMTok) / 1_000_000
  // Range: retries and longer replies can roughly double the cost.
  return { calls: promptChars.length, inputTokens, outputTokens, lowUsd: usd, highUsd: usd * 2 }
}
