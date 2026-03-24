"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationDetails } from "@/types/menu/type";
import { AvailabilityResponse, ReservationSlot, ReservationException } from "@/types/reservation/type";
import { PublicReservationSetting, BookingQuestion } from "@/types/reservation-setting/type";
import { PublicReservationPayload } from "@/types/public-reservation/type";

const API_KEY =
  "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a";

function createPublicClient(): ApiClient {
  const client = new ApiClient();
  client.isPlain = true;
  return client;
}

export const fetchPublicLocationInfo = async (
  locationId: string,
): Promise<LocationDetails> => {
  const apiClient = createPublicClient();
  const data = await apiClient.get<LocationDetails>(
    `/api/menu/${locationId}`,
    {
      headers: { "SETTLO-API-KEY": API_KEY },
    },
  );
  return parseStringify(data);
};

export const fetchPublicReservationSettings = async (
  locationId: string,
): Promise<PublicReservationSetting | null> => {
  try {
    const apiClient = createPublicClient();
    const data = await apiClient.get(
      `/api/reservation-settings/${locationId}`,
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
};

export const fetchPublicBookingQuestions = async (
  locationId: string,
): Promise<BookingQuestion[]> => {
  try {
    const apiClient = createPublicClient();
    const data = await apiClient.get(`/api/booking-questions/${locationId}`);
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return [];
    throw error;
  }
};

export const fetchPublicReservationSlots = async (
  locationId: string,
): Promise<ReservationSlot[]> => {
  try {
    const apiClient = createPublicClient();
    const data = await apiClient.get(`/api/reservation-slots/${locationId}`);
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return [];
    throw error;
  }
};

export const fetchPublicReservationExceptions = async (
  locationId: string,
): Promise<ReservationException[]> => {
  try {
    const apiClient = createPublicClient();
    const data = await apiClient.get(`/api/reservation-exceptions/${locationId}`);
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return [];
    throw error;
  }
};

export const fetchPublicAvailability = async (
  locationId: string,
  date: string,
  partySize: number,
): Promise<AvailabilityResponse> => {
  const apiClient = createPublicClient();
  const data = await apiClient.post(
    `/api/reservations/${locationId}/availability`,
    { date, partySize },
  );
  return parseStringify(data);
};

export const createPublicReservation = async (
  locationId: string,
  payload: PublicReservationPayload,
): Promise<{ success: boolean; message: string }> => {
  try {
    const apiClient = createPublicClient();
    await apiClient.post(`/api/reservations/${locationId}/create`, {
      ...payload,
      source: "ONLINE",
      location: locationId,
    });
    return { success: true, message: "Reservation created successfully" };
  } catch (error: any) {
    let message = "Failed to create reservation. Please try again.";
    if (typeof error?.message === "string") {
      message = error.message;
    } else if (typeof error?.message === "object" && error.message?.message) {
      message = error.message.message;
    }
    return { success: false, message };
  }
};
