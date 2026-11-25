// Single place for provider settings (SPEC 12.1).
// AI_MODEL is provisional until the owner picks a model from the Pack C pilot (SPEC 17 #7).
export const AI_PROVIDER = {
  name: 'Anthropic',
  origin: 'https://api.anthropic.com',
} as const

export const AI_MODEL = 'claude-haiku-5-5'

// Shown on the landing page. Empty values hide the matching link (filled in by the owner).
export const AUTHOR: { name: string; role: string; linkedin: string; contact: string } = {
  name: 'Oleksandra Hordieieva',
  role: '',
  linkedin: '',
  /** mailto: address or an https URL for feedback. */
  contact: '',
}
