export type IngestErrorCode =
  | 'too_large'
  | 'too_many_pages'
  | 'too_many_rows'
  | 'scanned_pdf'
  | 'password'
  | 'corrupt'
  | 'unsupported_type'
  | 'empty'

export type IngestWarningCode = 'not_english'

// Thrown by parsers; the UI maps `code` to a message in en.json and names the file.
export class IngestError extends Error {
  readonly code: IngestErrorCode
  readonly fileName: string
  constructor(code: IngestErrorCode, fileName: string) {
    super(`${code}: ${fileName}`)
    this.name = 'IngestError'
    this.code = code
    this.fileName = fileName
  }
}

export const LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  maxPages: 300,
  maxRows: 2000,
  scannedCharsPerPage: 50,
} as const

export function assertSize(bytes: number, fileName: string): void {
  if (bytes > LIMITS.maxBytes) throw new IngestError('too_large', fileName)
  if (bytes === 0) throw new IngestError('empty', fileName)
}
