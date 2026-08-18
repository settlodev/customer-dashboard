export interface Vendor {
  id: string;
  slug: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  registrationNumber?: string | null;
  defaultCurrencyCode?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  active: boolean;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}
