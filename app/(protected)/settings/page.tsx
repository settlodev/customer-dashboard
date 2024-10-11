
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { LocationSettings } from "@/types/locationSettings/type";
import { fectchLocationSettings} from "@/lib/actions/settings-actions";
import LocationSettingsForm from "@/components/forms/location_settings_form";

export default async function LocationSettingsPage() {

    const item = await fectchLocationSettings();
    const breadcrumbItems = [
        { title: "Settings", link: "/settings" },
        {
            title: "Edit",
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

            <LocationSettingsCard  item={item} />
        </div>
    );
}

const LocationSettingsCard = ({
    item,
}: {
    item: LocationSettings | null | undefined;
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit settings</CardTitle>
                <CardDescription>
                    Edit location settings details
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LocationSettingsForm item={item} />
            </CardContent>
        </Card>
    );
};
