"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationDetails } from "@/types/menu/type";
import {
  AvailabilityResponse,
  Reservation,
  ReservationDepositPaymentResponse,
} from "@/types/reservation/type";
import {
  PublicReservationSetting,
  BookingQuestion,
} from "@/types/reservation-setting/type";
import {
  PublicReservationPayload,
  PublicReservationUpdatePayload,
} from "@/types/public-reservation/type";

/**
 * Public reservation paths under {@code /api/v1/public/locations/{locationId}/reservations}.
 * All endpoints are unauthenticated; mutating endpoints require an
 * Idempotency-Key (the ApiClient adds one automatically). Token-protected
 * read / update / cancel verify the per-reservation confirmation token
 * captured at create time.
 */

const PUBLIC_API_KEY =
  "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a";

const publicBase = (locationId: string) =>
  `/api/v1/public/locations/${locationId}/reservations`;

function omsPlain(): ApiClient {
  const client = new ApiClient("orders");
  client.isPlain = true;
  return client;
}

function accountsPlain(): ApiClient {
  const client = new ApiClient();
  client.isPlain = true;
  return client;
}

// ─── Read endpoints ─────────────────────────────────────────────────

export const fetchPublicLocationInfo = async (
  locationId: string,
): Promise<LocationDetails> => {
  const data = await accountsPlain().get<LocationDetails>(
    `/api/menu/${locationId}`,
    { headers: { "SETTLO-API-KEY": PUBLIC_API_KEY } },
  );
  return parseStringify(data);
};

export const fetchPublicReservationSettings = async (
  locationId: string,
): Promise<PublicReservationSetting | null> => {
  try {
    const data = await omsPlain().get<PublicReservationSetting>(
      `${publicBase(locationId)}/settings`,
    );
    return parseStringify(data);
  } catch (error: unknown) {
    const e = error as { status?: number };
    if (e?.status === 404) return null;
    throw error;
  }
};

export const fetchPublicBookingQuestions = async (
  locationId: string,
): Promise<BookingQuestion[]> => {
  try {
    const data = await omsPlain().get<BookingQuestion[]>(
      `${publicBase(locationId)}/booking-questions`,
    );
    return parseStringify(data);
  } catch (error: unknown) {
    const e = error as { status?: number };
    if (e?.status === 404) return [];
    throw error;
  }
};

export const fetchPublicAvailability = async (
  locationId: string,
  date: string,
  partySize: number,
): Promise<AvailabilityResponse> => {
  const data = await omsPlain().post<AvailabilityResponse, unknown>(
    `${publicBase(locationId)}/availability`,
    { date, partySize },
  );
  return parseStringify(data);
};

// ─── Mutating endpoints ─────────────────────────────────────────────

/**
 * Create a reservation through the public booking flow.
 *
 * @returns the created reservation (id + confirmationToken via the
 *          response). Caller should show the customer a "manage your
 *          booking" link with {@code id} and the token returned by the
 *          server in subsequent emails.
 */
export const createPublicReservation = async (
  locationId: string,
  payload: PublicReservationPayload,
): Promise<{ success: boolean; message: string; reservation?: Reservation }> => {
  try {
    const reservation = await omsPlain().post<Reservation, unknown>(
      `${publicBase(locationId)}`,
      { ...payload, source: "ONLINE" },
    );
    return {
      success: true,
      message: "Reservation created successfully",
      reservation: parseStringify(reservation),
    };
  } catch (error: unknown) {
    return { success: false, message: extractMessage(error) };
  }
};

/**
 * Look up a reservation by id and the confirmation token sent to the
 * customer at create time. The OMS returns 404 (not 401) on token
 * mismatch — leaks no information about whether the reservation exists.
 */
export const fetchPublicReservation = async (
  locationId: string,
  reservationId: string,
  token: string,
): Promise<Reservation | null> => {
  try {
    const data = await omsPlain().get<Reservation>(
      `${publicBase(locationId)}/${reservationId}?token=${encodeURIComponent(token)}`,
    );
    return parseStringify(data);
  } catch (error: unknown) {
    const e = error as { status?: number };
    if (e?.status === 404) return null;
    throw error;
  }
};

/** Customer-side update of their own reservation. */
export const updatePublicReservation = async (
  locationId: string,
  reservationId: string,
  token: string,
  payload: PublicReservationUpdatePayload,
): Promise<{ success: boolean; message: string }> => {
  try {
    await omsPlain().put(
      `${publicBase(locationId)}/${reservationId}?token=${encodeURIComponent(token)}`,
      payload,
    );
    return { success: true, message: "Reservation updated successfully" };
  } catch (error: unknown) {
    return { success: false, message: extractMessage(error) };
  }
};

/**
 * Customer-side cancellation. Subject to {@code allowOnlineCancellation}
 * and {@code cancellationPolicyHours} on the reservation settings — the
 * OMS rejects late cancellations with HTTP 409.
 */
export const cancelPublicReservation = async (
  locationId: string,
  reservationId: string,
  token: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    await omsPlain().post(
      `${publicBase(locationId)}/${reservationId}/cancel?token=${encodeURIComponent(token)}`,
      {},
    );
    return { success: true, message: "Reservation cancelled" };
  } catch (error: unknown) {
    return { success: false, message: extractMessage(error) };
  }
};

/** Initiate a deposit payment from the public flow (mobile-money push). */
export const payPublicReservationDeposit = async (
  locationId: string,
  reservationId: string,
  customerPhone: string,
): Promise<ReservationDepositPaymentResponse | { success: false; message: string }> => {
  try {
    const data = await omsPlain().post<ReservationDepositPaymentResponse, unknown>(
      `${publicBase(locationId)}/${reservationId}/pay-deposit`,
      { customerPhone },
    );
    return parseStringify(data);
  } catch (error: unknown) {
    return { success: false, message: extractMessage(error) };
  }
};

// ─── Helpers ────────────────────────────────────────────────────────

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const e = error as { message?: unknown };
    if (typeof e.message === "string") return e.message;
    if (e.message && typeof e.message === "object") {
      const inner = e.message as { message?: string };
      if (typeof inner.message === "string") return inner.message;
    }
  }
  return "Something went wrong. Please try again.";
}
