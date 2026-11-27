import { readFileSync, writeFileSync } from 'node:fs'
import { sampleReport } from '../src/app/sampleReport.ts'

// Writes public/sample-report/index.html from the synthetic Pack D vendor sample.
const html = sampleReport(
  readFileSync('eval/packs/pack-d/docs/dpa.md', 'utf8'),
  readFileSync('eval/packs/pack-d/answers.csv', 'utf8'),
)
writeFileSync('public/sample-report/index.html', html)
console.log(`public/sample-report/index.html: ${html.length} bytes`)
