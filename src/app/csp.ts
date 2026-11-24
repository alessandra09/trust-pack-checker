import { AI_PROVIDER } from './config.ts'

// Strict CSP (SPEC 5.1): no third-party scripts, fonts or analytics; the only network target is the AI provider.
export function buildCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${AI_PROVIDER.origin}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
}
