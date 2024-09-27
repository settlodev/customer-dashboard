"use server";

import {z} from "zod";
import {CustomerSchema} from "@/types/customer/schema";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthToken} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {getAuthenticatedUser} from "@/lib/actions/auth-actions";
import {Customer} from "@/types/customer/type";

export const fectchAllCustomers = async () : Promise<Customer[]> => {
    await  getAuthenticatedUser();

    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();

        const customerData = await  apiClient.get(
            `/api/customer/${authToken?.locationId}`
        );
        return parseStringify(customerData);

    }
    catch (error){
        throw error;
    }
}
export const  createCustomer= async (
    customer: z.infer<typeof CustomerSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const customerValidData= CustomerSchema.safeParse(customer)

    if (!customerValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(customerValidData.error.message)
      }
      return parseStringify(formResponse)
    }
    try {
        const apiClient = new ApiClient();
        const authToken = await getAuthToken();

        await apiClient.post(
            `api/customer/${authToken?.locationId}/create`,customerValidData.data
        );
    }
    catch (error){
        console.error("Error creating customer",error)
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    if (formResponse){
        return parseStringify(formResponse)
    }
    revalidatePath("/customer");
    redirect("/customer")
}

