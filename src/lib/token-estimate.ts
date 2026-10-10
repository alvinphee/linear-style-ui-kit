// Rough token counts, for showing how much of a model's context something
// would take. A token is a piece of a word: English text runs at about four
// characters a token. These are estimates for the UI, not the model's own
// count; a real tokenizer can differ by a fifth either way.

// What a file holds. The same values as FileKind in components/file-chip
// (lib sits below components, so it cannot import the type).
type FileKindName = 'pdf' | 'sheet' | 'doc' | 'csv' | 'text' | 'image' | 'code' | 'other'

// Tokens in a piece of text: about four characters each.
export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}

// Tokens in a file, from its size in bytes and its kind. Very rough:
//   text, code, other   size / 4    plain text is nearly all words
//   pdf, doc            size / 12   layout, fonts and images take most bytes
//   sheet, csv          size / 6    numbers and separators, short cells
//   image               1,500 flat  the model sees a picture, not its bytes
export function estimateFileTokens(size: number, kind: FileKindName) {
  if (kind === 'image') return 1500
  const perToken = kind === 'pdf' || kind === 'doc' ? 12 : kind === 'sheet' || kind === 'csv' ? 6 : 4
  return Math.ceil(Math.max(0, size) / perToken)
}

// A token count in a few characters: "820", "1.2k", "38k", "1.1M".
export function formatTokens(n: number) {
  const value = Math.max(0, Math.round(n))
  if (value < 1000) return String(value)
  if (value < 10_000) return `${trim(value / 1000)}k`
  if (value < 999_500) return `${Math.round(value / 1000)}k`
  return value < 10_000_000 ? `${trim(value / 1_000_000)}M` : `${Math.round(value / 1_000_000)}M`
}

// One decimal place, without a trailing ".0": 1.2, 4.
const trim = (n: number) => String(Math.round(n * 10) / 10)
