import { DeliveryTruck01Icon, Door01Icon, IdCardIcon, ReceiptIcon, SmileIcon } from '@hugeicons/core-free-icons'
import type { FormValues } from '@/blocks/form-fields'
import { fieldsOf, isCheckField, resultOf, scoreOf, type FormDefinition, type FormSubmission } from '@/blocks/form-renderer'
import { seededRandom } from '@/lib/random'

// Sample forms for the Forms catalogue page, and a few past submissions of
// them. They stand for the kinds of form a business fills in on the spot:
// two checklists, a claim, a survey and a sign-in. The blocks they feed know
// nothing about any of this; swap them for your own.

const check = (key: string, label: string, description?: string) =>
  ({ key, label, type: 'check', required: true, description } as const)

export const FORMS: FormDefinition[] = [
  {
    id: 'vehicle-check',
    name: 'Vehicle check',
    description: 'Before a delivery run: a walk around, the cab and the load',
    category: 'Operations',
    icon: DeliveryTruck01Icon,
    colour: 'var(--chart-2)',
    version: 3,
    estimatedMinutes: 4,
    context: { label: 'Vehicle', placeholder: 'Registration, such as SGX 4821' },
    sections: [
      {
        id: 'outside', title: 'Walk around', description: 'All four sides, engine off',
        fields: [
          check('tyres', 'Tyres inflated, no visible damage'),
          check('lights', 'All lights and indicators work'),
          check('mirrors', 'Mirrors clean and set'),
          check('body', 'Bodywork free of new damage', 'Photograph anything new'),
        ],
      },
      {
        id: 'cab', title: 'In the cab',
        fields: [
          check('brakes', 'Brakes firm, handbrake holds'),
          check('horn', 'Horn works'),
          check('belt', 'Seat belt latches and retracts'),
          { key: 'fuel', label: 'Fuel level', type: 'select', required: true, options: ['Full', 'Three quarters', 'Half', 'Quarter', 'Reserve'].map((v) => ({ value: v, label: v })) },
        ],
      },
      {
        id: 'load', title: 'Load',
        fields: [
          { key: 'secured', label: 'Is the load secured?', type: 'yes-no', required: true, notePlaceholder: 'What is loose, and what did you do about it?' },
          { key: 'odometer', label: 'Odometer', type: 'number', required: true, placeholder: '128450', hint: 'km' },
        ],
      },
      {
        id: 'sign', title: 'Sign-off',
        fields: [
          { key: 'driver', label: 'Driver', type: 'text', required: true, placeholder: 'Your name', autoComplete: 'name' },
          { key: 'signature', label: 'Signature', type: 'signature', required: true },
        ],
      },
    ],
  },
  {
    id: 'opening-checklist',
    name: 'Opening checklist',
    description: 'Open the site for the day',
    category: 'Operations',
    icon: Door01Icon,
    colour: 'var(--chart-3)',
    version: 2,
    estimatedMinutes: 6,
    sections: [
      {
        id: 'security', title: 'Security',
        fields: [check('alarm', 'Alarm disarmed, no overnight events'), check('doors', 'All external doors and shutters open and undamaged'), check('cctv', 'Cameras recording')],
      },
      {
        id: 'floor', title: 'The floor',
        fields: [
          check('lights', 'Lights on in every aisle'),
          check('exits', 'Fire exits clear and unlocked'),
          check('spills', 'No spills or obstructions', 'Clean up before anyone starts'),
          { key: 'coldroom', label: 'Cold room temperature', type: 'number', required: true, placeholder: '4', hint: '°C' },
        ],
      },
      {
        id: 'equipment', title: 'Equipment',
        fields: [check('chargers', 'Chargers switched off, batteries full'), check('scanners', 'Handheld scanners charged and signed out'), { key: 'notes', label: 'Anything else for the day shift', type: 'textarea', rows: 2, maxLength: 300 }],
      },
    ],
  },
  {
    id: 'expense-claim',
    name: 'Expense claim',
    description: 'Claim back something you paid for yourself',
    category: 'Finance',
    icon: ReceiptIcon,
    colour: 'var(--chart-4)',
    version: 1,
    estimatedMinutes: 3,
    sections: [
      {
        id: 'details', title: 'What you paid',
        fields: [
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'category', label: 'Category', type: 'select', required: true, options: ['Travel', 'Meals', 'Accommodation', 'Supplies', 'Other'].map((v) => ({ value: v, label: v })) },
          { key: 'merchant', label: 'Paid to', type: 'text', required: true, placeholder: 'Shop, airline, hotel…' },
          { key: 'amount', label: 'Amount', type: 'number', required: true, prefix: '$', placeholder: '0.00' },
          { key: 'purpose', label: 'Purpose', type: 'textarea', required: true, rows: 2, maxLength: 200, placeholder: 'Who it was for and why' },
        ],
      },
      {
        id: 'receipt', title: 'Receipt',
        fields: [
          { key: 'receipt', label: 'Photo of the receipt', type: 'photo', required: true, description: 'The whole receipt, readable' },
          { key: 'confirm', label: 'This was a business expense and I have not claimed it before', type: 'checkbox', validate: (v) => (v === true ? undefined : 'Confirm to continue.') },
        ],
      },
      { id: 'sign', title: 'Sign-off', fields: [{ key: 'signature', label: 'Signature', type: 'signature', required: true }] },
    ],
  },
  {
    id: 'customer-satisfaction',
    name: 'Customer satisfaction survey',
    description: 'How did we do on your last order?',
    category: 'Customers',
    icon: SmileIcon,
    colour: 'var(--chart-5)',
    version: 1,
    estimatedMinutes: 2,
    sections: [
      {
        id: 'ratings', title: 'Rate your experience',
        fields: [
          { key: 'overall', label: 'Overall', type: 'rating', required: true, ratingLabels: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] },
          { key: 'delivery', label: 'Delivered on time', type: 'rating' },
          { key: 'quality', label: 'Product quality', type: 'rating' },
          { key: 'support', label: 'Help when you needed it', type: 'rating' },
        ],
      },
      {
        id: 'more', title: 'Tell us more',
        fields: [
          { key: 'recommend', label: 'Would you recommend us?', type: 'yes-no', required: true, notePlaceholder: 'What would change your mind?' },
          { key: 'comments', label: 'Anything else', type: 'textarea', rows: 3, maxLength: 500 },
          { key: 'email', label: 'Email, if you would like a reply', type: 'email', hint: 'Optional', autoComplete: 'email' },
        ],
      },
    ],
  },
  {
    id: 'visitor-sign-in',
    name: 'Visitor sign-in',
    description: 'Sign in at reception',
    category: 'Facilities',
    icon: IdCardIcon,
    colour: 'var(--chart-1)',
    version: 4,
    estimatedMinutes: 1,
    sections: [
      {
        id: 'visitor', title: 'About you',
        fields: [
          { key: 'name', label: 'Full name', type: 'text', required: true, autoComplete: 'name' },
          { key: 'company', label: 'Company', type: 'text', hint: 'Optional' },
          { key: 'purpose', label: 'Purpose of visit', type: 'radio', required: true, options: ['Meeting', 'Delivery', 'Interview', 'Contractor'].map((v) => ({ value: v, label: v })) },
          { key: 'host', label: 'Who are you visiting?', type: 'text', required: true },
        ],
      },
      {
        id: 'rules', title: 'Site rules',
        fields: [
          { key: 'agree', label: 'I will wear my visitor badge and stay with my host', type: 'checkbox', validate: (v) => (v === true ? undefined : 'Agree to the site rules to continue.') },
          { key: 'signature', label: 'Signature', type: 'signature', required: true },
        ],
      },
    ],
  },
]

