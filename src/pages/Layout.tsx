import type { ReactNode } from 'react'
import { Icon } from '../components/Icon.tsx'
import { t } from '../i18n/t.ts'
import { BASE, href, PAGE_PATH, SAMPLE_REPORT_PATH } from './paths.ts'

// Shell for the prerendered static pages (pilot, privacy, terms, about, guides).
export function SiteFooterLinks() {
  const links: [string, string][] = [
    [href(PAGE_PATH.pilot), t('nav.pilot')],
    [href(SAMPLE_REPORT_PATH), t('nav.sample')],
    [`${BASE}#how-it-was-tested`, t('nav.tested')],
    [href(PAGE_PATH.art28), t('page.art28.short')],
    [href(PAGE_PATH.questionnaire), t('page.questionnaire.short')],
    [href(PAGE_PATH.about), t('nav.about')],
    [href(PAGE_PATH.privacy), t('nav.privacy')],
    [href(PAGE_PATH.terms), t('nav.terms')],
  ]
  return (
    <nav aria-label={t('nav.footer')} className="flex flex-wrap gap-x-4 gap-y-1">
      {links.map(([to, label]) => (
        <a key={to} href={to} className="hover:underline">
          {label}
        </a>
      ))}
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        {t('nav.skip')}
      </a>
      <header className="app-header flex items-center gap-4 px-6 py-3">
        <a
          href={BASE}
          className="flex min-w-0 items-center gap-2.5 text-[16px] font-semibold tracking-tight whitespace-nowrap"
          aria-label={t('nav.home')}
        >
          <span className="brand-mark">
            <Icon name="mark" size={18} />
          </span>
          {t('app.name')}
        </a>
      </header>
      <main id="main" className="flex-1">
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12 leading-relaxed">
          {children}
        </article>
      </main>
      <footer className="flex flex-col gap-1 border-t border-[var(--border)] px-6 py-3 text-[13px] text-[var(--muted)]">
        <p>
          {t('footer.disclaimer')} {t('footer.rulesNotReviewed')}
        </p>
        <SiteFooterLinks />
      </footer>
    </div>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{children}</h1>
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="pt-4 text-[20px] font-semibold">{children}</h2>
}
