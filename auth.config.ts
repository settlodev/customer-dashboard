import { NextAuthConfig } from "next-auth";
import Credentials from "@auth/core/providers/credentials";
import { LoginSchema } from "@/types/data-schemas";

const authServiceURL = process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL;

export default {
  providers: [
    Credentials({
      async authorize(credentials: any) {
        // Pre-authenticated mode: login server action already verified credentials
        // and stored tokens. Just create the NextAuth session user object.
        if (credentials.__preAuthenticated === "true") {
          return {
            id: credentials.userId,
            email: credentials.email,
            name: credentials.name,
            firstName: credentials.firstName,
            lastName: credentials.lastName,
            phoneNumber: credentials.phoneNumber,
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            emailVerified: credentials.emailVerified === "true" ? new Date() : null,
            isBusinessRegistrationComplete: credentials.isBusinessRegistrationComplete === "true",
            isLocationRegistrationComplete: credentials.isLocationRegistrationComplete === "true",
            countryId: credentials.countryId,
            countryCode: credentials.countryCode,
            accountId: credentials.accountId,
            theme: credentials.theme,
            pictureUrl: credentials.pictureUrl,
          };
        }

        // Direct login mode (fallback)
        const validatedData = LoginSchema.safeParse(credentials);

        if (!validatedData.success) {
          return null;
        }

        const { email, password } = validatedData.data;

        try {
          const response = await fetch(`${authServiceURL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (!data.emailVerified) {
            return null;
          }

          return {
            id: data.userId,
            email: data.email,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            emailVerified: new Date(),
            accountId: data.accountId,
          };
        } catch (error: any) {
          console.error("Error during login:", error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
