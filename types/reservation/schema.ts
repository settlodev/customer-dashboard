import {
  boolean,
  number,
  object,
  string,
  enum as zenum,
  array,
  preprocess,
} from "zod";

const optionalNumber = preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  number().nonnegative().optional(),
);

const requiredNumber = (message: string) =>
  preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") return Number(val);
      return val;
    },
    number({ message }).positive(message),
  );

export const ReservationSchema = object({
  reservationDate: string({ required_error: "Reservation date is required" }),
  reservationTime: string({ required_error: "Reservation time is required" }),
  reservationEndTime: string().optional(),
  peopleCount: requiredNumber("Number of guests is required"),
  specialRequests: string().optional(),
  source: zenum(["ONLINE", "POS", "PHONE", "WALK_IN"]).optional(),
  customer: string().uuid("Please select a valid customer").optional(),
  tableAndSpace: string().uuid("Please select a valid table").optional(),
  answers: array(
    object({
      questionId: string().uuid(),
      answerText: string(),
    }),
  ).optional(),
  status: boolean().optional(),
});

export const ReservationSlotSchema = object({
  dayOfWeek: zenum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ], { required_error: "Day of week is required" }),
  startTime: string({ required_error: "Start time is required" }),
  endTime: string({ required_error: "End time is required" }),
  slotDurationMinutes: requiredNumber("Slot duration is required"),
  maxReservations: optionalNumber,
  maxGuests: optionalNumber,
  active: boolean().optional().default(true),
});

export const ReservationExceptionSchema = object({
  date: string({ required_error: "Date is required" }),
  startTime: string().optional(),
  endTime: string().optional(),
  reason: string().optional(),
  type: zenum(["CLOSED", "PRIVATE_EVENT", "HOLIDAY", "MAINTENANCE", "BLOCKED"], {
    required_error: "Exception type is required",
  }),
});

export const AvailabilityRequestSchema = object({
  date: string({ required_error: "Date is required" }),
  partySize: requiredNumber("Party size is required"),
});
