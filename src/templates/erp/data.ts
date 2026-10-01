import { TODAY, addDays } from './format'
import type { Data, Role, Row } from './types'

// Sample data for the ERP template. Made up, generated from a fixed seed so
// every visit shows the same records. Names are invented; dates sit around
// the demo's "today" (1 Oct 2026).

function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = seeded(20261001)
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]
const money = (min: number, max: number, step = 10) => Math.round(int(min, max) / step) * step
const pad = (n: number, width = 4) => String(n).padStart(width, '0')
const day = (from: number, to: number) => addDays(TODAY, int(from, to))

export const PEOPLE = [
  'Alex Morgan', 'Priya Nair', 'Daniel Tan', 'Mei Ling Chua', 'Ravi Kumar', 'Siti Rahman', 'Jordan Lee',
  'Hannah Ong', 'Marcus Lim', 'Aisha Yusof', 'Ethan Goh', 'Chloe Wong', 'Farid Hassan', 'Grace Teo',
  'Nikhil Rao', 'Sofia Reyes', 'Ben Carter', 'Lina Park', 'Omar Aziz', 'Zoe Tan',
] as const

const SALES_REPS = ['Priya Nair', 'Daniel Tan', 'Jordan Lee', 'Hannah Ong'] as const
const BUYERS = ['Ravi Kumar', 'Marcus Lim', 'Ethan Goh'] as const

export const CUSTOMERS = [
  'Bayview Foods', 'Lumen Electronics', 'Orchid Pharma', 'Tanjong Paints', 'Redhill Printing', 'Northgate Supplies',
  'Harbourline Shipping', 'Kestrel Labs', 'Summit Hardware', 'Pinewood Furniture', 'Bluefin Seafood', 'Meridian Textiles',
  'Evergreen Organics', 'Silverleaf Hotels', 'Granite Build Co', 'Coral Bay Clinics',
] as const

export const VENDORS = [
  'Prime Pallets Co', 'Coastal Steel Works', 'Greenleaf Paper Mill', 'Vertex Components', 'Delta Chemicals',
  'Unity Freight Lines', 'Sterling Office Supply', 'Apex Plastics', 'Riverside Timber', 'Nova Packaging',
] as const

const INDUSTRIES = ['Food and beverage', 'Electronics', 'Healthcare', 'Manufacturing', 'Printing', 'Logistics', 'Retail', 'Construction', 'Hospitality'] as const
const CITIES = ['Singapore', 'Johor Bahru', 'Kuala Lumpur', 'Jakarta', 'Bangkok', 'Ho Chi Minh City', 'Manila', 'Penang'] as const

export const WAREHOUSES = [
  { id: 'WH-01', name: 'Central DC', city: 'Singapore' },
  { id: 'WH-02', name: 'East hub', city: 'Singapore' },
  { id: 'WH-03', name: 'Johor depot', city: 'Johor Bahru' },
  { id: 'WH-04', name: 'Port Klang store', city: 'Kuala Lumpur' },
] as const

const ITEMS = [
  ['Wooden pallet 1200×1000', 'Pallets', 18], ['Plastic pallet, nestable', 'Pallets', 42], ['Stretch wrap 500 mm', 'Packaging', 14],
  ['Shrink film 18 µm', 'Packaging', 22], ['Corrugated carton, large', 'Packaging', 1.6], ['Packing tape 48 mm', 'Packaging', 2.2],
  ['Edge protector 50 mm', 'Packaging', 0.8], ['Bubble wrap 1 m roll', 'Packaging', 26], ['Steel strapping 19 mm', 'Strapping', 48],
  ['Strapping buckle (box of 1000)', 'Strapping', 35], ['Plastic crate 60 L', 'Storage', 12], ['Steel shelving bay', 'Storage', 190],
  ['Wire mesh deck', 'Storage', 38], ['Pallet jack 2.5 t', 'Equipment', 420], ['Drum dolly', 'Equipment', 65],
  ['Barcode scanner', 'Equipment', 240], ['Label roll 100×150', 'Consumables', 9], ['Thermal printer ribbon', 'Consumables', 11],
  ['Safety gloves (box of 50)', 'Safety', 16], ['Hi-vis vest', 'Safety', 6],
] as const