export const formById = (id: string) => FORMS.find((f) => f.id === id)

/* ---------- Past submissions ---------- */

const NAMES = ['Daniel Tan', 'Priya Nair', 'Jordan Lee', 'Mei Ling Chua', 'Ravi Kumar', 'Hannah Ong']
const VEHICLES = ['SGX 4821', 'SKT 907', 'SLM 2210']
const NOTES = ['Reported to the workshop.', 'Fixed on the spot.', 'Logged for the next service.', 'Taken out of use until fixed.']
const TEXT: Record<string, string> = {
  driver: 'Daniel Tan', odometer: '128450', coldroom: '4', merchant: 'Grab', amount: '38.50', purpose: 'Taxi to the client visit', name: 'Jamie Ng',
  company: 'Kestrel Labs', host: 'Priya Nair', comments: 'Quick delivery, friendly driver.', notes: '',
}

// Made-up answers for a form: mostly passes, a fail here and there.
function answers(form: FormDefinition, rand: () => number, failRate: number): FormValues {
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
    else if (f.type === 'photo') values[f.key] = 'receipt-0931.jpg'
    else if (f.type === 'signature') values[f.key] = ''
    else if (f.type === 'date') values[f.key] = '2026-10-02'
    else if (f.type === 'email') values[f.key] = ''
    else values[f.key] = TEXT[f.key] ?? ''
  }
  return values
}

export function sampleSubmissions(): FormSubmission[] {
  const rand = seededRandom(20261006)
  const now = Date.now()
  const picks: [string, number][] = [
    ['vehicle-check', 0.5], ['opening-checklist', 1], ['vehicle-check', 1.2], ['expense-claim', 2], ['customer-satisfaction', 2.5],
    ['vehicle-check', 3], ['visitor-sign-in', 3.2], ['opening-checklist', 4], ['vehicle-check', 5], ['customer-satisfaction', 6],
    ['expense-claim', 7], ['vehicle-check', 8],
  ]
  return picks.map(([formId, daysAgo], i) => {
    const form = formById(formId)!
    const values = answers(form, rand, i % 3 === 0 ? 0.18 : 0.02)
    return {
      id: `SUB-${String(1042 - i).padStart(4, '0')}`,
      formId,
      formVersion: form.version,
      context: form.context ? VEHICLES[i % VEHICLES.length] : undefined,
      values,
      result: resultOf(form, values),
      score: scoreOf(form, values),
      submittedAt: new Date(now - daysAgo * 86_400_000 - (i % 5) * 3_600_000).toISOString(),
      submittedBy: NAMES[i % NAMES.length],
    }
  })
}
