import { makeDoc } from '../core/ingest/text.ts'
import { csvToTable } from '../core/ingest/sheet.ts'
import dpa from '../../eval/packs/pack-c/docs/dpa.md?raw'
import privacy from '../../eval/packs/pack-c/docs/privacy-policy.md?raw'
import security from '../../eval/packs/pack-c/docs/security-policy.md?raw'
import questionnaire from '../../eval/packs/pack-c/questionnaire.csv?raw'
import vendorDpa from '../../eval/packs/pack-d/docs/dpa.md?raw'
import vendorAnswers from '../../eval/packs/pack-d/answers.csv?raw'
import type { LoadedFile, SlotId } from './types.ts'

// "Try with sample data": the synthetic Pack C documents for the fictional Northwind Voice Ltd.
export function sampleFiles(): Partial<Record<SlotId, LoadedFile>> {
  return {
    dpa: {
      name: 'Northwind DPA (sample).md',
      warnings: [],
      doc: makeDoc('dpa', 'Northwind DPA (sample)', 'dpa', [dpa]),
    },
    security: {
      name: 'Northwind security policy (sample).md',
      warnings: [],
      doc: makeDoc('security', 'Northwind security policy (sample)', 'security', [security]),
    },
    privacy: {
      name: 'Northwind privacy notice (sample).md',
      warnings: [],
      doc: makeDoc('privacy', 'Northwind privacy notice (sample)', 'privacy', [privacy]),
    },
    questionnaire: {
      name: 'Customer questionnaire (sample).csv',
      warnings: [],
      table: csvToTable('questionnaire', 'Customer questionnaire (sample).csv', questionnaire),
    },
  }
}

// Vendor sample: the synthetic Pack D DPA and answers for the fictional Harbourline Payroll Ltd.
export function vendorSampleFiles(): Partial<Record<SlotId, LoadedFile>> {
  return {
    dpa: {
      name: 'Harbourline DPA (sample).md',
      warnings: [],
      doc: makeDoc('dpa', 'Harbourline DPA (sample)', 'dpa', [vendorDpa]),
    },
    questionnaire: {
      name: 'Harbourline answers (sample).csv',
      warnings: [],
      table: csvToTable('questionnaire', 'Harbourline answers (sample).csv', vendorAnswers),
    },
  }
}
