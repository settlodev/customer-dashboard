"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {endpoints} from "@/types/endpoints";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import {Location} from "@/types/location/type";

export const listLocations = async (): Promise<Location> => {
    const currentBusiness = await getCurrentBusiness();
    const myCurrentBusiness = JSON.parse(currentBusiness);

    const myEndpoints = endpoints({businessId: myCurrentBusiness.id});
    try {
        const apiClient = new ApiClient();

        const data = await apiClient.get(myEndpoints.locations.list.endpoint);
        //console.log("Locations response", data);

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};