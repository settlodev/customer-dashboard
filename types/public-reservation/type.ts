/**
 * Payload for {@code POST /api/v1/public/locations/{locationId}/reservations}.
 * The customer is captured by guest details — the OMS forwards them to the
 * Accounts Service find-or-create endpoint to materialise / link a customer
 * record.
 */
export interface PublicReservationPayload {
  reservationDate: string;
  reservationTime: string;
  reservationEndTime?: string;
  peopleCount: number;
  /** Always {@code "ONLINE"} for public flow — server enforces this. */
  source?: "ONLINE";
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone?: string;
  specialRequests?: string;
  tableSpaceId?: string;
  answers?: { bookingQuestionId: string; answerValue: string }[];
}

/**
 * Payload for {@code PUT /public/.../reservations/{id}?token=}. Subset of
 * {@link PublicReservationPayload}.
 */
export interface PublicReservationUpdatePayload {
  reservationDate?: string;
  reservationTime?: string;
  reservationEndTime?: string;
  peopleCount?: number;
  specialRequests?: string;
  tableSpaceId?: string;
}

/** Captured during the booking flow before being submitted. */
export interface GuestInfo {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
}

export type ReservationStep = "booking" | "details" | "extras" | "confirmation";
