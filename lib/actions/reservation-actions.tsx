"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import {
  Reservation,
  ReservationSlot,
  ReservationException,
  AvailabilityResponse,
  TableAllocationResult,
  ReservationDepositPaymentResponse,
  ReservationEvent,
} from "@/types/reservation/type";
import {
  ReservationSchema,
  ReservationUpdateSchema,
  ReservationSlotSchema,
  ReservationExceptionSchema,
  ReservationDepositPaymentSchema,
} from "@/types/reservation/schema";

/**
 * All reservation traffic goes to the Order Management Service (OMS).
 * Path prefix is {@code /api/v1/locations/{locationId}/reservations...}.
 */
const oms = () => new ApiClient("orders");

const base = (locationId: string) =>
  `/api/v1/locations/${locationId}/reservations`;

// ─── Reservations ─────────────────────────────────────────────────────

export const fetchAllReservations = async (params?: {
  from?: string;
  to?: string;
  status?: string;
}): Promise<Reservation[]> => {
  const location = await getCurrentLocation();
  if (!location?.id) return [];

  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();

  const data = await oms().get<Reservation[]>(
    `${base(location.id)}${query ? `?${query}` : ""}`,
  );
  return parseStringify(data);
};

export const searchReservation = async (
  q: string,
  page: number,
  pageLimit: number,
  filters?: { from?: string; to?: string; status?: string; customerId?: string },
): Promise<ApiResponse<Reservation>> => {
  // Note: the OMS search endpoint takes status / from / to / customerId
  // directly rather than a generic filter array. The free-text {@code q}
  // is unused server-side — kept as a parameter so existing callers keep
  // working; client should filter in-memory if free-text matching is needed.
  void q;

  const location = await getCurrentLocation();
  if (!location?.id) {
    return parseStringify({ content: [], totalElements: 0, totalPages: 0 });
  }

  const data = await oms().post<ApiResponse<Reservation>, unknown>(
    `${base(location.id)}/search`,
    {
      status: filters?.status,
      from: filters?.from,
      to: filters?.to,
      customerId: filters?.customerId,
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    },
  );
  return parseStringify(data);
};

export const getReservationById = async (id: UUID): Promise<Reservation> => {
  const location = await getCurrentLocation();
  const data = await oms().get<Reservation>(`${base(location?.id as string)}/${id}`);
  return parseStringify(data);
};

/**
 * Strips empty / blank optional fields from the validated form data so the
 * outgoing JSON body matches the OMS {@code ReservationCreateRequest}
 * shape exactly. Without this, fields like {@code customerEmail: ""} or
 * {@code reservationEndTime: ""} land on the server as empty strings and
 * Jackson can either reject them (LocalTime-typed fields) or pass them
 * through as blanks that downstream validators don't expect.
 */
function buildReservationCreateBody(
  data: z.infer<typeof ReservationSchema>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    reservationDate: data.reservationDate,
    reservationTime: data.reservationTime,
    peopleCount: data.peopleCount,
    source: data.source,
  };
  if (data.reservationEndTime?.trim()) body.reservationEndTime = data.reservationEndTime;
  if (data.specialRequests?.trim()) body.specialRequests = data.specialRequests;
  if (data.tableSpaceId) body.tableSpaceId = data.tableSpaceId;
  body.customerId = data.customerId;
  if (data.answers && data.answers.length > 0) body.answers = data.answers;
  return body;
}

/**
 * Same idea as {@link buildReservationCreateBody}, but for the update DTO,
 * which is a strict subset (date/time/end-time/peopleCount/specialRequests/
 * tableSpaceId only).
 */
function buildReservationUpdateBody(
  data: z.infer<typeof ReservationUpdateSchema>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.reservationDate?.trim()) body.reservationDate = data.reservationDate;
  if (data.reservationTime?.trim()) body.reservationTime = data.reservationTime;
  if (data.reservationEndTime?.trim()) body.reservationEndTime = data.reservationEndTime;
  if (data.peopleCount != null) body.peopleCount = data.peopleCount;
  if (data.specialRequests?.trim()) body.specialRequests = data.specialRequests;
  if (data.tableSpaceId) body.tableSpaceId = data.tableSpaceId;
  return body;
}

