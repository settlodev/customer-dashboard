/**
 * Business-scoped supplier. Optionally linked to a marketplace-verified
 * SettloSupplier, which pre-populates registration/contact details but leaves
 * local contact-person fields editable.
 */
export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPersonName: string;
  contactPersonPhone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  registrationNumber: string | null;
  tinNumber: string | null;
  settloSupplierId: string | null;
  settloSupplierName: string | null;
  linkedToSettloSupplier: boolean;
  archivedAt: string | null;
  /** Tag set by the list page when a row comes from the marketplace catalog. */
  isSettloSupplier?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Platform-verified marketplace supplier. Global, not scoped by business.
 * Used by the link flow to pre-fill a business-level Supplier.
 */
export interface SettloSupplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  registrationNumber: string | null;
  tinNumber: string | null;
  verificationStatus: SettloSupplierVerificationStatus;
  financingEligible: boolean;
  marketplaceEnabled: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SettloSupplierVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export const SETTLO_SUPPLIER_STATUS_LABELS: Record<
  SettloSupplierVerificationStatus,
  string
> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};
