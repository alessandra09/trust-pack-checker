import type { ReactNode } from 'react'
import { t, type MessageKey } from '../i18n/t.ts'
import { PAGE_PATH, type PageId } from './paths.ts'
import { Art28Page, QuestionnairePage } from './GuidePages.tsx'
import { PilotPage } from './PilotPage.tsx'
import { TextPage } from './TextPage.tsx'

export type StaticPage = {
  id: PageId
  path: string
  title: string
  description: string
  render: () => ReactNode
}

const page = (
  id: PageId,
  title: MessageKey,
  description: MessageKey,
  render: () => ReactNode,
): StaticPage => ({ id, path: PAGE_PATH[id], title: t(title), description: t(description), render })

export const STATIC_PAGES: StaticPage[] = [
  page('pilot', 'page.pilot.title', 'page.pilot.description', () => <PilotPage />),
  page('privacy', 'trust.privacy.title', 'page.privacy.description', () => (
    <TextPage id="privacy" />
  )),
  page('terms', 'trust.terms.title', 'page.terms.description', () => <TextPage id="terms" />),
  page('about', 'page.about.title', 'page.about.description', () => <TextPage id="about" />),
  page('art28', 'page.art28.title', 'page.art28.description', () => <Art28Page />),
  page('questionnaire', 'page.questionnaire.title', 'page.questionnaire.description', () => (
    <QuestionnairePage />
  )),
]
