import {
  boolean,
  number,
  object,
  string,
  enum as zenum,
  array,
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

const requiredNumber = (message: string) =>
  preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") return Number(val);
      return val;
    },
    number({ message }).positive(message),
  );

/**
 * Schema for {@code POST /reservations} (authenticated create) and
 * {@code POST /reservations/walk-in} (authenticated walk-in). Mirrors the
 * OMS {@code ReservationCreateRequest}.
 *
 * <p>Customer can be supplied either by {@code customer} (UUID) when
 * already registered, or via {@code customerFirstName/LastName/Phone/Email}
 * for the find-or-create flow that the OMS forwards to Accounts Service.
 *
 * <p>For staff-created reservations the dashboard treats this form as
 * "filling on the customer's behalf" — when no existing customerId is
 * picked, first name, last name, and phone are all required so the booking
 * carries enough contact detail to confirm and remind the guest.
 */
export const ReservationSchema = object({
  reservationDate: string({ required_error: "Reservation date is required" })
    .min(1, "Reservation date is required"),
  reservationTime: string({ required_error: "Reservation time is required" })
    .min(1, "Reservation time is required"),
  reservationEndTime: string().optional(),
  peopleCount: requiredNumber("Number of guests is required"),
  specialRequests: string().optional(),
  source: zenum([
    "ONLINE",
    "PHONE",
    "WALK_IN",
    "POS",
    "THIRD_PARTY",
  ], { required_error: "Source is required" }),
  customerId: string({ required_error: "Customer is required" })
    .uuid("Please select a valid customer"),
  tableSpaceId: string().uuid("Please select a valid table").optional(),
  answers: array(
    object({
      bookingQuestionId: string().uuid("Please select a valid question"),
      answerValue: string(),
    }),
  ).optional(),
});

/** Schema for {@code PUT /reservations/{id}} — every field optional. */
export const ReservationUpdateSchema = object({
  reservationDate: string().optional(),
  reservationTime: string().optional(),
  reservationEndTime: string().optional(),
  peopleCount: optionalNumber,
  specialRequests: string().optional(),
  tableSpaceId: string().uuid().optional(),
});

/** Schema for {@code POST /reservation-slots} and PUT. */
export const ReservationSlotSchema = object({
  dayOfWeek: zenum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ], { required_error: "Day of week is required" }),
  startTime: string({ required_error: "Start time is required" }),
  endTime: string({ required_error: "End time is required" }),
  slotDurationMinutes: requiredNumber("Slot duration is required"),
  maxReservations: optionalNumber,
  maxGuests: optionalNumber,
  active: boolean().optional().default(true),
});

/** Schema for {@code POST /reservation-exceptions} and PUT. */
export const ReservationExceptionSchema = object({
  date: string({ required_error: "Date is required" }),
  startTime: string().optional(),
  endTime: string().optional(),
  reason: string().optional(),
  type: zenum(
    ["CLOSED", "PRIVATE_EVENT", "HOLIDAY", "MAINTENANCE", "BLOCKED"],
    { required_error: "Exception type is required" },
  ),
});

/** Schema for {@code POST /reservations/availability}. */
export const AvailabilityRequestSchema = object({
  date: string({ required_error: "Date is required" }),
  partySize: requiredNumber("Party size is required"),
});

/**
 * Schema for {@code POST /reservations/{id}/pay-deposit}. Both customer-online
 * and staff-triggered manual confirmation use this — the difference is
 * whether {@code paymentMethodId} is supplied.
 *
 * <p>Customer-online: leave {@code paymentMethodId} null (Payment Service
 * picks the default mobile-money method) and supply {@code customerPhone}
 * for the push.
 *
 * <p>Staff manual confirmation: supply {@code paymentMethodId} (CASH,
 * BANK_TRANSFER, COMPLIMENTARY, or a specific provider method) and an
 * optional {@code confirmationNote} for audit. {@code customerPhone} can
 * be left blank for tenders that don't need it.
 */
export const ReservationDepositPaymentSchema = object({
  customerPhone: string().optional(),
  paymentMethodId: string().uuid("Please select a valid payment method").optional(),
  confirmationNote: string().optional(),
});
