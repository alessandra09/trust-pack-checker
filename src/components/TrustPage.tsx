import { useEffect, useState } from 'react'
import { AUTHOR } from '../app/config.ts'
import { t, type MessageKey } from '../i18n/t.ts'
import { EmailLine } from './EmailLine.tsx'

// Contact, terms and privacy as hash pages (#/privacy), so they work on static hosting without a router.
export const TRUST_PAGES = ['privacy', 'terms', 'contact'] as const
export type TrustPageId = (typeof TRUST_PAGES)[number]
const UPDATED = '2026-11-27'

const PARTS: Record<TrustPageId, MessageKey[]> = {
  privacy: [
    'trust.privacy.p1',
    'trust.privacy.h.tool',
    'trust.privacy.p2',
    'trust.privacy.p3',
    'trust.privacy.p4',
    'trust.privacy.p5',
    'trust.privacy.h.pilot',
    'trust.privacy.p6',
    'trust.privacy.p7',
  ],
  terms: ['trust.terms.p1', 'trust.terms.p2', 'trust.terms.p3', 'trust.terms.p4', 'trust.terms.p5'],
  contact: ['trust.contact.p1', 'trust.contact.p2'],
}

function readHash(): TrustPageId | null {
  const id = location.hash.replace(/^#\//, '')
  return (TRUST_PAGES as readonly string[]).includes(id) ? (id as TrustPageId) : null
}

export function useTrustPage(): TrustPageId | null {
  const [page, setPage] = useState(readHash)
  useEffect(() => {
    const on = () => setPage(readHash())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return page
}

export function TrustPage({ id }: { id: TrustPageId }) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <a href="#/" className="btn-link self-start">
        ← {t('nav.back')}
      </a>
      <h1 className="text-[32px] font-semibold tracking-tight">{t(`trust.${id}.title`)}</h1>
      <p className="text-[14px] text-[var(--muted)]">
        {t('trust.updated')}: {UPDATED}
      </p>
      {id !== 'contact' ? (
        <p role="note" className="diff-line font-medium">
          {t('trust.draft')}
        </p>
      ) : null}
      {PARTS[id].map((k) =>
        k.includes('.h.') ? (
          <h2 key={k} className="pt-2 text-[20px] font-semibold">
            {t(k)}
          </h2>
        ) : (
          <p key={k} className="leading-relaxed">
            {t(k)}
          </p>
        ),
      )}
      {id === 'contact' ? (
        <>
          <EmailLine />
          {AUTHOR.linkedin ? (
            <a
              href={AUTHOR.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-link self-start"
            >
              {t('trust.contact.linkedin')}
            </a>
          ) : null}
        </>
      ) : null}
    </article>
  )
}

export function TrustLinks() {
  return (
    <nav aria-label={t('nav.trust')} className="flex gap-4">
      {TRUST_PAGES.map((p) => (
        <a key={p} href={`#/${p}`} className="hover:underline">
          {t(`nav.${p}`)}
        </a>
      ))}
    </nav>
  )
}
