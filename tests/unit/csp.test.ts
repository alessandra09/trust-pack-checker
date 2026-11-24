import { describe, expect, it } from 'vitest'
import { buildCsp } from '../../src/app/csp.ts'

describe('buildCsp', () => {
  const csp = buildCsp()

  it('limits network calls to self and the AI provider', () => {
    expect(csp).toContain("connect-src 'self' https://api.anthropic.com")
  })

  it('blocks third-party scripts, fonts and objects', () => {
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("font-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/)
  })
})
