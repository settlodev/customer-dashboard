import { AuthError, NextAuthConfig } from "next-auth";
import Credentials from "@auth/core/providers/credentials";
import { LoginSchema } from "@/types/data-schemas";

const serviceURL = process.env.SERVICE_URL;

export default {
  providers: [
    Credentials({
      async authorize(credentials: any) {
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

          console.log("response: ", response);

          if (!response.ok) {
            const responseData = await response.json();

            if (response.status === 500) {
              console.log(responseData.message);
            } else if (response.status === 400) {
              if (responseData.code === "BAD_CREDENTIALS") {
                console.log(responseData.message);
              } else if (responseData.code === "VALIDATION_FAILED") {
                responseData.fieldErrors?.forEach(() => {
                  console.log(responseData.message);
                });
              }
            }
            return null;
          }
          // return await response.json();
          // ✨ NEW: capture upstream routing headers
          const upstreamService = response.headers.get("x-upstream-service");
          const handoffToken = response.headers.get("x-handoff-token"); // if backend provides one

          const userData = await response.json();

          console.log("The user data after logging in: ", userData);

          return {
            ...userData,
            upstreamService: upstreamService || null,
            handoffToken: handoffToken || null,
          };
        } catch (error: any) {
          console.log("error during registration: ", error);
          if (error instanceof AuthError) {
            switch (error.name) {
              case "CredentialsSignin":
                return {
                  error:
                    "Wrong credentials! Invalid email address and/or password",
                  status: "error",
                };
              default:
                return {
                  error: "An unexpected error occurred. Please try again.",
                  status: "error",
                };
            }
          }
          throw error;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
