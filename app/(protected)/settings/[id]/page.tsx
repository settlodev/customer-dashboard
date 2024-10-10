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
import { LocationSettings } from "@/types/locationSettings/type";
import { getLocationSettings } from "@/lib/actions/settings-actions";
import LocationSettingsForm from "@/components/forms/location_settings_form";

export default async function LocationSettingsPage({
                                               params,
                                           }: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<LocationSettings> | null = null;

    if (!isNewItem) {
        try {
            item = await getLocationSettings(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load location data");
        }
    }

    const breadcrumbItems = [
        { title: "Settings", link: "/settings" },
        {
            title: isNewItem ? "New" : item?.content[0]?.id || "Edit",
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

            <LocationSettingsCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const LocationSettingsCard = ({
                        isNewItem,
                        item,
                    }: {
    isNewItem: boolean;
    item: LocationSettings | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create location settings" : "Edit location settings"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Add a new location settings to your business"
                    : "Edit location settings details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LocationSettingsForm item={item} />
        </CardContent>
    </Card>
);
