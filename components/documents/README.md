# Business Document Template

A single, reusable document template for the Settlo Customer Dashboard. One component renders **invoices, receipts, purchase orders, purchase requisitions, quotes, delivery notes, credit notes, and statements** — driven by data, not duplicated layouts.

## Why one template

Every business document in the platform shares the same anatomy: issuer block, recipient block, meta (numbers/dates), line items, totals, notes/footer. The differences (label text, status badges, signatures, payment lines) are data-level, not layout-level. So we keep one template and let `meta.type` plus optional fields drive the variations.

## Folder structure

```
components/documents/
├── BusinessDocument.tsx        # The composed template
├── PrintableDocument.tsx       # Wraps it with print toolbar + A4 print CSS
├── index.ts                    # Public exports
├── types/index.ts              # All TypeScript types
├── utils/format.ts             # Currency, date, label helpers
├── sections/
│   ├── DocumentHeader.tsx      # Logo + title + issuer details
│   ├── DocumentMetaBlock.tsx   # Bill-to + numbers + dates
│   ├── LineItemsTable.tsx      # The blue-header items table
│   ├── TotalsSummary.tsx       # Subtotal, tax, payments, amount due
│   └── NotesFooter.tsx         # Notes, bank details, signatures
└── examples/
    ├── exampleInvoice.ts
    ├── exampleReceipt.ts
    ├── examplePurchaseOrder.ts
    └── examplePurchaseRequisition.ts
```

## Quick start

### 1. View the preview

Visit `/documents/preview` in your dev server. The page lets you toggle between all four document types.

### 2. Render a document

```tsx
import { PrintableDocument } from "@/components/documents";
import type { BusinessDocumentData } from "@/components/documents";

const data: BusinessDocumentData = {
  meta: {
    type: "invoice",
    documentNumber: "INV-2026-001",
    issueDate: "2026-04-27",
    dueDate: "2026-05-27",
  },
  issuer: { /* tenant business identity */ },
  recipient: { /* customer */ },
  items: [ /* line items */ ],
  totals: { subtotal: 100, total: 100, amountDue: 100 },
  currency: "USD",
};

export default function Page() {
  return <PrintableDocument data={data} />;
}
```

The toolbar provides a "Print / Save as PDF" button. Print styles are A4-sized and hide the toolbar.

### 3. Just the document (no toolbar)

```tsx
import { BusinessDocument } from "@/components/documents";

<BusinessDocument data={data} />
```

Use this when embedding the doc inside a larger page, in an email preview, or in a modal.

## How each document type maps

| Document Type | `meta.type` | Recipient label | Notable fields |
|---|---|---|---|
| Invoice | `invoice` | Bill to | `bankDetails`, `dueDate` |
| Receipt | `receipt` | Received from | `totals.payments`, `status: "Paid"` |
| Quote | `quote` | Quote for | `dueDate` (validity), no payments |
| Purchase Order | `purchase_order` | Vendor | `signatures`, `referenceNumber` (linked req) |
| Purchase Requisition | `purchase_requisition` | Requested for | `signatures` (approval chain), `status` |
| Delivery Note | `delivery_note` | Deliver to | usually no totals/pricing — set them to 0 or omit table |
| Credit Note | `credit_note` | Credit to | negative amounts in items |
| Statement | `statement` | Statement for | items = list of past invoices |

All variations share **the same component**. Only the data shape changes.

## SaaS multi-tenancy

The `issuer` field is the account owner's business. In your data layer, fetch it once per request from the authenticated tenant:

```tsx
// app/[tenant]/invoices/[id]/page.tsx
import { getCurrentBusiness } from "@/lib/auth";
import { getInvoice } from "@/lib/invoices";

export default async function InvoicePage({ params }) {
  const issuer = await getCurrentBusiness();
  const invoice = await getInvoice(params.id);

  const data = {
    meta: {
      type: "invoice",
      documentNumber: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
    },
    issuer,                  // <-- from tenant
    recipient: invoice.customer,
    items: invoice.lineItems,
    totals: invoice.totals,
    currency: invoice.currency,
    bankDetails: issuer.bankDetails,
  };

  return <PrintableDocument data={data} />;
}
```

## Customising per-tenant branding

The table header colour (the blue strip) is the most visible brand element. Override it via `tableHeaderClassName`:

```tsx
<PrintableDocument
  data={data}
  tableHeaderClassName="bg-emerald-700"   // or any Tailwind bg-* utility
/>
```

For deeper branding (logo, full colour palette), tenants supply `issuer.logoUrl`. Add a tenant-level `themeColor` field to your business model and pipe it through if you need brand-coloured tables, badges, or accents.

## PDF generation

The current implementation uses **browser print to PDF**, which is:
- Free, no extra dependencies
- Faithful to what the user sees
- Slightly different per-browser (Chrome, Safari, Firefox)

If you need server-side PDF generation later (for emailing PDFs from the backend, locking the rendering across browsers, or generating in batch), the same component can be rendered with libraries like:
- `@react-pdf/renderer` (rewrite sections in `@react-pdf` primitives)
- `puppeteer` / `playwright` (render this exact component to PDF)
- Spring Boot side: pass the data shape to your reports service and reuse there

Recommended path: keep this component as the source of truth for the visual design, and when you need server-side PDFs, spin up a headless Chromium that renders `/documents/preview?data=<token>` and prints the result.

## Adding a new document type

1. Add the literal to `DocumentType` in `types/index.ts`.
2. Add entries in `getDocumentTitle`, `getRecipientLabel`, `getDocumentNumberLabel`, `getIssueDateLabel` in `utils/format.ts`.
3. (Optional) Create an example file in `examples/`.

That's it — no new components or layouts needed.

## Status badges

Show document status in the meta block using `meta.status`:

```ts
status: { label: "Overdue", tone: "danger" }     // red
status: { label: "Paid", tone: "success" }       // green
status: { label: "Pending Approval", tone: "warning" }  // amber
status: { label: "Draft", tone: "neutral" }      // gray
status: { label: "Sent", tone: "info" }          // blue
```

## Print styling notes

- Page is sized to A4 (`210mm × 297mm`).
- `@page { margin: 0 }` because we control padding inside the document.
- `print:hidden` hides toolbar elements during printing.
- `print-color-adjust: exact` keeps the blue header visible (Chrome strips backgrounds otherwise).
- Line item rows have `page-break-inside: avoid` so single rows don't split across pages.
