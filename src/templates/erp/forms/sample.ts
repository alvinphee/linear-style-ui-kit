import type { FormValues } from '@/blocks/form-fields'
import { RESULT_LABEL, fieldsOf, isCheckField, resultOf, scoreOf } from '@/blocks/form-renderer'
import { TODAY, addDays } from '../format'
import type { Row } from '../types'
import { ERP_FORMS, formById } from './definitions'

// Past submissions of the ERP's forms, made up from a fixed seed: who filled
// in what, when, and how it came out. Each row keeps its answers as JSON,
// read back by the kit's FormSubmissionView in the record peek.

const NOTES = ['Reported to the workshop.', 'Fixed on the spot.', 'Logged for the next service.', 'Taken out of use until fixed.']
const TEXT: Record<string, string> = {
  operator: 'Ravi Kumar', hours: '4210', sku: 'SKU-1004', counted: '118', system: '120', coldroom: '4', notes: '', driver: 'Daniel Tan',
  odometer: '128450', merchant: 'Grab', amount: '38.50', purpose: 'Taxi to the client visit', name: 'Jamie Ng', company: 'Kestrel Labs',
  host: 'Priya Nair', comments: 'Quick delivery, friendly driver.', where: 'Dock door 03', description: 'A pallet slipped off the forks while reversing. Nobody nearby.',
  reporter: 'Marcus Lim', start: addDays(TODAY, 7),
}
const CONTEXTS: Record<string, string[]> = {
  'forklift-pre-use': ['FL-03', 'FL-07', 'FL-12'],
  'stock-count': ['A-04-2', 'B-11-1', 'C-02-4'],
  'vehicle-check': ['SGX 4821', 'SKT 907', 'SLM 2210'],
  'employee-onboarding': ['Zoe Tan', 'Omar Aziz'],
}

function answers(formId: string, rand: () => number, failRate: number): FormValues {
  const form = formById(formId)!
  const values: FormValues = {}
  for (const f of fieldsOf(form)) {
    if (isCheckField(f)) {
      const roll = rand()
      const bad = roll < failRate
      const na = !bad && roll > 0.94 && f.type === 'check'
      const result = f.type === 'yes-no' ? (bad ? 'no' : 'yes') : bad ? 'fail' : na ? 'na' : 'pass'
      values[f.key] = bad ? { result, note: NOTES[Math.floor(rand() * NOTES.length)], photo: rand() > 0.5 ? 'IMG_0421.jpg' : undefined } : { result }
    } else if (f.type === 'checkbox') values[f.key] = true
    else if (f.type === 'rating') values[f.key] = String(3 + Math.floor(rand() * 3))
    else if (f.type === 'select' || f.type === 'radio') values[f.key] = f.options?.[Math.floor(rand() * f.options.length)]?.value ?? ''
    else if (f.type === 'photo') values[f.key] = 'IMG_0931.jpg'
    else if (f.type === 'signature' || f.type === 'email') values[f.key] = ''
    else if (f.type === 'date') values[f.key] = addDays(TODAY, -1)
    else values[f.key] = TEXT[f.key] ?? ''
  }
  return values
}

export function sampleSubmissions(rand: () => number, people: readonly string[]): Row[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const rows: Row[] = []
  let n = 1080
  // About three a day over the past twelve days, the shop-floor checks most often.
  const weights = ERP_FORMS.map((f) => (f.context ? 3 : f.category === 'Warehouse' ? 2 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  for (let day = 0; day < 12; day++) {
    const count = day === 0 ? 4 : 2 + Math.floor(rand() * 3)
    for (let i = 0; i < count; i++) {
      let pick = rand() * total
      const form = ERP_FORMS.find((_, k) => (pick -= weights[k]) < 0) ?? ERP_FORMS[0]
      const values = answers(form.id, rand, rand() < 0.3 ? 0.2 : 0.02)
      const score = scoreOf(form, values)
      const contexts = CONTEXTS[form.id]
      rows.push({
        id: `SUB-${n--}`,
        form: form.name,
        formId: form.id,
        context: contexts ? contexts[Math.floor(rand() * contexts.length)] : '',
        result: RESULT_LABEL[resultOf(form, values)],
        passed: score?.passed ?? 0,
        failed: score?.failed ?? 0,
        submittedBy: people[Math.floor(rand() * people.length)],
        submittedAt: `${addDays(TODAY, -day)} ${pad(6 + Math.floor(rand() * 12))}:${pad(Math.floor(rand() * 60))}`,
        values: JSON.stringify(values),
      })
    }
  }
  return rows
}
