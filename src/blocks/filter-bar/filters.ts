import type { ReactNode } from 'react'
import type { IconSvgElement } from '@hugeicons/react'

// The filter bar's model: fields a list can be filtered by, each with the
// values to pick from. Values inside one field widen the list (OR); fields
// narrow it (AND). Matching rows is up to the page, which knows its data.

export type FilterOption = {
  value: string
  label: string
  // Shown before the label: a status icon, a dot, an avatar…
  visual?: ReactNode
}

export type FilterFieldConfig = {
  id: string
  label: string
  icon: IconSvgElement
  options: FilterOption[]
}

// Field id → the values picked. A field with nothing picked is left out.
export type FilterValues = Partial<Record<string, string[]>>

export function setFieldValues(filters: FilterValues, field: string, values: string[]): FilterValues {
  const next = { ...filters }
  if (values.length) next[field] = values
  else delete next[field]
  return next
}

export function toggleFieldValue(filters: FilterValues, field: string, value: string): FilterValues {
  const current = filters[field] ?? []
  return setFieldValues(filters, field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
}

// The fields that have something picked, in the order given.
export const activeFields = (fields: FilterFieldConfig[], filters: FilterValues) =>
  fields.filter((f) => filters[f.id]?.length)

// Same values per field, in any order.
export function sameFilters(a: FilterValues, b: FilterValues) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].every((field) => {
    const x = a[field] ?? []
    const y = b[field] ?? []
    return x.length === y.length && x.every((v) => y.includes(v))
  })
}
