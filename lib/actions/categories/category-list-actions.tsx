"use server"
import * as https from "node:https";
import {axiosInstance} from "@/app/axiosConfig";
import {parseStringify} from "@/lib/utils";

export const getCategoriesAction = async()=> {
    const agent = new https.Agent({
        rejectUnauthorized: false
    });
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        httpsAgent: agent,
        url: 'https://35.159.78.184:8443/api/categories/2e5a964c-41d4-46b7-9377-c547acbf7739',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYmlqYW1wb2xhQGdtYWlsLmNvbSIsImlhdCI6MTcyNzM2ODYyNCwiZXhwIjoxNzI3MzcyMjI0fQ.rfSNS9QPS3YjtXb-LEIDAHmxgi0iUXXr16zDN8AUdM8'
        }
    };

    return axiosInstance.request(config).then((response) => parseStringify(response.data));
}
