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

// ─── Create Reservation ──────────────────────────────────────────────

export const createPublicReservation = async (
  locationId: string,
  payload: PublicReservationPayload,
): Promise<{ success: boolean; message: string; reservationId?: string }> => {
  try {
    const apiClient = createPublicClient();
    const reservationId = await apiClient.post(
      `/api/reservations/${locationId}/create`,
      {
        ...payload,
        source: "ONLINE",
        location: locationId,
      },
    );
    return {
      success: true,
      message: "Reservation created successfully",
      reservationId: String(reservationId),
    };
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

// ─── Deposit Payment (via Payment Service) ───────────────────────────

export const payReservationDeposit = async (
  locationId: string,
  reservationId: string,
  customerPhone: string,
): Promise<{
  success: boolean;
  paymentStatus: "PROCESSING" | "SUCCESS" | "FAILED";
  externalReferenceId?: string;
  message: string;
}> => {
  try {
    const apiClient = createPublicClient();
    const data: { paymentStatus: string; externalReferenceId?: string } =
      await apiClient.post(
        `/api/reservations/${locationId}/${reservationId}/pay-deposit`,
        { customerPhone },
      );

    const result = parseStringify(data);
    return {
      success: true,
      paymentStatus: result.paymentStatus as "PROCESSING" | "SUCCESS",
      externalReferenceId: result.externalReferenceId,
      message:
        result.paymentStatus === "SUCCESS"
          ? "Payment confirmed!"
          : "Payment request sent to your phone. Please approve.",
    };
  } catch (error: any) {
    let message = "Payment failed. Please try again.";
    if (typeof error?.message === "string") {
      message = error.message;
    } else if (typeof error?.message === "object" && error.message?.message) {
      message = error.message.message;
    }
    return { success: false, paymentStatus: "FAILED", message };
  }
};

export const checkPaymentTransactionStatus = async (
  externalReferenceId: string,
): Promise<{ status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"; message: string }> => {
  try {
    const baseUrl = process.env.SERVICE_URL || "";
    const response = await fetch(
      `${baseUrl}/payments/api/v1/transactions/${externalReferenceId}/status`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return { status: "PENDING", message: "Checking payment status..." };
    }

    const data = await response.json();
    const status = data.status || data.paymentStatus || "PENDING";

    if (status === "SUCCESS" || status === "COMPLETED") {
      return { status: "SUCCESS", message: "Payment confirmed successfully!" };
    }
    if (status === "FAILED" || status === "CANCELLED") {
      return { status: "FAILED", message: data.message || "Payment failed." };
    }

    return { status: "PENDING", message: "Waiting for payment confirmation..." };
  } catch {
    return { status: "PENDING", message: "Checking payment status..." };
  }
};
