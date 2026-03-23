"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Loading from "@/components/ui/loading";
import WhatsAppButton from "@/components/whatsapp-button";
import {
  fetchPublicLocationInfo,
  fetchPublicReservationSettings,
  fetchPublicBookingQuestions,
  fetchPublicReservationSlots,
  fetchPublicReservationExceptions,
  fetchPublicAvailability,
  createPublicReservation,
} from "@/lib/actions/public-reservation-actions";
import { LocationDetails } from "@/types/menu/type";
import {
  PublicReservationSetting,
  BookingQuestion,
} from "@/types/reservation-setting/type";
import { AvailabilityResponse, AvailableSlot, ReservationSlot, ReservationException } from "@/types/reservation/type";
import {
  GuestInfo,
  ReservationStep,
} from "@/types/public-reservation/type";
import {
  CalendarDays,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  MapPin,
  Loader2,
} from "lucide-react";

interface ReservationWidgetProps {
  locationId: string;
  initialSettings?: PublicReservationSetting | null;
}

export default function ReservationWidget({
  locationId,
  initialSettings,
}: ReservationWidgetProps) {
  // --- data state ---
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [settings, setSettings] = useState<PublicReservationSetting | null>(initialSettings ?? null);
  const [bookingQuestions, setBookingQuestions] = useState<BookingQuestion[]>([]);
  const [reservationSlots, setReservationSlots] = useState<ReservationSlot[]>([]);
  const [reservationExceptions, setReservationExceptions] = useState<ReservationException[]>([]);
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);

  // --- loading / error ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- form state ---
  const [step, setStep] = useState<ReservationStep>("booking");
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [specialRequests, setSpecialRequests] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [acceptedCancellationPolicy, setAcceptedCancellationPolicy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // --- derived ---
  const primaryColor = settings?.primaryColor || "#EB7F44";
  const secondaryColor = settings?.secondaryColor || "#1A1A2E";
  const minParty = settings?.minPartySize ?? 1;
  const maxParty = settings?.maxPartySize ?? 20;
  const bookingWindowDays = settings?.bookingWindowDays ?? 30;

  // --- initial data load ---
  useEffect(() => {
    const load = async () => {
      try {
        const [loc, sett, questions, slots, exceptions] = await Promise.all([
          fetchPublicLocationInfo(locationId),
          initialSettings !== undefined
            ? Promise.resolve(initialSettings)
            : fetchPublicReservationSettings(locationId),
          fetchPublicBookingQuestions(locationId),
          fetchPublicReservationSlots(locationId),
          fetchPublicReservationExceptions(locationId),
        ]);
        setLocation(loc);
        if (!initialSettings) setSettings(sett);
        setBookingQuestions(questions.filter((q) => q.active));
        setReservationSlots(slots.filter((s) => s.active));
        setReservationExceptions(exceptions);

        if (sett && !sett.enableOnlineBooking) {
          setError("Online booking is not currently available for this location.");
        }
      } catch {
        setError("Unable to load booking information. Please try again later.");
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [locationId]);

  // --- date helpers ---
  const today = new Date();
  const minDate = new Date(today);
  if (settings?.minAdvanceBookingHours) {
    minDate.setHours(minDate.getHours() + settings.minAdvanceBookingHours);
  }
  const minDateStr = minDate.toISOString().split("T")[0];

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + bookingWindowDays);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // --- map JS day index (0=Sun) to schedule day name ---
  const JS_DAY_TO_NAME = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const scheduledDays = new Set(reservationSlots.map((s) => s.dayOfWeek));
  const closedDates = new Set(
    reservationExceptions
      .filter((e) => e.type === "CLOSED" || e.type === "HOLIDAY" || e.type === "MAINTENANCE" || e.type === "BLOCKED")
      .filter((e) => !e.startTime) // full-day closures only
      .map((e) => e.date),
  );

  const isDateDisabled = (date: Date) => {
    // outside booking window
    if (date < new Date(minDateStr + "T00:00:00") || date > new Date(maxDateStr + "T23:59:59")) return true;
    // no schedule for this day of week
    if (scheduledDays.size > 0 && !scheduledDays.has(JS_DAY_TO_NAME[date.getDay()])) return true;
    // full-day exception closure
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (closedDates.has(dateStr)) return true;
    return false;
  };

  // --- load availability ---
  const loadAvailability = useCallback(
    async (date: string, size: number) => {
      setLoadingSlots(true);
      setAvailability(null);
      setSelectedSlot(null);
      setSelectedTable(null);
      try {
        const data = await fetchPublicAvailability(locationId, date, size);
        setAvailability(data);
      } catch {
        setAvailability(null);
      } finally {
        setLoadingSlots(false);
      }
    },
    [locationId],
  );

  // --- submit reservation ---
  const handleSubmit = async () => {
    if (!selectedSlot || !selectedDate) return;

    setSubmitting(true);
    setError(null);

    const questionAnswers = Object.entries(answers)
      .filter(([, v]) => v.trim() !== "")
      .map(([bookingQuestionId, answerValue]) => ({ bookingQuestionId, answerValue }));

    const payload = {
      reservationDate: selectedDate,
      reservationTime: selectedSlot.time,
      peopleCount: partySize,
      customerFirstName: guestInfo.customerFirstName.trim(),
      customerLastName: guestInfo.customerLastName.trim(),
      customerEmail: guestInfo.customerEmail.trim() || undefined,
      customerPhone: guestInfo.customerPhone.trim() || undefined,
      specialRequests: specialRequests || undefined,
      tableAndSpace: selectedTable || undefined,
      answers: questionAnswers.length > 0 ? questionAnswers : undefined,
    };

    console.log("Reservation payload:", payload);

    const result = await createPublicReservation(locationId, payload);

    setSubmitting(false);

    if (result.success) {
      setConfirmationMessage(
        settings?.confirmationMessage ||
          "Your reservation has been submitted successfully!",
      );
      setStep("confirmation");
    } else {
      setError(result.message);
    }
  };

  // --- party size buttons ---
  const partySizeOptions = Array.from(
    { length: Math.min(maxParty, 10) - minParty + 1 },
    (_, i) => minParty + i,
  );


  // --- format time helper ---
  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${ampm}`;
  };

  // --- format date helper ---
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // --- render loading ---
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // --- render fatal error ---
  if (error && !location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mb-5">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // --- online booking disabled ---
  if (settings && !settings.enableOnlineBooking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Online Booking Unavailable
        </h2>
        <p className="text-gray-600">
          Online reservations are not currently available. Please call us to make a reservation.
        </p>
        {location?.businessPhone && (
          <a
            href={`tel:${location.businessPhone}`}
            className="mt-4 font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            {location.businessPhone}
          </a>
        )}
      </div>
    );
  }

  const steps: { key: ReservationStep; label: string }[] = [
    { key: "booking", label: "Booking" },
    { key: "details", label: "Details" },
    { key: "extras", label: "Review" },
    { key: "confirmation", label: "Confirmed" },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        {(settings?.logoUrl || location?.businessLogo) && (
          <img
            src={settings?.logoUrl || location?.businessLogo}
            alt={location?.locationName || ""}
            className="max-h-16 sm:max-h-24 mx-auto mb-2 sm:mb-3 object-contain"
          />
        )}
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: secondaryColor }}>
          {location?.locationName || "Book a Table"}
        </h1>
        {settings?.bookingPageWelcomeMessage && step !== "confirmation" && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
            {settings.bookingPageWelcomeMessage}
          </p>
        )}
      </div>

      {/* Progress */}
      {step !== "confirmation" && (
        <div className="flex items-center justify-center gap-1 mb-4 sm:mb-6">
          {steps.slice(0, 3).map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    i <= currentStepIndex
                      ? "text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  style={i <= currentStepIndex ? { backgroundColor: primaryColor } : undefined}
                >
                  {i < currentStepIndex ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{s.label}</span>
              </div>
              {i < 2 && (
                <div
                  className="w-8 sm:w-12 h-0.5 mb-4 sm:mb-5"
                  style={{ backgroundColor: i < currentStepIndex ? primaryColor : "#e5e7eb" }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && step !== "confirmation" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========= STEP 1: GUESTS, DATE & TIME ========= */}
      {step === "booking" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Number of guests - shown first on mobile for better flow */}
          <div className="sm:hidden">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1.5" />
              Number of Guests
            </label>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${partySizeOptions.length <= 6 ? partySizeOptions.length : Math.ceil(partySizeOptions.length / 2)}, 1fr)` }}
            >
              {partySizeOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setPartySize(n);
                    if (selectedDate) {
                      loadAvailability(selectedDate, n);
                    }
                  }}
                  className={`h-10 rounded-full text-sm font-medium transition-colors ${
                    partySize === n
                      ? "text-white"
                      : "bg-white border border-gray-300 text-gray-700"
                  }`}
                  style={partySize === n
                    ? { backgroundColor: primaryColor }
                    : undefined
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            {partySize === maxParty && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium text-xs">Need more seats?</p>
                <p className="text-amber-600 text-xs mt-1">
                  For parties larger than {maxParty}, please contact us directly.
                </p>
                {location?.businessPhone && (
                  <a
                    href={`tel:${location.businessPhone}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Call {location.businessPhone}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Calendar + Guests (desktop side-by-side) */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6">
            {/* Calendar */}
            <div className="flex flex-col items-center sm:items-start">
              <label className="block text-sm font-medium text-gray-700 mb-2 self-start">
                <CalendarDays className="w-4 h-4 inline mr-1.5" />
                Select Date
              </label>
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    setSelectedDate(dateStr);
                    loadAvailability(dateStr, partySize);
                  } else {
                    setSelectedDate("");
                  }
                }}
                disabled={isDateDisabled}
                fromDate={new Date(minDateStr + "T00:00:00")}
                toDate={new Date(maxDateStr + "T23:59:59")}
                className="rounded-md border w-full"
                classNames={{
                  day_selected: "text-white rounded-md hover:text-white focus:text-white",
                }}
                modifiersStyles={{
                  selected: { backgroundColor: primaryColor, color: "white" },
                }}
              />
            </div>

            {/* Vertical divider */}
            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

            {/* Number of guests (desktop) + Time slots */}
            <div className="space-y-4 sm:space-y-6">
              {/* Guests - desktop only (mobile version is above) */}
              <div className="hidden sm:block">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="w-4 h-4 inline mr-1.5" />
                  Number of Guests
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {partySizeOptions.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setPartySize(n);
                        if (selectedDate) {
                          loadAvailability(selectedDate, n);
                        }
                      }}
                      className={`w-11 h-11 rounded-full text-sm font-medium transition-colors ${
                        partySize === n
                          ? "text-white"
                          : "bg-white border border-gray-300 text-gray-700"
                      }`}
                      style={partySize === n
                        ? { backgroundColor: primaryColor }
                        : undefined
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {partySize === maxParty && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    <p className="font-medium">Need more seats?</p>
                    <p className="text-amber-600 text-xs mt-1">
                      For parties larger than {maxParty}, please contact us directly to arrange your reservation.
                    </p>
                    {location?.businessPhone && (
                      <a
                        href={`tel:${location.businessPhone}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                        style={{ color: primaryColor }}
                      >
                        Call {location.businessPhone}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1.5" />
                    Select Time
                  </label>

                  {loadingSlots && (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" style={{ color: primaryColor }} />
                      <span className="ml-2 text-sm text-gray-500">
                        Checking availability...
                      </span>
                    </div>
                  )}

                  {!loadingSlots && availability && !availability.locationOpen && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-amber-800 font-medium text-sm">
                        Location is closed on this date
                      </p>
                      {availability.closureReason && (
                        <p className="text-amber-600 text-xs sm:text-sm mt-1">
                          {availability.closureReason}
                        </p>
                      )}
                    </div>
                  )}

                  {!loadingSlots &&
                    availability &&
                    availability.locationOpen &&
                    availability.slots.length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 sm:p-6 text-center">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500">
                          No available slots
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try a different date or number of guests
                        </p>
                      </div>
                    )}

                  {!loadingSlots &&
                    availability &&
                    availability.locationOpen &&
                    availability.slots.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {availability.slots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSelectedTable(null);
                            }}
                            disabled={!slot.pacingAvailable}
                            className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                              selectedSlot?.time === slot.time
                                ? "text-white"
                                : slot.pacingAvailable
                                  ? "bg-white border border-gray-300 text-gray-700"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            style={selectedSlot?.time === slot.time
                              ? { backgroundColor: primaryColor }
                              : undefined
                            }
                          >
                            {formatTime(slot.time)}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Table preference */}
          {settings?.allowGuestTablePreference && selectedSlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1.5" />
                Preferred Seating <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              {(() => {
                const tables = selectedSlot.availableTables || [];
                const combinations = selectedSlot.availableCombinations || [];
                if (tables.length === 0 && combinations.length === 0) {
                  return (
                    <p className="text-xs text-gray-400">
                      No specific seating options available for this time.
                    </p>
                  );
                }
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                    {tables.map((table) => (
                      <button
                        key={`table-${table.id}`}
                        onClick={() =>
                          setSelectedTable(selectedTable === table.id ? null : table.id)
                        }
                        className={`p-2.5 sm:p-3 rounded-lg text-sm transition-colors text-left ${
                          selectedTable === table.id
                            ? "text-white"
                            : "bg-white border border-gray-300 text-gray-700"
                        }`}
                        style={selectedTable === table.id
                          ? { backgroundColor: primaryColor }
                          : undefined
                        }
                      >
                        <span className="font-medium block">{table.name}</span>
                        <span className={`text-xs ${selectedTable === table.id ? "text-white/80" : "text-gray-400"}`}>
                          {table.type.charAt(0) + table.type.slice(1).toLowerCase()} · Up to {table.capacity}
                        </span>
                      </button>
                    ))}
                    {combinations.map((combo) => (
                      <button
                        key={`combo-${combo.id}`}
                        onClick={() =>
                          setSelectedTable(selectedTable === combo.id ? null : combo.id)
                        }
                        className={`p-3 rounded-lg text-sm transition-colors text-left ${
                          selectedTable === combo.id
                            ? "text-white"
                            : "bg-white border border-gray-300 text-gray-700"
                        }`}
                        style={selectedTable === combo.id
                          ? { backgroundColor: primaryColor }
                          : undefined
                        }
                      >
                        <span className="font-medium block">{combo.name}</span>
                        <span className={`text-xs ${selectedTable === combo.id ? "text-white/80" : "text-gray-400"}`}>
                          Combined · Up to {combo.capacity}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Continue button */}
          <Button
            onClick={() => {
              setError(null);
              setStep("details");
            }}
            disabled={!selectedSlot}
            className="w-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ========= STEP 3: GUEST DETAILS ========= */}
      {step === "details" && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="bg-gray-100 rounded-lg p-2.5 sm:p-3 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:justify-between text-xs sm:text-sm">
            <span className="text-gray-600 text-center sm:text-left">
              <Users className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
              {partySize} {partySize === 1 ? "guest" : "guests"}
            </span>
            <span className="text-gray-600 text-center">
              <CalendarDays className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
              {(() => {
                const d = new Date(selectedDate + "T00:00:00");
                return (
                  <>
                    <span className="sm:hidden">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="hidden sm:inline">{formatDate(selectedDate)}</span>
                  </>
                );
              })()}
            </span>
            <span className="text-gray-600 text-center sm:text-right">
              <Clock className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
              {selectedSlot && formatTime(selectedSlot.time)}
            </span>
          </div>

          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={guestInfo.customerFirstName}
                onChange={(e) =>
                  setGuestInfo((prev) => ({
                    ...prev,
                    customerFirstName: e.target.value,
                  }))
                }
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={guestInfo.customerLastName}
                onChange={(e) =>
                  setGuestInfo((prev) => ({
                    ...prev,
                    customerLastName: e.target.value,
                  }))
                }
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              Email Address {settings?.requireGuestEmail ? "*" : ""}
            </Label>
            <Input
              id="email"
              type="email"
              value={guestInfo.customerEmail}
              onChange={(e) =>
                setGuestInfo((prev) => ({ ...prev, customerEmail: e.target.value }))
              }
              placeholder="john@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">
              Phone Number {settings?.requireGuestPhone ? "*" : ""}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={guestInfo.customerPhone}
              onChange={(e) =>
                setGuestInfo((prev) => ({ ...prev, customerPhone: e.target.value }))
              }
              placeholder="+255 700 000 000"
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("booking")}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={() => {
                setError(null);
                setStep("extras");
              }}
              disabled={
                !guestInfo.customerFirstName.trim() ||
                !guestInfo.customerLastName.trim() ||
                (settings?.requireGuestEmail && !guestInfo.customerEmail.trim()) ||
                (settings?.requireGuestPhone && !guestInfo.customerPhone.trim())
              }
              className="flex-1 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========= STEP 3: EXTRAS & REVIEW ========= */}
      {step === "extras" && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="bg-gray-100 rounded-lg p-2.5 sm:p-3 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:justify-between text-xs sm:text-sm">
            <span className="text-gray-600 text-center sm:text-left">
              <Users className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
              {partySize} {partySize === 1 ? "guest" : "guests"}
            </span>
            <span className="text-gray-600 text-center">
              <CalendarDays className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
              {(() => {
                const d = new Date(selectedDate + "T00:00:00");
                return (
                  <>
                    <span className="sm:hidden">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="hidden sm:inline">{formatDate(selectedDate)}</span>
                  </>
                );
              })()}
            </span>
            <span className="text-gray-600 text-center sm:text-right">
              <Clock className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
              {selectedSlot && formatTime(selectedSlot.time)}
            </span>
          </div>

          {/* Special requests */}
          {settings?.allowSpecialRequests !== false && (
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any dietary requirements, accessibility needs, or special occasions..."
                rows={3}
              />
            </div>
          )}

          {/* Booking questions */}
          {bookingQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Additional Information
              </h3>
              {bookingQuestions.map((q) => (
                <BookingQuestionField
                  key={q.id}
                  question={q}
                  value={answers[q.id] ?? ""}
                  onChange={(val) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: val }))
                  }
                />
              ))}
            </div>
          )}

          {/* Deposit info */}
          {settings?.requireDeposit && settings.defaultDepositAmount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium">Deposit Required</p>
              <p className="text-blue-600 text-xs mt-1">
                A deposit of{" "}
                {settings.depositPerGuest
                  ? `${settings.defaultDepositAmount.toLocaleString()} per guest (${(settings.defaultDepositAmount * partySize).toLocaleString()} total)`
                  : settings.defaultDepositAmount.toLocaleString()}{" "}
                is required for this reservation.
              </p>
            </div>
          )}

          {/* Cancellation policy acceptance */}
          {settings?.cancellationPolicyText && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-600 mb-1">
                Cancellation Policy
              </p>
              <p className="mb-2">{settings.cancellationPolicyText}</p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accept-cancellation"
                  checked={acceptedCancellationPolicy}
                  onCheckedChange={(checked) =>
                    setAcceptedCancellationPolicy(checked === true)
                  }
                />
                <Label htmlFor="accept-cancellation" className="font-normal text-xs text-gray-600">
                  I have read and accept the cancellation policy *
                </Label>
              </div>
            </div>
          )}

          {/* Terms acceptance */}
          {settings?.termsAndConditions && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-600 mb-1">
                Terms & Conditions
              </p>
              <p className="mb-2">{settings.termsAndConditions}</p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(checked === true)
                  }
                />
                <Label htmlFor="accept-terms" className="font-normal text-xs text-gray-600">
                  I have read and accept the terms and conditions *
                </Label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("details")}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                (!!settings?.cancellationPolicyText && !acceptedCancellationPolicy) ||
                (!!settings?.termsAndConditions && !acceptedTerms)
              }
              className="flex-1 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Reservation"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ========= STEP 4: CONFIRMATION ========= */}
      {step === "confirmation" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold" style={{ color: secondaryColor }}>
              Reservation Confirmed!
            </h2>
            <p className="text-gray-500 mt-2 text-sm">{confirmationMessage}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>
                {partySize} {partySize === 1 ? "guest" : "guests"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{selectedSlot && formatTime(selectedSlot.time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{location?.locationName || location?.businessName}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              setStep("booking");
              setSelectedDate("");
              setSelectedSlot(null);
              setSelectedTable(null);
              setGuestInfo({ customerFirstName: "", customerLastName: "", customerEmail: "", customerPhone: "" });
              setSpecialRequests("");
              setAnswers({});
              setAcceptedCancellationPolicy(false);
              setAcceptedTerms(false);
              setError(null);
              setAvailability(null);
            }}
            variant="outline"
            className="w-full"
          >
            Make Another Reservation
          </Button>

        </div>
      )}

      {/* Powered by Settlo */}
      <div className="mt-6 sm:mt-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <div className="pt-4 pb-16">
        <a
          href="https://settlo.co.tz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          Powered by
          <img
            src="/images/logo_new.png"
            alt="Settlo"
            className="h-4 opacity-60"
          />
        </a>
      </div>

      {/* Business WhatsApp button */}
      {location?.businessPhone && (
        <WhatsAppButton
          phoneNumber={location.businessPhone}
          customMessage={`Hi${location.locationName ? ` ${location.locationName}` : ""}, I'd like to make a reservation. Could you help me with availability?`}
        />
      )}
    </div>
  );
}

