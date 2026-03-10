"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
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
  let formResponse: FormResponse | null = null;
  const validated = ReservationSettingSchema.safeParse(settings);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/reservation-settings/${location?.id}/create`, validated.data);
    formResponse = {
      responseType: "success",
      message: "Reservation settings created successfully",
    };
  } catch (error) {
    console.error("Error creating reservation settings", error);
    formResponse = {
      responseType: "error",
      message: "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }


  return parseStringify(formResponse);
};

export const updateReservationSettings = async (
  settings: z.infer<typeof ReservationSettingSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = ReservationSettingSchema.safeParse(settings);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/reservation-settings/${location?.id}`, validated.data);
    formResponse = {
      responseType: "success",
      message: "Reservation settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating reservation settings", error);
    formResponse = {
      responseType: "error",
      message: "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }


  return parseStringify(formResponse);
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
  let formResponse: FormResponse | null = null;
  const validated = BookingQuestionSchema.safeParse(question);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/booking-questions/${location?.id}/create`, validated.data);
    formResponse = {
      responseType: "success",
      message: "Booking question created successfully",
    };
  } catch (error) {
    console.error("Error creating booking question", error);
    formResponse = {
      responseType: "error",
      message: "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }


  return parseStringify(formResponse);
};

export const updateBookingQuestion = async (
  id: UUID,
  question: z.infer<typeof BookingQuestionSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = BookingQuestionSchema.safeParse(question);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/booking-questions/${location?.id}/${id}`, validated.data);
    formResponse = {
      responseType: "success",
      message: "Booking question updated successfully",
    };
  } catch (error) {
    console.error("Error updating booking question", error);
    formResponse = {
      responseType: "error",
      message: "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }


  return parseStringify(formResponse);
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
