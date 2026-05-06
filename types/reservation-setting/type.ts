import { UUID } from "node:crypto";
import { BookingQuestionType } from "@/types/enums";

/**
 * Mirrors the OMS {@code ReservationSettingResponse}. One row per location.
 *
 * <p>Note: deposit policy (require / amount / per-guest / min party size) is
 * NO LONGER part of reservation settings — those rules now live in the
 * separate {@code deposit_rules} entity which supports priority-based
 * overrides per slot/table/global. See {@code DepositRule}.
 */
export declare interface ReservationSetting {
  id: UUID;
  locationId: UUID;

  // Booking Rules
  minPartySize: number;
  maxPartySize: number | null;
  bookingWindowDays: number;
  minAdvanceBookingHours: number;
  defaultDurationMinutes: number;
  slotIntervalMinutes: number;
  enableOnlineBooking: boolean;
  requireGuestEmail: boolean;
  requireGuestPhone: boolean;
  allowSpecialRequests: boolean;

  // Confirmation
  autoConfirm: boolean;
  autoConfirmMaxPartySize: number | null;

  // Cancellation & No-Show
  cancellationPolicyHours: number | null;
  allowOnlineCancellation: boolean;
  cancellationPolicyText: string | null;
  chargeNoShowFee: boolean;
  noShowFeeAmount: number | null;
  /** Minutes after reservation time before the no-show scheduler fires. */
  noShowGraceMinutes: number;

  // Notifications & Reminders
  sendConfirmationEmail: boolean;
  sendConfirmationSms: boolean;
  sendReminderNotification: boolean;
  reminderHoursBeforeReservation: number;

  // Pacing & Capacity
  defaultTurnTimeMinutes: number;
  bufferMinutesBetweenSeatings: number;
  maxDailyReservations: number | null;
  maxDailyGuests: number | null;

  // Waitlist
  enableWaitlist: boolean;
  maxWaitlistSize: number | null;

  // Deposit collection (the "should we collect online vs cash" toggle —
  // the actual deposit rules live in DepositRule).
  enableOnlineDepositPayment: boolean;

  // Table Assignment
  autoAssignTable: boolean;
  allowGuestTablePreference: boolean;

  // Guest-Facing Messages
  confirmationMessage: string | null;
  bookingPageWelcomeMessage: string | null;
  termsAndConditions: string | null;
}

/**
 * Mirrors the OMS {@code PublicReservationSettingDto}. Returned from
 * {@code GET /api/v1/public/locations/{locationId}/reservations/settings}.
 * Strict subset of {@link ReservationSetting} — never exposes pacing /
 * internal fields to public callers.
 */
export declare interface PublicReservationSetting {
  enableOnlineBooking: boolean;
  requireGuestEmail: boolean;
  requireGuestPhone: boolean;
  allowSpecialRequests: boolean;
  enableOnlineDepositPayment: boolean;
  minPartySize: number;
  maxPartySize: number | null;
  bookingWindowDays: number;
  minAdvanceBookingHours: number;
  bookingPageWelcomeMessage: string | null;
  termsAndConditions: string | null;
  confirmationMessage: string | null;
}

/** Mirrors {@code BookingQuestionOption}. */
export declare interface BookingQuestionOption {
  id?: UUID;
  label: string;
  value: string;
  sortOrder: number;
}

/** Mirrors {@code BookingQuestionResponse}. */
export declare interface BookingQuestion {
  id: UUID;
  questionText: string;
  questionType: BookingQuestionType;
  required: boolean;
  sortOrder: number;
  active: boolean;
  options: BookingQuestionOption[];
}

export type ReservationSettingCategory =
  | "booking_rules"
  | "confirmation"
  | "cancellation"
  | "notifications"
  | "pacing"
  | "waitlist"
  | "deposit_collection"
  | "table_assignment"
  | "messages";

export interface ReservationSettingField {
  key: keyof ReservationSetting;
  label: string;
  type: "switch" | "number" | "text" | "textarea";
  category: ReservationSettingCategory;
  placeholder?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  dependsOn?: keyof ReservationSetting;
}

