import { UUID } from "crypto";

export type DepositRuleScope = "GLOBAL" | "SLOT" | "TABLE" | "TABLE_SLOT";

export declare interface DepositRule {
  id: UUID;
  scope: DepositRuleScope;
  reservationSlotId: UUID | null;
  reservationSlotDayOfWeek: string | null;
  reservationSlotStartTime: string | null;
  reservationSlotEndTime: string | null;
  tableAndSpaceId: UUID | null;
  tableAndSpaceName: string | null;
  requireDeposit: boolean;
  depositAmount: number | null;
  depositPerGuest: boolean;
  depositRequiredMinPartySize: number | null;
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export const DEPOSIT_RULE_SCOPE_LABELS: Record<DepositRuleScope, string> = {
  GLOBAL: "Global",
  SLOT: "Slot",
  TABLE: "Table",
  TABLE_SLOT: "Table + Slot",
};
