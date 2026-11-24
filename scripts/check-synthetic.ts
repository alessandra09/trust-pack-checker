// Pre-commit and CI guard (SPEC 5.5, 13.2): every eval pack must be marked synthetic,
// and no private paths or secrets may be committed.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const PACKS_DIR = 'eval/packs'
const MARKER = /^synthetic:\s*true\s*$/m
const FORBIDDEN_PATHS = [/^private\//, /(^|\/)\.env(\.|$)/, /^real-docs\//, /\.real\./]

function packProblems(): string[] {
  if (!existsSync(PACKS_DIR)) return []
  return readdirSync(PACKS_DIR)
    .filter((name) => statSync(join(PACKS_DIR, name)).isDirectory())
    .flatMap((name) => {
      const manifest = join(PACKS_DIR, name, 'SYNTHETIC.md')
      if (!existsSync(manifest)) return [`${manifest} is missing`]
      if (!MARKER.test(readFileSync(manifest, 'utf8')))
        return [`${manifest} lacks "synthetic: true"`]
      return []
    })
}

function trackedPathProblems(): string[] {
  let files: string[]
  try {
    files = execSync('git ls-files --cached', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter(Boolean)
  } catch {
    return [] // not a git repository yet
  }
  return files
    .filter((f) => !f.endsWith('.env.example') && FORBIDDEN_PATHS.some((re) => re.test(f)))
    .map((f) => `${f} must never be committed`)
}

const problems = [...packProblems(), ...trackedPathProblems()]
if (problems.length > 0) {
  console.error('check-synthetic failed:\n' + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log('check-synthetic: ok')
