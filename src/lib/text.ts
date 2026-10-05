// Small text helpers: counts with the right word, URL and file name slugs,
// and the greeting on a welcome screen.

// A count with its word: "1 job", "3 jobs". Pass the plural when adding "s"
// is wrong: plural(n, 'reply', 'replies').
export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${pluralWord(n, one, many)}`
}

// Only the word, for a count shown on its own: "job" or "jobs".
export function pluralWord(n: number, one: string, many = `${one}s`) {
  return n === 1 ? one : many
}

// A URL or file name part: "Café menu (v2)" → "cafe-menu-v2". Accents are
// dropped, anything else that is not a letter or digit becomes one dash.
// `maxLength` cuts it without leaving a dash at the end; `fallback` is used
// when nothing is left (a title of only symbols), such as "untitled".
export function slug(text: string, { maxLength, fallback = '' }: { maxLength?: number; fallback?: string } = {}) {
  let result = text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '')
  if (maxLength !== undefined) result = result.slice(0, maxLength)
  return result.replace(/-+$/, '') || fallback
}

// "Good morning", "Good afternoon" or "Good evening" for the hour of `date`.
// Before 5 am it is still "Good evening": nobody up at 2 am wants "Good morning".
export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
