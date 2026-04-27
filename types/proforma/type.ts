import { UUID } from "node:crypto";

export interface Proforma {
  id: string;
  proformaNumber: string;
  proformaStatus: "DRAFT" | "COMPLETED" | "CANCELLED" | string;
  notes: string | null;
  taxExclusiveGrossAmount: number;
  showTaxAmounts: boolean;
  taxAmount: number;
  grossAmount: number;
  manualDiscountAmount: number;
  appliedDiscountAmount: number;
  totalDiscountAmount: number;
  appliedDiscountId: string | null;
  netAmount: number;
  expiresAt: string;
  dateCreated: string;
  customer: UUID;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhoneNumber: string;
  customerCity: string;
  customerAddress: string;
  customerTin: string;
  businessName: string | null;
  locationName: string | null;
  locationLogo: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationEmail: string | null;
  locationPhoneNumber: string | null;
  tinNumber?: string | null;
  items: ProformaItem[];
}

export interface ProformaItem {
  id: UUID;
  unitPrice: number;
  quantity: number;
  productName: string;
  productVariantName: string;
  unitTaxExclusivePrice: number;
}
