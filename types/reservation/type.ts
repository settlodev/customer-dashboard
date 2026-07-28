import { UUID } from "crypto";
import {
  ReservationStatus,
  DepositPaymentStatus,
  ReservationExceptionType,
} from "@/types/enums";

export declare interface Reservation {
  id: UUID;
  reservationDate: string;
  reservationTime: string;
  reservationEndTime: string | null;
  peopleCount: number;
  reservationStatus: ReservationStatus;
  specialRequests: string | null;
  depositAmount: number | null;
  depositPaymentStatus: DepositPaymentStatus | null;
  source: string | null;
  tableAndSpace: UUID | null;
  tableAndSpaceName: string | null;
  tableMinimumSpend: number | null;
  customer: UUID | null;
  customerName: string | null;
  answers: ReservationAnswer[];
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface ReservationAnswer {
  id: UUID;
  questionId: UUID;
  questionText: string;
  questionType: string;
  answerText: string;
}

export declare interface ReservationSlot {
  id: UUID;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxReservations: number | null;
  maxGuests: number | null;
  active: boolean;
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface ReservationException {
  id: UUID;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  type: ReservationExceptionType;
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface AvailableTable {
  id: UUID;
  name: string;
  code: string | null;
  capacity: number;
  minCapacity: number | null;
  type: string;
  turnTimeMinutes: number | null;
  minimumSpend: number | null;
  requireDeposit: boolean | null;
  depositAmount: number | null;
  depositPerGuest: boolean | null;
}

export declare interface AvailableCombination {
  id: UUID;
  name: string;
  capacity: number;
  tableIds: UUID[];
}

export declare interface AvailableSlot {
  time: string;
  endTime: string;
  availableTables: AvailableTable[];
  availableCombinations: AvailableCombination[];
  remainingCapacity: number;
  currentReservations: number;
  maxReservations: number | null;
  pacingAvailable: boolean;
}

export declare interface AvailabilityResponse {
  date: string;
  partySize: number;
  locationOpen: boolean;
  closureReason: string | null;
  slots: AvailableSlot[];

  // Reservation settings (enriched from API)
  minPartySize: number | null;
  maxPartySize: number | null;
  defaultDurationMinutes: number | null;
  bookingWindowDays: number | null;
  minAdvanceBookingHours: number | null;
  requireGuestEmail: boolean | null;
  requireGuestPhone: boolean | null;
  allowSpecialRequests: boolean | null;
  allowGuestTablePreference: boolean | null;
  enableOnlineBooking: boolean | null;
  autoConfirm: boolean | null;
  cancellationPolicyHours: number | null;
  allowOnlineCancellation: boolean | null;
  confirmationMessage: string | null;
  bookingPageWelcomeMessage: string | null;
  termsAndConditions: string | null;
  cancellationPolicyText: string | null;
  enableOnlineDepositPayment: boolean | null;

  // Default deposit info (from GLOBAL DepositRule)
  requireDeposit: boolean | null;
  defaultDepositAmount: number | null;
  depositPerGuest: boolean | null;
  depositRequiredMinPartySize: number | null;

  // Booking questions
  bookingQuestions: AvailabilityBookingQuestion[] | null;
}

export declare interface AvailabilityBookingQuestion {
  id: UUID;
  questionText: string;
  questionType: string;
  required: boolean;
  sortOrder: number;
  active: boolean;
  options: { id?: UUID; optionValue: string; sortOrder: number }[];
}

export declare interface TableAllocationResult {
  allocated: boolean;
  tableId: UUID | null;
  tableName: string | null;
  combinationId: UUID | null;
  combinationName: string | null;
  combinedTableIds: UUID[] | null;
  totalCapacity: number;
  reason: string | null;
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: "Pending",
  [ReservationStatus.CONFIRMED]: "Confirmed",
  [ReservationStatus.SEATED]: "Seated",
  [ReservationStatus.COMPLETED]: "Completed",
  [ReservationStatus.CANCELLED]: "Cancelled",
  [ReservationStatus.NO_SHOW]: "No Show",
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [ReservationStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
  [ReservationStatus.SEATED]: "bg-emerald-100 text-emerald-800",
  [ReservationStatus.COMPLETED]: "bg-gray-100 text-gray-800",
  [ReservationStatus.CANCELLED]: "bg-red-100 text-red-800",
  [ReservationStatus.NO_SHOW]: "bg-orange-100 text-orange-800",
};

export const DEPOSIT_STATUS_LABELS: Record<DepositPaymentStatus, string> = {
  [DepositPaymentStatus.NOT_REQUIRED]: "Not Required",
  [DepositPaymentStatus.PENDING]: "Pending",
  [DepositPaymentStatus.PAID]: "Paid",
  [DepositPaymentStatus.FAILED]: "Failed",
  [DepositPaymentStatus.REFUNDED]: "Refunded",
};

export const DEPOSIT_STATUS_COLORS: Record<DepositPaymentStatus, string> = {
  [DepositPaymentStatus.NOT_REQUIRED]: "bg-gray-100 text-gray-600",
  [DepositPaymentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [DepositPaymentStatus.PAID]: "bg-emerald-100 text-emerald-800",
  [DepositPaymentStatus.FAILED]: "bg-red-100 text-red-800",
  [DepositPaymentStatus.REFUNDED]: "bg-blue-100 text-blue-800",
};

export const EXCEPTION_TYPE_LABELS: Record<ReservationExceptionType, string> = {
  [ReservationExceptionType.CLOSED]: "Closed",
  [ReservationExceptionType.PRIVATE_EVENT]: "Private Event",
  [ReservationExceptionType.HOLIDAY]: "Holiday",
  [ReservationExceptionType.MAINTENANCE]: "Maintenance",
  [ReservationExceptionType.BLOCKED]: "Blocked",
};

export const DAY_OF_WEEK_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const VALID_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.SEATED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
  [ReservationStatus.SEATED]: [ReservationStatus.COMPLETED],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.NO_SHOW]: [],
};

export const RESERVATION_SOURCES = [
  "ONLINE",
  "POS",
  "PHONE",
  "WALK_IN",
] as const;

export const RESERVATION_SOURCE_LABELS: Record<string, string> = {
  ONLINE: "Online",
  POS: "POS",
  PHONE: "Phone",
  WALK_IN: "Walk-in",
};
