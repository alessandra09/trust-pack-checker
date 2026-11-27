import { art28 } from '../data/load.ts'
import { t, type MessageKey } from '../i18n/t.ts'
import { H2, PageTitle } from './Layout.tsx'
import { BASE } from './paths.ts'

// Two content pages for search (SPRINT2 task 5). The Art. 28 list comes from the rule data file only.
const SOURCES: [MessageKey, string][] = [
  ['guide.source.gdpr', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'],
  ['guide.source.art28', 'https://gdpr-info.eu/art-28/'],
  [
    'guide.source.edpb',
    'https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en',
  ],
]

function Meta({ verified }: { verified: string }) {
  return (
    <>
      <p className="text-[14px] text-[var(--muted)]">
        {t('guide.verified')}: {verified}
      </p>
      <p role="note" className="diff-line">
        {t('guide.notAdvice')}
      </p>
    </>
  )
}

function Sources() {
  return (
    <>
      <H2>{t('guide.sources')}</H2>
      <ul className="list-disc pl-5">
        {SOURCES.map(([k, url]) => (
          <li key={url}>
            <a href={url} rel="noreferrer noopener" className="btn-link">
              {t(k)}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

function Cta({ title, body }: { title: MessageKey; body: MessageKey }) {
  return (
    <section className="tile glass mt-4 gap-2">
      <h2 className="text-[20px] font-semibold">{t(title)}</h2>
      <p>{t(body)}</p>
      <a href={BASE} className="btn-primary self-start">
        {t('page.art28.ctaLink')}
      </a>
    </section>
  )
}

export function Art28Page() {
  const core = art28.rules.filter((r) => r.class === 'core')
  const practice = art28.rules.filter((r) => r.class !== 'core')
  return (
    <>
      <PageTitle>{t('page.art28.title')}</PageTitle>
      <Meta verified={art28.lastVerified} />
      <p>{t('page.art28.intro')}</p>
      <p>{t('page.art28.how')}</p>
      <H2>{t('page.art28.coreTitle')}</H2>
      <ol className="flex list-decimal flex-col gap-3 pl-5" data-rules="core">
        {core.map((r) => (
          <li key={r.id} data-rule={r.id}>
            <h3 className="font-semibold">
              {r.title} <span className="font-normal text-[var(--muted)]">({r.article})</span>
            </h3>
            <p>
              <span className="font-medium">{t('page.art28.lookFor')}</span> {r.elements.join('; ')}
              .
            </p>
            <p>
              <span className="font-medium">{t('page.art28.why')}</span> {r.whyItMatters}
            </p>
          </li>
        ))}
      </ol>
      <H2>{t('page.art28.practiceTitle')}</H2>
      <p>{t('page.art28.practiceIntro')}</p>
      <ul className="flex list-disc flex-col gap-2 pl-5" data-rules="practice">
        {practice.map((r) => (
          <li key={r.id} data-rule={r.id}>
            <span className="font-semibold">{r.title}</span>{' '}
            <span className="text-[var(--muted)]">({r.article})</span>
          </li>
        ))}
      </ul>
      <H2>{t('page.art28.gapsTitle')}</H2>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {(['gap1', 'gap2', 'gap3', 'gap4'] as const).map((k) => (
          <li key={k}>{t(`page.art28.${k}`)}</li>
        ))}
      </ul>
      <Cta title="page.art28.ctaTitle" body="page.art28.cta" />
      <Sources />
    </>
  )
}

export const QUESTIONNAIRE_UPDATED = '2026-11-27'

export function QuestionnairePage() {
  return (
    <>
      <PageTitle>{t('page.questionnaire.title')}</PageTitle>
      <Meta verified={QUESTIONNAIRE_UPDATED} />
      <p>{t('page.questionnaire.intro')}</p>
      {(['s1', 's2', 's3', 's4', 's5'] as const).map((s) => (
        <section key={s}>
          <H2>{t(`page.questionnaire.${s}.title`)}</H2>
          <p>{t(`page.questionnaire.${s}.body`)}</p>
        </section>
      ))}
      <H2>{t('page.questionnaire.mistakesTitle')}</H2>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {(['mistakes1', 'mistakes2', 'mistakes3', 'mistakes4', 'mistakes5'] as const).map((k) => (
          <li key={k}>{t(`page.questionnaire.${k}`)}</li>
        ))}
      </ul>
      <H2>{t('page.questionnaire.whyTitle')}</H2>
      <p>{t('page.questionnaire.why')}</p>
      <Cta title="page.questionnaire.ctaTitle" body="page.questionnaire.cta" />
      <Sources />
    </>
  )
}
