"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { FormResponse } from "@/types/types";

import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { ReservationSetting, BookingQuestion } from "@/types/reservation-setting/type";
import {
  ReservationSettingSchema,
  BookingQuestionSchema,
} from "@/types/reservation-setting/schema";

// ─── Reservation Settings ────────────────────────────────────────────

export const fetchReservationSettings = async (): Promise<ReservationSetting | null> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/reservation-settings/${location?.id}`);
    return parseStringify(data);
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

export const createReservationSettings = async (
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
    const apiClient = new ApiClient();
    await apiClient.post(`/api/reservation-settings/${location?.id}/create`, validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to create reservation settings");
  }

  return SettloErrorHandler.createSuccessResponse("Reservation settings created successfully");
};

export const updateReservationSettings = async (
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
    const apiClient = new ApiClient();
    await apiClient.put(`/api/reservation-settings/${location?.id}`, validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to update reservation settings");
  }

  return SettloErrorHandler.createSuccessResponse("Reservation settings updated successfully");
};

// ─── Booking Questions ───────────────────────────────────────────────

export const fetchBookingQuestions = async (): Promise<BookingQuestion[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/booking-questions/${location?.id}`);
    return parseStringify(data);
  } catch (error: any) {
    if (error?.response?.status === 404) return [];
    throw error;
  }
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
    const apiClient = new ApiClient();
    await apiClient.post(`/api/booking-questions/${location?.id}/create`, validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to create booking question");
  }

  return SettloErrorHandler.createSuccessResponse("Booking question created successfully");
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
    const apiClient = new ApiClient();
    await apiClient.put(`/api/booking-questions/${location?.id}/${id}`, validated.data);
  } catch (error: unknown) {
    return SettloErrorHandler.createErrorResponse(error, "Failed to update booking question");
  }

  return SettloErrorHandler.createSuccessResponse("Booking question updated successfully");
};

export const deleteBookingQuestion = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Booking question ID is required");

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/booking-questions/${location?.id}/${id}`);
  } catch (error) {
    throw error;
  }
};
