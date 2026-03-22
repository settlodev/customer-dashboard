import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Reservation } from "@/types/reservation/type";
import ReservationForm from "@/components/forms/reservation_form";
import { getReservationById } from "@/lib/actions/reservation-actions";

type Params = Promise<{ id: string }>;
export default async function ReservationPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Reservation | null = null;

  if (!isNewItem) {
    try {
      item = await getReservationById(resolvedParams.id as UUID);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load reservation data");
    }
    if (!item) notFound();
  }

  const breadcrumbItems = [
    { title: "Reservations", link: "/reservations" },
    {
      title: isNewItem ? "New" : item?.customerName || "Edit",
      link: "",
    },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Create Reservation" : "Edit Reservation"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Add a new reservation to your business location"
              : "Update reservation details"}
          </p>
        </div>

        <ReservationForm item={item} />
      </div>
    </div>
  );
}
