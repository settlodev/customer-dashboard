export type AccountingPeriodStatus = "OPEN" | "CLOSED";

export interface AccountingPeriod {
  id: string;
  businessId: string;
  locationId: string;
  year: number;
  month: number;
  status: AccountingPeriodStatus;
  closedAt?: string | null;
  closedBy?: string | null;
  closingNotes?: string | null;
  reopenedAt?: string | null;
  reopenedBy?: string | null;
  reopeningReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
