import type { BusinessDocumentData } from "../types";

/**
 * Reproduces the reference screenshot — useful as a smoke test.
 */
export const exampleInvoice: BusinessDocumentData = {
  meta: {
    type: "invoice",
    documentNumber: "2610234",
    issueDate: "2026-01-13",
    dueDate: "2026-02-12",
  },
  issuer: {
    name: "Qroo Solutions",
    legalName: "Qroo Company Limited",
    tin: "142-307-316",
    addressLines: [
      "Plot 151, Block 45C, Makumbusho",
      "P.O.Box 6702",
      "Kinondoni, Dar es Salaam",
      "Tanzania, United Republic of",
    ],
    phone: "+255 764 453 888",
    website: "www.qroo.co.tz",
  },
  recipient: {
    name: "EHS Company Limited",
    contactPerson: "Edgar Mwasha",
    addressLines: [
      "Josam House, Plot no. 16, Block B,",
      "Mikocheni Light Industrial Area, Coca Cola Road",
      "Dar es Salaam, Tanzania, United Republic of",
    ],
    phone: "+255 787 696 932",
    email: "info@ehstz.com",
  },
  items: [
    {
      name: "Annual email and web hosting renewal",
      description: "Domain renewal for ehstz.com & ehs.co.tz",
      quantity: 1,
      unitPrice: 108.0,
    },
    {
      name: "Annual email and web hosting renewal",
      description:
        "Email and google workspace hosting renewal for ehstz.com & ehs.co.tz ( 9 email addresses )",
      quantity: 1,
      unitPrice: 1248.92,
    },
    {
      name: "10% Admin fee",
      quantity: 1,
      unitPrice: 135.7,
    },
  ],
  totals: {
    subtotal: 1492.62,
    taxes: [{ label: "VAT", rate: 0, amount: 0 }],
    total: 1492.62,
    payments: [
      {
        date: "2026-02-13",
        method: "a bank payment",
        amount: 531.3,
      },
    ],
    amountDue: 961.32,
  },
  currency: "USD",
  bankDetails: {
    accountName: "Walter Peter Karanja",
    bankName: "Absa Bank Tanzania",
    branch: "Mikocheni Branch",
    accountNumber: "014-2026422",
  },
};
