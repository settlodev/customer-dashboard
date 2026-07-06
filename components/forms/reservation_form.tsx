"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone as PhoneIcon,
  Plus,
  Sparkles,
  StickyNote,
  Table2,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TimePicker } from "@/components/ui/time-picker";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlComboboxTriggerClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogIcon,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import CustomerSelector from "../widgets/customer-selector";
import GenderSelector from "../widgets/gender-selector";

import {
  AvailabilityResponse,
  AvailableSlot,
  AvailableTable,
  EXCEPTION_TYPE_LABELS,
  RESERVATION_SOURCE_LABELS,
  RESERVATION_SOURCES,
  Reservation,
  ReservationException,
  ReservationSlot,
} from "@/types/reservation/type";
import { ReservationSetting } from "@/types/reservation-setting/type";
import { Customer, CustomerGroup } from "@/types/customer/type";
import { CustomerCreatedFrom } from "@/types/enums";
import { Space } from "@/types/space/type";
import { ReservationSchema } from "@/types/reservation/schema";
import {
  checkAvailability,
  createReservation,
  fetchAllReservations,
  fetchReservationExceptions,
  fetchReservationSlots,
  updateReservation,
} from "@/lib/actions/reservation-actions";
import { fetchReservationSettings } from "@/lib/actions/reservation-setting-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import {
  createCustomer,
  fetchCustomerGroups,
} from "@/lib/actions/customer-actions";
import { invalidateCustomersCache } from "@/lib/cache/reference-data";
import { FormResponse } from "@/types/types";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

import styles from "./styles/form-shell.module.css";

type ReservationFormValues = z.infer<typeof ReservationSchema>;

interface ReservationFormProps {
  item: Reservation | null | undefined;
}

const DAY_NAMES_BY_INDEX = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const dayOfWeek = (date: Date): string => DAY_NAMES_BY_INDEX[date.getDay()];

const isoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (date: Date, n: number): Date => {
  const out = new Date(date);
  out.setDate(out.getDate() + n);
  return out;
};

const addHours = (date: Date, n: number): Date => {
  const out = new Date(date);
  out.setHours(out.getHours() + n);
  return out;
};

const startOfDay = (date: Date): Date => {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
};

const endOfDay = (date: Date): Date => {
  const out = new Date(date);
  out.setHours(23, 59, 59, 999);
  return out;
};

