"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
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
} from "@/types/reservation/type";
import {
  ReservationSchema,
  ReservationSlotSchema,
  ReservationExceptionSchema,
} from "@/types/reservation/schema";

// ─── Reservations ─────────────────────────────────────────────────────

export const fetchAllReservations = async (): Promise<Reservation[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/reservations/${location?.id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const searchReservation = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Reservation>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        {
          key: "customer.firstName",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
        {
          key: "customer.lastName",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
      ],
      sorts: [
        {
          key: "reservationDate",
          direction: "DESC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = await getCurrentLocation();
    const data = await apiClient.post(
      `/api/reservations/${location?.id}`,
      query,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

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

  const payload = {
    ...validated.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/reservations/${location?.id}/create`, payload);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to create reservation");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation created successfully");
};

export const getReservation = async (
  id: UUID,
): Promise<ApiResponse<Reservation>> => {
  const apiClient = new ApiClient();
  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };
  const location = await getCurrentLocation();
  const data = await apiClient.post(`/api/reservations/${location?.id}`, query);
  return parseStringify(data);
};

export const getReservationById = async (id: UUID): Promise<Reservation> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const data = await apiClient.get(`/api/reservations/${location?.id}/${id}`);
  return parseStringify(data);
};

export const updateReservation = async (
  id: UUID,
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

  const payload = {
    ...validated.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/reservations/${location?.id}/${id}`, payload);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to update reservation");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation updated successfully");
};

export const updateReservationStatus = async (
  id: UUID,
  status: string,
): Promise<FormResponse | void> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.put(
      `/api/reservations/${location?.id}/${id}/status?status=${status}`,
      {},
    );
  } catch (error: unknown) {
    revalidatePath("/reservations");
    return SettloErrorHandler.createErrorResponse(error, "Failed to update reservation status");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation status updated successfully");
};

export const deleteReservation = async (id: UUID): Promise<void> => {
  if (!id)
    throw new Error("Reservation ID is required to perform this request");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/reservations/${location?.id}/${id}`);
    revalidatePath("/reservations");
  } catch (error) {
    throw error;
  }
};

export const checkAvailability = async (
  date: string,
  partySize: number,
): Promise<AvailabilityResponse> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const data = await apiClient.post(
    `/api/reservations/${location?.id}/availability`,
    { date, partySize },
  );
  return parseStringify(data);
};

export const allocateTable = async (
  date: string,
  time: string,
  partySize: number,
): Promise<TableAllocationResult> => {
  await getAuthenticatedUser();
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();
  const data = await apiClient.get(
    `/api/reservations/${location?.id}/allocate?date=${date}&time=${time}&partySize=${partySize}`,
  );
  return parseStringify(data);
};

// ─── Reservation Slots ────────────────────────────────────────────────

export const fetchReservationSlots = async (): Promise<ReservationSlot[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/reservation-slots/${location?.id}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
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
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/reservation-slots/${location?.id}/create`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to create reservation slot");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation slot created successfully");
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
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/reservation-slots/${location?.id}/${id}`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to update reservation slot");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation slot updated successfully");
};

export const deleteReservationSlot = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Reservation slot ID is required");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/reservation-slots/${location?.id}/${id}`);
    revalidatePath("/reservations");
  } catch (error) {
    throw error;
  }
};

// ─── Reservation Exceptions ──────────────────────────────────────────

export const fetchReservationExceptions = async (): Promise<
  ReservationException[]
> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(
      `/api/reservation-exceptions/${location?.id}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
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
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/reservation-exceptions/${location?.id}/create`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to create reservation exception");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation exception created successfully");
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
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/reservation-exceptions/${location?.id}/${id}`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to update reservation exception");
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse("Reservation exception updated successfully");
};

export const deleteReservationException = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Reservation exception ID is required");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/reservation-exceptions/${location?.id}/${id}`);
    revalidatePath("/reservations");
  } catch (error) {
    throw error;
  }
};
