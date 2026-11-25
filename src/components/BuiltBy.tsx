import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'

// Author credit and a feedback link. Hidden until the owner has filled in her links in config.ts.
export function BuiltBy() {
  if (!AUTHOR.linkedin && !AUTHOR.contact) return null
  return (
    <section className="tile glass flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p className="text-[16px]">
        <span className="text-[var(--muted)]">{t('about.builtBy')} </span>
        {AUTHOR.linkedin ? (
          <a
            href={AUTHOR.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-link"
            aria-label={`${AUTHOR.name}, ${t('about.linkedin')}`}
          >
            {AUTHOR.name}
          </a>
        ) : (
          <span className="font-semibold">{AUTHOR.name}</span>
        )}
        {AUTHOR.role ? <span className="text-[var(--muted)]">, {AUTHOR.role}</span> : null}
      </p>
      {AUTHOR.contact ? (
        <a
          href={AUTHOR.contact}
          className="btn-secondary"
          {...(AUTHOR.contact.startsWith('http')
            ? { target: '_blank', rel: 'noreferrer noopener' }
            : {})}
        >
          {t('about.feedback')}
        </a>
      ) : null}
    </section>
  )
}
