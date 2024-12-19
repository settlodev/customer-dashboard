"use client"
import { useEffect, useState } from "react";
import { getAllBusinessLocationsByBusinessID } from "@/lib/actions/auth/location";
import { useSearchParams } from "next/navigation";
import { Location } from "@/types/location/type";
import RegisterForm from "@/components/forms/register_form";
import Loading from "../loading";

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
        return <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
            <Loading />
        </div>
      </div>
    }

    return <RegisterForm step="step4" />
}

export default LocationPage;