// Year-to-date balances, chosen to fit together: income exceeds expenses
// (net income $254,200), and assets equal liabilities plus equity once that
// year's earnings are added. Accumulated depreciation is a positive amount
// that reduces equipment.
const LEDGER = [
  ['1000', 'Cash at bank', 'Asset', 412_300], ['1010', 'Petty cash', 'Asset', 1_200], ['1100', 'Accounts receivable', 'Asset', 338_900],
  ['1200', 'Inventory', 'Asset', 943_000], ['1500', 'Equipment', 'Asset', 356_000], ['1510', 'Accumulated depreciation', 'Asset', 128_000],
  ['2000', 'Accounts payable', 'Liability', 214_500], ['2100', 'GST payable', 'Liability', 38_200], ['2200', 'Accrued expenses', 'Liability', 22_800],
  ['2500', 'Bank loan', 'Liability', 300_000], ['3000', 'Share capital', 'Equity', 500_000], ['3100', 'Retained earnings', 'Equity', 593_700],
  ['4000', 'Sales revenue', 'Income', 2_480_000], ['4100', 'Service revenue', 'Income', 186_000], ['4900', 'Other income', 'Income', 12_400],
  ['5000', 'Cost of goods sold', 'Expense', 1_520_000], ['5100', 'Freight and delivery', 'Expense', 96_000], ['5200', 'Salaries and wages', 'Expense', 512_000],
  ['5300', 'Rent', 'Expense', 144_000], ['5400', 'Utilities', 'Expense', 28_600], ['5500', 'Software subscriptions', 'Expense', 31_200],
  ['5600', 'Depreciation', 'Expense', 42_000], ['5700', 'Bank charges', 'Expense', 3_900], ['5800', 'Marketing', 'Expense', 46_500],
] as const

const DEPARTMENTS = ['Sales', 'Operations', 'Finance', 'HR', 'Warehouse', 'Procurement', 'IT'] as const

function times<T>(n: number, make: (i: number) => T) {
  return Array.from({ length: n }, (_, i) => make(i))
}

