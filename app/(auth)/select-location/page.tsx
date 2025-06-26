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

const warehouses = [
    {
      id: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      name: "Central Warehouse",
      address: "123 Main Street",
      city: "Dar es Salaam"
    },
    // {
    //   id: "b2c3d4e5-f6a7-8901-bcde-2345678901bc",
    //   name: "North Hub",
    //   address: "45 Industrial Road",
    //   city: "Arusha"
    // },
    // {
    //   id: "c3d4e5f6-a7b8-9012-cdef-3456789012cd",
    //   name: "Southern Depot",
    //   address: "789 Logistics Avenue",
    //   city: "Mbeya"
    // }
  ];
  

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
                warehouses={warehouses}
            />
        );
    } catch (error) {
        console.error("Error in getting current business - logging out:", error);
        redirect('/select-business');
    }
}


