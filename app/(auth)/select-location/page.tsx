import { redirect } from 'next/navigation';
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import LocationList from "@/app/(auth)/select-location/location-list";
import {fetchAllLocations} from "@/lib/actions/location-actions";

export default async function SelectLocationPage() {
    const business = await getCurrentBusiness();

    if (!business) {
        redirect('/select-business');
    }

    if (business.totalLocations == 0) {
        redirect('/business-location');
    }

    const businessLocations = await fetchAllLocations();

    if (businessLocations == null) {
        redirect('/select-business');
    }

    return (
        <LocationList
            locations={businessLocations}
            businessName={business.name}
        />
    );
}
