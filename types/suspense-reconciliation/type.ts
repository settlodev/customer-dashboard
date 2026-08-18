export interface SuspenseLine {
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  description?: string | null;
  reference?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  amount: number;
}

export interface SuspenseReconciliation {
  locationId: string;
  startDate: string;
  endDate: string;
  totalSuspenseAmount: number;
  lines: SuspenseLine[];
}
