"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import {Product} from "@/types/product/type";
import {ProductSchema} from "@/types/product/schema";

export const fectchAllProducts = async () : Promise<Product[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/products/${location?.id}`,
        );

        return parseStringify(data);

    }
    catch (error){
        throw error;
    }
}
export const searchProducts = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Product>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"name",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/products/${location?.id}`,
            query
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}

export const  createProduct= async (
    product: z.infer<typeof ProductSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validData= ProductSchema.safeParse(product)


    if (!validData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id
    }

    try {
        const apiClient = new ApiClient();
        await apiClient.post(
            `/api/products/${location?.id}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Product created successfully",
        };
    }
    catch (error: any){
        const formattedError = await error;
        console.error("Error creating product", formattedError) ;
        formResponse = {
            responseType: "error",
            message: error.message ?? "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if ( formResponse.responseType == "error" ) return parseStringify(formResponse);

    revalidatePath("/products")
    redirect("/products");
}

export const getProduct= async (id:UUID) : Promise<ApiResponse<Product>> => {
    const apiClient = new ApiClient();
    const query ={
        filters:[
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            }
        ],
        sorts: [],
        page: 0,
        size: 1,
    }
    const location = await getCurrentLocation();
    const response = await apiClient.post(
        `/api/products/${location?.id}`,
        query,
    );

    return parseStringify(response)
}
//
// export const updateProduct = async (
//     productId: string,
//     product: z.infer<typeof ProductSchema>
// ): Promise<FormResponse | void> => {
//     let formResponse: FormResponse | null = null;
//
//     // Validate the incoming data
//     const validData = ProductSchema.safeParse(product);
//
//     if (!validData.success) {
//         formResponse = {
//             responseType: "error",
//             message: "Please fill all the required fields",
//             error: new Error(validData.error.message)
//         };
//         return parseStringify(formResponse);
//     }
//
//     // Get current location and business context
//     const location = await getCurrentLocation();
//     const business = await getCurrentBusiness();
//
//     // Prepare the update payload
//     const payload = {
//         ...validData.data,
//         location: location?.id,
//         business: business?.id
//     };
//
//     try {
//         const apiClient = new ApiClient();
//
//         // First, fetch the existing product to compare variants
//         const existingProduct = await apiClient.get(`/api/products/${location?.id}/${productId}`);
//
//         // Find variants to be removed (present in existing but not in update)
//         const variantsToRemove = existingProduct.variants
//             .filter(existingVariant =>
//                 !payload.variants.some(newVariant =>
//                     newVariant.id === existingVariant.id
//                 )
//             )
//             .map(variant => variant.id);
//
//         // If there are variants to remove, delete them first
//         if (variantsToRemove.length > 0) {
//             await apiClient.delete(
//                 `/api/products/${location?.id}/${productId}/variants/delete`,
//                 { variantIds: variantsToRemove }
//             );
//         }
//
//         // Update the product with new data
//         await apiClient.put(
//             `/api/products/${location?.id}/${productId}/update`,
//             payload
//         );
//
//         formResponse = {
//             responseType: "success",
//             message: "Product updated successfully",
//         };
//     } catch (error: any) {
//         const formattedError = await error;
//         console.error("Error updating product", formattedError);
//         formResponse = {
//             responseType: "error",
//             message: error.message ?? "Something went wrong while processing your request, please try again",
//             error: error instanceof Error ? error : new Error(String(error)),
//         };
//     }
//
//     if (formResponse.responseType === "error") return parseStringify(formResponse);
//
//     revalidatePath("/products");
//     redirect("/products");
// };

export const updateProduct = async (
    id: UUID,
    product: z.infer<typeof ProductSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validData = ProductSchema.safeParse(product);


    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id
    };
    // console.log("The payload to update product", payload);

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/products/${location?.id}/${id}`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Product updated successfully",
        };

    } catch (error) {
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/products")
    return parseStringify(formResponse);
};

export const deleteProduct = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Product ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/products/${location?.id}/${id}`,
    );
    revalidatePath("/products");

   }
   catch (error){
       throw error
   }
}

export const uploadProductCSV = async ({ fileData, fileName }: { fileData: string; fileName: string }): Promise<void> => {

    if (!fileName.endsWith(".csv")) {
        throw new Error("Invalid file type. Please upload a CSV file with a .csv extension.");
    }

    const lines = fileData.split("\n");
    const isCSVContent = lines.every(line => line.split(",").length > 1);

    if (!isCSVContent) {
        throw new Error("Invalid file content. The file does not appear to have a CSV structure.");
    }


    const formattedCSVData = fileData.replace(/\r\n/g, '\n');


    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        await apiClient.post(
            `/api/products/${location?.id}/upload-csv`,
            formattedCSVData,
            {
                headers: {
                    "Content-Type": "text/csv",
                },
                transformRequest: [(data) => data],
            }
        );

        revalidatePath("/products");
        redirect("/products");

    } catch (error) {
        console.error("Error uploading CSV file:", error);

        return ;
        // throw new Error(`Failed to upload CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
};
