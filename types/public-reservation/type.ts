export interface PublicReservationPayload {
  reservationDate: string;
  reservationTime: string;
  peopleCount: number;
  specialRequests?: string;
  customer?: string;
  answers?: { questionId: string; answerText: string }[];
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export type ReservationStep = "guests" | "datetime" | "details" | "confirmation";
