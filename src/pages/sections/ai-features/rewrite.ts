// Scripted "AI" rewrites for the inline editor. No model: phrase rules tuned to
// the sample paragraph, plus prepared translations of its four sentences.

export const SAMPLE =
  'Hi team, just a quick update on the Jurong delivery. The truck got delayed at the depot cause the forklift was broken, so we are gonna be about 40 mins late. Pls let the site contact know asap and make sure bay 4 stays open. We will send the proof photos once the pallets are unloaded.'

export type RewriteAction = 'improve' | 'shorten' | 'friendlier' | 'translate'
export type Lang = 'es' | 'fr' | 'de'

export const LANGS: { id: Lang; name: string }[] = [
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
]

export const ACTION_LABELS: Record<Exclude<RewriteAction, 'translate'>, string> = {
  improve: 'Improve writing',
  shorten: 'Shorten',
  friendlier: 'Make friendlier',
}

// A replacement list gives "Try again" something different to say.
type Rule = [RegExp, string | string[]]

const IMPROVE: Rule[] = [
  [/\bjust a quick update on\b/gi, ['here is a quick update on', 'a short update on']],
  [/\bgot delayed\b/gi, ['was delayed', 'was held up']],
  [/\bcause\b/gi, 'because'],
  [/\bwas broken\b/gi, ['was out of service', 'had broken down']],
  [/\bwe are gonna be\b/gi, ['we expect to be', 'we will be']],
  [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'],
  [/\bmins\b/gi, 'minutes'],
  [/\bpls\b/gi, 'please'],
  [/\basap\b/gi, 'as soon as possible'],
  [/\bmake sure\b/gi, ['ensure', 'make sure']],
  [/\bbay (\d+)\b/g, 'Bay $1'],
  [/\bthe proof photos\b/gi, ['the proof-of-delivery photos', 'the delivery photos']],
  [/\btmr\b/gi, 'tomorrow'],
  [/\bbtw\b/gi, 'by the way'],
  [/\bi\b/g, 'I'],
]

const SHORTEN: Rule[] = [
  [/\bjust a quick update on\b/gi, ['quick update on', 'update on']],
  [/\bgot delayed at the depot cause the forklift was broken\b/gi, ['was held at the depot by a broken forklift', 'is stuck at the depot (forklift down)']],
  [/\bgot delayed\b/gi, 'was held'],
  [/\bcause\b/gi, 'as'],
  [/\bso we are gonna be about (\d+) mins late\b/gi, ["so we'll be ~$1 min late", 'so expect a ~$1 min delay']],
  [/\bwe are gonna be\b/gi, "we'll be"],
  [/\babout (\d+)\b/gi, '~$1'],
  [/\b(?:mins|minutes)\b/gi, 'min'],
  [/\b(?:pls|please) let (.+?) know asap\b/gi, ['tell $1 asap', 'alert $1 now']],
  [/\b(?:pls|please) let (.+?) know\b/gi, 'tell $1'],
  [/\bmake sure (.+?) stays open\b/gi, 'keep $1 open'],
  [/\bWe will send the proof photos once the pallets are unloaded\b/gi, ['Proof photos follow after unloading', 'Photos to follow once unloaded']],
  [/\bonce the pallets are unloaded\b/gi, 'after unloading'],
  [/\bwe will\b/gi, "we'll"],
  [/\b(?:just|really|very|actually|basically|quite)\s+/gi, ''],
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bplease note that\s+/gi, ''],
]

const FRIENDLIER: Rule[] = [
  [/^hi team,/i, ['Hi everyone,', 'Hey team,']],
  [/\bjust a quick update on\b/gi, ['a quick heads-up on', 'just a friendly update on']],
  [/\bgot delayed\b/gi, 'got held up'],
  [/\bcause the forklift was broken\b/gi, ['while the forklift was being fixed', 'because the forklift needed a quick repair']],
  [/\bcause\b/gi, 'because'],
  [/\bwe are gonna be\b/gi, "we'll be"],
  [/\bgonna\b/gi, 'going to'],
  [/\bmins\b/gi, 'minutes'],
  [/\blate\./gi, ['late. Sorry for the wait!', 'late. Thanks for bearing with us!']],
  [/\b(?:pls|please) let (.+?) know asap\b/gi, ['when you get a moment, please let $1 know', 'it would be great if you could let $1 know soon']],
  [/\bpls\b/gi, 'please'],
  [/\basap\b/gi, 'soon'],
  [/\bmake sure\b/gi, 'help make sure'],
  [/\bWe will send\b/gi, ["We'll share", "We'll send over"]],
  [/\bunloaded\./gi, ['unloaded. Thanks, everyone!', 'unloaded. Thanks so much!']],
  [/\bmust\b/gi, 'will need to'],
  [/\bdo not\b/gi, "please don't"],
]

