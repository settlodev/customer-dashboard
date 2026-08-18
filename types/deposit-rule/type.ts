import { UUID } from "node:crypto";
import { DepositRuleScope } from "@/types/enums";

/**
 * Mirrors the OMS {@code DepositRuleResponse}. Deposit policy is
 * priority-resolved at reservation-create time — TABLE_SLOT > TABLE > SLOT
 * > GLOBAL. The first matching rule for a given (location, slot, table)
 * tuple wins.
 *
 * <p>{@code reservationSlotId} and {@code tableSpaceId} narrow the scope:
 *
 * <ul>
 *   <li>GLOBAL: applies to every reservation at this location</li>
 *   <li>SLOT: applies when the reservation falls in the named slot</li>
 *   <li>TABLE: applies when the reservation is allocated to the named table</li>
 *   <li>TABLE_SLOT: applies when both slot AND table match (highest priority)</li>
 * </ul>
 */
export declare interface DepositRule {
  id: UUID;
  scope: DepositRuleScope;
  requireDeposit: boolean;
  depositAmount: number | null;
  /** Multiply {@code depositAmount} by party size when true. */
  depositPerGuest: boolean;
  /** Only require deposit for parties at or above this size. */
  depositRequiredMinPartySize: number | null;
  reservationSlotId: UUID | null;
  tableSpaceId: UUID | null;
}

export const DEPOSIT_RULE_SCOPE_LABELS: Record<DepositRuleScope, string> = {
  [DepositRuleScope.GLOBAL]: "All reservations",
  [DepositRuleScope.SLOT]: "Specific time slot",
  [DepositRuleScope.TABLE]: "Specific table",
  [DepositRuleScope.TABLE_SLOT]: "Specific table + time slot",
};

export const DEPOSIT_RULE_SCOPE_PRIORITY_LABELS: Record<DepositRuleScope, string> = {
  [DepositRuleScope.TABLE_SLOT]: "Highest priority",
  [DepositRuleScope.TABLE]: "High priority",
  [DepositRuleScope.SLOT]: "Medium priority",
  [DepositRuleScope.GLOBAL]: "Default (lowest priority)",
};
