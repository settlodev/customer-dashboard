"use server";

import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {PrivilegeItem} from "@/types/types";

export const fetchAllSections = async () : Promise<PrivilegeItem[]> => {
    try {
        const apiClient = new ApiClient();

        const data = await  apiClient.get(
            `/api/privilege-sections`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}
