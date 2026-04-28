import type { BusinessDocumentData } from "../types";

/**
 * Purchase Requisition — internal request raised by a department, approved
 * before becoming a Purchase Order.
 * - status reflects approval workflow stage
 * - recipient = the requesting cost centre / department
 * - multiple signatures for the approval chain
 */
export const examplePurchaseRequisition: BusinessDocumentData = {
  meta: {
    type: "purchase_requisition",
    documentNumber: "REQ-2026-00031",
    issueDate: "2026-04-18",
    status: { label: "Pending Approval", tone: "warning" },
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
    name: "Engineering Department",
    contactPerson: "Requested by: Jane Mushi",
    addressLines: ["Cost Centre: ENG-001"],
    email: "jane.mushi@qroo.co.tz",
  },
  items: [
    {
      name: "Dell Latitude 5450 laptop",
      description: "Replacement units for backend team",
      quantity: 5,
      unitPrice: 1450.0,
      unitOfMeasure: "units",
    },
    {
      name: "Logitech MX Master 3S",
      quantity: 5,
      unitPrice: 99.0,
      unitOfMeasure: "units",
    },
  ],
  totals: {
    subtotal: 7745.0,
    taxes: [{ label: "VAT", rate: 18, amount: 1394.1 }],
    total: 9139.1,
    amountDue: 9139.1,
  },
  currency: "USD",
  notes:
    "Justification: Existing laptops are 4+ years old and showing thermal\n" +
    "issues affecting build times. Approved supplier: TechSupplies Tanzania Ltd.\n" +
    "Budget line: Capex / IT Equipment 2026.",
  signatures: [
    { label: "Requested by", name: "Jane Mushi", date: "2026-04-18" },
    { label: "Department head", name: "", date: "" },
    { label: "Finance approval", name: "", date: "" },
  ],
  footerMessage: "",
};
