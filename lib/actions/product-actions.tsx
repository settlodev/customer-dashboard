"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {
  deleteActiveBusinessCookie,
  deleteActiveLocationCookie,
  getAuthenticatedUser,
} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UUID } from "node:crypto";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import {
  Product,
  SoldItemsReport,
  TopSellingProduct,
} from "@/types/product/type";
import { ProductSchema } from "@/types/product/schema";
import { GoogleGenAI } from "@google/genai";
import { LocationDetails } from "@/types/menu/type";

export const fectchAllProducts = async (): Promise<Product[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const data = await apiClient.get(`/api/products/${location?.id}`);

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const productSummary = async (): Promise<any> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const data = await apiClient.get(
      `/api/reports/${location?.id}/products/summary`,
    );

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
export const searchProducts = async (
  q: string,
  page: number,
  pageLimit: number,
  locationId?: string,
): Promise<ApiResponse<Product>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        {
          key: "name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
        {
          key: "isArchived",
          operator: "EQUAL",
          field_type: "BOOLEAN",
          value: false,
        },
      ],
      sorts: [
        {
          key: "name",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = (await getCurrentLocation()) || { id: locationId };

    const data = await apiClient.post(`/api/products/${location?.id}`, query);
    // console.log("Products are as follow:", data);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createProduct = async (
  product: z.infer<typeof ProductSchema>,
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
    business: business?.id,
  };

  // console.log("The payload to create product", payload);

  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/products/${location?.id}/create`, payload);
    formResponse = {
      responseType: "success",
      message: "Product created successfully",
    };
  } catch (error: any) {
    const formattedError = await error;
    console.error("Error creating product", formattedError);
    formResponse = {
      responseType: "error",
      message:
        error.message ??
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse.responseType == "error") return parseStringify(formResponse);

  revalidatePath("/products");
  redirect("/products");
};

export const getProduct = async (id: UUID): Promise<ApiResponse<Product>> => {
  const apiClient = new ApiClient();
  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };
  const location = await getCurrentLocation();
  const response = await apiClient.post(`/api/products/${location?.id}`, query);

  return parseStringify(response);
};

export const updateProduct = async (
  productId: string,
  product: z.infer<typeof ProductSchema>,
  paginationState?: { pageIndex: number; pageSize: number } | null,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  // Validate the incoming data
  const validData = ProductSchema.safeParse(product);

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
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
    business: business?.id,
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
    existingVariants.forEach((variant) => {
      existingVariantMap.set(variant.id, variant);
    });

    // Process new/updated variants
    payload.variants.forEach((newVariant) => {
      if (newVariant.id && existingVariantMap.has(newVariant.id)) {
        variantsPayload.push({
          ...newVariant,
          id: newVariant.id,
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
            id: variantId,
          });
        }
      }
    }

    // Prepare final payload with properly categorized variants
    const finalPayload = {
      ...payload,
      variants: variantsPayload,
    };

    // console.log("The final payload to update product", finalPayload);

    // Update the product with new data
    await apiClient.put(
      `/api/products/${location?.id}/${productId}`,
      finalPayload,
    );

    formResponse = {
      responseType: "success",
      message:
        deletionErrors.length > 0
          ? "Product updated successfully with some variants retained due to deletion failures"
          : "Product updated successfully",
    };
  } catch (error: any) {
    const formattedError = await error;
    console.error("Error updating product - Full Details:", {
      ...formattedError,
      details: {
        ...formattedError.details,
        fieldErrors: JSON.stringify(
          formattedError.details?.fieldErrors,
          null,
          2,
        ),
      },
    });
    console.error(
      "Field Errors Detail:",
      JSON.stringify(formattedError.details?.fieldErrors, null, 2),
    );

    formResponse = {
      responseType: "error",
      message:
        error.message ??
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse.responseType === "error")
    return parseStringify(formResponse);

  console.log("🔄 Preparing redirect with pagination state:", paginationState);
  revalidatePath("/products");

  if (
    paginationState &&
    typeof paginationState.pageIndex === "number" &&
    typeof paginationState.pageSize === "number"
  ) {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;
    console.log("↪️ Redirecting to:", `/products?page=${page}&limit=${limit}`);
    redirect(`/products?page=${page}&limit=${limit}`);
  } else {
    console.log("↪️ Redirecting to default products page");
    redirect("/products");
  }
};

export const deleteVariant = async (
  productId: UUID,
  variantId: UUID,
): Promise<void> => {
  if (!productId)
    throw new Error("Product ID is required to perform this request");
  if (!variantId)
    throw new Error("Variant ID is required to perform this request");

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/variants/${productId}/${variantId}`);
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Product ID is required to perform this request");

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(`/api/products/${location?.id}/${id}`);

    revalidatePath("/products");
  } catch (error) {
    throw error;
  }
};

