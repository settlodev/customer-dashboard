import { boolean, number, object, string, enum as zenum, preprocess } from "zod";

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

export const DepositRuleSchema = object({
  scope: zenum(["GLOBAL", "SLOT", "TABLE", "TABLE_SLOT"], {
    required_error: "Scope is required",
  }),
  reservationSlotId: string().uuid("Please select a valid slot").optional(),
  tableAndSpaceId: string().uuid("Please select a valid table").optional(),
  requireDeposit: boolean({ required_error: "This field is required" }),
  depositAmount: optionalNumber,
  depositPerGuest: boolean().optional().default(false),
  depositRequiredMinPartySize: optionalNumber,
})
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
        !data.tableAndSpaceId
      )
        return false;
      return true;
    },
    {
      message: "Table is required for this scope",
      path: ["tableAndSpaceId"],
    },
  )
  .refine(
    (data) => {
      if (data.requireDeposit && !data.depositAmount) return false;
      return true;
    },
    {
      message: "Deposit amount is required when deposit is enabled",
      path: ["depositAmount"],
    },
  );
