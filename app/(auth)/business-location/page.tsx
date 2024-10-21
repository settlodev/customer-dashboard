"use client"
import { useEffect, useState } from "react";
import { getAllBusinessLocationsByBusinessID } from "@/lib/actions/auth/location";
import { useSearchParams } from "next/navigation";
import { Location } from "@/types/location/type";
import RegisterForm from "@/components/forms/register_form";

async function fetchLocationData(businessId: string) {
    return await getAllBusinessLocationsByBusinessID(businessId);
}

function LocationPage() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get("business");
    const [loading, setLoading] = useState(true);
    const [, setLocationData] = useState<Location[]>([]);

    useEffect(() => {
        if (businessId) {
            fetchLocationData(businessId).then(data => {
                setLocationData(data);
                setLoading(false);
            }).catch(error => {
                console.error("Error fetching location data:", error);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [businessId]);

    if (loading) {
        return <p>Loading...</p>;
    }

    /*return (
        locationData.length > 0 ? <CreatedBusinessLocationList locations={locationData}/> : <LocationAuthForm />
    );*/

    return <RegisterForm step="step3" />
}

export default LocationPage;
