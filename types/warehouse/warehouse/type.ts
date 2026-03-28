export interface Warehouses {
  id: string;
  accountId: string;
  businessId: string;
  businessName: string;
  identifier: string;
  name: string;
  description: string;
  code: string;
  primary: boolean;
  capacity: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
