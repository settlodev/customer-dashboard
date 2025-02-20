import { redirect } from 'next/navigation';
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import LocationList from "@/app/(auth)/select-location/location-list";
import {fetchAllLocations} from "@/lib/actions/location-actions";

import { cookies } from 'next/headers';
import { headers } from 'next/headers';

// Mark the page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Add error boundary for better error handling
export const fetchCache = 'force-no-store';

export default async function SelectLocationPage() {
    try {
        // Force dynamic behavior by reading headers and cookies
        headers();
        cookies();

        const business = await getCurrentBusiness();

        if (!business) {
            redirect('/select-business');
        }

        if (business.totalLocations === 0) {
            redirect('/business-location');
        }

        const businessLocations = await fetchAllLocations();

        if (!businessLocations) {
            redirect('/select-business');
        }

        return (
            <LocationList
                locations={businessLocations}
                businessName={business.name}
            />
        );
    } catch (error) {
        console.error("Error in getting current business - logging out:", error);
        redirect('/select-business');
    }
}


