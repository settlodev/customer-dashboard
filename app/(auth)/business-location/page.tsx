"use client"
import { useEffect, useState } from "react"; // Add useState and useEffect
import LocationForm from "@/components/forms/location_form";
import { getAllBusinessLocationsByBusinessID } from "@/lib/actions/auth/location";
import { useSearchParams } from "next/navigation";
import CreatedBusinessLocationList from "./Location_list";
import { Location } from "@/types/location/type";

async function fetchLocationData(businessId: string) {
    return await getAllBusinessLocationsByBusinessID(businessId);
}

function LocationPage() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get("business");
    const [loading, setLoading] = useState(true);
    const [locationData, setLocationData] = useState<Location[]>([]); 

    useEffect(() => {
        if (businessId) {
            fetchLocationData(businessId).then(data => {
                console.log("The location data is:", data.length);
                setLocationData(data);
                setLoading(false);
            });
        }
    }, [businessId]); 

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        locationData.length > 0 ? <CreatedBusinessLocationList locations={locationData}/> : <LocationForm />
    );
}

export default LocationPage;