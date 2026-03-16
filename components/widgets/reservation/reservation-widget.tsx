"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Loading from "@/components/ui/loading";
import {
  fetchPublicLocationInfo,
  fetchPublicReservationSettings,
  fetchPublicBookingQuestions,
  fetchPublicAvailability,
  createPublicReservation,
} from "@/lib/actions/public-reservation-actions";
import { LocationDetails } from "@/types/menu/type";
import {
  ReservationSetting,
  BookingQuestion,
} from "@/types/reservation-setting/type";
import { AvailabilityResponse, AvailableSlot } from "@/types/reservation/type";
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
}

export default function ReservationWidget({
  locationId,
}: ReservationWidgetProps) {
  // --- data state ---
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [settings, setSettings] = useState<ReservationSetting | null>(null);
  const [bookingQuestions, setBookingQuestions] = useState<BookingQuestion[]>([]);
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);

  // --- loading / error ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- form state ---
  const [step, setStep] = useState<ReservationStep>("guests");
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [specialRequests, setSpecialRequests] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // --- derived ---
  const minParty = settings?.minPartySize ?? 1;
  const maxParty = settings?.maxPartySize ?? 20;
  const bookingWindowDays = settings?.bookingWindowDays ?? 30;

  // --- initial data load ---
  useEffect(() => {
    const load = async () => {
      try {
        const [loc, sett, questions] = await Promise.all([
          fetchPublicLocationInfo(locationId),
          fetchPublicReservationSettings(locationId),
          fetchPublicBookingQuestions(locationId),
        ]);
        setLocation(loc);
        setSettings(sett);
        setBookingQuestions(questions.filter((q) => q.active));

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

  // --- load availability ---
  const loadAvailability = useCallback(
    async (date: string, size: number) => {
      setLoadingSlots(true);
      setAvailability(null);
      setSelectedSlot(null);
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
      .map(([questionId, answerText]) => ({ questionId, answerText }));

    const result = await createPublicReservation(locationId, {
      reservationDate: selectedDate,
      reservationTime: selectedSlot.time,
      peopleCount: partySize,
      specialRequests: specialRequests || undefined,
      answers: questionAnswers.length > 0 ? questionAnswers : undefined,
    });

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
  const showLargerPartyInput = maxParty > 10;

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
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600">{error}</p>
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
            className="mt-4 text-[#EB7F44] font-medium hover:underline"
          >
            {location.businessPhone}
          </a>
        )}
      </div>
    );
  }

  const steps: { key: ReservationStep; label: string }[] = [
    { key: "guests", label: "Guests" },
    { key: "datetime", label: "Date & Time" },
    { key: "details", label: "Details" },
    { key: "confirmation", label: "Confirmed" },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        {location?.businessLogo && (
          <img
            src={location.businessLogo}
            alt={location.businessName}
            className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
          />
        )}
        <h1 className="text-xl font-bold text-gray-900">
          {location?.businessName || "Book a Table"}
        </h1>
        {location?.locationName && (
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {location.locationName}
          </p>
        )}
        {settings?.bookingPageWelcomeMessage && step !== "confirmation" && (
          <p className="text-sm text-gray-500 mt-2">
            {settings.bookingPageWelcomeMessage}
          </p>
        )}
      </div>

      {/* Progress */}
      {step !== "confirmation" && (
        <div className="flex items-center justify-center gap-1 mb-6">
          {steps.slice(0, 3).map((s, i) => (
            <React.Fragment key={s.key}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < currentStepIndex
                    ? "bg-[#EB7F44] text-white"
                    : i === currentStepIndex
                      ? "bg-[#EB7F44] text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < currentStepIndex ? "bg-[#EB7F44]" : "bg-gray-200"
                  }`}
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

      {/* ========= STEP 1: PARTY SIZE ========= */}
      {step === "guests" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="w-4 h-4 inline mr-1.5" />
              Number of Guests
            </label>
            <div className="flex flex-wrap gap-2">
              {partySizeOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => setPartySize(n)}
                  className={`w-11 h-11 rounded-full text-sm font-medium transition-colors ${
                    partySize === n
                      ? "bg-[#EB7F44] text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-[#EB7F44]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {showLargerPartyInput && partySize > 10 && (
              <div className="mt-3">
                <Input
                  type="number"
                  min={minParty}
                  max={maxParty}
                  value={partySize}
                  onChange={(e) =>
                    setPartySize(
                      Math.max(minParty, Math.min(maxParty, Number(e.target.value))),
                    )
                  }
                  className="w-24"
                />
              </div>
            )}
            {showLargerPartyInput && partySize <= 10 && (
              <button
                onClick={() => setPartySize(11)}
                className="mt-2 text-sm text-[#EB7F44] hover:underline"
              >
                Larger party?
              </button>
            )}
          </div>

          <Button
            onClick={() => setStep("datetime")}
            className="w-full bg-[#EB7F44] hover:bg-[#d9703b] text-white"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ========= STEP 2: DATE & TIME ========= */}
      {step === "datetime" && (
        <div className="space-y-6">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarDays className="w-4 h-4 inline mr-1.5" />
              Select Date
            </label>
            <Input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) {
                  loadAvailability(e.target.value, partySize);
                }
              }}
              className="w-full"
            />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Select Time
              </label>

              {loadingSlots && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#EB7F44]" />
                  <span className="ml-2 text-sm text-gray-500">
                    Checking availability...
                  </span>
                </div>
              )}

              {!loadingSlots && availability && !availability.locationOpen && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-amber-800 font-medium">
                    Location is closed on this date
                  </p>
                  {availability.closureReason && (
                    <p className="text-amber-600 text-sm mt-1">
                      {availability.closureReason}
                    </p>
                  )}
                </div>
              )}

              {!loadingSlots &&
                availability &&
                availability.locationOpen &&
                availability.slots.length === 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-600">
                      No available time slots for this date and party size.
                    </p>
                  </div>
                )}

              {!loadingSlots &&
                availability &&
                availability.locationOpen &&
                availability.slots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availability.slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.pacingAvailable}
                        className={`py-2.5 px-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedSlot?.time === slot.time
                            ? "bg-[#EB7F44] text-white"
                            : slot.pacingAvailable
                              ? "bg-white border border-gray-300 text-gray-700 hover:border-[#EB7F44]"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("guests")}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              disabled={!selectedSlot}
              className="flex-1 bg-[#EB7F44] hover:bg-[#d9703b] text-white"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========= STEP 3: GUEST DETAILS ========= */}
      {step === "details" && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              {partySize} {partySize === 1 ? "guest" : "guests"}
            </span>
            <span className="text-gray-600">
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
              {formatDate(selectedDate)}
            </span>
            <span className="text-gray-600">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {selectedSlot && formatTime(selectedSlot.time)}
            </span>
          </div>

          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={guestInfo.firstName}
                onChange={(e) =>
                  setGuestInfo((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={guestInfo.lastName}
                onChange={(e) =>
                  setGuestInfo((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                placeholder="Doe"
              />
            </div>
          </div>

          {(settings?.requireGuestEmail !== false) && (
            <div>
              <Label htmlFor="email">
                Email {settings?.requireGuestEmail ? "*" : ""}
              </Label>
              <Input
                id="email"
                type="email"
                value={guestInfo.email}
                onChange={(e) =>
                  setGuestInfo((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john@example.com"
              />
            </div>
          )}

          {(settings?.requireGuestPhone !== false) && (
            <div>
              <Label htmlFor="phone">
                Phone {settings?.requireGuestPhone ? "*" : ""}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={guestInfo.phone}
                onChange={(e) =>
                  setGuestInfo((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+255 700 000 000"
              />
            </div>
          )}

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

          {/* Cancellation policy */}
          {settings?.cancellationPolicyText && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-600 mb-1">
                Cancellation Policy
              </p>
              {settings.cancellationPolicyText}
            </div>
          )}

          {/* Terms */}
          {settings?.termsAndConditions && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-600 mb-1">
                Terms & Conditions
              </p>
              {settings.termsAndConditions}
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

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("datetime")}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !guestInfo.firstName.trim() ||
                !guestInfo.lastName.trim() ||
                (settings?.requireGuestEmail && !guestInfo.email.trim()) ||
                (settings?.requireGuestPhone && !guestInfo.phone.trim())
              }
              className="flex-1 bg-[#EB7F44] hover:bg-[#d9703b] text-white"
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
            <h2 className="text-xl font-bold text-gray-900">
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
              setStep("guests");
              setSelectedDate("");
              setSelectedSlot(null);
              setGuestInfo({ firstName: "", lastName: "", email: "", phone: "" });
              setSpecialRequests("");
              setAnswers({});
              setError(null);
              setAvailability(null);
            }}
            variant="outline"
            className="w-full"
          >
            Make Another Reservation
          </Button>

          {/* Powered by */}
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <a
              href="https://settlo.co.tz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EB7F44] hover:underline"
            >
              Settlo
            </a>
          </p>
        </div>
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
