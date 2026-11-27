import ExcelJS from 'exceljs'

// Writes docs/pilot-kit/08_pilot_tracker.xlsx: a tracker sheet with dropdowns and a Summary sheet with formulas.
const COLUMNS = [
  ['Date', 12],
  ['Contact', 20],
  ['Company', 20],
  ['Type', 16],
  ['Channel', 12],
  ['Source link', 28],
  ['Document type', 18],
  ['Hours spent', 10],
  ['Result summary', 36],
  ['Feedback', 36],
  ['Would pay (Y/N)', 10],
  ['Amount said', 14],
  ['Quote permission', 12],
  ['Follow-up date', 14],
  ['Status', 16],
] as const

const LISTS: Record<string, string[]> = {
  D: ['DPO consultant', 'B2B company', 'Procurement', 'Other'],
  E: ['LinkedIn', 'Email', 'Referral', 'Website', 'Other'],
  G: ['DPA', 'Questionnaire', 'Vendor DPA + answers', 'Other'],
  K: ['Y', 'N'],
  M: ['Y', 'N'],
  O: ['Contacted', 'Replied', 'Call', 'Received', 'Report sent', 'Feedback done', 'Closed'],
}

const EXAMPLES = [
  [
    'EXAMPLE (delete)',
    'Example Consulting',
    'DPO consultant',
    'LinkedIn',
    '',
    'DPA',
    1.5,
    'EXAMPLE: 3 elements not found',
    'EXAMPLE: wants SCC check',
    'Y',
    '€150 per DPA',
    'Y',
    'Report sent',
  ],
  [
    'EXAMPLE (delete)',
    'Example SaaS Ltd',
    'B2B company',
    'Email',
    '',
    'Questionnaire',
    2,
    'EXAMPLE: 40 of 50 answered from documents',
    'EXAMPLE: liked the gap list',
    'N',
    '',
    'N',
    'Feedback done',
  ],
  [
    'EXAMPLE (delete)',
    'Example Procurement',
    'Procurement',
    'Referral',
    '',
    'Vendor DPA + answers',
    1,
    'EXAMPLE: 2 contradictions',
    'EXAMPLE: needs Word export',
    'Y',
    '€99',
    'N',
    'Closed',
  ],
] as const

async function main() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Tracker', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = COLUMNS.map(([header, width]) => ({ header, width }))
  ws.getRow(1).font = { bold: true }
  EXAMPLES.forEach((r, i) => {
    const row = ws.getRow(i + 2)
    row.values = [
      new Date(Date.UTC(2026, 10, 27 + i)),
      ...r.slice(0, 12),
      new Date(Date.UTC(2026, 11, 2 + i)),
      r[12],
    ]
    row.getCell(1).numFmt = 'yyyy-mm-dd'
    row.getCell(14).numFmt = 'yyyy-mm-dd'
  })
  for (const [col, list] of Object.entries(LISTS))
    for (let r = 2; r <= 500; r++)
      ws.getCell(`${col}${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${list.join(',')}"`],
      }
  for (let r = 2; r <= 500; r++)
    ws.getCell(`H${r}`).dataValidation = {
      type: 'decimal',
      operator: 'between',
      allowBlank: true,
      formulae: [0, 40],
    }

  const s = wb.addWorksheet('Summary')
  s.columns = [{ width: 34 }, { width: 14 }]
  const rows: [string, string, number][] = [
    ['Conversations (rows with a contact)', 'COUNTA(Tracker!B2:B500)', 3],
    [
      'Pilots (report sent or later)',
      'COUNTIF(Tracker!O2:O500,"Report sent")+COUNTIF(Tracker!O2:O500,"Feedback done")+COUNTIF(Tracker!O2:O500,"Closed")',
      3,
    ],
    ['Would pay: Y', 'COUNTIF(Tracker!K2:K500,"Y")', 2],
    ['Would pay: N', 'COUNTIF(Tracker!K2:K500,"N")', 1],
    ['Average hours per pilot', 'IFERROR(AVERAGE(Tracker!H2:H500),0)', 1.5],
    ['Quote permissions', 'COUNTIF(Tracker!M2:M500,"Y")', 1],
  ]
  s.getRow(1).values = ['Measure', 'Value']
  s.getRow(1).font = { bold: true }
  rows.forEach(([label, formula, result], i) => {
    s.getCell(`A${i + 2}`).value = label
    s.getCell(`B${i + 2}`).value = { formula, result }
  })
  s.getCell('A10').value = 'Rows marked EXAMPLE are samples: delete them before real use.'
  await wb.xlsx.writeFile('docs/pilot-kit/08_pilot_tracker.xlsx')
}

void main()