// --- Booking Question Field sub-component ---

function BookingQuestionField({
  question,
  value,
  onChange,
}: {
  question: BookingQuestion;
  value: string;
  onChange: (val: string) => void;
}) {
  const required = question.required;

  switch (question.questionType) {
    case "FREE_TEXT":
      return (
        <div>
          <Label>
            {question.questionText} {required && "*"}
          </Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer..."
          />
        </div>
      );

    case "SINGLE_SELECT":
      return (
        <div>
          <Label>
            {question.questionText} {required && "*"}
          </Label>
          <RadioGroup value={value} onValueChange={onChange}>
            {question.options
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((opt) => (
                <div key={opt.optionValue} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={opt.optionValue}
                    id={`${question.id}-${opt.optionValue}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${opt.optionValue}`}
                    className="font-normal"
                  >
                    {opt.optionValue}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        </div>
      );

    case "MULTI_SELECT": {
      const selected = value ? value.split(",").filter(Boolean) : [];
      const toggle = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        onChange(next.join(","));
      };
      return (
        <div>
          <Label>
            {question.questionText} {required && "*"}
          </Label>
          <div className="space-y-2 mt-1">
            {question.options
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((opt) => (
                <div
                  key={opt.optionValue}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${question.id}-${opt.optionValue}`}
                    checked={selected.includes(opt.optionValue)}
                    onCheckedChange={() => toggle(opt.optionValue)}
                  />
                  <Label
                    htmlFor={`${question.id}-${opt.optionValue}`}
                    className="font-normal"
                  >
                    {opt.optionValue}
                  </Label>
                </div>
              ))}
          </div>
        </div>
      );
    }

    case "ACKNOWLEDGEMENT":
      return (
        <div className="flex items-start space-x-2">
          <Checkbox
            id={`ack-${question.id}`}
            checked={value === "true"}
            onCheckedChange={(checked) =>
              onChange(checked ? "true" : "")
            }
          />
          <Label htmlFor={`ack-${question.id}`} className="font-normal text-sm">
            {question.questionText} {required && "*"}
          </Label>
        </div>
      );

    default:
      return null;
  }
}
