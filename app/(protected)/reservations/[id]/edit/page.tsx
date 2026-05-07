import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import ReservationForm from "@/components/forms/reservation_form";
import { getReservationById } from "@/lib/actions/reservation-actions";
import { Reservation, canEditReservation } from "@/types/reservation/type";

type Params = Promise<{ id: string }>;

export default async function ReservationEditPage({
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

  // The API rejects edits for terminal-status reservations; bounce direct
  // URL access back to the detail view rather than letting the user fill
  // out a form that will 409 on save.
  if (!canEditReservation(reservation)) {
    redirect(`/reservations/${reservation.id}`);
  }

  const headerName = reservation.customerName || "Walk-in reservation";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reservations", href: "/reservations" },
          { title: headerName, href: `/reservations/${reservation.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${headerName}`}
        subtitle="Update guest count, time, table, and special requests."
      />
      <PageBody>
        <ReservationForm item={reservation} />
      </PageBody>
    </PageShell>
  );
}
