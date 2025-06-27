"use server";



import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse} from "@/types/types";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import { Warehouses } from "@/types/warehouse/warehouse/type";

export const getWarehouses = async (): Promise<Warehouses[] | null> => {
    try {
        const business = await getCurrentBusiness();

        if (!business) {
            return null;
        }

        const apiClient = new ApiClient();

        const warehousesData = await apiClient.get(
            `/api/warehouses/${business.id}`,
        );

        return parseStringify(warehousesData);
    } catch (error) {
        
        console.error('Error in getWarehouses:', error);
        throw error;
    }
};

export const searchWarehouses = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Warehouses>> => {
    await getAuthenticatedUser();

    try {
        const business = await getCurrentBusiness();
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "name",
                    operator: "LIKE",
                    field_type: "UUID_STRING",
                    value: q,
                },
                {
                    key:"isArchived",
                    operator:"EQUAL",
                    field_type:"BOOLEAN",
                    value:false
                }
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


        const data = await apiClient.post(
            `/api/warehouses/${business?.id}`,
            query,
        );
        console.log("The list of warehouses: ", data)
        return parseStringify(data);

    } catch (error) {
        console.error('Error in search warehouses:', error);
        throw error;
    }
};

// export const createLocation = async (
//     location: z.infer<typeof LocationSchema>,
//     multiStep?: boolean
// ): Promise<FormResponse> => {
//     let formResponse: FormResponse | null = null;

//     console.log('Starting createLocation with data:', location );

//     try {
//         // Authentication check
//         const authenticatedUser = await getAuthenticatedUser();
//         if ("responseType" in authenticatedUser) {
//             return parseStringify({
//                 responseType: "error",
//                 message: "Authentication failed",
//                 error: new Error("User not authenticated")
//             });
//         }

//         // Validate input data
//         const validatedData = LocationSchema.safeParse(location);
//         if (!validatedData.success) {
//             return parseStringify({
//                 responseType: "error",
//                 message: "Please fill in all the fields marked with * before proceeding",
//                 error: new Error(validatedData.error.message),
//             });
//         }
//         console.log("validatedData: ", validatedData);

//         // Get current business & current location
//         const currentBusiness = await getCurrentBusiness();

//         const currentLocation = await getCurrentLocation();
//         const business = multiStep ? currentLocation?.business : currentBusiness?.id;
        
//         if (!business) {
//             console.error('Business not found', {
//                 authenticatedUser,
//                 location
//             });
//             return parseStringify({
//                 responseType: "error",
//                 message: "Business information not found",
//                 error: new Error("Business ID is required")
//             });
//         }

//         // if multiStep is true use the data from the form else use the data from the validatedData
//         // if multiStep is true use the data from the form else use the data from the validatedData
//                 const payload = multiStep 
//                 ? location 
//                 : {
//                     ...validatedData.data,
//                     business: business,
//                     createdAt: new Date().toISOString(),
//                     updatedAt: new Date().toISOString(),
//                 };
//             // console.log("payload: ", payload);

       


//         const apiClient = new ApiClient();
//         const response = await apiClient.post(
//             `/api/locations/${business}/create`,
//             payload,
//         );

//         // console.log("response: ", response);

//         formResponse = parseStringify({
//             responseType: "success",
//             message: "Location created successfully",
//             data: response
//         });

//     } catch (error: unknown) {
//         // console.error('Error creating location', {
//         //     error: error instanceof Error ? error.message : String(error),
//         //     stack: error instanceof Error ? error.stack : undefined,
//         //     location
//         // });

//         return parseStringify({
//             responseType: "error",
//             message: "Something went wrong while processing your request, please try again",
//             error: error instanceof Error ? error : new Error(String(error)),
//         });
//     }

//     if (formResponse) {
//         if (formResponse.responseType === "success") {
//             if (multiStep) {
//                 redirect("/business"); 
//             } else {
//                 revalidatePath("/locations");
//                 redirect("/locations");
//             }
//         }
//         return formResponse;
//     }

//     // Fallback
//     return parseStringify({
//         responseType: "error",
//         message: "An unexpected error occurred",
//         error: new Error("No response was generated")
//     });
// };


