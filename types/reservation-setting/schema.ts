import { boolean, number, object, string, array, enum as zenum, preprocess } from "zod";

// Helpers that accept null from the API and convert to undefined
const optionalBoolean = preprocess(
  (val) => (val === null ? undefined : val),
  boolean().optional(),
);

const optionalString = preprocess(
  (val) => (val === null || val === "" ? undefined : val),
  string().optional(),
);

const optionalNumber = preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  number().positive().optional(),
);

const optionalNonNegativeNumber = preprocess(
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
    number({ message }).nonnegative({ message: `${message} (must be non-negative)` }),
  );

export const ReservationSettingSchema = object({
  // Booking Rules
  minPartySize: requiredNumber("Minimum party size is required"),
  maxPartySize: optionalNumber,
  bookingWindowDays: requiredNumber("Booking window is required"),
  minAdvanceBookingHours: requiredNumber("Minimum advance booking hours is required"),
  defaultDurationMinutes: requiredNumber("Default duration is required"),
  slotIntervalMinutes: requiredNumber("Slot interval is required"),
  enableOnlineBooking: optionalBoolean,
  requireGuestEmail: optionalBoolean,
  requireGuestPhone: optionalBoolean,
  allowSpecialRequests: optionalBoolean,

  // Confirmation
  autoConfirm: optionalBoolean,
  autoConfirmMaxPartySize: optionalNumber,

  // Deposit & Payment
  requireDeposit: optionalBoolean,
  defaultDepositAmount: optionalNonNegativeNumber,
  depositPerGuest: optionalBoolean,
  depositRequiredMinPartySize: optionalNumber,

  // Cancellation & No-Show
  cancellationPolicyHours: optionalNonNegativeNumber,
  allowOnlineCancellation: optionalBoolean,
  cancellationPolicyText: optionalString,
  chargeNoShowFee: optionalBoolean,
  noShowFeeAmount: optionalNonNegativeNumber,

  // Notifications & Reminders
  sendConfirmationEmail: optionalBoolean,
  sendConfirmationSms: optionalBoolean,
  sendReminderNotification: optionalBoolean,
  reminderHoursBeforeReservation: optionalNumber,

  // Pacing & Capacity
  defaultTurnTimeMinutes: requiredNumber("Default turn time is required"),
  bufferMinutesBetweenSeatings: optionalNonNegativeNumber,
  maxDailyReservations: optionalNumber,
  maxDailyGuests: optionalNumber,

  // Waitlist
  enableWaitlist: optionalBoolean,
  maxWaitlistSize: optionalNumber,

  // Table Assignment
  autoAssignTable: optionalBoolean,
  allowGuestTablePreference: optionalBoolean,

  // Guest-Facing Messages
  confirmationMessage: optionalString,
  bookingPageWelcomeMessage: optionalString,
  termsAndConditions: optionalString,
}).refine(
  (data) => {
    if (data.maxPartySize && data.minPartySize > data.maxPartySize) return false;
    return true;
  },
  { message: "Minimum party size cannot exceed maximum party size", path: ["minPartySize"] },
).refine(
  (data) => {
    if (data.chargeNoShowFee && !data.noShowFeeAmount) return false;
    return true;
  },
  { message: "No-show fee amount is required when charging no-show fees", path: ["noShowFeeAmount"] },
).refine(
  (data) => {
    if (data.requireDeposit && !data.defaultDepositAmount) return false;
    return true;
  },
  { message: "Deposit amount is required when deposits are enabled", path: ["defaultDepositAmount"] },
);

export const BookingQuestionOptionSchema = object({
  id: string().uuid().optional(),
  optionValue: string({ required_error: "Option value is required" }).min(1, "Option value cannot be empty"),
  sortOrder: preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    number().nonnegative().default(0),
  ),
});

export const BookingQuestionSchema = object({
  questionText: string({ required_error: "Question text is required" }).min(1, "Question text cannot be empty"),
  questionType: zenum(["MULTI_SELECT", "SINGLE_SELECT", "ACKNOWLEDGEMENT", "FREE_TEXT"], {
    required_error: "Question type is required",
  }),
  required: boolean().default(false),
  sortOrder: preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    number().nonnegative().default(0),
  ),
  active: boolean().default(true),
  options: array(BookingQuestionOptionSchema).default([]),
}).refine(
  (data) => {
    if (
      (data.questionType === "MULTI_SELECT" || data.questionType === "SINGLE_SELECT") &&
      data.options.length < 2
    ) {
      return false;
    }
    return true;
  },
  { message: "Select-type questions require at least 2 options", path: ["options"] },
);
