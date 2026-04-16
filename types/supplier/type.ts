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
  isSettloSupplier?: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  verificationStatus: string;
  financingEligible: boolean;
  marketplaceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