const toMinutes = (time: string | null | undefined): number => {
  if (!time) return Number.NaN;
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const formatTimeOfDay = (time: string): string => {
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${(m ?? "00").substring(0, 2)} ${ampm}`;
};

export default function ReservationForm({ item }: ReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();

  // Reference data
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [settings, setSettings] = useState<ReservationSetting | null>(null);
  const [slots, setSlots] = useState<ReservationSlot[]>([]);
  const [exceptions, setExceptions] = useState<ReservationException[]>([]);
  const [referenceLoaded, setReferenceLoaded] = useState(false);
  const [exceptionsLoaded, setExceptionsLoaded] = useState(false);

  // Date-driven data
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);

  // Time entry mode — slot picker by default; manual override available.
  const [manualTime, setManualTime] = useState(false);

  // Quick-add customer sheet — bumping `customerListKey` after a successful
  // create remounts the CustomerSelector so the new customer appears in
  // its dropdown without a full page round-trip.
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [customerListKey, setCustomerListKey] = useState(0);

  const isEditMode = !!item;

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(ReservationSchema),
    defaultValues: {
      reservationDate: item?.reservationDate ?? "",
      reservationTime: item?.reservationTime ?? "",
      reservationEndTime: item?.reservationEndTime ?? undefined,
      peopleCount: item?.peopleCount ?? undefined,
      specialRequests: item?.specialRequests ?? undefined,
      source: (item?.source as never) ?? "POS",
      customerId: (item?.customer as string | undefined) ?? undefined,
      tableSpaceId: (item?.tableAndSpace as string) ?? undefined,
    },
  });

  // ── Initial reference data ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tablesData, settingsData, slotsData] = await Promise.all([
          fetchAllTables(),
          fetchReservationSettings(),
          fetchReservationSlots(),
        ]);
        if (cancelled) return;
        setSpaces(tablesData.filter((t: Space) => t.reservable && t.active));
        setSettings(settingsData);
        setSlots((slotsData ?? []).filter((s) => s.active));
      } catch (error) {
        console.error("Failed to load reservation reference data:", error);
      } finally {
        if (!cancelled) setReferenceLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Booking-window-aware exception window ─────────────────────────
  const bookingWindowDays = settings?.bookingWindowDays ?? 60;
  const minAdvanceHours = settings?.minAdvanceBookingHours ?? 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = startOfDay(new Date());
        // Look back a touch so an in-progress edit on a past date still resolves.
        const from = isoDate(addDays(today, -1));
        const to = isoDate(addDays(today, bookingWindowDays + 1));
        const data = await fetchReservationExceptions({ from, to });
        if (!cancelled) setExceptions(data ?? []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load reservation exceptions:", error);
          setExceptions([]);
        }
      } finally {
        if (!cancelled) setExceptionsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingWindowDays]);

  const scheduleLoaded = referenceLoaded && exceptionsLoaded;

  // ── Watched form values ───────────────────────────────────────────
  const reservationDate = form.watch("reservationDate");
  const reservationTime = form.watch("reservationTime");
  const reservationEndTime = form.watch("reservationEndTime");
  const peopleCount = form.watch("peopleCount");
  const customerId = form.watch("customerId");
  const tableSpaceId = form.watch("tableSpaceId");
  const source = form.watch("source");
  const specialRequests = form.watch("specialRequests");

  // ── Settings-driven derived values ────────────────────────────────
  const minParty = settings?.minPartySize ?? 1;
  const maxParty = settings?.maxPartySize ?? null;
  const allowSpecialRequests = settings?.allowSpecialRequests !== false;

  const minDate = useMemo(() => {
    const base = new Date();
    return minAdvanceHours > 0 ? addHours(base, minAdvanceHours) : base;
  }, [minAdvanceHours]);

  const maxDate = useMemo(
    () => addDays(new Date(), bookingWindowDays),
    [bookingWindowDays],
  );

  // Slot day-of-week coverage
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    slots.forEach((s) => set.add(s.dayOfWeek));
    return set;
  }, [slots]);

  // Full-day exceptions, by date string
  const fullDayExceptionDates = useMemo(() => {
    const m = new Map<string, ReservationException>();
    exceptions.forEach((e) => {
      if (e.fullDay) m.set(e.date, e);
    });
    return m;
  }, [exceptions]);

  // ── Calendar disabling ────────────────────────────────────────────
  const editingExistingDate = isEditMode ? item?.reservationDate ?? null : null;

  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      const ds = isoDate(date);
      // Always allow the existing date in edit mode so the user can keep it.
      if (ds === editingExistingDate) return false;

      if (date < startOfDay(minDate)) return true;
      if (date > endOfDay(maxDate)) return true;

      // No active schedule for this day-of-week
      if (slots.length > 0 && !activeDays.has(dayOfWeek(date))) return true;

      // Full-day exception
      if (fullDayExceptionDates.has(ds)) return true;

      return false;
    },
    [
      editingExistingDate,
      minDate,
      maxDate,
      slots.length,
      activeDays,
      fullDayExceptionDates,
    ],
  );

  // ── Availability — refetch when date or partySize changes ────────
  useEffect(() => {
    if (!referenceLoaded) return;
    if (!reservationDate || !peopleCount || peopleCount < 1) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    setLoadingAvailability(true);
    checkAvailability(reservationDate, peopleCount)
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch((err) => {
        console.error("Availability check failed:", err);
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationDate, peopleCount, referenceLoaded]);

  // ── Same-day reservation list (for conflict / heads-up) ───────────
  useEffect(() => {
    if (!reservationDate) {
      setDayReservations([]);
      return;
    }
    let cancelled = false;
    fetchAllReservations({ from: reservationDate, to: reservationDate })
      .then((data) => {
        if (cancelled) return;
        const filtered = (data ?? []).filter((r) => {
          if (isEditMode && item && r.id === item.id) return false;
          if (r.reservationStatus === "CANCELLED") return false;
          if (r.reservationStatus === "NO_SHOW") return false;
          return true;
        });
        setDayReservations(filtered);
      })
      .catch(() => {
        if (!cancelled) setDayReservations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationDate, isEditMode, item]);

  // ── Slot / exception window for chosen time ───────────────────────
  const selectedDateObj = useMemo(
    () => (reservationDate ? new Date(reservationDate + "T00:00:00") : null),
    [reservationDate],
  );

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDateObj) return [] as ReservationSlot[];
    const dow = dayOfWeek(selectedDateObj);
    return slots.filter((s) => s.dayOfWeek === dow);
  }, [slots, selectedDateObj]);

  const exceptionsForSelectedDay = useMemo(() => {
    if (!reservationDate) return [] as ReservationException[];
    return exceptions.filter((e) => e.date === reservationDate);
  }, [exceptions, reservationDate]);

  const fullDayException = useMemo(
    () => exceptionsForSelectedDay.find((e) => e.fullDay) ?? null,
    [exceptionsForSelectedDay],
  );

  const matchingActiveSlot = useMemo(() => {
    if (!reservationTime || slotsForSelectedDay.length === 0) return null;
    const t = toMinutes(reservationTime);
    if (Number.isNaN(t)) return null;
    return (
      slotsForSelectedDay.find(
        (s) => t >= toMinutes(s.startTime) && t < toMinutes(s.endTime),
      ) ?? null
    );
  }, [slotsForSelectedDay, reservationTime]);

  const overlappingException = useMemo(() => {
    if (!reservationTime) return fullDayException;
    if (fullDayException) return fullDayException;
    const t = toMinutes(reservationTime);
    if (Number.isNaN(t)) return null;
    return (
      exceptionsForSelectedDay.find((e) => {
        if (e.fullDay) return true;
        if (!e.startTime || !e.endTime) return false;
        return t >= toMinutes(e.startTime) && t < toMinutes(e.endTime);
      }) ?? null
    );
  }, [exceptionsForSelectedDay, fullDayException, reservationTime]);

  // ── Conflicts — heads-up info, not a hard block ───────────────────
  const overlappingReservations = useMemo(() => {
    if (!reservationTime) return [] as Reservation[];
    const t = toMinutes(reservationTime);
    if (Number.isNaN(t)) return [] as Reservation[];
    const fallbackDuration =
      (settings?.defaultDurationMinutes ?? 90) +
      (settings?.defaultTurnTimeMinutes ?? 15);
    const buffer = settings?.bufferMinutesBetweenSeatings ?? 0;
    const tEnd = reservationEndTime ? toMinutes(reservationEndTime) : t + fallbackDuration;

    return dayReservations.filter((r) => {
      if (!r.reservationTime) return false;
      const rt = toMinutes(r.reservationTime);
      if (Number.isNaN(rt)) return false;
      const rEnd = r.reservationEndTime
        ? toMinutes(r.reservationEndTime)
        : rt + fallbackDuration;
      const aStart = t - buffer;
      const aEnd = tEnd + buffer;
      const bStart = rt - buffer;
      const bEnd = rEnd + buffer;
      return aStart < bEnd && bStart < aEnd;
    });
  }, [
    dayReservations,
    reservationTime,
    reservationEndTime,
    settings?.defaultDurationMinutes,
    settings?.defaultTurnTimeMinutes,
    settings?.bufferMinutesBetweenSeatings,
  ]);

  const sameTableConflict = useMemo(() => {
    if (!tableSpaceId) return null;
    return (
      overlappingReservations.find(
        (r) => (r.tableAndSpace as string | null) === tableSpaceId,
      ) ?? null
    );
  }, [overlappingReservations, tableSpaceId]);

  // ── Tables — filter by capacity & live availability ──────────────
  const availabilityTablesForSlot = useMemo<AvailableTable[] | null>(() => {
    if (!availability || !reservationTime) return null;
    const slot = availability.slots.find((s) => s.time === reservationTime);
    return slot?.availableTables ?? null;
  }, [availability, reservationTime]);

  const filteredTables = useMemo(() => {
    if (peopleCount == null || peopleCount <= 0) return spaces;
    return spaces.filter((s) => {
      const cap = s.capacity ?? 0;
      const min = s.minCapacity ?? 0;
      if (cap < peopleCount) return false;
      if (min > 0 && peopleCount < min) return false;
      return true;
    });
  }, [spaces, peopleCount]);

  // Tables free for the chosen slot (when availability data is present).
  const availableTableIds = useMemo(() => {
    if (!availabilityTablesForSlot) return null;
    return new Set(availabilityTablesForSlot.map((t) => String(t.id)));
  }, [availabilityTablesForSlot]);

  // Auto-clear table if it's no longer valid for the new partySize / time.
  useEffect(() => {
    if (!tableSpaceId) return;
    const table = spaces.find((s) => s.id === tableSpaceId);
    if (!table) return;
    let invalid = false;
    if (peopleCount && peopleCount > 0) {
      if ((table.capacity ?? 0) < peopleCount) invalid = true;
      if (
        (table.minCapacity ?? 0) > 0 &&
        peopleCount < (table.minCapacity ?? 0)
      ) {
        invalid = true;
      }
    }
    if (
      !invalid &&
      availableTableIds &&
      !availableTableIds.has(String(tableSpaceId))
    ) {
      // Only auto-clear in create mode — preserve a user's edit-mode choice.
      if (!isEditMode) invalid = true;
    }
    if (invalid) form.setValue("tableSpaceId", undefined);
  }, [
    tableSpaceId,
    peopleCount,
    spaces,
    availableTableIds,
    form,
    isEditMode,
  ]);

  const tableLabel = useMemo(() => {
    if (!tableSpaceId) return undefined;
    const t = spaces.find((s) => s.id === tableSpaceId);
    if (!t) return undefined;
    return t.capacity ? `${t.name} · ${t.capacity} seats` : t.name;
  }, [tableSpaceId, spaces]);

  // ── Settings & validation snapshot ───────────────────────────────
  const partySizeError = useMemo(() => {
    if (peopleCount == null || peopleCount <= 0) return null;
    if (peopleCount < minParty) {
      return `Minimum party size is ${minParty}.`;
    }
    if (maxParty != null && peopleCount > maxParty) {
      return `Maximum party size is ${maxParty}.`;
    }
    return null;
  }, [peopleCount, minParty, maxParty]);

  const requiredFlags = useMemo(
    () => [
      !!reservationDate?.trim(),
      !!reservationTime?.trim(),
      peopleCount != null && peopleCount > 0 && !partySizeError,
      !!source,
      !!customerId,
    ],
    [reservationDate, reservationTime, peopleCount, partySizeError, source, customerId],
  );

  const blockingErrors = useMemo(() => {
    const errs: string[] = [];
    if (!reservationDate) errs.push("Pick a date.");
    if (!reservationTime) errs.push("Pick a time.");
    if (peopleCount == null || peopleCount <= 0)
      errs.push("Enter the party size.");
    if (partySizeError) errs.push(partySizeError);
    if (!customerId) errs.push("Pick or create a customer.");
    if (overlappingException && !isEditMode) {
      errs.push(
        `Time falls inside a ${EXCEPTION_TYPE_LABELS[overlappingException.type] ?? "blocked"} window.`,
      );
    }
    // Only enforce slot-fit in manual mode — the slot grid already filters
    // to valid times when the user picks from it, so there's nothing to flag.
    if (
      manualTime &&
      reservationTime &&
      slotsForSelectedDay.length > 0 &&
      !matchingActiveSlot &&
      !isEditMode
    ) {
      errs.push("Pick a time within an open service slot.");
    }
    if (sameTableConflict) {
      errs.push("The selected table is already booked at this time.");
    }
    return errs;
  }, [
    reservationDate,
    reservationTime,
    peopleCount,
    partySizeError,
    customerId,
    overlappingException,
    isEditMode,
    matchingActiveSlot,
    manualTime,
    slotsForSelectedDay.length,
    sameTableConflict,
  ]);

  const completion = Math.round(
    (requiredFlags.filter(Boolean).length / requiredFlags.length) * 100,
  );
  const isValid = blockingErrors.length === 0 && requiredFlags.every(Boolean);
  const remainingFields = requiredFlags.filter((v) => !v).length;

  // ── Submit ───────────────────────────────────────────────────────
  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      const firstError =
        Object.values(errors)[0]?.message ??
        "Please check the highlighted fields and try again.";
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: typeof firstError === "string" ? firstError : undefined,
      });
    },
    [toast],
  );

  const submit = useCallback(
    (values: ReservationFormValues) => {
      if (partySizeError) {
        toast({
          variant: "destructive",
          title: "Party size out of range",
          description: partySizeError,
        });
        return;
      }
      if (overlappingException && !isEditMode) {
        toast({
          variant: "destructive",
          title: "Time blocked",
          description: `That time is inside a ${EXCEPTION_TYPE_LABELS[overlappingException.type] ?? "blocked"} window.`,
        });
        return;
      }

      setResponse(undefined);
      startTransition(async () => {
        try {
          const result = isEditMode
            ? await updateReservation(item!.id, values)
            : await createReservation(values);
          if (!result) return;
          setResponse(result);
          if (result.responseType === "success") {
            toast({
              variant: "success",
              title: isEditMode ? "Reservation updated" : "Reservation created",
              description: SettloErrorHandler.safeMessage(result.message),
            });
            router.push("/reservations");
          } else {
            toast({
              variant: "destructive",
              title: "Couldn't save reservation",
              description: SettloErrorHandler.safeMessage(result.message),
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Something went wrong",
            description:
              (error as Error)?.message ?? "Please try again later.",
          });
        }
      });
    },
    [isEditMode, item, router, toast, partySizeError, overlappingException],
  );

  const handleDiscard = useCallback(() => {
    router.back();
  }, [router]);

  // ── Time slot picker UI helpers ──────────────────────────────────
  const slotPickerLoading = !referenceLoaded || loadingAvailability;
  const showSlotPicker = !manualTime;
  const availabilitySlots = availability?.slots ?? [];
  const closedReason = availability?.closedReason;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this reservation</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}

      {settings && !settings.enableOnlineBooking && (
        <Alert tone="warning" className="mb-3">
          <AlertIcon>
            <Info className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>Online booking is currently disabled</AlertTitle>
            <AlertDescription>
              Customers can&apos;t self-serve, but staff can still create
              bookings here. Re-enable in{" "}
              <span className="font-medium">Reservations → Settings</span>.
            </AlertDescription>
          </AlertBody>
        </Alert>
      )}

      <form
        onSubmit={form.handleSubmit(submit, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formGrid}>
          {/* ── LEFT — form column ─────────────────────────────── */}
          <div className={styles.formStack}>
            {/* Identity card — date / time / guests */}
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <CalendarDays className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>When &amp; how many</h3>
                  <p className={styles.formCardHeadDesc}>
                    Pick the date and party size — we&apos;ll show only the
                    times the venue is open and accepting bookings.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 01</span>
                </div>
              </header>

              <div className={styles.formBody}>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="reservationDate"
                    render={({ field }) => {
                      const selected = field.value
                        ? new Date(field.value + "T00:00:00")
                        : undefined;
                      return (
                        <FormItem className="min-w-0 space-y-[7px]">
                          <FieldLabel required>Date</FieldLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isPending || !scheduleLoaded}
                                  className={cn(
                                    controlComboboxTriggerClass,
                                    "justify-start",
                                    !selected && "text-muted-2",
                                  )}
                                >
                                  {scheduleLoaded ? (
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                                  ) : (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin opacity-70" />
                                  )}
                                  {scheduleLoaded
                                    ? selected
                                      ? format(selected, "PPP")
                                      : "Pick a date"
                                    : "Loading schedule…"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[300px] p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={selected}
                                onSelect={(d) => {
                                  field.onChange(d ? isoDate(d) : "");
                                  // Reset time so the user picks a fresh slot.
                                  if (d) form.setValue("reservationTime", "");
                                }}
                                disabled={isDateDisabled}
                                fromDate={startOfDay(minDate)}
                                toDate={endOfDay(maxDate)}
                                defaultMonth={selected ?? undefined}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {settings ? (
                            <FieldHint>
                              Bookable up to {bookingWindowDays} days ahead
                              {minAdvanceHours > 0
                                ? ` · ${minAdvanceHours}h advance notice`
                                : ""}
                              .
                            </FieldHint>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="peopleCount"
                    render={({ field }) => (
                      <FormItem className="min-w-0 space-y-[7px]">
                        <FieldLabel>
                          Guests <span className="text-primary">*</span>
                          {settings ? (
                            <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                              {minParty}
                              {maxParty != null ? `–${maxParty}` : "+"}
                            </span>
                          ) : null}
                        </FieldLabel>
                        <FormControl>
                          <ControlInput
                            type="number"
                            min={minParty}
                            max={maxParty ?? undefined}
                            placeholder="Party size"
                            disabled={isPending}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : parseInt(e.target.value, 10),
                              )
                            }
                          />
                        </FormControl>
                        {partySizeError ? (
                          <p className="text-[11px] text-danger mt-1">
                            {partySizeError}
                          </p>
                        ) : null}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tableSpaceId"
                    render={({ field }) => (
                      <FormItem className="min-w-0 space-y-[7px]">
                        <FieldLabel optional>Table</FieldLabel>
                        <Select
                          onValueChange={(v) =>
                            field.onChange(v === "__auto__" ? undefined : v)
                          }
                          value={field.value ?? "__auto__"}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className={cn(controlSelectTriggerClass, "w-full")}>
                              <SelectValue placeholder="Auto-assign or pick a table" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__auto__">
                              Auto-assign on arrival
                            </SelectItem>
                            {filteredTables.length === 0 && peopleCount ? (
                              <SelectItem disabled value="__none__">
                                No tables fit {peopleCount} guest
                                {peopleCount === 1 ? "" : "s"}
                              </SelectItem>
                            ) : null}
                            {filteredTables.map((s) => {
                              const free =
                                !availableTableIds ||
                                availableTableIds.has(String(s.id));
                              return (
                                <SelectItem
                                  key={s.id}
                                  value={s.id as string}
                                  disabled={!free && !isEditMode}
                                >
                                  {s.name}
                                  {s.capacity
                                    ? ` · up to ${s.capacity}`
                                    : ""}
                                  {s.minCapacity
                                    ? ` (min ${s.minCapacity})`
                                    : ""}
                                  {!free ? " · booked" : ""}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {peopleCount != null && peopleCount > 0 ? (
                          <FieldHint>
                            Fits {peopleCount} guest
                            {peopleCount === 1 ? "" : "s"}
                            {availableTableIds
                              ? ` · ${availableTableIds.size} free.`
                              : "."}
                          </FieldHint>
                        ) : null}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem className="min-w-0 space-y-[7px]">
                        <FieldLabel required>Booking source</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className={cn(controlSelectTriggerClass, "w-full")}>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESERVATION_SOURCES.map((src) => (
                              <SelectItem key={src} value={src}>
                                {RESERVATION_SOURCE_LABELS[src]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem className="min-w-0 sm:col-span-2 space-y-[7px]">
                        <FieldLabel required>Customer</FieldLabel>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <CustomerSelector
                              key={customerListKey}
                              value={field.value}
                              onChange={(id) => field.onChange(id)}
                              isDisabled={isPending}
                              placeholder="Search by name or phone"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => setQuickCustomerOpen(true)}
                            disabled={isPending}
                            title="Create a new customer"
                            aria-label="Create a new customer"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {allowSpecialRequests && (
                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem className="col-span-full w-full space-y-[7px]">
                          <FieldLabel optional>Special notes</FieldLabel>
                          <FormControl>
                            <ControlTextarea
                              placeholder="e.g. Birthday — please prepare a candle. Allergies: shellfish."
                              disabled={isPending}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {sameTableConflict && (
                  <Alert tone="danger" className="mt-3">
                    <AlertIcon>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </AlertIcon>
                    <AlertBody>
                      <AlertTitle>That table is already booked</AlertTitle>
                      <AlertDescription>
                        {sameTableConflict.reservationTime?.slice(0, 5)} ·{" "}
                        {sameTableConflict.peopleCount} guest
                        {sameTableConflict.peopleCount === 1 ? "" : "s"}
                        {sameTableConflict.customerName
                          ? ` · ${sameTableConflict.customerName}`
                          : ""}
                        . Pick a different table or change the time.
                      </AlertDescription>
                    </AlertBody>
                  </Alert>
                )}

                {/* Day-context messaging */}
                {reservationDate &&
                  fullDayException &&
                  !isEditMode && (
                    <Alert tone="danger" className="mt-3">
                      <AlertIcon>
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </AlertIcon>
                      <AlertBody>
                        <AlertTitle>
                          Closed on this date —{" "}
                          {EXCEPTION_TYPE_LABELS[fullDayException.type] ??
                            "Blocked"}
                        </AlertTitle>
                        <AlertDescription>
                          {fullDayException.reason ??
                            "Pick another date for this booking."}
                        </AlertDescription>
                      </AlertBody>
                    </Alert>
                  )}

                {reservationDate &&
                  exceptionsForSelectedDay.length > 0 &&
                  !fullDayException && (
                    <Alert tone="warning" className="mt-3">
                      <AlertIcon>
                        <Info className="h-3.5 w-3.5" />
                      </AlertIcon>
                      <AlertBody>
                        <AlertTitle>
                          Limited hours on this date
                        </AlertTitle>
                        <AlertDescription>
                          {exceptionsForSelectedDay.map((e, i) => (
                            <span key={e.id} className="mr-2 inline-block">
                              {EXCEPTION_TYPE_LABELS[e.type] ?? "Blocked"}
                              {e.startTime && e.endTime
                                ? ` ${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)}`
                                : ""}
                              {e.reason ? ` · ${e.reason}` : ""}
                              {i < exceptionsForSelectedDay.length - 1
                                ? ";"
                                : ""}
                            </span>
                          ))}
                        </AlertDescription>
                      </AlertBody>
                    </Alert>
                  )}
              </div>
            </section>

            {/* Time selection */}
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Time slot</h3>
                  <p className={styles.formCardHeadDesc}>
                    Pick from open slots — we factor in operating hours,
                    exceptions, and existing bookings.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 02</span>
                </div>
              </header>

              <div className={styles.formBody}>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <FormField
                    control={form.control}
                    name="reservationTime"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-0 space-y-[7px]">
                        <FieldLabel required>Start time</FieldLabel>
                        {showSlotPicker ? (
                          <SlotPicker
                            value={field.value}
                            onChange={field.onChange}
                            slots={availabilitySlots}
                            loading={slotPickerLoading}
                            disabled={isPending || !reservationDate}
                            closed={!!availability?.closed}
                            closedReason={closedReason ?? null}
                            preserveTime={
                              isEditMode ? item?.reservationTime ?? null : null
                            }
                          />
                        ) : (
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isPending}
                              placeholder="Pick a start time"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between mb-3 mt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="manual-time"
                      checked={manualTime}
                      onCheckedChange={setManualTime}
                      disabled={isPending}
                    />
                    <Label
                      htmlFor="manual-time"
                      className="text-[12px] text-ink-3 font-normal cursor-pointer"
                    >
                      Override time manually
                    </Label>
                  </div>
                  {reservationTime && matchingActiveSlot ? (
                    <Badge variant="pos" className="text-[10.5px]">
                      <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Within{" "}
                      {matchingActiveSlot.startTime.slice(0, 5)}–
                      {matchingActiveSlot.endTime.slice(0, 5)}
                    </Badge>
                  ) : reservationTime &&
                    manualTime &&
                    slotsForSelectedDay.length > 0 &&
                    !isEditMode ? (
                    <Badge variant="warn" className="text-[10.5px]">
                      <AlertTriangle className="mr-1 h-2.5 w-2.5" /> Outside
                      open slot
                    </Badge>
                  ) : null}
                </div>

                {/* Optional end-time, mostly for staff control */}
                <FormField
                  control={form.control}
                  name="reservationEndTime"
                  render={({ field }) => (
                    <FormItem className="min-w-0 mt-1 space-y-[7px]">
                      <FieldLabel optional>End time</FieldLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          placeholder="Auto by default"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conflict / context warnings */}
                {overlappingException && !fullDayException && (
                  <Alert tone="danger" className="mt-3">
                    <AlertIcon>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </AlertIcon>
                    <AlertBody>
                      <AlertTitle>
                        That time is blocked —{" "}
                        {EXCEPTION_TYPE_LABELS[overlappingException.type] ??
                          "Exception"}
                      </AlertTitle>
                      <AlertDescription>
                        {overlappingException.reason
                          ? overlappingException.reason
                          : "Pick a time outside the blocked window."}
                      </AlertDescription>
                    </AlertBody>
                  </Alert>
                )}

                {availability?.slots[0]?.reservationsRemaining != null &&
                  reservationTime &&
                  (() => {
                    const slot = availability.slots.find(
                      (s) => s.time === reservationTime,
                    );
                    if (!slot) return null;
                    const remaining = slot.reservationsRemaining;
                    const guestsRemaining = slot.guestsRemaining;
                    if (remaining == null && guestsRemaining == null)
                      return null;
                    return (
                      <Alert tone="info" className="mt-3">
                        <AlertIcon>
                          <Info className="h-3.5 w-3.5" />
                        </AlertIcon>
                        <AlertBody>
                          <AlertDescription>
                            {remaining != null && (
                              <>
                                {remaining} reservation slot
                                {remaining === 1 ? "" : "s"} left
                              </>
                            )}
                            {remaining != null && guestsRemaining != null
                              ? " · "
                              : ""}
                            {guestsRemaining != null && (
                              <>
                                {guestsRemaining} guest seat
                                {guestsRemaining === 1 ? "" : "s"} left
                              </>
                            )}
                            .
                          </AlertDescription>
                        </AlertBody>
                      </Alert>
                    );
                  })()}

                {overlappingReservations.length > 0 && (
                  <Alert tone="warning" className="mt-3">
                    <AlertIcon>
                      <Users className="h-3.5 w-3.5" />
                    </AlertIcon>
                    <AlertBody>
                      <AlertTitle>
                        {overlappingReservations.length} other reservation
                        {overlappingReservations.length === 1 ? "" : "s"}{" "}
                        around this time
                      </AlertTitle>
                      <AlertDescription>
                        <ul className="mt-1 space-y-0.5 text-[11.5px]">
                          {overlappingReservations.slice(0, 4).map((r) => (
                            <li key={r.id}>
                              {r.reservationTime?.slice(0, 5)} ·{" "}
                              {r.peopleCount} guest
                              {r.peopleCount === 1 ? "" : "s"}
                              {r.tableAndSpaceName
                                ? ` · ${r.tableAndSpaceName}`
                                : ""}
                              {r.customerName ? ` · ${r.customerName}` : ""}
                            </li>
                          ))}
                          {overlappingReservations.length > 4 && (
                            <li className="text-ink-3">
                              + {overlappingReservations.length - 4} more
                            </li>
                          )}
                        </ul>
                      </AlertDescription>
                    </AlertBody>
                  </Alert>
                )}
              </div>
            </section>

          </div>

          {/* ── RIGHT — preview + tips ─────────────────────────── */}
          <aside className={styles.formStack}>
            <ReservationLivePreviewCard
              reservationDate={reservationDate}
              reservationTime={reservationTime}
              reservationEndTime={reservationEndTime}
              peopleCount={peopleCount}
              tableLabel={tableLabel}
              hasCustomer={!!customerId}
              source={source}
              specialRequests={specialRequests}
              checklist={[
                { label: "Date", done: requiredFlags[0] },
                { label: "Start time", done: requiredFlags[1] },
                {
                  label: `Guests (${minParty}${maxParty != null ? `–${maxParty}` : "+"})`,
                  done: requiredFlags[2],
                },
                { label: "Source", done: requiredFlags[3] },
                { label: "Customer", done: requiredFlags[4] },
              ]}
              completion={completion}
            />
            <ReservationTipsCard isEdit={isEditMode} />

            {blockingErrors.length > 0 && (
              <Alert tone="warning">
                <AlertIcon>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </AlertIcon>
                <AlertBody>
                  <AlertTitle>Before you can save</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11.5px]">
                      {blockingErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </AlertBody>
              </Alert>
            )}
          </aside>
        </div>

        {/* Sticky footer */}
        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anything you typed since opening the form will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={handleDiscard}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="submit"
            disabled={isPending || !isValid}
            title={
              isValid
                ? isEditMode
                  ? "Save changes"
                  : "Create reservation"
                : `Complete required fields (${remainingFields} remaining)`
            }
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isEditMode ? "Save changes" : "Create reservation"}
          </Button>
        </div>
      </form>

      <QuickCustomerSheet
        open={quickCustomerOpen}
        onOpenChange={setQuickCustomerOpen}
        onCreated={(customer) => {
          form.setValue("customerId", customer.id, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setCustomerListKey((k) => k + 1);
          setQuickCustomerOpen(false);
        }}
      />
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Slot picker — buttons sourced from /availability
// ─────────────────────────────────────────────────────────────────────

interface SlotPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  slots: AvailableSlot[];
  loading: boolean;
  disabled: boolean;
  closed: boolean;
  closedReason: string | null;
  /** When editing, preserve the existing time even if it's not in the grid. */
  preserveTime: string | null;
}

function SlotPicker({
  value,
  onChange,
  slots,
  loading,
  disabled,
  closed,
  closedReason,
  preserveTime,
}: SlotPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-[12px] text-ink-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking availability…
      </div>
    );
  }

  if (closed) {
    return (
      <Alert tone="warning">
        <AlertIcon>
          <Info className="h-3.5 w-3.5" />
        </AlertIcon>
        <AlertBody>
          <AlertTitle>Closed on this date</AlertTitle>
          <AlertDescription>
            {closedReason ?? "Pick another date or use override to set a custom time."}
          </AlertDescription>
        </AlertBody>
      </Alert>
    );
  }

  if (slots.length === 0 && !preserveTime) {
    return (
      <div className="rounded-md border border-dashed border-line bg-canvas px-3 py-4 text-center">
        <Clock className="h-4 w-4 text-ink-3 mx-auto mb-1.5" />
        <p className="text-[12px] font-medium text-ink-2">
          No open slots
        </p>
        <p className="text-[11px] text-ink-3 mt-0.5">
          Try a different date or party size, or use override.
        </p>
      </div>
    );
  }

  // Surface the existing time as a "current" pill so editing reservations
  // doesn't lose it when the venue's schedule has shifted.
  const includesPreserved =
    preserveTime != null && slots.some((s) => s.time === preserveTime);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      {preserveTime && !includesPreserved && (
        <button
          type="button"
          onClick={() => onChange(preserveTime)}
          disabled={disabled}
          className={cn(
            "py-2 px-1.5 rounded-md text-[12px] font-medium border transition-colors",
            value === preserveTime
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-canvas border-line text-ink-2 hover:bg-accent",
          )}
          title="Existing reservation time"
        >
          {formatTimeOfDay(preserveTime)}
          <span className="block text-[9px] opacity-70 mt-0.5">current</span>
        </button>
      )}
      {slots.map((s) => {
        const active = value === s.time;
        return (
          <button
            key={s.time}
            type="button"
            onClick={() => onChange(s.time)}
            disabled={disabled || !s.available}
            className={cn(
              "py-2 px-1.5 rounded-md text-[12px] font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : s.available
                  ? "bg-canvas border-line text-ink-2 hover:bg-accent"
                  : "bg-canvas/60 border-line text-ink-3 line-through cursor-not-allowed",
            )}
            title={
              s.available
                ? s.reservationsRemaining != null
                  ? `${s.reservationsRemaining} slot${s.reservationsRemaining === 1 ? "" : "s"} left`
                  : "Available"
                : "Fully booked"
            }
          >
            {formatTimeOfDay(s.time)}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Quick-add customer sheet
// ─────────────────────────────────────────────────────────────────────

interface QuickCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}

function QuickCustomerSheet({
  open,
  onOpenChange,
  onCreated,
}: QuickCustomerSheetProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [customerGroupId, setCustomerGroupId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset all internal state when the sheet closes so a follow-up open
  // doesn't show stale values from the previous session.
  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setGender("");
      setPhoneNumber("");
      setEmail("");
      setCustomerGroupId("");
      setNotes("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  // Lazy-load groups the first time the sheet opens — keeps the reservation
  // form's initial render fast for the common case where the user already
  // has a customer to pick.
  useEffect(() => {
    if (!open || groups.length > 0 || groupsLoading) return;
    let cancelled = false;
    (async () => {
      try {
        setGroupsLoading(true);
        const data = await fetchCustomerGroups();
        if (!cancelled) setGroups(data ?? []);
      } catch (e) {
        if (!cancelled) console.error("Failed to load customer groups", e);
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, groups.length, groupsLoading]);

  const canSubmit =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!gender &&
    !!phoneNumber.trim() &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await createCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender as never,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        customerGroupId: customerGroupId || undefined,
        notes: notes.trim() || undefined,
        createdFrom: CustomerCreatedFrom.RESERVATION,
        allowNotifications: true,
        active: true,
      });
      if (result?.responseType === "success" && result.data) {
        invalidateCustomersCache();
        toast({
          variant: "success",
          title: "Customer created",
          description: `${firstName.trim()} ${lastName.trim()} is now linked to this reservation.`,
        });
        onCreated(result.data as Customer);
      } else {
        const message = result?.message ?? "Couldn't create customer";
        setError(message);
        toast({
          variant: "destructive",
          title: "Couldn't create customer",
          description: message,
        });
      }
    } catch (e) {
      const message = (e as Error)?.message ?? "Something went wrong";
      setError(message);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-base">New customer</SheetTitle>
            <SheetDescription className="text-xs">
              Capture the basics — we&apos;ll mark this profile as created
              from the reservation flow so you can find them later.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {error ? (
            <Alert tone="danger" className="mb-4">
              <AlertIcon>
                <AlertTriangle className="h-3.5 w-3.5" />
              </AlertIcon>
              <AlertBody>
                <AlertDescription>{error}</AlertDescription>
              </AlertBody>
            </Alert>
          ) : null}

          <div className="space-y-6">
            {/* Identity ------------------------------------------------- */}
            <SheetSection
              icon={<User className="h-3.5 w-3.5" />}
              title="Identity"
              description="The basics that identify this customer at the till and on receipts."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <div className="min-w-0">
                  <Label className={styles.fieldLabel}>
                    First name <span className="req">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Amani"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-0">
                  <Label className={styles.fieldLabel}>
                    Last name <span className="req">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Mushi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <Label className={styles.fieldLabel}>
                    Gender <span className="req">*</span>
                  </Label>
                  <div className="mt-1">
                    <GenderSelector
                      label="Gender"
                      placeholder="Select gender"
                      value={gender}
                      onChange={setGender}
                      onBlur={() => {}}
                      isDisabled={submitting}
                    />
                  </div>
                </div>
              </div>
            </SheetSection>

            {/* Contact -------------------------------------------------- */}
            <SheetSection
              icon={<PhoneIcon className="h-3.5 w-3.5" />}
              title="Contact"
              description="How staff will reach the guest to confirm or remind."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <div className="min-w-0">
                  <Label className={styles.fieldLabel}>
                    Phone <span className="req">*</span>
                  </Label>
                  <Input
                    placeholder="+255 ..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-0">
                  <Label className={styles.fieldLabel}>
                    Email <span className="opt">OPTIONAL</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="guest@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
              </div>
            </SheetSection>

            {/* Profile -------------------------------------------------- */}
            <SheetSection
              icon={<Tag className="h-3.5 w-3.5" />}
              title="Profile"
              description="Bucket the guest into a group so reports and offers find them."
            >
              <div className="min-w-0">
                <Label className={styles.fieldLabel}>
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Customer group
                  </span>
                  <span className="opt">OPTIONAL</span>
                </Label>
                <div className="mt-1">
                  <Select
                    value={customerGroupId}
                    onValueChange={setCustomerGroupId}
                    disabled={submitting || groupsLoading || groups.length === 0}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue
                        placeholder={
                          groupsLoading
                            ? "Loading groups…"
                            : groups.length === 0
                              ? "No groups available"
                              : "Select a group"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem
                          key={group.id}
                          value={group.id as string}
                        >
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetSection>

            {/* Notes ---------------------------------------------------- */}
            <SheetSection
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              title="Staff notes"
              description="Internal context — never shown to the customer."
            >
              <div className="min-w-0">
                <Label className={styles.fieldLabel}>
                  Notes <span className="opt">OPTIONAL</span>
                </Label>
                <Textarea
                  placeholder="e.g. VIP regular — prefers a quiet table near the window."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  className="mt-1 w-full"
                />
              </div>
            </SheetSection>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse items-stretch gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Create &amp; attach
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-start gap-3">
        <div className={styles.icoBox}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold leading-tight text-ink">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-[11.5px] text-ink-3">{description}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: live preview card
// ─────────────────────────────────────────────────────────────────────

interface ReservationLivePreviewProps {
  reservationDate: string | undefined;
  reservationTime: string | undefined;
  reservationEndTime: string | undefined;
  peopleCount: number | undefined;
  tableLabel: string | undefined;
  hasCustomer: boolean;
  source: string | undefined;
  specialRequests: string | undefined;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function ReservationLivePreviewCard({
  reservationDate,
  reservationTime,
  reservationEndTime,
  peopleCount,
  tableLabel,
  hasCustomer,
  source,
  specialRequests,
  checklist,
  completion,
}: ReservationLivePreviewProps) {
  const dateLabel = reservationDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(reservationDate + "T00:00:00"),
      )
    : "Pick a date";
  const timeLabel = reservationTime
    ? reservationEndTime
      ? `${reservationTime.substring(0, 5)} – ${reservationEndTime.substring(0, 5)}`
      : reservationTime.substring(0, 5)
    : "Pick a time";

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHead}>
        <span className={styles.liveDot} />
        Live preview
      </div>
      <div className={styles.previewBody}>
        <div
          className={styles.previewThumb}
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
          }}
        >
          <CalendarDays className="h-10 w-10 text-white opacity-90" />
        </div>
        <div className={styles.previewName}>{dateLabel}</div>
        <div className={styles.previewMeta}>
          {timeLabel}
          {peopleCount
            ? ` · ${peopleCount} guest${peopleCount === 1 ? "" : "s"}`
            : ""}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tableLabel ? (
            <Badge variant="soft" className="text-[10.5px]">
              <Table2 className="mr-1 h-2.5 w-2.5" /> {tableLabel}
            </Badge>
          ) : (
            <Badge variant="warn" className="text-[10.5px]">
              <Table2 className="mr-1 h-2.5 w-2.5" /> Auto-assign
            </Badge>
          )}
          {hasCustomer ? (
            <Badge variant="pos" className="text-[10.5px]">
              <User className="mr-1 h-2.5 w-2.5" /> Guest captured
            </Badge>
          ) : (
            <Badge variant="warn" className="text-[10.5px]">
              <User className="mr-1 h-2.5 w-2.5" /> Guest pending
            </Badge>
          )}
          {source && (
            <Badge variant="soft" className="text-[10.5px]">
              <Sparkles className="mr-1 h-2.5 w-2.5" />{" "}
              {RESERVATION_SOURCE_LABELS[source as never] ?? source}
            </Badge>
          )}
          {specialRequests && (
            <Badge variant="soft" className="text-[10.5px]">
              <StickyNote className="mr-1 h-2.5 w-2.5" /> Notes
            </Badge>
          )}
        </div>

        <div className={styles.checklist}>
          {checklist.map((c) => (
            <div
              key={c.label}
              className={`${styles.checklistItem} ${
                c.done ? styles.checklistItemDone : ""
              }`}
            >
              <span className={styles.checklistMark}>
                {c.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
              </span>
              {c.label}
            </div>
          ))}
        </div>

        <div className={styles.readiness}>
          <div className={styles.readinessHead}>
            <span className={styles.readinessLabel}>Readiness</span>
            <span
              className={`${styles.readinessPct} ${
                completion === 100 ? styles.readinessPctDone : ""
              }`}
            >
              {completion}%
            </span>
          </div>
          <div className={styles.readinessBar}>
            <div
              className={`${styles.readinessBarFill} ${
                completion === 100 ? styles.readinessBarFillDone : ""
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: contextual tips card
// ─────────────────────────────────────────────────────────────────────

function ReservationTipsCard({ isEdit }: { isEdit: boolean }) {
  const tips = isEdit
    ? [
        {
          icon: Clock,
          text: "Moving the time triggers a re-allocation if the original table isn't free at the new slot.",
        },
        {
          icon: Users,
          text: "Bumping the guest count past the assigned table's capacity unassigns it — staff will need to pick again.",
        },
        {
          icon: PhoneIcon,
          text: "Updating customer details on a linked customer also updates their record everywhere else.",
        },
      ]
    : [
        {
          icon: Sparkles,
          text: "Slots, tables and exceptions all update live — pick a date and the time grid refreshes.",
        },
        {
          icon: User,
          text: "Linking a customer pre-fills name, phone and email; otherwise you must capture them yourself.",
        },
        {
          icon: MapPin,
          text: "Leaving the table blank lets staff seat the guests on arrival based on what's free.",
        },
        {
          icon: Mail,
          text: "Add an email if you want booking confirmation and reminders to reach the customer.",
        },
      ];

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHead}>Tips</div>
      <div className="space-y-2.5 px-4 py-4">
        {tips.map(({ icon: Icon, text }, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[12px] text-ink-3"
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary mt-0.5" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