export const RESERVATION_SETTINGS_CONFIG: ReservationSettingField[] = [
  // Booking Rules
  {
    key: "enableOnlineBooking",
    label: "Enable Online Booking",
    type: "switch",
    category: "booking_rules",
    helperText: "Allow guests to book online",
  },
  {
    key: "minPartySize",
    label: "Minimum Party Size",
    type: "number",
    category: "booking_rules",
    placeholder: "1",
    min: 1,
  },
  {
    key: "maxPartySize",
    label: "Maximum Party Size",
    type: "number",
    category: "booking_rules",
    placeholder: "No limit",
    min: 1,
  },
  {
    key: "bookingWindowDays",
    label: "Booking Window (days)",
    type: "number",
    category: "booking_rules",
    placeholder: "30",
    helperText: "How far ahead guests can book",
    min: 1,
  },
  {
    key: "minAdvanceBookingHours",
    label: "Minimum Advance Booking (hours)",
    type: "number",
    category: "booking_rules",
    placeholder: "1",
    helperText: "Minimum notice required",
    min: 0,
  },
  {
    key: "defaultDurationMinutes",
    label: "Default Duration (minutes)",
    type: "number",
    category: "booking_rules",
    placeholder: "90",
    min: 15,
    step: 15,
  },
  {
    key: "slotIntervalMinutes",
    label: "Slot Interval (minutes)",
    type: "number",
    category: "booking_rules",
    placeholder: "30",
    helperText: "Time gap between available booking slots",
    min: 5,
    step: 5,
  },
  {
    key: "requireGuestEmail",
    label: "Require Guest Email",
    type: "switch",
    category: "booking_rules",
    helperText: "Make email mandatory during booking",
  },
  {
    key: "requireGuestPhone",
    label: "Require Guest Phone",
    type: "switch",
    category: "booking_rules",
    helperText: "Make phone number mandatory during booking",
  },
  {
    key: "allowSpecialRequests",
    label: "Allow Special Requests",
    type: "switch",
    category: "booking_rules",
    helperText: "Show special requests field on booking form",
  },

  // Confirmation
  {
    key: "autoConfirm",
    label: "Auto-Confirm Reservations",
    type: "switch",
    category: "confirmation",
    helperText: "Automatically confirm new reservations",
  },
  {
    key: "autoConfirmMaxPartySize",
    label: "Auto-Confirm Max Party Size",
    type: "number",
    category: "confirmation",
    placeholder: "No limit",
    helperText: "Only auto-confirm parties up to this size",
    min: 1,
    dependsOn: "autoConfirm",
  },

  // Cancellation & No-Show
  {
    key: "allowOnlineCancellation",
    label: "Allow Online Cancellation",
    type: "switch",
    category: "cancellation",
    helperText: "Let guests cancel their own reservations",
  },
  {
    key: "cancellationPolicyHours",
    label: "Free Cancellation Window (hours)",
    type: "number",
    category: "cancellation",
    placeholder: "No policy",
    helperText: "Hours before reservation when free cancellation is allowed",
    min: 0,
  },
  {
    key: "cancellationPolicyText",
    label: "Cancellation Policy Text",
    type: "textarea",
    category: "cancellation",
    placeholder: "Enter your cancellation policy...",
    helperText: "Displayed to guests during booking",
  },
  {
    key: "chargeNoShowFee",
    label: "Charge No-Show Fee",
    type: "switch",
    category: "cancellation",
    helperText: "Charge a fee when guests don't show up",
  },
  {
    key: "noShowFeeAmount",
    label: "No-Show Fee Amount",
    type: "number",
    category: "cancellation",
    placeholder: "0.00",
    min: 0,
    step: 0.01,
    dependsOn: "chargeNoShowFee",
  },
  {
    key: "noShowGraceMinutes",
    label: "No-Show Grace Period (minutes)",
    type: "number",
    category: "cancellation",
    placeholder: "30",
    helperText: "Wait this long after reservation time before marking NO_SHOW",
    min: 0,
    step: 5,
  },

  // Notifications & Reminders
  {
    key: "sendConfirmationEmail",
    label: "Send Confirmation Email",
    type: "switch",
    category: "notifications",
    helperText: "Email guests when reservation is confirmed",
  },
  {
    key: "sendConfirmationSms",
    label: "Send Confirmation SMS",
    type: "switch",
    category: "notifications",
    helperText: "SMS guests when reservation is confirmed",
  },
  {
    key: "sendReminderNotification",
    label: "Send Reminder Notification",
    type: "switch",
    category: "notifications",
    helperText: "Send a reminder before the reservation",
  },
  {
    key: "reminderHoursBeforeReservation",
    label: "Reminder Lead Time (hours)",
    type: "number",
    category: "notifications",
    placeholder: "24",
    min: 1,
    dependsOn: "sendReminderNotification",
  },

  // Pacing & Capacity
  {
    key: "defaultTurnTimeMinutes",
    label: "Default Turn Time (minutes)",
    type: "number",
    category: "pacing",
    placeholder: "15",
    helperText: "Fallback turn time if not set per table",
    min: 0,
    step: 5,
  },
  {
    key: "bufferMinutesBetweenSeatings",
    label: "Buffer Between Seatings (minutes)",
    type: "number",
    category: "pacing",
    placeholder: "0",
    min: 0,
    step: 5,
  },
  {
    key: "maxDailyReservations",
    label: "Max Daily Reservations",
    type: "number",
    category: "pacing",
    placeholder: "No limit",
    helperText: "Hard cap on reservations per day",
    min: 1,
  },
  {
    key: "maxDailyGuests",
    label: "Max Daily Guests",
    type: "number",
    category: "pacing",
    placeholder: "No limit",
    helperText: "Hard cap on total guests per day",
    min: 1,
  },

  // Waitlist
  {
    key: "enableWaitlist",
    label: "Enable Waitlist",
    type: "switch",
    category: "waitlist",
    helperText: "Allow guests to join a waitlist when fully booked",
  },
  {
    key: "maxWaitlistSize",
    label: "Max Waitlist Size",
    type: "number",
    category: "waitlist",
    placeholder: "No limit",
    min: 1,
    dependsOn: "enableWaitlist",
  },

  // Deposit Collection (deposit RULES live in DepositRule, not here)
  {
    key: "enableOnlineDepositPayment",
    label: "Collect Deposits Online",
    type: "switch",
    category: "deposit_collection",
    helperText:
      "When on, deposits are taken via Payment Service (mobile money, card). When off, staff manually confirm payments.",
  },

  // Table Assignment
  {
    key: "autoAssignTable",
    label: "Auto-Assign Tables",
    type: "switch",
    category: "table_assignment",
    helperText: "Automatically assign tables to reservations",
  },
  {
    key: "allowGuestTablePreference",
    label: "Allow Guest Table Preference",
    type: "switch",
    category: "table_assignment",
    helperText: "Let guests request a table or area preference",
  },

  // Guest-Facing Messages
  {
    key: "confirmationMessage",
    label: "Confirmation Message",
    type: "textarea",
    category: "messages",
    placeholder: "Thank you for your reservation...",
    helperText: "Shown to guests after booking",
  },
  {
    key: "bookingPageWelcomeMessage",
    label: "Booking Page Welcome Message",
    type: "textarea",
    category: "messages",
    placeholder: "Welcome to our restaurant...",
    helperText: "Displayed at the top of the booking page",
  },
  {
    key: "termsAndConditions",
    label: "Terms & Conditions",
    type: "textarea",
    category: "messages",
    placeholder: "Enter your terms and conditions...",
    helperText: "Displayed during the booking process",
  },
];

export const RESERVATION_SETTING_CATEGORY_TITLES: Record<
  ReservationSettingCategory,
  string
> = {
  booking_rules: "Booking Rules",
  confirmation: "Confirmation",
  cancellation: "Cancellation & No-Show",
  notifications: "Notifications & Reminders",
  pacing: "Pacing & Capacity",
  waitlist: "Waitlist",
  deposit_collection: "Deposit Collection",
  table_assignment: "Table Assignment",
  messages: "Guest-Facing Messages",
};

export const BOOKING_QUESTION_TYPE_LABELS: Record<BookingQuestionType, string> = {
  [BookingQuestionType.TEXT]: "Free text",
  [BookingQuestionType.NUMBER]: "Number",
  [BookingQuestionType.BOOLEAN]: "Yes / No",
  [BookingQuestionType.SINGLE_CHOICE]: "Single choice",
  [BookingQuestionType.MULTI_CHOICE]: "Multiple choice",
};
