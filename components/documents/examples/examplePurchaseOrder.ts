import type { BusinessDocumentData } from "../types";

/**
 * Purchase Order — issued by the buyer to a supplier.
 * - recipient = vendor (label auto-changes to "Vendor")
 * - signatures block for authorisation
 * - no bankDetails (you're not requesting payment to your account here)
 */
export const examplePurchaseOrder: BusinessDocumentData = {
  meta: {
    type: "purchase_order",
    documentNumber: "PO-2026-00042",
    issueDate: "2026-04-20",
    dueDate: "2026-05-05",
    referenceNumber: "REQ-2026-00031",
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
    name: "TechSupplies Tanzania Ltd",
    contactPerson: "Sales Department",
    addressLines: ["Plot 24, Nyerere Road", "Dar es Salaam"],
    phone: "+255 712 000 000",
    email: "sales@techsupplies.co.tz",
  },
  items: [
    {
      name: "Dell Latitude 5450 laptop",
      description: "i7-1355U, 16GB RAM, 512GB SSD, 3-year warranty",
      quantity: 5,
      unitPrice: 1450.0,
      unitOfMeasure: "units",
    },
    {
      name: "Logitech MX Master 3S",
      description: "Wireless mouse",
      quantity: 5,
      unitPrice: 99.0,
      unitOfMeasure: "units",
    },
    {
      name: "On-site delivery",
      quantity: 1,
      unitPrice: 50.0,
    },
  ],
  totals: {
    subtotal: 7795.0,
    taxes: [{ label: "VAT", rate: 18, amount: 1403.1 }],
    total: 9198.1,
    amountDue: 9198.1,
  },
  currency: "USD",
  notes:
    "Delivery to: Qroo Solutions HQ, Makumbusho.\n" +
    "Please confirm receipt of this PO and acknowledge expected delivery date by email.",
  signatures: [
    { label: "Authorised by", name: "Walter Peter Karanja", date: "2026-04-20" },
    { label: "Vendor acknowledgement", name: "", date: "" },
  ],
  footerMessage: "This purchase order is subject to our standard terms and conditions",
};
