import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  Reservation,
  RESERVATION_STATUS_LABELS,
} from "@/types/reservation/type";
import { getReservationById } from "@/lib/actions/reservation-actions";
import { ReservationDetailView } from "./reservation-detail-view";
import { ReservationActions } from "./reservation-actions";
import { ReservationStatus } from "@/types/enums";

type Params = Promise<{ id: string }>;

const STATUS_PILL: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  [ReservationStatus.CONFIRMED]:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  [ReservationStatus.SEATED]:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  [ReservationStatus.COMPLETED]:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  [ReservationStatus.CANCELLED]:
    "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  [ReservationStatus.NO_SHOW]:
    "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

export default async function ReservationPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  if (id === "new") redirect("/reservations/new");

  let reservation: Reservation | null = null;
  try {
    reservation = await getReservationById(id as UUID);
  } catch {
    throw new Error("Failed to load reservation data");
  }
  if (!reservation) notFound();

  const headerName = reservation.customerName || "Walk-in reservation";
  const status = reservation.reservationStatus;
  const statusClass =
    STATUS_PILL[status] ??
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  const formattedDate = reservation.reservationDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(reservation.reservationDate),
      )
    : null;
  const time = reservation.reservationTime?.substring(0, 5);

  const subtitleParts: string[] = [];
  if (formattedDate) subtitleParts.push(formattedDate);
  if (time) subtitleParts.push(time);
  if (reservation.peopleCount)
    subtitleParts.push(
      `${reservation.peopleCount} guest${reservation.peopleCount === 1 ? "" : "s"}`,
    );
  if (reservation.tableAndSpaceName)
    subtitleParts.push(reservation.tableAndSpaceName);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reservations", href: "/reservations" },
          { title: headerName },
        ]}
      />
      <PageHeader
        title={headerName}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {RESERVATION_STATUS_LABELS[status] ?? String(status)}
          </span>
        }
        subtitle={subtitleParts.join(" · ")}
        actions={<ReservationActions reservation={reservation} />}
      />

      <PageBody>
        <ReservationDetailView reservation={reservation} />
      </PageBody>
    </PageShell>
  );
}
