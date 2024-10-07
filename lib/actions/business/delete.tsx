"use server"
import ApiClient from "@/lib/settlo-api-client";
import {endpoints} from "@/types/endpoints";
import {getAuthenticatedUser, getAuthToken} from "@/lib/auth-utils";
import {UUID} from "node:crypto";
import {revalidatePath} from "next/cache";

export const deleteBusiness = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Business ID is required to perform this request");
    await getAuthenticatedUser();
    const authToken = await getAuthToken();
    const deleteData = {id: id, userId: authToken?.id}
    console.log("deleteData: ", deleteData);
    const myEndpoint = endpoints(deleteData)
    try {
        const apiClient = new ApiClient();
        await apiClient.delete(myEndpoint.business.delete.endpoint);
        revalidatePath("/business");
    } catch (error) {
        throw error;
    }
};
