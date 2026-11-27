// Site paths, resolved against the deploy base (/trust-pack-checker/ on GitHub Pages).
// Works in the browser (Vite sets BASE_URL) and in the Node prerender script (BASE_PATH env).
type Meta = { env?: { BASE_URL?: string } }
type Env = { process?: { env: Record<string, string | undefined> } }
const nodeBase = (globalThis as Env).process?.env.BASE_PATH

export const BASE: string = (import.meta as Meta).env?.BASE_URL ?? nodeBase ?? '/'

/** The public origin and path, for canonical and Open Graph URLs. */
export const SITE_URL = 'https://alessandra09.github.io/trust-pack-checker/'

export type PageId = 'pilot' | 'privacy' | 'terms' | 'about' | 'art28' | 'questionnaire'

export const PAGE_PATH: Record<PageId, string> = {
  pilot: 'pilot/',
  privacy: 'privacy/',
  terms: 'terms/',
  about: 'about/',
  art28: 'guides/gdpr-article-28-dpa-checklist/',
  questionnaire: 'guides/answer-security-questionnaire/',
}

export const SAMPLE_REPORT_PATH = 'sample-report/'

export const href = (path: string) => `${BASE}${path}`
