"use server";

import axios  from "axios";
import {z} from "zod";
import {CustomerSchema} from "@/types/data-schemas";
import {CustomerResponse} from "@/types/types";
// import {parseStringify} from "@/lib/utils";

export const  createCustomer= async (
    formData: z.infer<typeof CustomerSchema>
): Promise<CustomerResponse> => {

    const customerValidData= CustomerSchema.safeParse(formData)

    if (!customerValidData.success){
      throw new Error("Invalid customer data")
    }
    try {
        const resp = await axios.post("/api/customer",customerValidData.data);
        return resp.data as CustomerResponse;
    }
    catch (error){
        console.error("Error creating customer",error)
        throw  new Error("Failed to create customer")
    }
}

