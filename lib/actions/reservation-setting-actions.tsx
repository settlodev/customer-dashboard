"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import {
  ReservationSetting,
  BookingQuestion,
} from "@/types/reservation-setting/type";
import {
  ReservationSettingSchema,
  BookingQuestionSchema,
} from "@/types/reservation-setting/schema";

const oms = () => new ApiClient("orders");

// ─── Reservation Settings (one row per location, PUT upsert) ─────────

const settingsBase = (locationId: string) =>
  `/api/v1/locations/${locationId}/reservation-settings`;

export const fetchReservationSettings = async (): Promise<ReservationSetting | null> => {
  const location = await getCurrentLocation();
  if (!location?.id) return null;
  try {
    const data = await oms().get<ReservationSetting>(settingsBase(location.id));
    return parseStringify(data);
  } catch (error: unknown) {
    const e = error as { status?: number; response?: { status?: number } };
    if (e?.status === 404 || e?.response?.status === 404) return null;
    throw error;
  }
};

/**
 * Upsert reservation settings. The OMS exposes a single PUT endpoint that
 * either creates the row (first time) or updates the existing one.
 */
export const upsertReservationSettings = async (
  settings: z.infer<typeof ReservationSettingSchema>,
): Promise<FormResponse | void> => {
  const validated = ReservationSettingSchema.safeParse(settings);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().put(settingsBase(location?.id as string), validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to save reservation settings",
    );
  }

  revalidatePath("/reservations");
  return SettloErrorHandler.createSuccessResponse(
    "Reservation settings saved successfully",
  );
};

// ─── Booking Questions ───────────────────────────────────────────────

const bookingQuestionsBase = (locationId: string) =>
  `/api/v1/locations/${locationId}/booking-questions`;

export const fetchBookingQuestions = async (): Promise<BookingQuestion[]> => {
  const location = await getCurrentLocation();
  if (!location?.id) return [];
  try {
    const data = await oms().get<BookingQuestion[]>(
      bookingQuestionsBase(location.id),
    );
    return parseStringify(data);
  } catch (error: unknown) {
    const e = error as { status?: number; response?: { status?: number } };
    if (e?.status === 404 || e?.response?.status === 404) return [];
    throw error;
  }
};

export const getBookingQuestion = async (
  id: UUID,
): Promise<BookingQuestion> => {
  const location = await getCurrentLocation();
  const data = await oms().get<BookingQuestion>(
    `${bookingQuestionsBase(location?.id as string)}/${id}`,
  );
  return parseStringify(data);
};

export const createBookingQuestion = async (
  question: z.infer<typeof BookingQuestionSchema>,
): Promise<FormResponse | void> => {
  const validated = BookingQuestionSchema.safeParse(question);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().post(
      bookingQuestionsBase(location?.id as string),
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create booking question",
    );
  }

  revalidatePath("/reservations/settings");
  return SettloErrorHandler.createSuccessResponse(
    "Booking question created successfully",
  );
};

export const updateBookingQuestion = async (
  id: UUID,
  question: z.infer<typeof BookingQuestionSchema>,
): Promise<FormResponse | void> => {
  const validated = BookingQuestionSchema.safeParse(question);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  try {
    await oms().put(
      `${bookingQuestionsBase(location?.id as string)}/${id}`,
      validated.data,
    );
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update booking question",
    );
  }

  revalidatePath("/reservations/settings");
  return SettloErrorHandler.createSuccessResponse(
    "Booking question updated successfully",
  );
};

export const deleteBookingQuestion = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Booking question ID is required");
  const location = await getCurrentLocation();
  await oms().delete(`${bookingQuestionsBase(location?.id as string)}/${id}`);
  revalidatePath("/reservations/settings");
};