function build(): Data {
  const accounts: Row[] = CUSTOMERS.map((name, i) => ({
    id: `ACC-${101 + i}`, name, industry: pick(INDUSTRIES), city: pick(CITIES), owner: pick(SALES_REPS),
    status: i < 12 ? 'Active' : pick(['Active', 'Inactive']), revenue: money(40_000, 900_000, 1000), since: day(-1400, -90),
  }))

  const leads: Row[] = times(24, (i) => {
    const first = pick(PEOPLE).split(' ')[0]
    return {
      id: `L-${1001 + i}`, name: `${first} ${pick(['Ng', 'Ismail', 'Fernandez', 'Koh', 'Sato', 'Wright', 'Hall', 'Das'])}`,
      company: pick(['Brightway Retail', 'Oakfield Foods', 'Lighthouse Media', 'Sunrise Dental', 'Quarry Lane Cafe', 'Westbrook Motors', 'Ivy Lane Studio', 'Tidewater Marine']),
      source: pick(['Website', 'Referral', 'Trade show', 'Outbound', 'Partner']), status: pick(['New', 'New', 'Contacted', 'Qualified', 'Lost']),
      score: int(12, 96), owner: pick(SALES_REPS), created: day(-40, 0),
    }
  })

  const opportunities: Row[] = times(22, (i) => {
    const stage = pick(['Discovery', 'Discovery', 'Proposal', 'Proposal', 'Negotiation', 'Won', 'Lost'])
    const probability = { Discovery: 20, Proposal: 45, Negotiation: 70, Won: 100, Lost: 0 }[stage] ?? 0
    return {
      id: `OPP-${2001 + i}`, name: `${pick(['Warehouse racking', 'Pallet supply', 'Packaging contract', 'Annual consumables', 'Equipment refresh', 'Cold-chain crates'])} ${pick(['2027', 'Q4', 'phase 2', 'renewal'])}`,
      account: pick(CUSTOMERS), stage, amount: money(8_000, 240_000, 500), probability,
      close: stage === 'Won' || stage === 'Lost' ? day(-60, -1) : day(5, 90), owner: pick(SALES_REPS),
    }
  })

  const contacts: Row[] = times(30, (i) => {
    const name = `${pick(['Wei', 'Nurul', 'James', 'Anita', 'Kenji', 'Maria', 'Tom', 'Lakshmi', 'Hui Min', 'Ahmad'])} ${pick(['Lim', 'Abdullah', 'Smith', 'Menon', 'Tanaka', 'Santos', 'Ho', 'Iyer', 'Chen', 'Rahim'])}`
    const account = CUSTOMERS[i % CUSTOMERS.length]
    return {
      id: `CON-${301 + i}`, name, title: pick(['Purchasing manager', 'Operations director', 'Warehouse lead', 'Finance controller', 'Owner', 'Procurement officer']),
      account, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`, phone: `+65 ${int(6000, 9999)} ${int(1000, 9999)}`,
      owner: pick(SALES_REPS), lastActivity: day(-30, 0),
    }
  })

  const activities: Row[] = times(24, (i) => {
    const type = pick(['Call', 'Email', 'Meeting', 'Task'])
    const due = day(-6, 10)
    return {
      id: `ACT-${401 + i}`, subject: `${{ Call: 'Call', Email: 'Follow up with', Meeting: 'Site visit at', Task: 'Send samples to' }[type]} ${pick(CUSTOMERS)}`,
      type, related: pick(opportunities).id as string, owner: pick(SALES_REPS), due, status: due < TODAY ? pick(['Completed', 'Completed', 'Overdue']) : 'Scheduled',
    }
  })

  const quotations: Row[] = times(18, (i) => {
    const issued = day(-45, 0)
    return {
      id: `QT-${3001 + i}`, customer: pick(CUSTOMERS), amount: money(1_200, 64_000), issued, validUntil: addDays(issued, 30),
      status: pick(['Draft', 'Sent', 'Sent', 'Accepted', 'Expired', 'Rejected']), owner: pick(SALES_REPS),
    }
  })

  const salesOrders: Row[] = times(26, (i) => ({
    id: `SO-${5001 + i}`, customer: pick(CUSTOMERS), ordered: day(-35, 0), amount: money(900, 58_000),
    status: pick(['Confirmed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Delivered', 'Cancelled']),
    payment: pick(['Paid', 'Unpaid', 'Partially paid']), owner: pick(SALES_REPS),
  }))

  const deliveries: Row[] = times(16, (i) => {
    const order = salesOrders[i]
    return {
      id: `DO-${7001 + i}`, order: order.id, customer: order.customer, warehouse: pick(WAREHOUSES).id, scheduled: day(-5, 7),
      status: pick(['Ready to pick', 'In transit', 'Delivered', 'Delivered', 'Scheduled']), carrier: pick(['Own fleet', 'Unity Freight Lines', 'Courier']),
    }
  })

  const priceLists: Row[] = [
    { id: 'PL-01', name: 'Standard', currency: 'USD', customers: 9, discount: 0, status: 'Active' },
    { id: 'PL-02', name: 'Wholesale', currency: 'USD', customers: 4, discount: 12, status: 'Active' },
    { id: 'PL-03', name: 'Key accounts', currency: 'USD', customers: 3, discount: 18, status: 'Active' },
    { id: 'PL-04', name: 'Malaysia (MYR)', currency: 'MYR', customers: 2, discount: 5, status: 'Active' },
    { id: 'PL-05', name: 'Promo Q3', currency: 'USD', customers: 6, discount: 10, status: 'Expired' },
  ]

  const items: Row[] = ITEMS.map(([name, category, price], i) => {
    const onHand = i % 7 === 3 ? 0 : i % 5 === 1 ? int(8, 30) : int(120, 2400)
    const reorderPoint = int(40, 200)
    return {
      id: `SKU-${1001 + i}`, name, category, price, cost: Math.round(price * (0.55 + rand() * 0.2) * 100) / 100,
      onHand, reorderPoint, status: onHand === 0 ? 'Out of stock' : onHand < reorderPoint ? 'Low stock' : 'In stock',
    }
  })

  const stock: Row[] = items.flatMap((item, i) =>
    WAREHOUSES.filter((_, w) => (i + w) % 3 !== 0).map((wh) => {
      const onHand = item.onHand === 0 ? 0 : int(0, Number(item.onHand))
      const reserved = Math.min(onHand, int(0, 60))
      return {
        id: `${item.id}-${wh.id}`, item: item.name as string, sku: item.id, warehouse: wh.id, onHand, reserved, available: onHand - reserved,
        reorderPoint: Math.round(Number(item.reorderPoint) / 2), status: onHand === 0 ? 'Out of stock' : onHand < Number(item.reorderPoint) / 2 ? 'Low stock' : 'In stock',
      }
    }),
  )

  const transfers: Row[] = times(10, (i) => {
    const from = pick(WAREHOUSES).id
    return {
      id: `ST-${401 + i}`, from, to: WAREHOUSES.find((w) => w.id !== from)!.id, lines: int(1, 9), requested: day(-14, 2),
      status: pick(['Draft', 'In transit', 'In transit', 'Received']), requestedBy: pick(BUYERS),
    }
  })

  const adjustments: Row[] = times(8, (i) => ({
    id: `ADJ-${501 + i}`, item: pick(ITEMS)[0], warehouse: pick(WAREHOUSES).id, quantity: pick([-24, -6, -2, 4, 12, -1, 30]),
    reason: pick(['Cycle count', 'Damaged', 'Expired', 'Found in count', 'Write-off']), date: day(-20, 0), status: pick(['Posted', 'Posted', 'Draft']),
  }))

  const warehouses: Row[] = WAREHOUSES.map((w, i) => ({
    id: w.id, name: w.name, city: w.city, manager: pick(['Siti Rahman', 'Marcus Lim', 'Farid Hassan', 'Omar Aziz']),
    utilisation: [82, 64, 91, 47][i], skus: stock.filter((s) => s.warehouse === w.id).length, status: 'Active',
  }))

  const vendors: Row[] = VENDORS.map((name, i) => ({
    id: `V-${101 + i}`, name, category: pick(['Raw materials', 'Packaging', 'Freight', 'Office', 'Equipment']), city: pick(CITIES),
    leadTime: int(3, 28), rating: Math.round((3 + rand() * 2) * 10) / 10, balance: money(0, 48_000), status: i === 9 ? 'Inactive' : 'Active',
  }))

  const requisitions: Row[] = times(10, (i) => ({
    id: `PR-${601 + i}`, item: pick(ITEMS)[0], quantity: pick([50, 100, 200, 500, 1000]), requestedBy: pick([...BUYERS, 'Siti Rahman']),
    needed: day(3, 30), estimate: money(400, 18_000), status: pick(['Awaiting approval', 'Awaiting approval', 'Approved', 'Ordered', 'Rejected']),
  }))

  const purchaseOrders: Row[] = times(18, (i) => {
    const ordered = day(-40, 0)
    return {
      id: `PO-${8001 + i}`, vendor: pick(VENDORS), ordered, expected: addDays(ordered, int(5, 30)), amount: money(600, 72_000),
      status: pick(['Draft', 'Awaiting approval', 'Awaiting approval', 'Approved', 'Partially received', 'Received', 'Closed']), buyer: pick(BUYERS),
    }
  })

  const goodsReceipts: Row[] = times(12, (i) => {
    const po = purchaseOrders[i]
    return {
      id: `GRN-${901 + i}`, order: po.id, vendor: po.vendor, warehouse: pick(WAREHOUSES).id, received: day(-25, 0), lines: int(1, 8),
      status: pick(['Received', 'Received', 'Partially received', 'Pending']),
    }
  })

  const invoices: Row[] = times(30, (i) => {
    const issued = day(-70, 0)
    const due = addDays(issued, 30)
    const amount = money(800, 64_000)
    const paidState = pick(['Paid', 'Paid', 'Sent', 'Partially paid', 'Draft'])
    // Any sent invoice still owing past its due date is overdue, part-paid ones too.
    const status = (paidState === 'Sent' || paidState === 'Partially paid') && due < TODAY ? 'Overdue' : paidState
    return {
      id: `INV-2026-${pad(401 + i)}`, customer: pick(CUSTOMERS), issued, due, amount,
      balance: paidState === 'Paid' ? 0 : paidState === 'Partially paid' ? Math.round(amount * 0.4) : amount, status,
    }
  })

  const bills: Row[] = times(18, (i) => {
    const issued = day(-50, 0)
    const due = addDays(issued, pick([14, 30, 45]))
    const status = pick(['Paid', 'Open', 'Open', 'Draft'])
    return {
      id: `BILL-${1001 + i}`, vendor: pick(VENDORS), issued, due, amount: money(300, 42_000),
      status: status === 'Open' && due < TODAY ? 'Overdue' : status,
    }
  })

  const payments: Row[] = times(20, (i) => {
    const incoming = i % 3 !== 0
    return {
      id: `PAY-${1001 + i}`, direction: incoming ? 'Received' : 'Sent', party: incoming ? pick(CUSTOMERS) : pick(VENDORS),
      method: pick(['Bank transfer', 'Bank transfer', 'Card', 'Cheque']), date: day(-30, 0), amount: money(400, 52_000),
      reference: incoming ? `INV-2026-${pad(int(401, 430))}` : `BILL-${int(1001, 1018)}`, status: pick(['Reconciled', 'Reconciled', 'Pending']),
    }
  })

  const journals: Row[] = times(16, (i) => ({
    id: `JE-${1001 + i}`, date: day(-30, 0),
    memo: pick(['Monthly depreciation', 'Accrue September rent', 'Reclass freight costs', 'Payroll September', 'GST adjustment', 'Bank charges', 'Inventory count variance']),
    debit: money(200, 48_000), status: pick(['Posted', 'Posted', 'Posted', 'Draft']), author: pick(['Grace Teo', 'Nikhil Rao', 'Alex Morgan']),
  }))

  const ledgerAccounts: Row[] = LEDGER.map(([code, name, type, balance]) => ({ id: code, name, type, balance, status: 'Active' }))

  const employees: Row[] = PEOPLE.map((name, i) => ({
    id: `E-${pad(101 + i, 3)}`, name, jobTitle: pick(['Account executive', 'Operations analyst', 'Accountant', 'HR partner', 'Warehouse supervisor', 'Buyer', 'Engineer']),
    department: i === 0 ? 'IT' : pick(DEPARTMENTS), location: pick(['Singapore', 'Singapore', 'Johor Bahru', 'Kuala Lumpur']),
    start: day(-2200, -20), status: pick(['Active', 'Active', 'Active', 'On leave', 'Probation']), manager: i < 3 ? '' : pick(['Alex Morgan', 'Priya Nair', 'Grace Teo']),
  }))

  const leave: Row[] = times(12, (i) => {
    const from = day(-10, 30)
    const days = pick([1, 1, 2, 3, 5])
    return {
      id: `LR-${101 + i}`, employee: pick(PEOPLE), type: pick(['Annual leave', 'Annual leave', 'Sick leave', 'Unpaid leave', 'Compassionate leave']),
      from, to: addDays(from, days - 1), days, status: from > TODAY ? pick(['Pending', 'Pending', 'Approved']) : pick(['Approved', 'Rejected']),
    }
  })

  const payroll: Row[] = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'].map((month, i, all) => ({
    id: `PAY-RUN-${month}`, period: month, employees: PEOPLE.length - (i < 3 ? 2 : 0), gross: money(118_000, 132_000, 100),
    payDate: `${month}-28`, status: i === all.length - 1 ? 'Draft' : i === all.length - 2 ? 'Processing' : 'Completed',
  }))

  const ROLE_NAMES: Record<Role, string> = { admin: 'Administrator', sales: 'Sales', operations: 'Operations', finance: 'Finance', hr: 'HR' }
  const users: Row[] = PEOPLE.slice(0, 14).map((name, i) => ({
    id: `U-${101 + i}`, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@acme.example.com`,
    role: ROLE_NAMES[(['admin', 'sales', 'sales', 'operations', 'operations', 'operations', 'sales', 'sales', 'operations', 'finance', 'operations', 'finance', 'hr', 'finance'] as Role[])[i]],
    lastActive: day(-12, 0), mfa: i % 4 !== 3, status: i === 13 ? 'Invited' : i === 11 ? 'Suspended' : 'Active',
  }))

  const audit: Row[] = times(30, (i) => {
    const actor = pick(PEOPLE.slice(0, 14))
    const [action, target] = pick([
      ['approved', 'PO-8004'], ['posted', 'JE-1007'], ['sent', 'INV-2026-0412'], ['changed role of', 'Hannah Ong'],
      ['signed in from a new device', ''], ['exported', 'Customer invoices'], ['deleted draft', 'QT-3011'],
      ['updated price of', 'SKU-1006'], ['received', 'GRN-905'], ['invited', 'Zoe Tan'],
    ])
    return {
      id: `EV-${pad(9000 - i)}`, at: `${day(-6, 0)} ${pad(int(8, 19), 2)}:${pad(int(0, 59), 2)}`, actor, action,
      target, module: pick(['Purchasing', 'Accounting', 'Administration', 'Inventory', 'Sales']), ip: `10.0.${int(1, 9)}.${int(2, 254)}`,
    }
  })

  return {
    leads, opportunities, accounts, contacts, activities, quotations, salesOrders, deliveries, priceLists, items, stock,
    transfers, adjustments, warehouses, requisitions, purchaseOrders, goodsReceipts, vendors, invoices, bills, payments,
    journals, ledgerAccounts, employees, leave, payroll, users, audit,
  }
}

