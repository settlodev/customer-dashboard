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
  Mail,
  MapPin,
  Phone as PhoneIcon,
  Sparkles,
  StickyNote,
  Table2,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

import {
  Reservation,
  RESERVATION_SOURCE_LABELS,
  RESERVATION_SOURCES,
} from "@/types/reservation/type";
import { Space } from "@/types/space/type";
import { ReservationSchema } from "@/types/reservation/schema";
import {
  createReservation,
  updateReservation,
} from "@/lib/actions/reservation-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { FormResponse } from "@/types/types";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

import styles from "./styles/form-shell.module.css";

type ReservationFormValues = z.infer<typeof ReservationSchema>;

interface ReservationFormProps {
  item: Reservation | null | undefined;
}

export default function ReservationForm({ item }: ReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeTab, setActiveTab] = useState<
    "guest" | "table" | "details"
  >("guest");

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
      customerId: (item?.customer as string) ?? undefined,
      tableSpaceId: (item?.tableAndSpace as string) ?? undefined,
    },
  });

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const data = await fetchAllTables();
        setSpaces(data.filter((t: Space) => t.reservable && t.active));
      } catch (error) {
        console.error("Failed to load tables:", error);
      }
    };
    loadSpaces();
  }, []);

  const reservationDate = form.watch("reservationDate");
  const reservationTime = form.watch("reservationTime");
  const reservationEndTime = form.watch("reservationEndTime");
  const peopleCount = form.watch("peopleCount");
  const customerId = form.watch("customerId");
  const tableSpaceId = form.watch("tableSpaceId");
  const source = form.watch("source");
  const specialRequests = form.watch("specialRequests");

  const tableLabel = useMemo(() => {
    if (!tableSpaceId) return undefined;
    const t = spaces.find((s) => s.id === tableSpaceId);
    return t ? t.name : undefined;
  }, [tableSpaceId, spaces]);

  const requiredFlags = useMemo(
    () => [
      !!reservationDate?.trim(),
      !!reservationTime?.trim(),
      peopleCount != null && peopleCount > 0,
      !!source,
    ],
    [reservationDate, reservationTime, peopleCount, source],
  );
  const completion = Math.round(
    (requiredFlags.filter(Boolean).length / requiredFlags.length) * 100,
  );
  const isValid = requiredFlags.every(Boolean);
  const remainingFields = requiredFlags.filter((v) => !v).length;

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
    [isEditMode, item, router, toast],
  );

  const handleDiscard = useCallback(() => {
    router.back();
  }, [router]);

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
                    Pick the date, time, and party size — the rest is
                    optional.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 01</span>
                </div>
              </header>

              <div className={styles.formBody}>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="reservationDate"
                    render={({ field }) => {
                      const selected = field.value
                        ? new Date(field.value)
                        : undefined;
                      return (
                        <FormItem className="min-w-0">
                          <FormLabel className={styles.fieldLabel}>
                            Date <span className="req">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isPending}
                                  className={cn(
                                    "h-10 w-full justify-start text-left font-normal",
                                    !selected && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                  {selected
                                    ? format(selected, "PPP")
                                    : "Pick a date"}
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
                                onSelect={(d) =>
                                  field.onChange(
                                    d ? d.toISOString().split("T")[0] : "",
                                  )
                                }
                                defaultMonth={selected ?? undefined}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="reservationTime"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Start time <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isPending}
                            placeholder="Pick a start time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reservationEndTime"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          End time
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isPending}
                            placeholder="Pick an end time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="peopleCount"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Guests <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Tabs section */}
            <section className={styles.formCard}>
              <div className={styles.formTabs} role="tablist">
                {(
                  [
                    {
                      id: "guest",
                      label: "Guest",
                      icon: <User className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "table",
                      label: "Table",
                      icon: <Table2 className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "details",
                      label: "Details",
                      icon: <StickyNote className="h-3.5 w-3.5" />,
                    },
                  ] as const
                ).map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`${styles.formTab} ${
                      activeTab === t.id ? styles.formTabOn : ""
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Guest */}
              {activeTab === "guest" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Guest</h3>
                      <p className={styles.formCardHeadDesc}>
                        Link an existing customer or capture details for a new
                        guest.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5">
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Existing customer
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <CustomerSelector
                                value={field.value}
                                onChange={(id) => field.onChange(id)}
                                placeholder="Search by name or phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="customerFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              First name
                              <span className="opt">WALK-IN</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Amani"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Last name
                              <span className="opt">WALK-IN</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Mushi"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Phone
                              <span className="opt">WALK-IN</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+255 ..."
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2 xl:col-span-3">
                            <FormLabel className={styles.fieldLabel}>
                              Email
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="guest@example.com"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Table */}
              {activeTab === "table" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Table2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Table assignment</h3>
                      <p className={styles.formCardHeadDesc}>
                        Pick a table now or leave blank for staff to assign on
                        arrival.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5">
                      <FormField
                        control={form.control}
                        name="tableSpaceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Table
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Auto-assign or pick a table" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {spaces.map((s) => (
                                  <SelectItem
                                    key={s.id}
                                    value={s.id as string}
                                  >
                                    {s.name}
                                    {s.capacity ? ` · ${s.capacity} seats` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Details */}
              {activeTab === "details" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <StickyNote className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Source &amp; notes</h3>
                      <p className={styles.formCardHeadDesc}>
                        Where did this booking come from and what should staff
                        know?
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Booking source <span className="req">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
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
                        name="specialRequests"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className={styles.fieldLabel}>
                              Special requests
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Birthday — please prepare a candle. Allergies: shellfish."
                                rows={4}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
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
                { label: "Guests", done: requiredFlags[2] },
                { label: "Source", done: requiredFlags[3] },
              ]}
              completion={completion}
            />
            <ReservationTipsCard isEdit={isEditMode} />
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
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditMode ? "Save changes" : "Create reservation"}
          </Button>
        </div>
      </form>
    </Form>
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
        new Date(reservationDate),
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
              <User className="mr-1 h-2.5 w-2.5" /> Linked customer
            </Badge>
          ) : (
            <Badge variant="soft" className="text-[10.5px]">
              <User className="mr-1 h-2.5 w-2.5" /> Walk-in
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
          text: "Moving the time will trigger a re-allocation if the original table isn't free at the new slot.",
        },
        {
          icon: Users,
          text: "Bumping the guest count past the assigned table's capacity unassigns it — staff will need to pick again.",
        },
        {
          icon: PhoneIcon,
          text: "Updating customer details on a linked customer also updates the customer record everywhere else.",
        },
      ]
    : [
        {
          icon: Sparkles,
          text: "Date, start time, party size, and source are all that's required to create a booking.",
        },
        {
          icon: User,
          text: "Pick an existing customer to attach loyalty and history — or just type a name and phone for walk-ins.",
        },
        {
          icon: MapPin,
          text: "Leave the table blank to let staff seat the guests on arrival based on what's free.",
        },
        {
          icon: Mail,
          text: "Add an email if you want the booking confirmation and reminders to reach the customer.",
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
