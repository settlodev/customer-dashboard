import { UUID } from "node:crypto";
import { notFound } from "next/navigation";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Reservation } from "@/types/reservation/type";
import ReservationForm from "@/components/forms/reservation_form";
import { getReservationById } from "@/lib/actions/reservation-actions";

type Params = Promise<{ id: string }>
export default async function ReservationPage({ params }: { params: Params }) {
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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>
            </div>

            <ReservationCard isNewItem={isNewItem} item={item} />
        </div>
    );
}

const ReservationCard = ({
    isNewItem, item,
}: {
    isNewItem: boolean;
    item: Reservation | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create Reservation" : "Edit Reservation"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Add a new reservation to your business location"
                    : "Edit reservation details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ReservationForm item={item} />
        </CardContent>
    </Card>
);
