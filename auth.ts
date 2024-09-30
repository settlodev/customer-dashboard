"server only";

import {getUserById, validateEmail} from "@/lib/actions/auth-actions";
import {UUID} from "node:crypto";
import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { SpringAuthAdapter } from "@/lib/spring-auth-adapter";
import { ExtendedUser } from "@/types/types";
import { createAuthToken } from "@/lib/auth-utils";

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: SpringAuthAdapter(process.env.SERVICE_URL!),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
        error: "/auth-error",
        newUser: "/business-registration",
    },
    events: {
        async linkAccount({ user }) {
            await validateEmail(user.id!);
        },
        async signIn({ user }) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
             // @ts-expect-error
            await createAuthToken(user);
        },
    },
    callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async signIn({ user, account }) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const existingUser = await getUserById(user.id!);

            //Check if email is verified
            //return existingUser?.emailVerified != null;

            return true;
        },
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }

            if (token.email && session.user.email) {
                session.user.email = token.email;
            }
            if (session.user) {
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.firstName = token.firstName as string;
                session.user.lastName = token.lastName as string;
                session.user.picture = token.picture ? token.picture : "";
                session.user.phoneNumber = token.phoneNumber as string;
                session.user.businessId = token.businessId as UUID;
                session.user.businessComplete = token.businessComplete as boolean;
                session.user.emailVerified = token.emailVerified as Date;
                session.user.phoneNumberVerified = token.emailVerified as Date;
                session.user.consent = (token.consent as boolean) ?? null;
                session.user.theme = (token.theme as string) ?? "light";
            }

            return session;
        },

        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;

            token.name = existingUser.name;
            token.email = existingUser.email;
            token.firstName = existingUser.firstName;
            token.lastName = existingUser.lastName;
            token.picture = existingUser.picture;
            token.phoneNumber = existingUser.phoneNumber;
            token.theme = existingUser.theme;
            token.consent = existingUser.consent;
            token.phoneNumberVerified = existingUser.phoneNumberVerified;
            token.emailVerified = existingUser.emailVerified;
            token.businessComplete = existingUser.businessComplete;

            return token;
        },
    },
    ...authConfig,
});
