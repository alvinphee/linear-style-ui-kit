import {
  Alert02Icon, Building03Icon, Calendar03Icon, ClipboardCheckIcon, DeliveryTruck01Icon, Door01Icon, ForkliftIcon, IdCardIcon,
  ReceiptIcon, Shield01Icon, SmileIcon, Store01Icon, UserCheck01Icon,
} from '@hugeicons/core-free-icons'
import type { FormIconOption } from '@/blocks/form-builder'
import type { FormDefinition } from '@/blocks/form-renderer'
import { erpHref } from '../route'

// The ERP's forms: the kit's form definitions, each owned by a module. The
// Forms module lists them all; a module's Forms page lists its own. These
// are sample definitions for the demo; the blocks that render them do not
// care what they are about.

export type ErpForm = FormDefinition & { module: string }

const check = (key: string, label: string, description?: string) =>
  ({ key, label, type: 'check', required: true, description } as const)
const options = (...values: string[]) => values.map((v) => ({ value: v, label: v }))

export const ERP_FORMS: ErpForm[] = [
  {
    id: 'forklift-pre-use', module: 'inventory', name: 'Forklift pre-use inspection', description: 'Before each shift, on the truck itself',
    category: 'Safety', icon: ForkliftIcon, colour: 'oklch(0.7 0.14 65)', version: 5, estimatedMinutes: 4,
    context: { label: 'Forklift', placeholder: 'Fleet number, such as FL-07' },
    sections: [
      {
        id: 'visual', title: 'Visual check', description: 'Engine off',
        fields: [
          check('forks', 'Forks straight, no cracks or wear'), check('chains', 'Mast chains tensioned and oiled'), check('leaks', 'No hydraulic leaks'),
          check('tyres', 'Tyres and wheels sound'), check('guard', 'Overhead guard and load backrest secure'),
        ],
      },
      {
        id: 'operational', title: 'Operational check', description: 'Engine on, nobody in front',
        fields: [
          check('brakes', 'Service and parking brakes hold'), check('steering', 'Steering smooth, no play'), check('horn', 'Horn and reverse alarm work'),
          check('lights', 'Lights and beacon work'), check('belt', 'Seat belt latches'), check('lift', 'Lift, lower and tilt operate smoothly'),
          { key: 'hours', label: 'Hour meter', type: 'number', required: true, placeholder: '4210', hint: 'hours' },
          { key: 'charge', label: 'Battery or fuel level', type: 'select', required: true, options: options('Full', 'Three quarters', 'Half', 'Quarter', 'Low') },
        ],
      },
      {
        id: 'sign', title: 'Sign-off',
        fields: [{ key: 'operator', label: 'Operator', type: 'text', required: true, autoComplete: 'name' }, { key: 'signature', label: 'Signature', type: 'signature', required: true }],
      },
    ],
  },
  {
    id: 'stock-count', module: 'inventory', name: 'Stock count sheet', description: 'Count one bin and record the difference',
    category: 'Warehouse', icon: Store01Icon, colour: 'oklch(0.7 0.14 65)', version: 2, estimatedMinutes: 3,
    context: { label: 'Bin', placeholder: 'Location, such as A-04-2' },
    sections: [
      {
        id: 'count', title: 'The count',
        fields: [
          { key: 'sku', label: 'Item (SKU)', type: 'text', required: true, placeholder: 'SKU-1004' },
          { key: 'counted', label: 'Counted quantity', type: 'number', required: true },
          { key: 'system', label: 'System quantity', type: 'number', required: true, description: 'From the stock on hand page' },
          { key: 'reason', label: 'Reason for any difference', type: 'select', options: options('None', 'Damaged', 'Mis-shelved', 'Not yet received', 'Theft or loss', 'Unknown') },
        ],
      },
      {
        id: 'condition', title: 'Condition',
        fields: [
          { key: 'damaged', label: 'Any damaged stock in the bin?', type: 'yes-no', required: true, notePlaceholder: 'How many, and what happened to it?' },
          { key: 'photo', label: 'Photo of the bin', type: 'photo' },
        ],
      },
    ],
  },
  {
    id: 'warehouse-opening', module: 'inventory', name: 'Warehouse opening checklist', description: 'Open the warehouse for the day',
    category: 'Warehouse', icon: Door01Icon, colour: 'oklch(0.7 0.14 65)', version: 3, estimatedMinutes: 6,
    sections: [
      { id: 'security', title: 'Security', fields: [check('alarm', 'Alarm disarmed, no overnight events'), check('doors', 'Dock doors and shutters open and undamaged'), check('cctv', 'Cameras recording')] },
      {
        id: 'floor', title: 'The floor',
        fields: [
          check('lights', 'Lights on in every aisle'), check('exits', 'Fire exits clear and unlocked'), check('spills', 'No spills or obstructions'),
          { key: 'coldroom', label: 'Cold room temperature', type: 'number', required: true, placeholder: '4', hint: '°C' },
        ],
      },
      { id: 'equipment', title: 'Equipment', fields: [check('chargers', 'Chargers switched off, batteries full'), check('scanners', 'Handheld scanners charged and signed out'), { key: 'notes', label: 'Anything for the day shift', type: 'textarea', rows: 2, maxLength: 300 }] },
    ],
  },
  {
    id: 'vehicle-check', module: 'sales', name: 'Delivery vehicle check', description: 'Before a delivery run: a walk around, the cab and the load',
    category: 'Fleet', icon: DeliveryTruck01Icon, colour: 'oklch(0.64 0.15 155)', version: 3, estimatedMinutes: 4,
    context: { label: 'Vehicle', placeholder: 'Registration, such as SGX 4821' },
    sections: [
      { id: 'outside', title: 'Walk around', fields: [check('tyres', 'Tyres inflated, no visible damage'), check('lights', 'All lights and indicators work'), check('mirrors', 'Mirrors clean and set'), check('body', 'Bodywork free of new damage', 'Photograph anything new')] },
      { id: 'cab', title: 'In the cab', fields: [check('brakes', 'Brakes firm, handbrake holds'), check('horn', 'Horn works'), check('belt', 'Seat belt latches and retracts'), { key: 'fuel', label: 'Fuel level', type: 'select', required: true, options: options('Full', 'Three quarters', 'Half', 'Quarter', 'Reserve') }] },
      { id: 'load', title: 'Load', fields: [{ key: 'secured', label: 'Is the load secured?', type: 'yes-no', required: true }, { key: 'odometer', label: 'Odometer', type: 'number', required: true, hint: 'km' }] },
      { id: 'sign', title: 'Sign-off', fields: [{ key: 'driver', label: 'Driver', type: 'text', required: true, autoComplete: 'name' }, { key: 'signature', label: 'Signature', type: 'signature', required: true }] },
    ],
  },
  {
    id: 'customer-satisfaction', module: 'sales', name: 'Customer satisfaction survey', description: 'How did we do on your last order?',
    category: 'Customers', icon: SmileIcon, colour: 'oklch(0.64 0.15 155)', version: 1, estimatedMinutes: 2,
    sections: [
      {
        id: 'ratings', title: 'Rate your experience',
        fields: [
          { key: 'overall', label: 'Overall', type: 'rating', required: true, ratingLabels: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] },
          { key: 'delivery', label: 'Delivered on time', type: 'rating' }, { key: 'quality', label: 'Product quality', type: 'rating' }, { key: 'support', label: 'Help when you needed it', type: 'rating' },
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
    id: 'expense-claim', module: 'hr', name: 'Expense claim', description: 'Claim back something you paid for yourself',
    category: 'Finance', icon: ReceiptIcon, colour: 'oklch(0.64 0.16 340)', version: 1, estimatedMinutes: 3,
    sections: [
      {
        id: 'details', title: 'What you paid',
        fields: [
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'category', label: 'Category', type: 'select', required: true, options: options('Travel', 'Meals', 'Accommodation', 'Supplies', 'Other') },
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
    id: 'employee-onboarding', module: 'hr', name: 'New starter checklist', description: 'Everything ready for someone’s first day',
    category: 'People', icon: UserCheck01Icon, colour: 'oklch(0.64 0.16 340)', version: 2, estimatedMinutes: 5,
    context: { label: 'New starter', placeholder: 'Their name' },
    sections: [
      { id: 'before', title: 'Before day one', fields: [check('contract', 'Contract signed and filed'), check('accounts', 'Email and system accounts created'), check('laptop', 'Laptop and phone issued'), check('badge', 'Access badge ready'), { key: 'start', label: 'Start date', type: 'date', required: true }] },
      { id: 'dayone', title: 'Day one', fields: [check('induction', 'Safety induction done'), check('buddy', 'Buddy assigned and introduced'), check('payroll', 'Bank and tax details collected'), { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }] },
    ],
  },
  {
    id: 'visitor-sign-in', module: 'admin', name: 'Visitor sign-in', description: 'Sign in at reception',
    category: 'Facilities', icon: IdCardIcon, colour: 'oklch(0.55 0.02 260)', version: 4, estimatedMinutes: 1,
    sections: [
      {
        id: 'visitor', title: 'About you',
        fields: [
          { key: 'name', label: 'Full name', type: 'text', required: true, autoComplete: 'name' }, { key: 'company', label: 'Company', type: 'text', hint: 'Optional' },
          { key: 'purpose', label: 'Purpose of visit', type: 'radio', required: true, options: options('Meeting', 'Delivery', 'Interview', 'Contractor') },
          { key: 'host', label: 'Who are you visiting?', type: 'text', required: true },
        ],
      },
      { id: 'rules', title: 'Site rules', fields: [{ key: 'agree', label: 'I will wear my visitor badge and stay with my host', type: 'checkbox', validate: (v) => (v === true ? undefined : 'Agree to the site rules to continue.') }, { key: 'signature', label: 'Signature', type: 'signature', required: true }] },
    ],
  },
  {
    id: 'incident-report', module: 'admin', name: 'Incident report', description: 'Report an accident, near miss or damage',
    category: 'Safety', icon: Alert02Icon, colour: 'oklch(0.55 0.02 260)', version: 2, estimatedMinutes: 5,
    sections: [
      {
        id: 'what', title: 'What happened',
        fields: [
          { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'where', label: 'Where', type: 'text', required: true, placeholder: 'Building, area, dock door…' },
          { key: 'type', label: 'Type', type: 'select', required: true, options: options('Injury', 'Near miss', 'Property damage', 'Spill or leak', 'Security') },
          { key: 'severity', label: 'Severity', type: 'radio', required: true, options: options('Minor', 'Moderate', 'Serious'), optionsClassName: '@sm:grid-cols-3' },
          { key: 'description', label: 'Describe it', type: 'textarea', required: true, rows: 4, maxLength: 1000 },
          { key: 'photos', label: 'Photos', type: 'photo', multiple: true },
        ],
      },
      {
        id: 'people', title: 'People',
        fields: [
          { key: 'hurt', label: 'Was anyone hurt?', type: 'yes-no', required: true, notePlaceholder: 'Who, and how badly?' },
          { key: 'firstaid', label: 'Was first aid given?', type: 'yes-no', required: true, noteOnFail: false },
          { key: 'reporter', label: 'Reported by', type: 'text', required: true, autoComplete: 'name' }, { key: 'signature', label: 'Signature', type: 'signature', required: true },
        ],
      },
    ],
  },
]

export const formById = (id: string | null | undefined) => ERP_FORMS.find((f) => f.id === id)

// The icons the form builder offers.
export const FORM_ICONS: FormIconOption[] = [
  { id: 'clipboard', label: 'Checklist', icon: ClipboardCheckIcon }, { id: 'truck', label: 'Vehicle', icon: DeliveryTruck01Icon },
  { id: 'forklift', label: 'Forklift', icon: ForkliftIcon }, { id: 'door', label: 'Site', icon: Door01Icon }, { id: 'store', label: 'Stock', icon: Store01Icon },
  { id: 'receipt', label: 'Claim', icon: ReceiptIcon }, { id: 'smile', label: 'Survey', icon: SmileIcon }, { id: 'id', label: 'Visitor', icon: IdCardIcon },
  { id: 'person', label: 'People', icon: UserCheck01Icon }, { id: 'alert', label: 'Incident', icon: Alert02Icon }, { id: 'shield', label: 'Safety', icon: Shield01Icon },
  { id: 'building', label: 'Facilities', icon: Building03Icon }, { id: 'calendar', label: 'Schedule', icon: Calendar03Icon },
]
export const formsOf = (moduleId: string) => ERP_FORMS.filter((f) => f.module === moduleId)

// Every form opens from the Forms module's catalogue, so one link works
// whichever module owns it.
export const formPath = (form: FormDefinition, context?: string) => erpHref('forms', 'catalogue', form.id, { context })

// The link a QR code carries: the whole address, so a phone camera can open it.
export const formLink = (form: FormDefinition, context?: string) => `${window.location.origin}${window.location.pathname}${formPath(form, context)}`
