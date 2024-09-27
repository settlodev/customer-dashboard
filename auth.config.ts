import type { NextAuthConfig } from "next-auth";

import Credentials from "next-auth/providers/credentials";

import { LoginSchema } from "@/types/data-schemas";

const serviceURL = process.env.NON_SSL_SERVICE_URL;

export default {
    providers: [
        Credentials({
            async authorize(credentials) {
                const validatedData = LoginSchema.safeParse(credentials);

                if (!validatedData.success) {
                    return null;
                }

                const { email, password } = validatedData.data;

                try {
                    const response = await fetch(`${serviceURL}/api/auth/login`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email, password }),
                    });

                    if (!response.ok) {
                        const responseData = await response.json();

                        if (response.status === 500) {
                            console.log(responseData.message)
                        } else if (response.status === 400) {
                            if (responseData.code === "BAD_CREDENTIALS") {
                                console.log(responseData.message);
                            } else if (responseData.code === "VALIDATION_FAILED") {
                                responseData.fieldErrors?.forEach((fieldError: any) => {
                                    console.log(responseData.message)
                                });
                            }
                        }

                        return null;
                    }

                    return await response.json();
                } catch (error) {
                    console.log(error)

                    return null;
                }
            },
        }),
    ],
} satisfies NextAuthConfig;
