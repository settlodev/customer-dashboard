import {
  boolean,
  number,
  object,
  string,
  enum as zenum,
  preprocess,
} from "zod";

const optionalNumber = preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  number().nonnegative().optional(),
);

/**
 * Schema for {@code POST /deposit-rules} and PUT. Mirrors the OMS
 * {@code DepositRuleRequest}.
 *
 * <p>Validation rules:
 *
 * <ul>
 *   <li>SLOT scope requires {@code reservationSlotId}</li>
 *   <li>TABLE scope requires {@code tableSpaceId}</li>
 *   <li>TABLE_SLOT requires both</li>
 *   <li>GLOBAL ignores both</li>
 *   <li>{@code depositAmount} is required when {@code requireDeposit} is true</li>
 * </ul>
 */
export const DepositRuleSchema = object({
  scope: zenum(["GLOBAL", "SLOT", "TABLE", "TABLE_SLOT"], {
    required_error: "Scope is required",
  }),
  requireDeposit: boolean().default(false),
  depositAmount: optionalNumber,
  depositPerGuest: boolean().default(false),
  depositRequiredMinPartySize: optionalNumber,
  reservationSlotId: string().uuid().optional(),
  tableSpaceId: string().uuid().optional(),
})
  .refine(
    (data) => {
      if (data.requireDeposit && !data.depositAmount) return false;
      return true;
    },
    {
      message: "Deposit amount is required when 'Require deposit' is on",
      path: ["depositAmount"],
    },
  )
  .refine(
    (data) => {
      if (
        (data.scope === "SLOT" || data.scope === "TABLE_SLOT") &&
        !data.reservationSlotId
      )
        return false;
      return true;
    },
    {
      message: "Reservation slot is required for this scope",
      path: ["reservationSlotId"],
    },
  )
  .refine(
    (data) => {
      if (
        (data.scope === "TABLE" || data.scope === "TABLE_SLOT") &&
        !data.tableSpaceId
      )
        return false;
      return true;
    },
    {
      message: "Table is required for this scope",
      path: ["tableSpaceId"],
    },
  );
