# Glossary

The words this kit uses, and what they mean. Each is the industry term:
what design systems (shadcn/ui, Material, Fiori) and ERPs (SAP, Oracle
NetSuite, Microsoft Dynamics, Odoo) call it. Use these words in the UI, in
file names and when talking about the work. Add a term here before using a
new one.

## The kit's five levels
| Term | Meaning | In this kit |
|---|---|---|
| Design tokens | Named values for colour, radius, type and spacing that everything else reads | `styles.css`, the Theme page |
| Components | Single building blocks with props and variants | Button, Input, Badge, Menu… |
| Blocks | A section or screen built from components that does one task | Board, Data table, Issue detail |
| Layouts | The frame pages sit in: navigation, header, content area. Also called the app shell | App shells |
| Templates | A whole app: a layout, blocks and data, ready to run | ERP app, AI chat app |
| Kitchen sink | One page that shows every component, to check they look right together | All components |
| Registry | shadcn's list of installable blocks, served as JSON | Planned |

## Interface patterns
| Term | Meaning |
|---|---|
| Navigation rail | A narrow column of icons for the top-level areas (modules) |
| Sidebar | The wider column listing the pages inside the current area |
| Inset | The content sits in a card that floats inside the sidebar's background |
| Breadcrumb | The path to the current page, such as Accounting › Customer invoices |
| Command palette | The Ctrl+K / ⌘K box for jumping anywhere, searching and running actions |
| Launchpad | The home screen of tiles, one per module (SAP Fiori's term) |
| App switcher (module switcher) | The control that moves between modules or apps. In the ERP template it sits at the top of the sidebar |
| KPI (key performance indicator) | A headline number on a dashboard, such as open pipeline or overdue receivables |
| Side panel (peek) | A record opened beside the list, without leaving it |
| Saved views | Named filters on a list, shown as tabs or pills |
| Bulk actions | Actions applied to every selected row |
| Empty state | What a page shows when it has nothing to list |
| Toast | A short message that appears and fades, such as "Invoice sent" |
| Sheet / drawer | A panel that slides in from an edge |
| Skeleton | Grey shapes shown while content loads |

## ERP modules
| Module | Covers |
|---|---|
| CRM (customer relationship management) | Leads, opportunities, accounts, contacts, activities |
| Sales | Quotations, sales orders, deliveries, price lists |
| Inventory | Items, stock on hand, stock transfers, stock adjustments, warehouses |
| Purchasing (procurement) | Purchase requisitions, purchase orders, goods receipts, vendors |
| Accounting (finance) | Customer invoices, vendor bills, payments, journal entries, chart of accounts, financial reports |
| Human resources (HR) | Employees, leave requests, payroll |
| Administration | Users, roles and permissions, company settings, audit trail, integrations |

## ERP records and documents
| Term | Meaning | Number |
|---|---|---|
| Lead | A possible customer not yet qualified | L-1001 |
| Opportunity | A qualified lead with a value and a stage in the pipeline | OPP-2001 |
| Pipeline | Opportunities grouped by stage, from first contact to won or lost | |
| Weighted pipeline | Each open opportunity's amount times its probability, added up | |
| Win rate | Opportunities won as a share of those closed (won plus lost) | |
| Conversion rate | Quotations accepted as a share of those sent | |
| Account | A company you sell to (CRM). Once it buys, it is also a customer | ACC-101 |
| Contact | A person at an account | |
| Activity | A call, email, meeting or task logged against a record | |
| Quotation | A priced offer sent to a customer | QT-3001 |
| Sales order | A confirmed order from a customer | SO-5001 |
| Delivery | The goods leaving the warehouse for a sales order (delivery order) | DO-7001 |
| Price list | The prices a group of customers pays | |
| Item | Something you buy, stock or sell (a product or service), identified by its SKU | SKU-1001 |
| Stock on hand | How many of an item each warehouse holds | |
| Available | Stock on hand less what is reserved for open sales orders | |
| Reorder point | The level at which an item should be bought again | |
| Stock value | Stock on hand times unit cost | |
| Stock transfer | Stock moved between warehouses | ST-401 |
| Stock adjustment | A correction to stock on hand after a count, damage or loss | ADJ-501 |
| Purchase requisition | An internal request to buy, before a purchase order | PR-601 |
| Purchase order | A confirmed order to a vendor | PO-8001 |
| Goods receipt | Recording goods delivered against a purchase order (GRN) | GRN-901 |
| Vendor | A company you buy from (also called a supplier) | V-101 |
| Customer invoice | A bill you send a customer. Part of accounts receivable | INV-2026-0001 |
| Vendor bill | A bill a vendor sends you. Part of accounts payable | BILL-1001 |
| Accounts receivable (AR) | Money customers owe you | |
| Accounts payable (AP) | Money you owe vendors | |
| Receivables ageing | Unpaid customer invoices grouped by how long they are overdue: current, 1–30, 31–60 and 60+ days | |
| Payment | Money received from a customer or paid to a vendor | PAY-1001 |
| Journal entry | A posting of debits and credits to the general ledger | JE-1001 |
| General ledger (GL) | The record of every posting, account by account | |
| Chart of accounts | The list of ledger accounts, grouped into assets, liabilities, equity, income and expenses | 1000–5999 |
| Profit and loss (P&L) | Income less expenses over a period | |
| Balance sheet | Assets, liabilities and equity on a date | |
| Current year earnings | Net income so far this year, shown in equity until the year is closed into retained earnings | |
| Opening balance equity | A balancing equity line used when opening balances don't yet agree | |
| Cash flow | Cash coming in and going out over a period, and the change in cash | |
| Leave request | An employee asking for time off | LR-101 |
| Payroll run | Paying all employees for one period | PAY-RUN-2026-09 |
| Role | A set of permissions given to users, such as Finance or Sales | |
| Audit trail | Who changed what, and when | |
| Multi-company | One system holding several legal companies (entities), each with its own books | |