export const SEED: Data = build()

export const COMPANIES = [
  { id: 'acme-sg', name: 'Acme Trading Pte Ltd', short: 'AT', country: 'Singapore', currency: 'USD', members: 42, colour: 'oklch(0.58 0.17 265)' },
  { id: 'acme-my', name: 'Acme Logistics Sdn Bhd', short: 'AL', country: 'Malaysia', currency: 'MYR', members: 18, colour: 'oklch(0.62 0.15 160)' },
  { id: 'acme-holdings', name: 'Acme Group Holdings', short: 'AG', country: 'Singapore', currency: 'USD', members: 6, colour: 'oklch(0.66 0.15 55)' },
] as const

export type Company = (typeof COMPANIES)[number]

// Demo sign-ins on the login page. Any email and password work; these fill
// the form with a role so you can see what each role's sidebar holds.
export const DEMO_USERS: { role: Role; name: string; email: string; title: string }[] = [
  { role: 'admin', name: 'Alex Morgan', email: 'alex@acme.example.com', title: 'Administrator' },
  { role: 'sales', name: 'Priya Nair', email: 'priya@acme.example.com', title: 'Sales manager' },
  { role: 'operations', name: 'Ravi Kumar', email: 'ravi@acme.example.com', title: 'Operations lead' },
  { role: 'finance', name: 'Grace Teo', email: 'grace@acme.example.com', title: 'Finance controller' },
  { role: 'hr', name: 'Hannah Ong', email: 'hannah@acme.example.com', title: 'HR partner' },
]

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator', sales: 'Sales', operations: 'Operations', finance: 'Finance', hr: 'HR',
}
