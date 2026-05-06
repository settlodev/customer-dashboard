import { UUID } from "crypto";
import {
  ReservationStatus,
  DepositPaymentStatus,
  ReservationExceptionType,
  ReservationSource,
} from "@/types/enums";

/**
 * Mirrors the OMS `ReservationResponseDto` from settlo-common 0.8.11.
 * The shape is denormalised — customer / table / business / location are
 * present both as UUIDs and as flattened display fields.
 */
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
  source: ReservationSource | string | null;

  // Table
  tableAndSpace: UUID | null;
  tableAndSpaceName: string | null;
  tableMinimumSpend: number | null;
  sectionId: UUID | null;
  sectionName: string | null;

  // Customer (denormalised)
  customer: UUID | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;

  // Location (denormalised)
  location: UUID;
  locationName: string | null;
  locationPhone: string | null;
  locationEmail: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationImage: string | null;
  locationLogo: string | null;
  locationBackgroundColor: string | null;
  locationOpeningTime: string | null;
  locationClosingTime: string | null;

  // Business (denormalised)
  business: UUID | null;
  businessName: string | null;
  businessLogo: string | null;
  businessPrimaryColor: string | null;
  businessSecondaryColor: string | null;
  businessBannerImageUrl: string | null;
  businessFaviconUrl: string | null;
  businessFontFamily: string | null;
  businessWebsite: string | null;

  // Booking-question answers
  answers: ReservationAnswer[];

  // Audit / display
  status: boolean;
  isArchived: boolean;
  canDelete: boolean;
}

export declare interface ReservationAnswer {
  id: UUID;
  bookingQuestion: UUID;
  questionText: string | null;
  questionType: string | null;
  answerValue: string;
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
}

export declare interface ReservationException {
  id: UUID;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  type: ReservationExceptionType;
  fullDay: boolean;
}

// ─── Availability ────────────────────────────────────────────────────

export declare interface AvailableTable {
  id: UUID;
  name: string;
  capacity: number;
  minCapacity: number | null;
  parentId: UUID | null;
  parentName: string | null;
}

export declare interface AvailableSlot {
  time: string;
  available: boolean;
  reservationsRemaining: number | null;
  guestsRemaining: number | null;
  availableTables: AvailableTable[];
}

export declare interface AvailabilityResponse {
  slots: AvailableSlot[];
  closed: boolean;
  closedReason: string | null;
}

// ─── Allocation result ──────────────────────────────────────────────

/**
 * Either {@code tableSpaceId} or {@code combinationId} is set, never both.
 * Combination wins when no single table fits the party.
 */
export declare interface TableAllocationResult {
  tableSpaceId: UUID | null;
  tableName: string | null;
  capacity: number | null;
  combinationId: UUID | null;
  combinationName: string | null;
}

// ─── Deposit payment ────────────────────────────────────────────────

export declare interface ReservationDepositPaymentResponse {
  reservationId: UUID;
  depositAmount: number;
  depositPaymentStatus: DepositPaymentStatus;
  paymentStatus: "PROCESSING" | "SUCCESS" | "FAILED" | "ACCEPTED";
  externalReferenceId: string | null;
  paymentMethodName: string | null;
  message: string | null;
}

// ─── Timeline / event log ───────────────────────────────────────────

/**
 * One row from the OMS reservation_events table — every action against a
 * reservation produces one of these. Use {@code GET /reservations/{id}/events}
 * to fetch the full timeline.
 */
export declare interface ReservationEvent {
  id: UUID;
  reservationId: UUID;
  locationId: UUID;
  eventType: string;
  /** Staff user who triggered the action; null for system / public events. */
  actorId: UUID | null;
  /** USER, DEVICE, SYSTEM, etc. */
  actorType: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

// ─── Display helpers ────────────────────────────────────────────────

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

export const RESERVATION_SOURCES: ReservationSource[] = [
  ReservationSource.ONLINE,
  ReservationSource.PHONE,
  ReservationSource.WALK_IN,
  ReservationSource.POS,
  ReservationSource.THIRD_PARTY,
];

export const RESERVATION_SOURCE_LABELS: Record<ReservationSource, string> = {
  [ReservationSource.ONLINE]: "Online",
  [ReservationSource.PHONE]: "Phone",
  [ReservationSource.WALK_IN]: "Walk-in",
  [ReservationSource.POS]: "POS",
  [ReservationSource.THIRD_PARTY]: "Third Party",
};
