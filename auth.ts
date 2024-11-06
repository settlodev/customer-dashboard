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
                const existingUser = await getUserById(session.user.id);
                session.user.name = existingUser.name as string;
                session.user.email = existingUser.email as string;
                session.user.firstName = existingUser.firstName as string;
                session.user.bio = existingUser.bio as string;
                session.user.role = existingUser.role as UUID;
                session.user.country = existingUser.country as UUID;
                session.user.lastName = existingUser.lastName as string;
                session.user.avatar = existingUser.avatar ? existingUser.avatar : null;
                session.user.phoneNumber = existingUser.phoneNumber as string;
                session.user.businessId = existingUser.businessId as UUID;
                session.user.businessComplete = existingUser.businessComplete as boolean;
                session.user.emailVerified = existingUser.emailVerified as Date;
                session.user.phoneNumberVerified = existingUser.emailVerified as Date;
                session.user.emailVerificationToken = existingUser.emailVerificationToken as string;
                session.user.consent = (existingUser.consent as boolean) ?? null;
                session.user.theme = (existingUser.theme as string) ?? "light";
            }

            return session;
        },

        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;
            token.bio = existingUser.bio;
            token.role = existingUser.role;
            token.country = existingUser.country;
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.firstName = existingUser.firstName;
            token.lastName = existingUser.lastName;
            token.avatar = existingUser.avatar;
            token.phoneNumber = existingUser.phoneNumber;
            token.theme = existingUser.theme;
            token.consent = existingUser.consent;
            token.phoneNumberVerified = existingUser.phoneNumberVerified;
            token.emailVerified = existingUser.emailVerified;
            token.businessComplete = existingUser.businessComplete;
            token.emailVerificationToken = existingUser.emailVerificationToken;
            return token;
        },
    },
    ...authConfig,
});
