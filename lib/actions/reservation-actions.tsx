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
import { Reservation } from "@/types/reservation/type";
import { ReservationSchema } from "@/types/reservation/schema";

export const fectchAllReservations = async () : Promise<Reservation[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const reservationData = await  apiClient.get(
            `/api/reservations/${location?.id}`,
        );

        return parseStringify(reservationData);

    }
    catch (error){
        throw error;
    }
}
export const searchReservation = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Reservation>> =>{
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

        const reservationData = await  apiClient.post(
            `/api/reservations/${location?.id}`,
            query
        );
        return parseStringify(reservationData);
    }
    catch (error){
        throw error;
    }

}
export const  createReservation= async (
    reservation: z.infer<typeof ReservationSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const VavlidReservationData= ReservationSchema.safeParse(reservation)

    if (!VavlidReservationData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(VavlidReservationData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...VavlidReservationData.data,
        location: location?.id,
        business: business?.id
    }
    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/reservations/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating reservation",error)
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
    revalidatePath("/reservations");
    redirect("/reservations")
}

export const getReservation= async (id:UUID) : Promise<ApiResponse<Reservation>> => {
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
    const reservationResponse = await apiClient.post(
        `/api/reservations/${location?.id}`,
        query,
    );

    return parseStringify(reservationResponse)
}



export const updateReservation = async (
    id: UUID,
    reservation: z.infer<typeof ReservationSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const ValidReservationData = ReservationSchema.safeParse(reservation);

    if (!ValidReservationData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(ValidReservationData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...ValidReservationData.data,
        location: location?.id,
        business: business?.id
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/reservations/${location?.id}/${id}`,
            payload
        );

    } catch (error) {
        console.error("Error updating reservation", error);
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }
    revalidatePath("/reservations");
    redirect("/reservations");
};

export const deleteReservation = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Reservation ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/reservations/${location?.id}/${id}`,
    );
    revalidatePath("/reservations");

   }
   catch (error){
       throw error
   }
}
