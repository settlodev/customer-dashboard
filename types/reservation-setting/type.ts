import { UUID } from "node:crypto";

export declare interface ReservationSetting {
  id: UUID;

  // Category 1: Booking Rules
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

  // Category 2: Confirmation
  autoConfirm: boolean;
  autoConfirmMaxPartySize: number | null;

  // Category 3: Deposit & Payment
  requireDeposit: boolean;
  defaultDepositAmount: number | null;
  depositPerGuest: boolean;
  depositRequiredMinPartySize: number | null;

  // Category 4: Cancellation & No-Show
  cancellationPolicyHours: number | null;
  allowOnlineCancellation: boolean;
  cancellationPolicyText: string | null;
  chargeNoShowFee: boolean;
  noShowFeeAmount: number | null;

  // Category 5: Notifications & Reminders
  sendConfirmationEmail: boolean;
  sendConfirmationSms: boolean;
  sendReminderNotification: boolean;
  reminderHoursBeforeReservation: number;

  // Category 6: Pacing & Capacity
  defaultTurnTimeMinutes: number;
  bufferMinutesBetweenSeatings: number;
  maxDailyReservations: number | null;
  maxDailyGuests: number | null;

  // Category 7: Waitlist
  enableWaitlist: boolean;
  maxWaitlistSize: number | null;

  // Category 8: Table Assignment
  autoAssignTable: boolean;
  allowGuestTablePreference: boolean;

  // Category 9: Guest-Facing Messages
  confirmationMessage: string | null;
  bookingPageWelcomeMessage: string | null;
  termsAndConditions: string | null;
}

export declare interface PublicReservationSetting extends ReservationSetting {
  location: string;

  // Branding (from business)
  logoUrl: string | null;
  bannerImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  faviconUrl: string | null;
  fontFamily: string | null;

  // SEO (from business)
  metaTitle: string | null;
  metaDescription: string | null;
  shareImageUrl: string | null;

  // Socials (from business)
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
}

export type BookingQuestionType =
  | "MULTI_SELECT"
  | "SINGLE_SELECT"
  | "ACKNOWLEDGEMENT"
  | "FREE_TEXT";

export declare interface BookingQuestionOption {
  id?: UUID;
  optionValue: string;
  sortOrder: number;
}

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
  | "deposit"
  | "cancellation"
  | "notifications"
  | "pacing"
  | "waitlist"
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

  // Deposit & Payment
  {
    key: "requireDeposit",
    label: "Require Deposit",
    type: "switch",
    category: "deposit",
    helperText: "Require a deposit for reservations",
  },
  {
    key: "defaultDepositAmount",
    label: "Default Deposit Amount",
    type: "number",
    category: "deposit",
    placeholder: "0.00",
    min: 0,
    step: 0.01,
    dependsOn: "requireDeposit",
  },
  {
    key: "depositPerGuest",
    label: "Deposit Per Guest",
    type: "switch",
    category: "deposit",
    helperText: "Multiply deposit amount by party size",
    dependsOn: "requireDeposit",
  },
  {
    key: "depositRequiredMinPartySize",
    label: "Deposit Required Min Party Size",
    type: "number",
    category: "deposit",
    placeholder: "No minimum",
    helperText: "Only require deposit for parties of this size or larger",
    min: 1,
    dependsOn: "requireDeposit",
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
  deposit: "Deposit & Payment",
  cancellation: "Cancellation & No-Show",
  notifications: "Notifications & Reminders",
  pacing: "Pacing & Capacity",
  waitlist: "Waitlist",
  table_assignment: "Table Assignment",
  messages: "Guest-Facing Messages",
};
