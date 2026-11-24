// Converts the limited HTML that mammoth produces into text that keeps structure (SPEC 7.1):
// headings become Markdown "#" lines, list items "- ", table rows are joined with " | ".
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

function decode(s: string): string {
  return s
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()
}

export function htmlToStructuredText(html: string): string {
  let out = html
  out = out.replace(/<table[\s\S]*?<\/table>/gi, (table) =>
    [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((row) =>
        [...(row[1] ?? '').matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
          .map((cell) => stripTags(cell[1] ?? ''))
          .join(' | '),
      )
      .map((line) => `\n${line}\n`)
      .join(''),
  )
  out = out.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, inner: string) => {
    return `\n\n${'#'.repeat(Number(level))} ${stripTags(inner)}\n\n`
  })
  out = out.replace(
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
    (_, inner: string) => `\n- ${stripTags(inner)}\n`,
  )
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner: string) => `\n${stripTags(inner)}\n`)
  out = out.replace(/<br\s*\/?>/gi, '\n')
  out = decode(out.replace(/<[^>]+>/g, ''))
  return out
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
