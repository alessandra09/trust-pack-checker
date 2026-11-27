import { AUTHOR } from '../app/config.ts'
import { EmailLine } from '../components/EmailLine.tsx'
import { t, type MessageKey } from '../i18n/t.ts'
import { H2, PageTitle } from './Layout.tsx'

// Privacy, terms and about: paragraphs from en.json; keys with ".h." are headings.
const UPDATED = '2026-11-27'

export const TEXT_PAGES = {
  privacy: {
    title: 'trust.privacy.title',
    draft: true,
    parts: [
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
  },
  terms: {
    title: 'trust.terms.title',
    draft: true,
    parts: [
      'trust.terms.p1',
      'trust.terms.p2',
      'trust.terms.p3',
      'trust.terms.p4',
      'trust.terms.p5',
    ],
  },
  about: {
    title: 'page.about.title',
    draft: false,
    parts: [
      'page.about.p1',
      'page.about.p2',
      'page.about.p3',
      'page.about.h.contact',
      'trust.contact.p1',
      'trust.contact.p2',
    ],
  },
} satisfies Record<string, { title: MessageKey; draft: boolean; parts: MessageKey[] }>

export function TextPage({ id }: { id: keyof typeof TEXT_PAGES }) {
  const page = TEXT_PAGES[id]
  return (
    <>
      <PageTitle>{t(page.title)}</PageTitle>
      <p className="text-[14px] text-[var(--muted)]">
        {t('trust.updated')}: {UPDATED}
      </p>
      {page.draft ? (
        <p role="note" className="diff-line font-medium">
          {t('trust.draft')}
        </p>
      ) : null}
      {page.parts.map((k: MessageKey) =>
        k.includes('.h.') ? <H2 key={k}>{t(k)}</H2> : <p key={k}>{t(k)}</p>,
      )}
      {id === 'about' ? (
        <>
          <EmailLine />
          {AUTHOR.linkedin ? (
            <a href={AUTHOR.linkedin} rel="noreferrer noopener" className="btn-link self-start">
              {t('trust.contact.linkedin')}
            </a>
          ) : null}
        </>
      ) : null}
    </>
  )
}
