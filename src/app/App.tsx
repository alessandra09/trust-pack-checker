import { t } from '../i18n/t.ts'

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <span className="text-[18px] font-semibold">{t('app.name')}</span>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-[32px] leading-tight font-semibold">{t('hero.headline')}</h1>
        <p className="text-[18px] text-[var(--muted)]">{t('hero.subline')}</p>
        <p className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 text-[16px]">
          {t('status.placeholder')}
        </p>
        <p className="text-[14px] text-[var(--muted)]">{t('privacy.note')}</p>
      </main>
      <footer className="border-t border-[var(--border)] px-6 py-4 text-[14px] text-[var(--muted)]">
        <p>{t('footer.disclaimer')}</p>
        <p>{t('footer.rulesNotReviewed')}</p>
      </footer>
    </div>
  )
}
