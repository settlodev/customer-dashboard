import type { BusinessDocumentData } from "../types";

/**
 * Receipt — issued after payment is received. Note:
 * - meta.type drives label changes ("Received from", "Receipt Number", etc.)
 * - status badge marks it PAID
 * - payments array equals total, so amountDue is 0
 */
export const exampleReceipt: BusinessDocumentData = {
  meta: {
    type: "receipt",
    documentNumber: "RCP-2026-00148",
    issueDate: "2026-02-13",
    referenceNumber: "INV-2610234",
    status: { label: "Paid", tone: "success" },
  },
  issuer: {
    name: "Qroo Solutions",
    legalName: "Qroo Company Limited",
    tin: "142-307-316",
    addressLines: [
      "Plot 151, Block 45C, Makumbusho",
      "P.O.Box 6702",
      "Kinondoni, Dar es Salaam",
      "Tanzania",
    ],
    phone: "+255 764 453 888",
    website: "www.qroo.co.tz",
  },
  recipient: {
    name: "EHS Company Limited",
    contactPerson: "Edgar Mwasha",
    addressLines: ["Josam House, Mikocheni Light Industrial Area", "Dar es Salaam"],
    email: "info@ehstz.com",
  },
  items: [
    {
      name: "Payment received against invoice 2610234",
      description: "Annual email and web hosting renewal",
      quantity: 1,
      unitPrice: 531.3,
    },
  ],
  totals: {
    subtotal: 531.3,
    total: 531.3,
    payments: [{ date: "2026-02-13", method: "bank transfer", amount: 531.3 }],
    amountDue: 0,
  },
  currency: "USD",
  footerMessage: "Thank you for your payment",
};
