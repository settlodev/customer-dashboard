"use client";

import { useRouter } from "next/navigation";

import { Business } from "@/types/business/type";


import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CreatedBusinessList = ({ businesses }: { businesses: Business[]}) => {

    const router = useRouter();
    console.log("businesses", businesses)
    if (businesses.length > 0) {
        //router.push(`/business-location?business=${businesses[0].id}`);
        router.push(`/select-business`);
        return null; //preventing the table
    }

    const handleRedirectToLocations = (business: Business) => {
        router.push(`/business-location?business=${business.id}`);
    }

    return (<></>)
}
export default CreatedBusinessList;
