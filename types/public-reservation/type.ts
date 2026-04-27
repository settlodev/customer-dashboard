export interface PublicReservationPayload {
  reservationDate: string;
  reservationTime: string;
  peopleCount: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone?: string;
  specialRequests?: string;
  tableAndSpace?: string;
  answers?: { bookingQuestionId: string; answerValue: string }[];
}

export interface GuestInfo {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
}

export type ReservationStep = "booking" | "details" | "extras" | "deposit" | "confirmation";
