// Checks a translation against English: same keys, same {{placeholders}}, same <tags>.
// Usage: node scripts/check-translation.mjs pcm [namespace…]
import { readFileSync, existsSync, readdirSync } from 'node:fs'

const lang = process.argv[2] ?? 'pcm'
const dir = 'src/i18n/locales'
const only = process.argv.slice(3)
const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]))
const marks = (s) => [...s.matchAll(/\{\{\s*[\w.]+\s*\}\}|<\/?\d+>|<\/?[a-z]+>/g)].map((m) => m[0].replace(/\s/g, '')).sort().join(' ')

let problems = 0
let files = 0
for (const f of readdirSync(dir).filter((x) => x.endsWith('.en.json') || x === 'en.json')) {
  const ns = f === 'en.json' ? 'translation' : f.replace('.en.json', '')
  if (only.length && !only.includes(ns)) continue
  const target = `${dir}/${ns}.${lang}.json`
  if (!existsSync(target)) continue
  files++
  const en = new Map(flat(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))))
  const tr = new Map(flat(JSON.parse(readFileSync(target, 'utf8'))))
  for (const [k, v] of en) {
    if (!tr.has(k)) {
      // A plural form the other language doesn't need is fine
      if (!/_(zero|one|two|few|many)$/.test(k)) (problems++, console.log(`${ns}: missing ${k}`))
      continue
    }
    if (marks(v) !== marks(tr.get(k))) (problems++, console.log(`${ns}: ${k} placeholders differ\n  en:  ${v}\n  ${lang}: ${tr.get(k)}`))
  }
  for (const k of tr.keys()) if (!en.has(k)) (problems++, console.log(`${ns}: extra key ${k}`))
}
console.log(`${files} file(s) checked, ${problems} problem(s)`)
process.exit(problems ? 1 : 0)
