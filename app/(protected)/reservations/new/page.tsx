import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import ReservationForm from "@/components/forms/reservation_form";

export default function NewReservationPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reservations", href: "/reservations" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add reservation"
        subtitle="Capture a booking — pick a date, time, party size, and table."
      />
      <PageBody>
        <ReservationForm item={null} />
      </PageBody>
    </PageShell>
  );
}
