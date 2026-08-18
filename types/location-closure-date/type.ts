// Matches Accounts Service LocationClosureDateResponse.

export interface LocationClosureDate {
  id: string;
  accountId: string;
  locationId: string;
  closureDate: string; // ISO date (YYYY-MM-DD)
  reason: string | null;
  allDay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClosureDatePayload {
  closureDate: string;
  reason?: string;
  allDay?: boolean;
}

export type UpdateClosureDatePayload = CreateClosureDatePayload;