export const createReservation = async (
  reservation: z.infer<typeof ReservationSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationSchema.safeParse(reservation);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  if (!location?.id) {
    return SettloErrorHandler.createErrorResponse(
      new Error("No active location"),
      "Pick a location before creating a reservation",
    );
  }

  try {
    await oms().post(base(location.id), buildReservationCreateBody(validated.data));
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create reservation",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation created successfully",
  );
};

/**
 * Composite create-and-seat for walk-ins. Forces source=WALK_IN and
 * transitions PENDING → CONFIRMED → SEATED in a single OMS transaction.
 */
export const createWalkInReservation = async (
  reservation: z.infer<typeof ReservationSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationSchema.safeParse({
    ...reservation,
    source: "WALK_IN",
  });
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  if (!location?.id) {
    return SettloErrorHandler.createErrorResponse(
      new Error("No active location"),
      "Pick a location before creating a reservation",
    );
  }

  try {
    await oms().post(
      `${base(location.id)}/walk-in`,
      buildReservationCreateBody(validated.data),
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create walk-in reservation",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Walk-in reservation created and seated",
  );
};

export const updateReservation = async (
  id: UUID,
  reservation: z.infer<typeof ReservationUpdateSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationUpdateSchema.safeParse(reservation);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please correct the highlighted fields",
    );
  }

  const location = await getCurrentLocation();
  if (!location?.id) {
    return SettloErrorHandler.createErrorResponse(
      new Error("No active location"),
      "Pick a location before updating a reservation",
    );
  }

  try {
    await oms().put(
      `${base(location.id)}/${id}`,
      buildReservationUpdateBody(validated.data),
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update reservation",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation updated successfully",
  );
};

export const updateReservationStatus = async (
  id: UUID,
  status: string,
): Promise<FormResponse | void> => {
  const location = await getCurrentLocation();
  if (!location?.id) {
    return SettloErrorHandler.createErrorResponse(
      new Error("No active location"),
      "Pick a location before updating a reservation",
    );
  }
  // Inline the query string rather than relying on axios's `params`
  // serialiser — when the request goes through a proxy/gateway, surfacing
  // the param in `config.url` makes it visible in the request log and
  // sidesteps any quirky params-merging behaviour. Status enum values are
  // already URL-safe (uppercase ASCII + underscore).
  const url = `${base(location.id)}/${id}/status?status=${encodeURIComponent(status)}`;
  try {
    await oms().put<unknown, null>(url, null);
  } catch (error: unknown) {
    revalidatePath("/reservations");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update reservation status",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation status updated successfully",
  );
};

export const deleteReservation = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Reservation ID is required");

  const location = await getCurrentLocation();
  await oms().delete(`${base(location?.id as string)}/${id}`);
  revalidatePath("/reservations");
};

// ─── Availability + allocation ──────────────────────────────────────

export const checkAvailability = async (
  date: string,
  partySize: number,
): Promise<AvailabilityResponse> => {
  const location = await getCurrentLocation();
  const data = await oms().post<AvailabilityResponse, unknown>(
    `${base(location?.id as string)}/availability`,
    { date, partySize },
  );
  return parseStringify(data);
};

export const allocateTable = async (
  date: string,
  time: string,
  partySize: number,
): Promise<TableAllocationResult> => {
  const location = await getCurrentLocation();
  const data = await oms().get<TableAllocationResult>(
    `${base(location?.id as string)}/allocate?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&partySize=${partySize}`,
  );
  return parseStringify(data);
};

// ─── Deposit payment ────────────────────────────────────────────────

/**
 * Trigger a deposit payment via Payment Service. Two flows share this:
 *
 * <ul>
 *   <li>Customer-online — leave {@code paymentMethodId} undefined; Payment
 *       Service picks the default mobile-money method and pushes a
 *       provider authorisation to {@code customerPhone}.</li>
 *   <li>Staff manual confirmation — supply {@code paymentMethodId} (CASH,
 *       BANK_TRANSFER, COMPLIMENTARY, or a specific provider method) plus
 *       an optional {@code confirmationNote}. Cash and similar synchronous
 *       tenders return SUCCESS immediately; the OMS webhook receives the
 *       signed callback and flips {@code depositPaymentStatus} to PAID.</li>
 * </ul>
 */
