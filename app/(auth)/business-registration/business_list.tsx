"use client";

import { useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import { Business } from "@/types/business/type";

const CreatedBusinessList = ({ businesses }: { businesses: Business[]}) => {
    const router = useRouter();
    
    useEffect(() => { // Use useEffect for side effects
        if (businesses.length > 0) {
            //router.push(`/business-location?business=${businesses[0].id}`);
            router.push(`/select-business`);
        }
    }, [businesses]); // Dependency array to run effect when businesses change

    return (<p>Loading...</p>)
}
export default CreatedBusinessList;