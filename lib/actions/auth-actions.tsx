"use server";

import {LoginSchema} from "@/types/data-schemas";
import {z} from "zod";
import {LoginResponse} from "@/types/types";
import {parseStringify} from "@/lib/utils";

export const login = async (
    credentials: z.infer<typeof LoginSchema>,
): Promise<LoginResponse> => {
    const validatedData = LoginSchema.safeParse(credentials);

    if (!validatedData) {
        return parseStringify({
            type: "error",
            password: credentials.password,
            username: credentials.username,
        });
    }else{
        console.log("Submit to API", validatedData.data);

        // call server
        return parseStringify({
            type: "success",
            password: validatedData.data?.password,
            username: validatedData.data?.username,
        });

    }
}
