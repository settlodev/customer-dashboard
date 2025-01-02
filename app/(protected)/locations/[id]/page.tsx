'use client';
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
import { getLocation } from "@/lib/actions/location-actions";
import {ApiResponse} from "@/types/types";
import {Location} from "@/types/location/type";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import LocationForm from "@/components/forms/location_form";

export default async function LocationPage({
                                               params,
                                           }: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Location> | null = null;

    if (!isNewItem) {
        try {
            item = await getLocation(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error);
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load location data");
        }
    }

    const breadcrumbItems = [
        { title: "Locations", link: "/locations" },
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

            <LocationCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const LocationCard = ({
                        isNewItem,
                        item,
                    }: {
    isNewItem: boolean;
    item: Location | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create location" : "Edit location"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Add a new location to your business"
                    : "Edit location details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LocationForm item={item} multipleStep onSubmit={() => {}} />
        </CardContent>
    </Card>
);
