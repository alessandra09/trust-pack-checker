import { Icon } from './Icon.tsx'
import { useId, useRef, useState } from 'react'
import { t, type MessageKey } from '../i18n/t.ts'
import type { LoadedFile } from '../app/types.ts'

type Props = {
  label: string
  hint: string
  required: boolean
  accept: string
  file: LoadedFile | undefined
  onFile: (file: File) => void
  onRemove: () => void
}

function errorText(f: LoadedFile): string {
  const key = `ingest.error.${f.error ?? 'unknown'}` as MessageKey
  return f.error === 'scanned_pdf' ? t(key) : `${f.name} ${t(key)}`
}

export function DropZone({ label, hint, required, accept, file, onFile, onRemove }: Props) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const pages = file?.doc?.pages.length
  const rows = file?.table?.sheets.reduce((n, s) => n + s.rows.length, 0)
  return (
    <div
      className={`rounded-[10px] border border-dashed p-5 transition-[border-color,background-color,box-shadow] duration-150 ${over ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-md)]' : file && !file.error ? 'border-solid border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]' : 'border-[var(--border-strong)] bg-[var(--surface)] hover:border-[var(--accent)]'}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="font-semibold">
          {label}
        </label>
        <span className="text-[14px] text-[var(--muted)]">
          {t(required ? 'upload.required' : 'upload.optional')}
        </span>
      </div>
      {file && !file.error ? (
        <div className="mt-2 text-[14px]">
          <p className="font-medium break-all">{file.name}</p>
          <p className="text-[var(--muted)]">
            {pages !== undefined
              ? `${pages} ${t('upload.pages')}`
              : `${rows ?? 0} ${t('upload.rows')}`}
          </p>
          {file.warnings.map((w) => (
            <p key={w} className="mt-1 text-[var(--partial-fg)]" role="status">
              {t(`ingest.warning.${w}`)}
            </p>
          ))}
          <button type="button" className="btn-link mt-2" onClick={onRemove}>
            {t('upload.remove')}
          </button>
        </div>
      ) : (
        <div className="mt-2 text-[14px] text-[var(--muted)]">
          <p className="flex items-center gap-2">
            <Icon name="upload" size={16} />
            {t('upload.drop')}
          </p>
          <p>{hint}</p>
          {file?.error ? (
            <p className="mt-1 text-[var(--conflict-fg)]" role="alert">
              {errorText(file)}
            </p>
          ) : null}
          <button
            type="button"
            className="btn-secondary mt-2"
            onClick={() => input.current?.click()}
          >
            {t('upload.choose')}
          </button>
        </div>
      )}
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
