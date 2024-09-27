"use server";

import {LoginSchema} from "@/types/data-schemas";
import {z} from "zod";
import {LoginResponse} from "@/types/types";
import {parseStringify} from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {endpoints} from "@/types/endpoints";
import {cookies} from "next/headers";

export const login = async (
    credentials: z.infer<typeof LoginSchema>,
): Promise<LoginResponse> => {
    const validatedData = LoginSchema.safeParse(credentials);

    if (!validatedData) {
        return parseStringify({
            type: "error",
            password: credentials.password,
            email: credentials.email
        });
    }else{
        console.log("Submit to API", validatedData.data);

        try {
            const apiClient = new ApiClient();

            const myEndpoints = endpoints();
            //console.log("credentials are:", validatedData.data);

            const data:LoginResponse = await apiClient.post(myEndpoints.auth.login.endpoint, validatedData.data);

            if(data) {
                const myCookies = cookies();
                myCookies.set('authToken', data.authToken);
                myCookies.set('userData', JSON.stringify(data));
            }

            return parseStringify({
                type: "success",
                data: data
            });
        } catch (error) {
            throw error;
        }

        /*// call server
        return parseStringify({
            type: "success",
            password: validatedData.data?.password,
            username: validatedData.data?.username,
        });*/

    }
}

export const getAuthenticatedUser = async (): Promise<string> => {
    //return current user object
    return "user";
};