export const payReservationDeposit = async (
  reservationId: UUID,
  body: z.infer<typeof ReservationDepositPaymentSchema>,
): Promise<ReservationDepositPaymentResponse | FormResponse> => {
  const validated = ReservationDepositPaymentSchema.safeParse(body);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please correct the highlighted fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    const data = await oms().post<ReservationDepositPaymentResponse, unknown>(
      `${base(location?.id as string)}/${reservationId}/pay-deposit`,
      validated.data,
    );
    revalidatePath("/reservations");
    return parseStringify(data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to initiate deposit payment",
    ) as FormResponse;
  }
};

// ─── Timeline / events ──────────────────────────────────────────────

export const fetchReservationEvents = async (
  reservationId: UUID,
): Promise<ReservationEvent[]> => {
  const location = await getCurrentLocation();
  const data = await oms().get<ReservationEvent[]>(
    `${base(location?.id as string)}/${reservationId}/events`,
  );
  return parseStringify(data);
};

// ─── Calendar helper ────────────────────────────────────────────────

export const searchReservationsByMonth = async (
  year: number,
  month: number,
): Promise<Reservation[]> => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay,
  ).padStart(2, "0")}`;

  return fetchAllReservations({ from: startDate, to: endDate });
};

// ─── Reservation Slots ────────────────────────────────────────────────

const slotsBase = (locationId: string) =>
  `/api/v1/locations/${locationId}/reservation-slots`;

export const fetchReservationSlots = async (): Promise<ReservationSlot[]> => {
  const location = await getCurrentLocation();
  if (!location?.id) return [];
  const data = await oms().get<ReservationSlot[]>(slotsBase(location.id));
  return parseStringify(data);
};

export const createReservationSlot = async (
  slot: z.infer<typeof ReservationSlotSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationSlotSchema.safeParse(slot);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().post(slotsBase(location?.id as string), validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create reservation slot",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation slot created successfully",
  );
};

export const updateReservationSlot = async (
  id: UUID,
  slot: z.infer<typeof ReservationSlotSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationSlotSchema.safeParse(slot);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().put(`${slotsBase(location?.id as string)}/${id}`, validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update reservation slot",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation slot updated successfully",
  );
};

export const deleteReservationSlot = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Reservation slot ID is required");
  const location = await getCurrentLocation();
  await oms().delete(`${slotsBase(location?.id as string)}/${id}`);
  revalidatePath("/reservations");
};

// ─── Reservation Exceptions ──────────────────────────────────────────

const exceptionsBase = (locationId: string) =>
  `/api/v1/locations/${locationId}/reservation-exceptions`;

export const fetchReservationExceptions = async (params?: {
  from?: string;
  to?: string;
}): Promise<ReservationException[]> => {
  const location = await getCurrentLocation();
  if (!location?.id) return [];

  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString();

  const data = await oms().get<ReservationException[]>(
    `${exceptionsBase(location.id)}${query ? `?${query}` : ""}`,
  );
  return parseStringify(data);
};

export const createReservationException = async (
  exception: z.infer<typeof ReservationExceptionSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationExceptionSchema.safeParse(exception);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().post(exceptionsBase(location?.id as string), validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create reservation exception",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation exception created successfully",
  );
};

export const updateReservationException = async (
  id: UUID,
  exception: z.infer<typeof ReservationExceptionSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationExceptionSchema.safeParse(exception);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().put(
      `${exceptionsBase(location?.id as string)}/${id}`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update reservation exception",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation exception updated successfully",
  );
};

export const deleteReservationException = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Reservation exception ID is required");
  const location = await getCurrentLocation();
  await oms().delete(`${exceptionsBase(location?.id as string)}/${id}`);
  revalidatePath("/reservations");
};
