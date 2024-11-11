"use server"

import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import {cookies} from "next/headers";

export const fetchCountries = async () => {
    const countryList = cookies().get("countries")?.value;
    console.log("countryList", countryList);
    if(countryList){
        return countryList;
    }else {
        try {
            const apiClient = new ApiClient();
            apiClient.isPlain = true;
            const response = await apiClient.get("/api/countries");
            cookies().set("countries", JSON.stringify(response));
            return parseStringify(response);
        } catch (error) {
            throw error;
        }
    }
}
