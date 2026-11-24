// Single place for provider settings (SPEC 12.1).
// AI_MODEL is provisional until the owner picks a model from the Pack C pilot (SPEC 17 #7).
export const AI_PROVIDER = {
  name: 'Anthropic',
  origin: 'https://api.anthropic.com',
} as const

export const AI_MODEL = 'claude-haiku-5-5'
