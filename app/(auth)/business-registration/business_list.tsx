"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/types/business/type";
import {Loader2Icon} from "lucide-react";

const CreatedBusinessList = ({ businesses }: { businesses: Business[]}) => {
    const router = useRouter();

    useEffect(() => {
        if (businesses.length > 0) {
            router.push(`/select-business`);
        }
    }, [businesses, router]);

    return <p className="py-10 flex items-center justify-center">
        <Loader2Icon className="animate-spin" />
    </p>
}
export default CreatedBusinessList;
