import { AUTHOR } from '../app/config.ts'
import { PilotForm } from '../components/PilotForm.tsx'
import { t } from '../i18n/t.ts'
import { H2, PageTitle } from './Layout.tsx'
import { href, SAMPLE_REPORT_PATH } from './paths.ts'

export function PilotPage() {
  return (
    <>
      <PageTitle>{t('page.pilot.title')}</PageTitle>
      <p className="text-[18px]">{t('page.pilot.intro')}</p>
      <dl className="grid gap-4 sm:grid-cols-2">
        {(['get', 'send', 'time', 'return'] as const).map((k) => (
          <div key={k} className="tile glass gap-1">
            <dt className="font-semibold">{t(`page.pilot.${k}Title`)}</dt>
            <dd>{t(`page.pilot.${k}`)}</dd>
          </div>
        ))}
      </dl>
      <p className="font-medium">{t('page.pilot.legal')}</p>
      <p>
        <a href={href(SAMPLE_REPORT_PATH)} className="btn-link">
          {t('pilot.sample')}
        </a>{' '}
        <span className="text-[14px] text-[var(--muted)]">{t('pilot.sampleNote')}</span>
      </p>
      <H2>{t('page.pilot.formTitle')}</H2>
      <p className="text-[14px] text-[var(--muted)]">{t('page.pilot.formIntro')}</p>
      <PilotForm />
      <p className="text-[14px]">
        {t('page.pilot.fallback')}{' '}
        <a href={`mailto:${AUTHOR.email}`} className="btn-link">
          {AUTHOR.email}
        </a>
      </p>
      <H2>{t('page.pilot.consultTitle')}</H2>
      <p>{t('page.pilot.consultBody')}</p>
    </>
  )
}
