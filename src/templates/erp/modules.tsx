import {
  Agreement01Icon, Audit01Icon, BankIcon, Building03Icon, CallIcon, ChartLineData01Icon, ContactBookIcon,
  Coins01Icon, DashboardSquare01Icon, DeliveryTruck01Icon, Exchange01Icon, FunnelIcon, Invoice01Icon, Invoice03Icon,
  Calendar03Icon, Note01Icon, PackageIcon, PackageReceiveIcon, Plug01Icon, QuoteDownIcon, ReceiptTextIcon,
  Settings01Icon, Shield01Icon, ShoppingCart01Icon, Store01Icon, Tag01Icon, Target02Icon, UserGroupIcon,
  UserLock01Icon, UserMultipleIcon, Wallet01Icon, WarehouseIcon, Home01Icon, Calculator01Icon, PipelineIcon,
  Briefcase01Icon, Payment01Icon, SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons'
import { CUSTOMERS, PEOPLE, VENDORS, WAREHOUSES } from './data'
import { TODAY, addDays } from './format'
import Launchpad from './Launchpad'
import { ModuleOverview } from './pages/Overview'
import { OpportunityPipeline } from './pages/Pipeline'
import { FinancialReports } from './pages/Reports'
import { CompanySettings, Integrations, RolesPermissions } from './pages/Admin'
import type { Data, ErpModule, ListSpec, Row } from './types'

// Every module, its pages, and how each list looks. Names follow the
// standard ERP vocabulary (docs/glossary.md).

const REPS = ['Priya Nair', 'Daniel Tan', 'Jordan Lee', 'Hannah Ong']
const WH = WAREHOUSES.map((w) => w.id)
const is = (...statuses: string[]) => (r: Row) => statuses.includes(String(r.status))
const count = (rows: Row[], ...statuses: string[]) => rows.filter(is(...statuses)).length
const sum = (rows: Row[], key: string) => rows.reduce((t, r) => t + Number(r[key] ?? 0), 0)
const short = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`)

export const LISTS = {
  leads: {
    entity: 'leads', singular: 'lead', plural: 'Leads', prefix: 'L-', primary: 'name',
    columns: [
      { key: 'id', label: 'Lead', kind: 'id' }, { key: 'name', label: 'Name' }, { key: 'company', label: 'Company', hide: 'md' },
      { key: 'source', label: 'Source', hide: 'xl' }, { key: 'score', label: 'Score', kind: 'number', hide: 'lg' },
      { key: 'owner', label: 'Owner', kind: 'person', hide: 'xl' }, { key: 'created', label: 'Created', kind: 'date', hide: '2xl' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All leads' }, { id: 'new', label: 'New', match: is('New') }, { id: 'working', label: 'Contacted', match: is('Contacted') }, { id: 'qualified', label: 'Qualified', match: is('Qualified') }, { id: 'lost', label: 'Lost', match: is('Lost') }],
    create: {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Jamie Ng' },
        { key: 'company', label: 'Company', type: 'text', required: true, placeholder: 'Brightway Retail' },
        { key: 'source', label: 'Source', type: 'select', options: ['Website', 'Referral', 'Trade show', 'Outbound', 'Partner'] },
        { key: 'owner', label: 'Owner', type: 'select', options: REPS },
      ],
      defaults: { status: 'New', score: 50, created: TODAY },
    },
    bulk: [{ label: 'Mark contacted', patch: { status: 'Contacted' } }, { label: 'Qualify', patch: { status: 'Qualified' } }, { label: 'Mark lost', patch: { status: 'Lost' } }],
  },
  opportunities: {
    entity: 'opportunities', singular: 'opportunity', plural: 'Opportunities', prefix: 'OPP-', primary: 'name',
    columns: [
      { key: 'id', label: 'Opportunity', kind: 'id' }, { key: 'name', label: 'Name' }, { key: 'account', label: 'Account', hide: 'md' },
      { key: 'amount', label: 'Amount', kind: 'money' }, { key: 'probability', label: 'Probability', kind: 'percent', hide: 'xl' },
      { key: 'close', label: 'Close date', kind: 'date', hide: 'lg' }, { key: 'owner', label: 'Owner', kind: 'person', hide: '2xl' },
      { key: 'stage', label: 'Stage', kind: 'status' },
    ],
    views: [{ id: 'open', label: 'Open', match: (r) => !['Won', 'Lost'].includes(String(r.stage)) }, { id: 'won', label: 'Won', match: (r) => r.stage === 'Won' }, { id: 'lost', label: 'Lost', match: (r) => r.stage === 'Lost' }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Warehouse racking 2027' },
        { key: 'account', label: 'Account', type: 'select', options: [...CUSTOMERS], required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '25000' },
        { key: 'close', label: 'Close date', type: 'date' },
        { key: 'owner', label: 'Owner', type: 'select', options: REPS },
      ],
      defaults: { stage: 'Discovery', probability: 20 },
    },
  },
  accounts: {
    entity: 'accounts', singular: 'account', plural: 'Accounts', prefix: 'ACC-', primary: 'name',
    columns: [
      { key: 'id', label: 'Account', kind: 'id', hide: 'lg' }, { key: 'name', label: 'Name' }, { key: 'industry', label: 'Industry', hide: 'lg' },
      { key: 'city', label: 'City', hide: 'md' }, { key: 'owner', label: 'Owner', kind: 'person', hide: 'xl' },
      { key: 'revenue', label: 'Annual revenue', kind: 'money', hide: 'md' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All accounts' }, { id: 'active', label: 'Active', match: is('Active') }, { id: 'inactive', label: 'Inactive', match: is('Inactive') }],
    create: {
      fields: [
        { key: 'name', label: 'Company name', type: 'text', required: true, placeholder: 'Oakfield Foods' },
        { key: 'industry', label: 'Industry', type: 'select', options: ['Food and beverage', 'Electronics', 'Healthcare', 'Manufacturing', 'Retail', 'Logistics'] },
        { key: 'city', label: 'City', type: 'text', placeholder: 'Singapore' },
        { key: 'owner', label: 'Owner', type: 'select', options: REPS },
      ],
      defaults: { status: 'Active', revenue: 0, since: TODAY },
    },
  },
  contacts: {
    entity: 'contacts', singular: 'contact', plural: 'Contacts', prefix: 'CON-', primary: 'name',
    columns: [
      { key: 'name', label: 'Name', kind: 'person' }, { key: 'title', label: 'Job title', hide: 'lg' }, { key: 'account', label: 'Account' },
      { key: 'email', label: 'Email', hide: 'md' }, { key: 'phone', label: 'Phone', hide: '2xl' },
      { key: 'lastActivity', label: 'Last activity', kind: 'date', hide: 'xl' },
    ],
    create: {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Wei Lim' },
        { key: 'title', label: 'Job title', type: 'text', placeholder: 'Purchasing manager' },
        { key: 'account', label: 'Account', type: 'select', options: [...CUSTOMERS], required: true },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'wei.lim@example.com' },
      ],
      defaults: { owner: 'Priya Nair', lastActivity: TODAY, phone: '' },
    },
  },
  activities: {
    entity: 'activities', singular: 'activity', plural: 'Activities', prefix: 'ACT-', primary: 'subject',
    columns: [
      { key: 'subject', label: 'Subject' }, { key: 'type', label: 'Type', hide: 'md' }, { key: 'related', label: 'Related to', kind: 'id', hide: 'xl' },
      { key: 'owner', label: 'Owner', kind: 'person', hide: 'lg' }, { key: 'due', label: 'Due', kind: 'date' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'upcoming', label: 'Upcoming', match: is('Scheduled') }, { id: 'overdue', label: 'Overdue', match: is('Overdue') }, { id: 'done', label: 'Completed', match: is('Completed') }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Call Bayview Foods about renewal' },
        { key: 'type', label: 'Type', type: 'select', options: ['Call', 'Email', 'Meeting', 'Task'] },
        { key: 'due', label: 'Due', type: 'date' },
        { key: 'owner', label: 'Owner', type: 'select', options: REPS },
      ],
      defaults: { status: 'Scheduled', related: '' },
    },
    bulk: [{ label: 'Mark completed', patch: { status: 'Completed' } }],
  },
  quotations: {
    entity: 'quotations', singular: 'quotation', plural: 'Quotations', prefix: 'QT-', primary: 'customer',
    columns: [
      { key: 'id', label: 'Quotation', kind: 'id' }, { key: 'customer', label: 'Customer' }, { key: 'issued', label: 'Issued', kind: 'date', hide: 'xl' },
      { key: 'validUntil', label: 'Valid until', kind: 'date', hide: 'lg' }, { key: 'owner', label: 'Salesperson', kind: 'person', hide: '2xl' },
      { key: 'amount', label: 'Total', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft', match: is('Draft') }, { id: 'sent', label: 'Sent', match: is('Sent') }, { id: 'accepted', label: 'Accepted', match: is('Accepted') }, { id: 'expired', label: 'Expired', match: is('Expired', 'Rejected') }],
    create: {
      fields: [
        { key: 'customer', label: 'Customer', type: 'select', options: [...CUSTOMERS], required: true },
        { key: 'amount', label: 'Total', type: 'number', required: true, placeholder: '4800' },
        { key: 'validUntil', label: 'Valid until', type: 'date' },
      ],
      defaults: { status: 'Draft', issued: TODAY, owner: 'Priya Nair', validUntil: addDays(TODAY, 30) },
    },
    bulk: [{ label: 'Mark sent', patch: { status: 'Sent' } }],
  },
  salesOrders: {
    entity: 'salesOrders', singular: 'sales order', plural: 'Sales orders', prefix: 'SO-', primary: 'customer',
    columns: [
      { key: 'id', label: 'Order', kind: 'id' }, { key: 'customer', label: 'Customer' }, { key: 'ordered', label: 'Order date', kind: 'date', hide: 'lg' },
      { key: 'payment', label: 'Payment', kind: 'status', hide: 'md' }, { key: 'owner', label: 'Salesperson', kind: 'person', hide: '2xl' },
      { key: 'amount', label: 'Total', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'open', label: 'Open', match: is('Confirmed', 'Processing') }, { id: 'shipped', label: 'Shipped', match: is('Shipped') }, { id: 'delivered', label: 'Delivered', match: is('Delivered') }, { id: 'cancelled', label: 'Cancelled', match: is('Cancelled') }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'customer', label: 'Customer', type: 'select', options: [...CUSTOMERS], required: true },
        { key: 'amount', label: 'Total', type: 'number', required: true, placeholder: '12500' },
      ],
      defaults: { status: 'Confirmed', payment: 'Unpaid', ordered: TODAY, owner: 'Priya Nair' },
    },
    bulk: [{ label: 'Mark shipped', patch: { status: 'Shipped' } }, { label: 'Mark delivered', patch: { status: 'Delivered' } }],
  },
  deliveries: {
    entity: 'deliveries', singular: 'delivery', plural: 'Deliveries', prefix: 'DO-', primary: 'customer',
    columns: [
      { key: 'id', label: 'Delivery', kind: 'id' }, { key: 'order', label: 'Sales order', kind: 'id', hide: 'lg' }, { key: 'customer', label: 'Customer' },
      { key: 'warehouse', label: 'Warehouse', hide: 'md' }, { key: 'carrier', label: 'Carrier', hide: 'xl' },
      { key: 'scheduled', label: 'Scheduled', kind: 'date' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'pick', label: 'Ready to pick', match: is('Ready to pick', 'Scheduled') }, { id: 'transit', label: 'In transit', match: is('In transit') }, { id: 'done', label: 'Delivered', match: is('Delivered') }, { id: 'all', label: 'All' }],
    bulk: [{ label: 'Mark in transit', patch: { status: 'In transit' } }, { label: 'Mark delivered', patch: { status: 'Delivered' } }],
  },
  priceLists: {
    entity: 'priceLists', singular: 'price list', plural: 'Price lists', prefix: 'PL-', primary: 'name',
    columns: [
      { key: 'name', label: 'Name' }, { key: 'currency', label: 'Currency' }, { key: 'customers', label: 'Customers', kind: 'number', hide: 'md' },
      { key: 'discount', label: 'Discount', kind: 'percent' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    create: {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Distributors' },
        { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'MYR', 'SGD'] },
        { key: 'discount', label: 'Discount (%)', type: 'number', placeholder: '8' },
      ],
      defaults: { customers: 0, status: 'Active' },
    },
  },
  items: {
    entity: 'items', singular: 'item', plural: 'Items', prefix: 'SKU-', primary: 'name',
    columns: [
      { key: 'id', label: 'SKU', kind: 'id' }, { key: 'name', label: 'Item' }, { key: 'category', label: 'Category', hide: 'lg' },
      { key: 'price', label: 'Unit price', kind: 'money', hide: 'md' }, { key: 'cost', label: 'Unit cost', kind: 'money', hide: '2xl' },
      { key: 'onHand', label: 'On hand', kind: 'number' }, { key: 'reorderPoint', label: 'Reorder point', kind: 'number', hide: 'xl' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All items' }, { id: 'low', label: 'Low stock', match: is('Low stock') }, { id: 'out', label: 'Out of stock', match: is('Out of stock') }],
    create: {
      fields: [
        { key: 'name', label: 'Item name', type: 'text', required: true, placeholder: 'Pallet wrap 23 µm' },
        { key: 'category', label: 'Category', type: 'select', options: ['Pallets', 'Packaging', 'Strapping', 'Storage', 'Equipment', 'Consumables', 'Safety'] },
        { key: 'price', label: 'Unit price', type: 'number', required: true, placeholder: '12.50' },
        { key: 'cost', label: 'Unit cost', type: 'number', placeholder: '7.80' },
      ],
      defaults: { onHand: 0, reorderPoint: 50, status: 'Out of stock' },
    },
  },
  stock: {
    entity: 'stock', singular: 'stock line', plural: 'Stock on hand', primary: 'item',
    columns: [
      { key: 'item', label: 'Item' }, { key: 'sku', label: 'SKU', kind: 'id', hide: 'lg' }, { key: 'warehouse', label: 'Warehouse' },
      { key: 'onHand', label: 'On hand', kind: 'number' }, { key: 'reserved', label: 'Reserved', kind: 'number', hide: 'xl' },
      { key: 'available', label: 'Available', kind: 'number', hide: 'md' }, { key: 'reorderPoint', label: 'Reorder point', kind: 'number', hide: '2xl' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [
      { id: 'all', label: 'All warehouses' },
      ...WH.map((id) => ({ id, label: id, match: (r: Row) => r.warehouse === id })),
      { id: 'low', label: 'Below reorder point', match: is('Low stock', 'Out of stock') },
    ],
  },
  transfers: {
    entity: 'transfers', singular: 'stock transfer', plural: 'Stock transfers', prefix: 'ST-', primary: 'id',
    columns: [
      { key: 'id', label: 'Transfer', kind: 'id' }, { key: 'from', label: 'From' }, { key: 'to', label: 'To' },
      { key: 'lines', label: 'Lines', kind: 'number', hide: 'md' }, { key: 'requested', label: 'Requested', kind: 'date', hide: 'lg' },
      { key: 'requestedBy', label: 'Requested by', kind: 'person', hide: 'xl' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft', match: is('Draft') }, { id: 'transit', label: 'In transit', match: is('In transit') }, { id: 'received', label: 'Received', match: is('Received') }],
    create: {
      fields: [
        { key: 'from', label: 'From warehouse', type: 'select', options: WH, required: true },
        { key: 'to', label: 'To warehouse', type: 'select', options: WH, required: true },
        { key: 'lines', label: 'Lines', type: 'number', placeholder: '3' },
      ],
      defaults: { status: 'Draft', requested: TODAY, requestedBy: 'Ravi Kumar' },
    },
    bulk: [{ label: 'Mark received', patch: { status: 'Received' } }],
  },
  adjustments: {
    entity: 'adjustments', singular: 'stock adjustment', plural: 'Stock adjustments', prefix: 'ADJ-', primary: 'item',
    columns: [
      { key: 'id', label: 'Adjustment', kind: 'id' }, { key: 'item', label: 'Item' }, { key: 'warehouse', label: 'Warehouse', hide: 'md' },
      { key: 'quantity', label: 'Quantity', kind: 'number' }, { key: 'reason', label: 'Reason', hide: 'lg' },
      { key: 'date', label: 'Date', kind: 'date', hide: 'xl' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    create: {
      fields: [
        { key: 'item', label: 'Item', type: 'text', required: true, placeholder: 'Stretch wrap 500 mm' },
        { key: 'warehouse', label: 'Warehouse', type: 'select', options: WH },
        { key: 'quantity', label: 'Quantity (+ or −)', type: 'number', required: true, placeholder: '-4' },
        { key: 'reason', label: 'Reason', type: 'select', options: ['Cycle count', 'Damaged', 'Expired', 'Found in count', 'Write-off'] },
      ],
      defaults: { status: 'Draft', date: TODAY },
    },
    bulk: [{ label: 'Post', patch: { status: 'Posted' } }],
  },
  warehouses: {
    entity: 'warehouses', singular: 'warehouse', plural: 'Warehouses', primary: 'name',
    columns: [
      { key: 'id', label: 'Code', kind: 'id' }, { key: 'name', label: 'Name' }, { key: 'city', label: 'City', hide: 'md' },
      { key: 'manager', label: 'Manager', kind: 'person', hide: 'lg' }, { key: 'skus', label: 'SKUs', kind: 'number', hide: 'xl' },
      { key: 'utilisation', label: 'Utilisation', kind: 'percent' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
  },
  requisitions: {
    entity: 'requisitions', singular: 'purchase requisition', plural: 'Purchase requisitions', prefix: 'PR-', primary: 'item',
    columns: [
      { key: 'id', label: 'Requisition', kind: 'id' }, { key: 'item', label: 'Item' }, { key: 'quantity', label: 'Quantity', kind: 'number', hide: 'lg' },
      { key: 'requestedBy', label: 'Requested by', kind: 'person', hide: 'xl' }, { key: 'needed', label: 'Needed by', kind: 'date', hide: 'md' },
      { key: 'estimate', label: 'Estimate', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'approval', label: 'Awaiting approval', match: is('Awaiting approval') }, { id: 'approved', label: 'Approved', match: is('Approved') }, { id: 'ordered', label: 'Ordered', match: is('Ordered') }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'item', label: 'Item', type: 'text', required: true, placeholder: 'Wooden pallet 1200×1000' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '200' },
        { key: 'needed', label: 'Needed by', type: 'date' },
        { key: 'estimate', label: 'Estimated cost', type: 'number', placeholder: '3600' },
      ],
      defaults: { status: 'Awaiting approval', requestedBy: 'Ravi Kumar' },
    },
    bulk: [{ label: 'Approve', patch: { status: 'Approved' } }, { label: 'Reject', patch: { status: 'Rejected' } }],
  },
  purchaseOrders: {
    entity: 'purchaseOrders', singular: 'purchase order', plural: 'Purchase orders', prefix: 'PO-', primary: 'vendor',
    columns: [
      { key: 'id', label: 'Order', kind: 'id' }, { key: 'vendor', label: 'Vendor' }, { key: 'ordered', label: 'Order date', kind: 'date', hide: 'xl' },
      { key: 'expected', label: 'Expected', kind: 'date', hide: 'lg' }, { key: 'buyer', label: 'Buyer', kind: 'person', hide: '2xl' },
      { key: 'amount', label: 'Total', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'approval', label: 'Awaiting approval', match: is('Awaiting approval') }, { id: 'open', label: 'Open', match: is('Approved', 'Partially received') }, { id: 'received', label: 'Received', match: is('Received', 'Closed') }, { id: 'draft', label: 'Draft', match: is('Draft') }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'vendor', label: 'Vendor', type: 'select', options: [...VENDORS], required: true },
        { key: 'amount', label: 'Total', type: 'number', required: true, placeholder: '8400' },
        { key: 'expected', label: 'Expected delivery', type: 'date' },
      ],
      defaults: { status: 'Draft', ordered: TODAY, buyer: 'Ravi Kumar', expected: addDays(TODAY, 14) },
    },
    bulk: [{ label: 'Approve', patch: { status: 'Approved' } }, { label: 'Close', patch: { status: 'Closed' } }],
  },
  goodsReceipts: {
    entity: 'goodsReceipts', singular: 'goods receipt', plural: 'Goods receipts', prefix: 'GRN-', primary: 'vendor',
    columns: [
      { key: 'id', label: 'Receipt', kind: 'id' }, { key: 'order', label: 'Purchase order', kind: 'id', hide: 'md' }, { key: 'vendor', label: 'Vendor' },
      { key: 'warehouse', label: 'Warehouse', hide: 'lg' }, { key: 'lines', label: 'Lines', kind: 'number', hide: 'xl' },
      { key: 'received', label: 'Received', kind: 'date' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
  },
  vendors: {
    entity: 'vendors', singular: 'vendor', plural: 'Vendors', prefix: 'V-', primary: 'name',
    columns: [
      { key: 'id', label: 'Vendor', kind: 'id', hide: 'lg' }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', hide: 'md' },
      { key: 'city', label: 'City', hide: 'xl' }, { key: 'leadTime', label: 'Lead time (days)', kind: 'number', hide: '2xl' },
      { key: 'rating', label: 'Rating', kind: 'number', hide: 'xl' }, { key: 'balance', label: 'Balance owed', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    create: {
      fields: [
        { key: 'name', label: 'Vendor name', type: 'text', required: true, placeholder: 'Harbour Crates Co' },
        { key: 'category', label: 'Category', type: 'select', options: ['Raw materials', 'Packaging', 'Freight', 'Office', 'Equipment'] },
        { key: 'city', label: 'City', type: 'text', placeholder: 'Singapore' },
      ],
      defaults: { leadTime: 7, rating: 4, balance: 0, status: 'Active' },
    },
  },
  invoices: {
    entity: 'invoices', singular: 'customer invoice', plural: 'Customer invoices', prefix: 'INV-2026-', primary: 'customer',
    columns: [
      { key: 'id', label: 'Invoice', kind: 'id' }, { key: 'customer', label: 'Customer' }, { key: 'issued', label: 'Issued', kind: 'date', hide: 'xl' },
      { key: 'due', label: 'Due', kind: 'date', hide: 'md' }, { key: 'amount', label: 'Total', kind: 'money', hide: 'lg' },
      { key: 'balance', label: 'Balance due', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All' }, { id: 'unpaid', label: 'Unpaid', match: is('Sent', 'Partially paid', 'Overdue') }, { id: 'overdue', label: 'Overdue', match: is('Overdue') }, { id: 'draft', label: 'Draft', match: is('Draft') }, { id: 'paid', label: 'Paid', match: is('Paid') }],
    create: {
      fields: [
        { key: 'customer', label: 'Customer', type: 'select', options: [...CUSTOMERS], required: true },
        { key: 'amount', label: 'Total', type: 'number', required: true, placeholder: '6400' },
        { key: 'due', label: 'Due date', type: 'date' },
      ],
      defaults: { status: 'Draft', issued: TODAY, due: addDays(TODAY, 30) },
    },
    bulk: [{ label: 'Mark sent', patch: { status: 'Sent' } }, { label: 'Record payment', patch: { status: 'Paid', balance: 0 } }],
  },
  bills: {
    entity: 'bills', singular: 'vendor bill', plural: 'Vendor bills', prefix: 'BILL-', primary: 'vendor',
    columns: [
      { key: 'id', label: 'Bill', kind: 'id' }, { key: 'vendor', label: 'Vendor' }, { key: 'issued', label: 'Bill date', kind: 'date', hide: 'xl' },
      { key: 'due', label: 'Due', kind: 'date', hide: 'md' }, { key: 'amount', label: 'Total', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'open', label: 'Open', match: is('Open', 'Overdue') }, { id: 'overdue', label: 'Overdue', match: is('Overdue') }, { id: 'paid', label: 'Paid', match: is('Paid') }, { id: 'draft', label: 'Draft', match: is('Draft') }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'vendor', label: 'Vendor', type: 'select', options: [...VENDORS], required: true },
        { key: 'amount', label: 'Total', type: 'number', required: true, placeholder: '2150' },
        { key: 'due', label: 'Due date', type: 'date' },
      ],
      defaults: { status: 'Draft', issued: TODAY, due: addDays(TODAY, 30) },
    },
    bulk: [{ label: 'Approve for payment', patch: { status: 'Open' } }, { label: 'Mark paid', patch: { status: 'Paid' } }],
  },
  payments: {
    entity: 'payments', singular: 'payment', plural: 'Payments', prefix: 'PAY-', primary: 'party',
    columns: [
      { key: 'id', label: 'Payment', kind: 'id' }, { key: 'direction', label: 'Type', hide: 'md' }, { key: 'party', label: 'Customer or vendor' },
      { key: 'method', label: 'Method', hide: 'xl' }, { key: 'reference', label: 'Applied to', kind: 'id', hide: '2xl' },
      { key: 'date', label: 'Date', kind: 'date', hide: 'lg' }, { key: 'amount', label: 'Amount', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All' }, { id: 'in', label: 'Received', match: (r) => r.direction === 'Received' }, { id: 'out', label: 'Sent', match: (r) => r.direction === 'Sent' }, { id: 'pending', label: 'To reconcile', match: is('Pending') }],
    create: {
      fields: [
        { key: 'direction', label: 'Type', type: 'select', options: ['Received', 'Sent'], required: true },
        { key: 'party', label: 'Customer or vendor', type: 'text', required: true, placeholder: 'Bayview Foods' },
        { key: 'method', label: 'Method', type: 'select', options: ['Bank transfer', 'Card', 'Cheque'] },
        { key: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '1800' },
      ],
      defaults: { date: TODAY, status: 'Pending', reference: '' },
    },
    bulk: [{ label: 'Mark reconciled', patch: { status: 'Reconciled' } }],
  },
  journals: {
    entity: 'journals', singular: 'journal entry', plural: 'Journal entries', prefix: 'JE-', primary: 'memo',
    columns: [
      { key: 'id', label: 'Entry', kind: 'id' }, { key: 'date', label: 'Date', kind: 'date', hide: 'md' }, { key: 'memo', label: 'Memo' },
      { key: 'author', label: 'Author', kind: 'person', hide: 'lg' }, { key: 'debit', label: 'Amount', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft', match: is('Draft') }, { id: 'posted', label: 'Posted', match: is('Posted') }],
    create: {
      fields: [
        { key: 'memo', label: 'Memo', type: 'text', required: true, placeholder: 'Accrue October rent' },
        { key: 'debit', label: 'Amount', type: 'number', required: true, placeholder: '9500' },
        { key: 'date', label: 'Posting date', type: 'date' },
      ],
      defaults: { status: 'Draft', author: 'Grace Teo' },
    },
    bulk: [{ label: 'Post', patch: { status: 'Posted' } }],
  },
  ledgerAccounts: {
    entity: 'ledgerAccounts', singular: 'ledger account', plural: 'Chart of accounts', primary: 'name',
    columns: [
      { key: 'id', label: 'Code', kind: 'id' }, { key: 'name', label: 'Account' }, { key: 'type', label: 'Type' },
      { key: 'balance', label: 'Balance', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status', hide: 'md' },
    ],
    views: [
      { id: 'all', label: 'All' },
      ...['Asset', 'Liability', 'Equity', 'Income', 'Expense'].map((t) => ({ id: t, label: t === 'Liability' ? 'Liabilities' : `${t}s`, match: (r: Row) => r.type === t })),
    ],
  },
  employees: {
    entity: 'employees', singular: 'employee', plural: 'Employees', prefix: 'E-', primary: 'name',
    columns: [
      { key: 'id', label: 'Employee', kind: 'id', hide: 'lg' }, { key: 'name', label: 'Name', kind: 'person' }, { key: 'jobTitle', label: 'Job title', hide: 'md' },
      { key: 'department', label: 'Department' }, { key: 'location', label: 'Location', hide: 'xl' }, { key: 'manager', label: 'Manager', kind: 'person', hide: '2xl' },
      { key: 'start', label: 'Start date', kind: 'date', hide: '2xl' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All employees' }, { id: 'leave', label: 'On leave', match: is('On leave') }, { id: 'probation', label: 'Probation', match: is('Probation') }],
    create: {
      fields: [
        { key: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'Jamie Ng' },
        { key: 'jobTitle', label: 'Job title', type: 'text', required: true, placeholder: 'Buyer' },
        { key: 'department', label: 'Department', type: 'select', options: ['Sales', 'Operations', 'Finance', 'HR', 'Warehouse', 'Procurement', 'IT'] },
        { key: 'start', label: 'Start date', type: 'date' },
      ],
      defaults: { status: 'Probation', location: 'Singapore', manager: 'Alex Morgan' },
    },
  },
  leave: {
    entity: 'leave', singular: 'leave request', plural: 'Leave requests', prefix: 'LR-', primary: 'employee',
    columns: [
      { key: 'id', label: 'Request', kind: 'id', hide: 'lg' }, { key: 'employee', label: 'Employee', kind: 'person' }, { key: 'type', label: 'Type', hide: 'md' },
      { key: 'from', label: 'From', kind: 'date' }, { key: 'to', label: 'To', kind: 'date', hide: 'xl' }, { key: 'days', label: 'Days', kind: 'number', hide: 'lg' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'pending', label: 'Pending', match: is('Pending') }, { id: 'approved', label: 'Approved', match: is('Approved') }, { id: 'rejected', label: 'Rejected', match: is('Rejected') }, { id: 'all', label: 'All' }],
    create: {
      fields: [
        { key: 'employee', label: 'Employee', type: 'select', options: [...PEOPLE], required: true },
        { key: 'type', label: 'Leave type', type: 'select', options: ['Annual leave', 'Sick leave', 'Unpaid leave', 'Compassionate leave'] },
        { key: 'from', label: 'From', type: 'date', required: true },
        { key: 'days', label: 'Days', type: 'number', required: true, placeholder: '2' },
      ],
      defaults: { status: 'Pending' },
    },
    bulk: [{ label: 'Approve', patch: { status: 'Approved' } }, { label: 'Reject', patch: { status: 'Rejected' } }],
  },
  payroll: {
    entity: 'payroll', singular: 'payroll run', plural: 'Payroll', primary: 'period',
    columns: [
      { key: 'id', label: 'Run', kind: 'id' }, { key: 'period', label: 'Period' }, { key: 'employees', label: 'Employees', kind: 'number', hide: 'md' },
      { key: 'payDate', label: 'Pay date', kind: 'date', hide: 'lg' }, { key: 'gross', label: 'Gross pay', kind: 'money' }, { key: 'status', label: 'Status', kind: 'status' },
    ],
  },
  users: {
    entity: 'users', singular: 'user', plural: 'Users', prefix: 'U-', primary: 'name',
    columns: [
      { key: 'name', label: 'Name', kind: 'person' }, { key: 'email', label: 'Email', hide: 'md' }, { key: 'role', label: 'Role' },
      { key: 'mfa', label: 'Two-factor', kind: 'bool', hide: 'lg' }, { key: 'lastActive', label: 'Last active', kind: 'date', hide: 'xl' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    views: [{ id: 'all', label: 'All users' }, { id: 'active', label: 'Active', match: is('Active') }, { id: 'invited', label: 'Invited', match: is('Invited') }, { id: 'suspended', label: 'Suspended', match: is('Suspended') }],
    create: {
      fields: [
        { key: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'Jamie Ng' },
        { key: 'email', label: 'Work email', type: 'email', required: true, placeholder: 'jamie@acme.example.com' },
        { key: 'role', label: 'Role', type: 'select', options: ['Administrator', 'Sales', 'Operations', 'Finance', 'HR'], required: true },
      ],
      defaults: { status: 'Invited', mfa: false, lastActive: '' },
    },
    bulk: [{ label: 'Suspend', patch: { status: 'Suspended' } }, { label: 'Reactivate', patch: { status: 'Active' } }],
  },
  audit: {
    entity: 'audit', singular: 'event', plural: 'Audit trail', primary: 'action',
    columns: [
      { key: 'at', label: 'Time', kind: 'datetime' }, { key: 'actor', label: 'User', kind: 'person' }, { key: 'action', label: 'Action' },
      { key: 'target', label: 'Record', kind: 'id' }, { key: 'module', label: 'Module', hide: 'lg' }, { key: 'ip', label: 'IP address', hide: 'xl' },
    ],
  },
} satisfies Record<string, ListSpec>

const list = (id: keyof typeof LISTS) => LISTS[id] as ListSpec

export const MODULES: ErpModule[] = [
  {
    id: 'home', name: 'Home', icon: Home01Icon, colour: 'var(--primary)', key: 'L', description: 'Your launchpad',
    roles: ['admin', 'sales', 'operations', 'finance', 'hr'],
    pages: [{ id: 'launchpad', label: 'Launchpad', icon: DashboardSquare01Icon, render: () => <Launchpad /> }],
  },
  {
    id: 'crm', name: 'CRM', icon: Target02Icon, colour: 'oklch(0.6 0.17 265)', key: 'C',
    description: 'Leads, opportunities and the people you sell to', roles: ['admin', 'sales'],
    metric: (d) => {
      const open = d.opportunities.filter((r) => !['Won', 'Lost'].includes(String(r.stage)))
      return `${open.length} open opportunities · ${short(sum(open, 'amount'))} pipeline`
    },
    pages: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, render: () => <ModuleOverview module="crm" /> },
      { id: 'leads', label: 'Leads', icon: FunnelIcon, list: list('leads'), badge: (d) => count(d.leads, 'New') },
      { id: 'opportunities', label: 'Opportunities', icon: PipelineIcon, list: list('opportunities'), render: () => <OpportunityPipeline /> },
      { id: 'accounts', label: 'Accounts', icon: Building03Icon, list: list('accounts') },
      { id: 'contacts', label: 'Contacts', icon: ContactBookIcon, list: list('contacts') },
      { id: 'activities', label: 'Activities', icon: CallIcon, list: list('activities'), badge: (d) => count(d.activities, 'Overdue') },
    ],
  },
  {
    id: 'sales', name: 'Sales', icon: ShoppingCart01Icon, colour: 'oklch(0.64 0.15 155)', key: 'S',
    description: 'Quotations, sales orders and deliveries', roles: ['admin', 'sales', 'finance'],
    metric: (d) => `${count(d.salesOrders, 'Confirmed', 'Processing')} open orders · ${count(d.quotations, 'Sent')} quotations out`,
    pages: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, render: () => <ModuleOverview module="sales" /> },
      { id: 'quotations', label: 'Quotations', icon: QuoteDownIcon, list: list('quotations') },
      { id: 'orders', label: 'Sales orders', icon: Agreement01Icon, list: list('salesOrders'), badge: (d) => count(d.salesOrders, 'Confirmed') },
      { id: 'deliveries', label: 'Deliveries', icon: DeliveryTruck01Icon, list: list('deliveries'), badge: (d) => count(d.deliveries, 'Ready to pick') },
      { id: 'price-lists', label: 'Price lists', icon: Tag01Icon, list: list('priceLists') },
    ],
  },
  {
    id: 'inventory', name: 'Inventory', icon: PackageIcon, colour: 'oklch(0.7 0.14 65)', key: 'I',
    description: 'Items, stock on hand and warehouses', roles: ['admin', 'operations', 'sales'],
    metric: (d) => `${d.items.length} items · ${count(d.items, 'Low stock', 'Out of stock')} below reorder point`,
    pages: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, render: () => <ModuleOverview module="inventory" /> },
      { id: 'items', label: 'Items', icon: PackageIcon, list: list('items'), badge: (d) => count(d.items, 'Out of stock') },
      { id: 'stock', label: 'Stock on hand', icon: Store01Icon, list: list('stock') },
      { id: 'transfers', label: 'Stock transfers', icon: Exchange01Icon, list: list('transfers'), badge: (d) => count(d.transfers, 'In transit') },
      { id: 'adjustments', label: 'Stock adjustments', icon: SlidersHorizontalIcon, list: list('adjustments') },
      { id: 'warehouses', label: 'Warehouses', icon: WarehouseIcon, list: list('warehouses') },
    ],
  },
  {
    id: 'purchasing', name: 'Purchasing', icon: PackageReceiveIcon, colour: 'oklch(0.64 0.16 35)', key: 'P',
    description: 'Requisitions, purchase orders and vendors', roles: ['admin', 'operations', 'finance'],
    metric: (d) => `${count(d.purchaseOrders, 'Awaiting approval') + count(d.requisitions, 'Awaiting approval')} awaiting approval · ${count(d.purchaseOrders, 'Approved', 'Partially received')} open orders`,
    pages: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, render: () => <ModuleOverview module="purchasing" /> },
      { id: 'requisitions', label: 'Purchase requisitions', icon: Note01Icon, list: list('requisitions'), badge: (d) => count(d.requisitions, 'Awaiting approval') },
      { id: 'orders', label: 'Purchase orders', icon: ReceiptTextIcon, list: list('purchaseOrders'), badge: (d) => count(d.purchaseOrders, 'Awaiting approval') },
      { id: 'receipts', label: 'Goods receipts', icon: PackageReceiveIcon, list: list('goodsReceipts') },
      { id: 'vendors', label: 'Vendors', icon: Briefcase01Icon, list: list('vendors') },
    ],
  },
  {
    id: 'accounting', name: 'Accounting', icon: Calculator01Icon, colour: 'oklch(0.62 0.12 200)', key: 'A',
    description: 'Receivables, payables, the ledger and reports', roles: ['admin', 'finance'],
    metric: (d) => `${short(sum(d.invoices.filter(is('Sent', 'Partially paid', 'Overdue')), 'balance'))} receivable · ${count(d.invoices, 'Overdue')} overdue`,
    pages: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, render: () => <ModuleOverview module="accounting" /> },
      { id: 'invoices', label: 'Customer invoices', icon: Invoice01Icon, group: 'Receivables', list: list('invoices'), badge: (d) => count(d.invoices, 'Overdue') },
      { id: 'payments', label: 'Payments', icon: Payment01Icon, group: 'Receivables', list: list('payments'), badge: (d) => count(d.payments, 'Pending') },
      { id: 'bills', label: 'Vendor bills', icon: Invoice03Icon, group: 'Payables', list: list('bills'), badge: (d) => count(d.bills, 'Overdue') },
      { id: 'journals', label: 'Journal entries', icon: BankIcon, group: 'Ledger', list: list('journals') },
      { id: 'ledger', label: 'Chart of accounts', icon: Coins01Icon, group: 'Ledger', list: list('ledgerAccounts') },
      { id: 'reports', label: 'Financial reports', icon: ChartLineData01Icon, group: 'Reports', render: () => <FinancialReports /> },
    ],
  },
  {
    id: 'hr', name: 'Human resources', icon: UserGroupIcon, colour: 'oklch(0.64 0.16 340)', key: 'H',
    description: 'Employees, leave and payroll', roles: ['admin', 'hr'],
    metric: (d) => `${d.employees.length} employees · ${count(d.leave, 'Pending')} leave requests pending`,
    pages: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, render: () => <ModuleOverview module="hr" /> },
      { id: 'employees', label: 'Employees', icon: UserMultipleIcon, list: list('employees') },
      { id: 'leave', label: 'Leave requests', icon: Calendar03Icon, list: list('leave'), badge: (d) => count(d.leave, 'Pending') },
      { id: 'payroll', label: 'Payroll', icon: Wallet01Icon, list: list('payroll') },
    ],
  },
  {
    id: 'admin', name: 'Administration', icon: Shield01Icon, colour: 'oklch(0.55 0.02 260)', key: 'X',
    description: 'Users, roles, company settings and the audit trail', roles: ['admin'],
    metric: (d) => `${count(d.users, 'Active')} active users · ${count(d.users, 'Invited')} invited`,
    pages: [
      { id: 'users', label: 'Users', icon: UserMultipleIcon, list: list('users'), badge: (d) => count(d.users, 'Invited') },
      { id: 'roles', label: 'Roles and permissions', icon: UserLock01Icon, render: () => <RolesPermissions /> },
      { id: 'company', label: 'Company settings', icon: Settings01Icon, render: () => <CompanySettings /> },
      { id: 'integrations', label: 'Integrations', icon: Plug01Icon, render: () => <Integrations /> },
      { id: 'audit', label: 'Audit trail', icon: Audit01Icon, list: list('audit') },
    ],
  },
]

export const moduleById = (id: string) => MODULES.find((m) => m.id === id)

// The list that shows records of an entity, for the side panel and the
// create dialog, wherever they are opened from.
export const specFor = (entity: string): ListSpec | undefined => Object.values(LISTS).find((l) => l.entity === entity) as ListSpec | undefined

// Where a record of an entity lives, for links from the palette and the launchpad.
export function pageFor(entity: string) {
  for (const m of MODULES) for (const p of m.pages) if (p.list?.entity === entity) return { module: m, page: p }
  return null
}

export type { Data }
