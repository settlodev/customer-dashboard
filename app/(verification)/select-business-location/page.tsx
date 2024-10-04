"use client"
import LocationForm  from "@/components/forms/location_form";
import { getAllBusinessLocationsByBusinessID } from "@/lib/actions/auth/location";
import { useSearchParams } from "next/navigation";
import CreatedBusinessLocationList from "./location_list";
async function LocationPage() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get("business");
    console.log("The business id is:", businessId)
    const locationData =await getAllBusinessLocationsByBusinessID(businessId as string);
    console.log("The location data is:",locationData.length)
    return (
        locationData.length > 0 ? <CreatedBusinessLocationList locations={locationData}/> : <LocationForm />
    )
}

export default LocationPage
