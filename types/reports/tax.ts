export interface TaxReportCurrencyTotal {
  currency: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxReportCodeSummary {
  taxCode: string;
  taxName: string | null;
  currency: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxReportRow {
  period: string; // yyyy-MM-dd
  productId: string | null;
  productName: string | null;
  taxCode: string | null;
  taxName: string | null;
  currency: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxReport {
  locationId: string;
  startDate: string;
  endDate: string;
  period: "day" | "month";
  breakdown: "product" | "taxCode" | null;
  /** Null when the range spans more than one currency — read totalsByCurrency. */
  totalTaxableAmount: number | null;
  totalTaxAmount: number | null;
  totalsByCurrency: TaxReportCurrencyTotal[];
  byTaxCode: TaxReportCodeSummary[];
  rows: TaxReportRow[];
}

export type TaxReportPeriod = "day" | "month";
export type TaxReportBreakdown = "taxCode" | "product";
