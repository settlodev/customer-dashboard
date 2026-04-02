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

// ─── Deposit Payment (Selcom Push-to-Pay Simulation) ─────────────────
// In production, this would call the Selcom USSD Push API to send a
// payment prompt to the customer's phone. For now, we simulate the flow.

const paymentSessions = new Map<string, { status: string; createdAt: number }>();

export const initiateDepositPayment = async (
  phoneNumber: string,
  amount: number,
  reservationRef: string,
): Promise<{ success: boolean; transactionId: string; message: string }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Validate phone number (Tanzanian format)
  const cleaned = phoneNumber.replace(/\s+/g, "").replace(/^0/, "255").replace(/^\+/, "");
  if (!/^255\d{9}$/.test(cleaned)) {
    return {
      success: false,
      transactionId: "",
      message: "Invalid phone number. Please use a valid Tanzanian number (e.g., 0712 345 678).",
    };
  }

  // Generate a simulated transaction ID
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Store session (simulating Selcom push sent)
  paymentSessions.set(transactionId, { status: "PENDING", createdAt: Date.now() });

  // In production: POST to Selcom USSD Push API
  // await selcomClient.post('/checkout/create-order', {
  //   vendor: 'SETTLO',
  //   order_id: reservationRef,
  //   buyer_phone: cleaned,
  //   amount,
  //   currency: 'TZS',
  //   payment_methods: 'USSD-PUSH',
  // });

  return {
    success: true,
    transactionId,
    message: `Payment request of TZS ${amount.toLocaleString()} sent to ${phoneNumber}. Please approve on your phone.`,
  };
};

export const checkDepositPaymentStatus = async (
  transactionId: string,
): Promise<{ status: "PENDING" | "PAID" | "FAILED"; message: string }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const session = paymentSessions.get(transactionId);

  if (!session) {
    return { status: "FAILED", message: "Transaction not found." };
  }

  // Simulate: after 4 seconds from creation, mark as PAID
  const elapsed = Date.now() - session.createdAt;
  if (elapsed > 4000) {
    session.status = "PAID";
    return { status: "PAID", message: "Payment confirmed successfully!" };
  }

  return { status: "PENDING", message: "Waiting for payment confirmation..." };
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
