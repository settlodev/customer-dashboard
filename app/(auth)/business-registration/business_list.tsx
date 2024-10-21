"use client";

import { useRouter } from "next/navigation";
import { Business } from "@/types/business/type";

const CreatedBusinessList = ({ businesses }: { businesses: Business[]}) => {
    const router = useRouter();
    if (businesses.length > 0) {
        //router.push(`/business-location?business=${businesses[0].id}`);
        router.push(`/select-business`);
        return null; //preventing the table
    }

    return (<p>Loading...</p>)
}
export default CreatedBusinessList;
