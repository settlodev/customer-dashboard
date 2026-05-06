"use client";

import { useState } from "react";
import {
  Activity,
  CalendarDays,
  Clock,
  CreditCard,
  History,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  StickyNote,
  Table2,
  User,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReservationTimeline from "@/components/reservation/reservation-timeline";
import {
  Reservation,
  RESERVATION_STATUS_LABELS,
  DEPOSIT_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
} from "@/types/reservation/type";
import {
  ReservationStatus,
  DepositPaymentStatus,
  ReservationSource,
} from "@/types/enums";

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "logistics", label: "Logistics", icon: Activity },
  { key: "deposit", label: "Deposit", icon: CreditCard },
  { key: "timeline", label: "Timeline", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_TONE: Record<
  ReservationStatus,
  { variant: "pos" | "neg" | "warn" | "soft"; label: string }
> = {
  [ReservationStatus.PENDING]: { variant: "warn", label: "Pending" },
  [ReservationStatus.CONFIRMED]: { variant: "pos", label: "Confirmed" },
  [ReservationStatus.SEATED]: { variant: "pos", label: "Seated" },
  [ReservationStatus.COMPLETED]: { variant: "soft", label: "Completed" },
  [ReservationStatus.CANCELLED]: { variant: "neg", label: "Cancelled" },
  [ReservationStatus.NO_SHOW]: { variant: "neg", label: "No-show" },
};

export function ReservationDetailView({ reservation }: { reservation: Reservation }) {
  const [tab, setTab] = useState<TabKey>("overview");

  const formattedDate = reservation.reservationDate
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "full",
      }).format(new Date(reservation.reservationDate))
    : "—";

  const reservationTime = reservation.reservationTime?.substring(0, 5) ?? "—";
  const endTime = reservation.reservationEndTime?.substring(0, 5);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
          <SummaryTile
            icon={<CalendarDays className="h-3 w-3" />}
            label="Date"
            value={
              reservation.reservationDate
                ? new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                  }).format(new Date(reservation.reservationDate))
                : "—"
            }
          />
          <SummaryTile
            icon={<Clock className="h-3 w-3" />}
            label="Time"
            value={reservationTime}
          />
          <SummaryTile
            icon={<Users className="h-3 w-3" />}
            label="Guests"
            value={reservation.peopleCount?.toString() ?? "—"}
          />
          <SummaryTile
            icon={<Table2 className="h-3 w-3" />}
            label="Table"
            value={reservation.tableAndSpaceName ?? "Unassigned"}
          />
          <SummaryTile
            icon={<Sparkles className="h-3 w-3" />}
            label="Source"
            value={
              reservation.source
                ? RESERVATION_SOURCE_LABELS[
                    reservation.source as ReservationSource
                  ] ?? String(reservation.source)
                : "—"
            }
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && (
        <OverviewTab
          reservation={reservation}
          formattedDate={formattedDate}
          reservationTime={reservationTime}
          endTime={endTime}
        />
      )}
      {tab === "logistics" && <LogisticsTab reservation={reservation} />}
      {tab === "deposit" && <DepositTab reservation={reservation} />}
      {tab === "timeline" && (
        <Card>
          <CardContent className="pt-6">
            <ReservationTimeline reservationId={reservation.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OverviewTab({
  reservation,
  formattedDate,
  reservationTime,
  endTime,
}: {
  reservation: Reservation;
  formattedDate: string;
  reservationTime: string;
  endTime?: string;
}) {
  const tone = STATUS_TONE[reservation.reservationStatus];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {reservation.customerName ?? "Walk-in"}
              </p>
              {reservation.customerPhone && (
                <p className="truncate text-xs text-muted-foreground">
                  {reservation.customerPhone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <Badge
              variant={tone?.variant ?? "soft"}
              className="text-[10.5px]"
            >
              {tone?.label ??
                RESERVATION_STATUS_LABELS[reservation.reservationStatus]}
            </Badge>
          </div>

          {reservation.specialRequests && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                Special requests
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {reservation.specialRequests}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Booking
          </h3>

          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow icon={CalendarDays} label="Date" value={formattedDate} />
              <DetailRow
                icon={Clock}
                label="Time"
                value={
                  endTime ? `${reservationTime} – ${endTime}` : reservationTime
                }
              />
              <DetailRow
                icon={Users}
                label="Guests"
                value={reservation.peopleCount?.toString()}
              />
              <DetailRow
                icon={Table2}
                label="Table"
                value={reservation.tableAndSpaceName}
              />
              <DetailRow
                icon={MapPin}
                label="Section"
                value={reservation.sectionName}
              />
              <DetailRow
                icon={Sparkles}
                label="Source"
                value={
                  reservation.source
                    ? RESERVATION_SOURCE_LABELS[
                        reservation.source as ReservationSource
                      ] ?? String(reservation.source)
                    : null
                }
              />
            </dl>
          </div>

          <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            Customer
          </h3>
          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow
                icon={User}
                label="Name"
                value={reservation.customerName}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={reservation.customerPhone}
              />
              <DetailRow
                icon={Mail}
                label="Email"
                value={reservation.customerEmail}
              />
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogisticsTab({ reservation }: { reservation: Reservation }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Table2 className="h-4 w-4 text-muted-foreground" />
            Seating
          </h3>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            <DetailRow
              label="Table / space"
              value={reservation.tableAndSpaceName ?? "Unassigned"}
            />
            <DetailRow
              label="Section"
              value={reservation.sectionName}
            />
            <DetailRow
              label="Minimum spend"
              value={
                reservation.tableMinimumSpend != null
                  ? `${reservation.tableMinimumSpend.toLocaleString()}`
                  : null
              }
            />
            <DetailRow
              label="Guests"
              value={reservation.peopleCount?.toString()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Location
          </h3>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            <DetailRow label="Name" value={reservation.locationName} />
            <DetailRow
              label="Address"
              value={reservation.locationAddress}
            />
            <DetailRow label="City" value={reservation.locationCity} />
            <DetailRow
              label="Phone"
              value={reservation.locationPhone}
            />
          </div>
        </CardContent>
      </Card>

      {reservation.answers?.length > 0 && (
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Booking question answers
            </h3>
            <div className="overflow-hidden rounded-lg border border-line bg-line">
              <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
                {reservation.answers.map((a) => (
                  <DetailRow
                    key={a.id as string}
                    label={a.questionText ?? "Question"}
                    value={a.answerValue}
                  />
                ))}
              </dl>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DepositTab({ reservation }: { reservation: Reservation }) {
  const status = reservation.depositPaymentStatus as DepositPaymentStatus | null;
  const tone =
    status === DepositPaymentStatus.PAID
      ? "pos"
      : status === DepositPaymentStatus.FAILED
        ? "neg"
        : "soft";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Deposit
            </h3>
            <Badge variant={tone} className="text-[10.5px]">
              {status ? DEPOSIT_STATUS_LABELS[status] : "Not set"}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                {reservation.depositAmount != null
                  ? reservation.depositAmount.toLocaleString()
                  : "—"}
              </span>
              {reservation.depositAmount != null && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  TZS
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              Deposit secures the booking against no-shows.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Reliability
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="Status"
              value={RESERVATION_STATUS_LABELS[reservation.reservationStatus]}
            />
            <DetailRow
              label="Source"
              value={
                reservation.source
                  ? RESERVATION_SOURCE_LABELS[
                      reservation.source as ReservationSource
                    ] ?? String(reservation.source)
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 text-[18px] font-semibold leading-none tracking-[-0.025em] text-ink">
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}