const RULES: Record<Exclude<RewriteAction, 'translate'>, Rule[]> = {
  improve: IMPROVE,
  shorten: SHORTEN,
  friendlier: FRIENDLIER,
}

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  es: {
    'Hi team, just a quick update on the Jurong delivery.': 'Hola equipo, una breve actualización sobre la entrega en Jurong.',
    'The truck got delayed at the depot cause the forklift was broken, so we are gonna be about 40 mins late.':
      'El camión se retrasó en el depósito porque la carretilla elevadora estaba averiada, así que llegaremos unos 40 minutos tarde.',
    'Pls let the site contact know asap and make sure bay 4 stays open.':
      'Por favor, avisad al contacto del sitio lo antes posible y aseguraos de que el muelle 4 siga abierto.',
    'We will send the proof photos once the pallets are unloaded.':
      'Enviaremos las fotos de prueba en cuanto se descarguen los palés.',
  },
  fr: {
    'Hi team, just a quick update on the Jurong delivery.': 'Bonjour à tous, petit point rapide sur la livraison à Jurong.',
    'The truck got delayed at the depot cause the forklift was broken, so we are gonna be about 40 mins late.':
      'Le camion a été retardé au dépôt car le chariot élévateur était en panne, nous aurons donc environ 40 minutes de retard.',
    'Pls let the site contact know asap and make sure bay 4 stays open.':
      'Merci de prévenir le contact sur site au plus vite et de vous assurer que le quai 4 reste ouvert.',
    'We will send the proof photos once the pallets are unloaded.':
      'Nous enverrons les photos de preuve dès que les palettes seront déchargées.',
  },
  de: {
    'Hi team, just a quick update on the Jurong delivery.': 'Hallo Team, kurzes Update zur Lieferung nach Jurong.',
    'The truck got delayed at the depot cause the forklift was broken, so we are gonna be about 40 mins late.':
      'Der Lkw wurde im Depot aufgehalten, weil der Gabelstapler defekt war, daher kommen wir etwa 40 Minuten später.',
    'Pls let the site contact know asap and make sure bay 4 stays open.':
      'Bitte gebt dem Ansprechpartner vor Ort so schnell wie möglich Bescheid und sorgt dafür, dass Rampe 4 offen bleibt.',
    'We will send the proof photos once the pallets are unloaded.':
      'Wir schicken die Beweisfotos, sobald die Paletten entladen sind.',
  },
}

function groupCount(pattern: RegExp) {
  return new RegExp(`${pattern.source}|`).exec('')!.length - 1
}

function applyRules(text: string, rules: Rule[], attempt: number) {
  let out = text
  for (const [pattern, replacement] of rules) {
    const groups = groupCount(pattern)
    out = out.replace(pattern, (match: string, ...rest: unknown[]) => {
      const pick = Array.isArray(replacement) ? replacement[attempt % replacement.length] : replacement
      const filled = pick.replace(/\$(\d)/g, (_, n: string) => String(rest.slice(0, groups)[Number(n) - 1] ?? ''))
      return /^[A-Z]/.test(match) && filled ? filled[0].toUpperCase() + filled.slice(1) : filled
    })
  }
  return out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.!?])/g, '$1')
    .replace(/([.!?]) ([a-z])/g, (_, mark: string, letter: string) => `${mark} ${letter.toUpperCase()}`)
    .trim()
}

type Span = { start: number; end: number }

function sentenceSpans(text: string): Span[] {
  const spans: Span[] = []
  const re = /[^.!?]*[.!?]+|[^.!?]+$/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const lead = m[0].length - m[0].trimStart().length
    if (m[0].trim()) spans.push({ start: m.index + lead, end: m.index + m[0].trimEnd().length })
  }
  return spans
}

// The range a request really works on: the selection without its outer
// spaces, or, for translation, widened to whole sentences.
export function prepareRange(value: string, start: number, end: number, action: RewriteAction) {
  const raw = value.slice(start, end)
  let from = start + (raw.length - raw.trimStart().length)
  let to = end - (raw.length - raw.trimEnd().length)
  let expanded = false
  if (action === 'translate') {
    const touched = sentenceSpans(value).filter((s) => s.end > from && s.start < to)
    if (touched.length) {
      const wideFrom = touched[0].start
      const wideTo = touched[touched.length - 1].end
      expanded = wideFrom < from || wideTo > to
      from = wideFrom
      to = wideTo
    }
  }
  return { start: from, end: to, expanded }
}

export type RewriteRequest = {
  start: number
  end: number
  expanded: boolean
  action: RewriteAction
  lang?: Lang
  attempt: number
  label: string
}

export type RewriteResult = { ok: true; text: string } | { ok: false; message: string }

export function rewrite(value: string, req: RewriteRequest): RewriteResult {
  const original = value.slice(req.start, req.end)
  if (req.action === 'translate') {
    const table = TRANSLATIONS[req.lang ?? 'es']
    const sentences = sentenceSpans(original).map((s) => original.slice(s.start, s.end))
    const translated = sentences.map((s) => table[s])
    if (!sentences.length || translated.some((t) => !t)) {
      return {
        ok: false,
        message: 'This demo only knows how to translate the original sample sentences. Reset the text to try again.',
      }
    }
    return { ok: true, text: translated.join(' ') }
  }

  let text = applyRules(original, RULES[req.action], req.attempt)
  const startsSentence = /(^|[.!?]\s*)$/.test(value.slice(0, req.start).trimEnd())
  if (startsSentence && text) text = text[0].toUpperCase() + text.slice(1)
  return { ok: true, text }
}

// "Ask AI" understands a few kinds of request; anything else becomes Improve.
export function actionFromPrompt(prompt: string): { action: RewriteAction; lang?: Lang } {
  const t = prompt.toLowerCase()
  if (/spanish|español/.test(t)) return { action: 'translate', lang: 'es' }
  if (/french|français/.test(t)) return { action: 'translate', lang: 'fr' }
  if (/german|deutsch/.test(t)) return { action: 'translate', lang: 'de' }
  if (/translat/.test(t)) return { action: 'translate', lang: 'es' }
  if (/short|concise|brief|trim|tight|fewer|less|tl;?dr/.test(t)) return { action: 'shorten' }
  if (/friend|warm|casual|kind|nice|polite|soft/.test(t)) return { action: 'friendlier' }
  return { action: 'improve' }
}
