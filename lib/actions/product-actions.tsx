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
import {Product, TopSellingProduct} from "@/types/product/type";
import {ProductSchema} from "@/types/product/schema";
// import {Variant} from "@/types/variant/type";

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
        console.log("Products are as follow:", data);
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

    // console.log("The payload to create product", payload);

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

export const updateProduct = async (
    productId: string,
    product: z.infer<typeof ProductSchema>,
    paginationState?: { pageIndex: number; pageSize: number } | null
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    // Validate the incoming data
    const validData = ProductSchema.safeParse(product);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        };
        return parseStringify(formResponse);
    }

    // Get current location and business context
    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    // Prepare the update payload
    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id
    };

    try {
        const apiClient = new ApiClient();

        // First, fetch the existing product to compare variants
        const existingProduct = await getProduct(productId as UUID);

        if (existingProduct.totalElements == 0) {
            formResponse = {
                responseType: "error",
                message: "Error occurred while updating this product",
            };
            return parseStringify(formResponse);
        }

        const existingVariants = existingProduct.content[0].variants;

        // Variants data
        const variantsPayload: any[] = [];

        // Create a map of existing variants based on original form positions
        const existingVariantMap = new Map();
        existingVariants.forEach(variant => {
            existingVariantMap.set(variant.id, variant);
        });

        // Process new/updated variants
        payload.variants.forEach((newVariant) => {
            if (newVariant.id && existingVariantMap.has(newVariant.id)) {
                variantsPayload.push({
                    ...newVariant,
                    id: newVariant.id
                });
                existingVariantMap.delete(newVariant.id);
            } else {
                variantsPayload.push(newVariant);
            }
        });

        // Any variants still in the map should be deleted
        const variantsToRemove = Array.from(existingVariantMap.keys());

        // Handle variant deletions with error tracking
        const deletionErrors: string[] = [];
        for (const variantId of variantsToRemove) {
            try {
                await deleteVariant(productId as UUID, variantId as UUID);
            } catch (error: any) {
                console.error(`Failed to delete variant ${variantId}:`, error);
                deletionErrors.push(variantId);

                const failedVariant = existingVariantMap.get(variantId);
                if (failedVariant) {
                    variantsPayload.push({
                        ...failedVariant,
                        id: variantId
                    });
                }
            }
        }

        // Prepare final payload with properly categorized variants
        const finalPayload = {
            ...payload,
            variants: variantsPayload
        };

        // console.log("The final payload to update product", finalPayload);

        // Update the product with new data
        await apiClient.put(
            `/api/products/${location?.id}/${productId}`,
            finalPayload
        );

        formResponse = {
            responseType: "success",
            message: deletionErrors.length > 0
                ? "Product updated successfully with some variants retained due to deletion failures"
                : "Product updated successfully",
        };
    } catch (error: any) {
        const formattedError = await error;
        console.error("Error updating product - Full Details:", {
            ...formattedError,
            details: {
                ...formattedError.details,
                fieldErrors: JSON.stringify(formattedError.details?.fieldErrors, null, 2)
            }
        });
        console.error("Field Errors Detail:", JSON.stringify(formattedError.details?.fieldErrors, null, 2));

        formResponse = {
            responseType: "error",
            message: error.message ?? "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse.responseType === "error") return parseStringify(formResponse);

    console.log('🔄 Preparing redirect with pagination state:', paginationState);
    revalidatePath("/products");

    if (paginationState && 
        typeof paginationState.pageIndex === 'number' && 
        typeof paginationState.pageSize === 'number') {
        
        const page = paginationState.pageIndex + 1;
        const limit = paginationState.pageSize;
        console.log('↪️ Redirecting to:', `/products?page=${page}&limit=${limit}`);
        redirect(`/products?page=${page}&limit=${limit}`);
    } else {
        console.log('↪️ Redirecting to default products page');
        redirect("/products");
    }
};


export const deleteVariant = async (productId: UUID, variantId: UUID): Promise<void> => {
    if (!productId) throw new Error("Product ID is required to perform this request");
    if (!variantId) throw new Error("Variant ID is required to perform this request");

    await getAuthenticatedUser();

    try{
        const apiClient = new ApiClient();
        await apiClient.delete(`/api/variants/${productId}/${variantId}`);
    }
    catch (error){
        throw error
    }
}

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

export const topSellingProduct = async (startDate?: Date, endDate?: Date,limit?:number): Promise<TopSellingProduct | null> => {

    await getAuthenticatedUser();
    try{
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const params = {
            startDate,
            endDate,
            limit
        }
        const topSelling = await apiClient.get(`/api/reports/${location?.id}/products/top-selling`, {
            params
        });
        // console.log("The products sold",topSelling)

        return parseStringify(topSelling);
    }
    catch (error){
        console.error("Error fetching top selling products report:", error);
        throw error
    }
}
