import { UUID } from "node:crypto";

import { notFound } from "next/navigation";
import { isNotFoundError } from "next/dist/client/components/not-found";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ApiResponse } from "@/types/types";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Reservation } from "@/types/reservation/type";
import ReservationForm from "@/components/forms/reservation_form";
import { getReservation } from "@/lib/actions/reservation-actions";

export default async function ReservationPage({params}: {params: { id: string }}) {

    const isNewItem = params.id === "new";
    let item: ApiResponse<Reservation> | null = null;

    if (!isNewItem) {
        try {
            item = await getReservation(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load reservation data");
        }
    }

    const breadcrumbItems = [
        { title: "Reservations", link: "/reservations" },
        {
            title: isNewItem ? "New" : item?.content[0]?.name || "Edit",
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

            <ReservationCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const ReservationCard = ({
    isNewItem, item,}: {
    isNewItem: boolean;
    item: Reservation | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create reservation" : "Edit reservation"}</CardTitle>
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