export const uploadProductCSV = async ({
  fileData,
  fileName,
}: {
  fileData: string;
  fileName: string;
}): Promise<void> => {
  if (!fileName.endsWith(".csv")) {
    throw new Error(
      "Invalid file type. Please upload a CSV file with a .csv extension.",
    );
  }

  const lines = fileData.split("\n");
  const isCSVContent = lines.every((line) => line.split(",").length > 1);

  if (!isCSVContent) {
    throw new Error(
      "Invalid file content. The file does not appear to have a CSV structure.",
    );
  }

  const formattedCSVData = fileData.replace(/\r\n/g, "\n");

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.post(
      `/rust/csv-uploading/upload-products-csv?location_id=${location?.id}`,
      formattedCSVData,
      {
        headers: {
          "Content-Type": "text/csv",
        },
        transformRequest: [(data) => data],
      },
    );

    // console.log("The uploading process",upload)

    revalidatePath("/products");
    redirect("/products");
  } catch (error: any) {
    // Handle subscription limit exceeded error
    if (
      error.code === "FORBIDDEN" &&
      error.status === 403 &&
      error.message?.includes(
        "beyond the limit of the current subscription package",
      )
    ) {
      // Extract limit and wanted values from the message
      const limitMatch = error.message.match(/limit is (\d+)/);
      const wantedMatch = error.message.match(/total of (\d+)/);

      const limit = limitMatch ? limitMatch[1] : "100";
      const wanted = wantedMatch ? wantedMatch[1] : "too many";

      throw new Error(
        `Subscription limit exceeded. Your current plan allows up to ${limit} products, but you attempted to upload a total of ${wanted}. Please upgrade your subscription or reduce the number of products.`,
      );
    }

    // Handle other API errors with structured messages
    if (error.message && typeof error.message === "string") {
      throw new Error(`Failed to upload CSV: ${error.message}`);
    }

    // Handle generic errors - safely convert to string
    if (error instanceof Error) {
      throw new Error(`Failed to upload CSV file: ${error.message}`);
    } else {
      throw new Error(
        `Failed to upload CSV file: Please check your file and try again.`,
      );
    }
  }
};

export const topSellingProduct = async (
  startDate?: Date,
  endDate?: Date,
  limit?: number,
): Promise<TopSellingProduct | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = {
      startDate,
      endDate,
      limit,
    };
    const topSelling = await apiClient.get(
      `/api/reports/${location?.id}/products/top-selling`,
      {
        params,
      },
    );
    // console.log("The products sold",topSelling )

    return parseStringify(topSelling);
  } catch (error) {
    console.error("Error fetching top selling products report:", error);
    throw error;
  }
};

export const SoldItemsReports = async (
  startDate?: Date,
  endDate?: Date,
): Promise<SoldItemsReport | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = {
      startDate,
      endDate,
    };
    const soldItems = await apiClient.get(
      `/api/reports/${location?.id}/products/sold-items`,
      {
        params,
      },
    );

    return parseStringify(soldItems);
  } catch (error) {
    console.error("Error fetching sold items report:", error);
    throw error;
  }
};

export const generateAIDescription = async (
  name: string,
  category: string,
): Promise<string> => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `Generate a concise product description for "${name}" in the ${category} category.

        Requirements:
        - Maximum 3-4 sentences
        - Focus on 2-3 key benefits/features only
        - Use simple, clear language
        - Avoid marketing fluff and excessive adjectives
        - Start with what the product does, not emotional language
        - Include practical value proposition
        - No bullet points or formatting
        - Keep it under 150 words

        Example format: "[Product] is a [category] that [main function]. It features [key benefit 1] and [key benefit 2]. Perfect for [target use case]."`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text ?? "No description generated";
  } catch (error) {
    console.error("Error generating description:", error);
    return "No description generated";
  }
};

// export const generateAIImage = async (description: string, name: string): Promise<string> => {
//     const ai = new GoogleGenAI({
//         apiKey: process.env.GEMINI_API_KEY,
//     });

//     const prompt = `Generate an image for "${name}" based on the following description: "${description}"`;

//     try {
//         const response = await ai.models.generateContent({
//             model: "gemini-2.0-flash-preview-image-generation",
//             contents: prompt,
//             config: {
//                 responseModalities: [Modality.TEXT, Modality.IMAGE],
//               },
//         });

//         console.log("Generated image URL:", response.url);

//         return response.url ?? "No image generated";
//     } catch (error) {
//         console.error("Error generating image:", error);
//         return "No image generated";
//     }
// }

export const downloadProductsCSV = async (locationId?: string) => {
  const location = (await getCurrentLocation()) || { id: locationId };

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.get(
      `/rust/csv-downloading/download-products-csv?location_id=${location?.id}`,
    );

    // console.log("CSV download response", response);

    return response;
  } catch (error) {
    console.error("Error downloading CSV file:", error);
    throw new Error(
      `Failed to download CSV file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const archiveProduct = async (ids: string | string[]) => {
  const apiClient = new ApiClient();
  const location = await getCurrentLocation();

  try {
    // Convert single ID to array for consistent handling
    const productIds = Array.isArray(ids) ? ids : [ids];

    // Process each product ID
    await apiClient.put(`/api/products/${location?.id}/archive`, productIds);

    revalidatePath("/products");
  } catch (error) {
    // console.error("Error archiving products:", error);
    throw error;
  }
};

export const menuProducts = async (
  q: string,
  page: number,
  pageLimit: number,
  locationId?: string,
): Promise<ApiResponse<Product>> => {
  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        {
          key: "name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
        {
          key: "isArchived",
          operator: "EQUAL",
          field_type: "BOOLEAN",
          value: false,
        },
      ],
      sorts: [
        {
          key: "name",
          direction: "ASC",
        },
      ],
      page: Math.max(page ? page - 1 : 0, 0),
      size: pageLimit ? Math.min(pageLimit, 100) : 10,
    };

    const location = { id: locationId };

    await deleteActiveBusinessCookie();
    await deleteActiveLocationCookie();

    const data = await apiClient.post(`/api/menu/${location?.id}`, query, {
      headers: {
        "SETTLO-API-KEY":
          "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a",
      },
    });

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const locationMenuDetails = async (
  locationId?: string,
): Promise<LocationDetails> => {
  try {
    const apiClient = new ApiClient();

    const data = await apiClient.get<LocationDetails>(
      `/api/menu/${locationId}`,
      {
        headers: {
          "SETTLO-API-KEY":
            "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a",
        },
      },
    );

    return parseStringify(data); // Should return LocationDetails
  } catch (error) {
    throw error;
  }
};
