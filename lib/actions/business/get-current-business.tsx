"use server"

import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {Business} from "@/types/business/type";

export const getCurrentBusiness = async (): Promise<string | undefined> => {
    return cookies().get("currentBusiness")?.value;
};
