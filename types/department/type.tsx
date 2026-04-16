// ---------------------------------------------------------------------------
// Department (matches DepartmentResponse from Accounts Service)
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  accountId: string;
  identifier: string;
  name: string;
  description: string | null;
  color: string | null;
  image: string | null;
  active: boolean;
  order: number | null;
  defaultPosView: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Department count
// ---------------------------------------------------------------------------

export interface DepartmentCount {
  total: number;
  active: number;
  inactive: number;
}

// ---------------------------------------------------------------------------
// Department report (from Reports Service)
// ---------------------------------------------------------------------------

export interface DepartmentReport {
  soldItems: Array<{
    name: string;
    productName: string;
    variantName: string;
    categoryName: string;
    imageUrl: string | null;
    quantity: number;
    price: number;
    cost: number;
    grossProfit: number;
    latestSoldDate: string;
    earliestSoldDate: string;
  }>;
  startDate: string;
  endDate: string;
  name: string;
  image: string | null;
  totalItemsSold: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalGrossProfit: number;
}
