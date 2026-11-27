// Single place for provider settings (SPEC 12.1).
// AI_MODEL is provisional until the owner picks a model from the Pack C pilot (SPEC 17 #7).
export const AI_PROVIDER = {
  name: 'Anthropic',
  origin: 'https://api.anthropic.com',
} as const

/** Shown in exported reports; bump with each release. */
export const TOOL_VERSION = '1.4'

export const AI_MODEL = 'claude-haiku-5-5'

// Shown on the landing page. Empty values hide the matching link (filled in by the owner).
export const AUTHOR: {
  name: string
  role: string
  linkedin: string
  contact: string
  pilot: string
  email: string
  pilotForm: string
} = {
  name: 'Oleksandra Hordieieva',
  /** Shown as plain text next to mail buttons, because mailto: does nothing without a mail app. */
  email: 'oleksandrahordieieva+pilot@gmail.com',
  /** Optional https link to an external request form (Tally or Google Forms). Empty: the built-in form. */
  pilotForm: '',
  role: 'Financial Analyst & Regulatory Compliance Specialist',
  linkedin: 'https://www.linkedin.com/in/oleksandra-hordieieva-41b143210/',
  /** mailto: address or an https URL for feedback. */
  contact: 'mailto:oleksandrahordieieva+pilot@gmail.com?subject=Trust%20Pack%20Checker%20feedback',
  /** mailto: for a free pilot review request (a manual review by the author, outside the tool). */
  pilot:
    'mailto:oleksandrahordieieva+pilot@gmail.com?subject=Free%20pilot%20review%20request&body=Hi%20Oleksandra%2C%0A%0AI%27d%20like%20a%20free%20pilot%20review.%0A%0AWhat%20I%20need%20checked%20%28DPA%20/%20customer%20questionnaire%20/%20vendor%20DPA%20and%20answers%29%3A%0ACompany%20and%20size%3A%0ADeadline%3A%0A%0APlease%20do%20not%20attach%20confidential%20documents%20to%20this%20first%20email%3B%20we%20will%20agree%20how%20to%20share%20them.%0A',
}
