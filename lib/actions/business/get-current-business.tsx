"use server"

import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {Business} from "@/types/business/type";

export const getCurrentBusiness = async (): Promise<Business> => {
    const myBusiness = cookies().get("currentBusiness")?.value as unknown as Business;
    try {
        return myBusiness
    } catch (error) {
        throw error;
    }
};
