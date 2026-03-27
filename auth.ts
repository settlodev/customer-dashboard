"server only";

import { getUserById } from "@/lib/actions/auth-actions";
import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { ExtendedUser } from "@/types/types";
import { createAuthToken } from "@/lib/auth-utils";

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/auth-error",
    newUser: "/business-registration",
  },
  events: {
    async signIn({ user }) {
      await createAuthToken(user);
    },
    async signOut() {
      // Cookie deletion is handled in the logout() server action
    },
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.bio = token.bio as string;
        session.user.avatar = token.avatar ? (token.avatar as string) : null;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
        session.user.emailVerified = token.emailVerified as Date;
        session.user.isBusinessRegistrationComplete = token.isBusinessRegistrationComplete as boolean;
        session.user.isLocationRegistrationComplete = token.isLocationRegistrationComplete as boolean;
        session.user.accountId = token.accountId as string;
        session.user.countryId = token.countryId as string;
        session.user.countryCode = token.countryCode as string;
        session.user.consent = (token.consent as boolean) ?? null;
        session.user.theme = (token.theme as string) ?? "light";
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      try {
        const existingUser = await getUserById(token.sub);
        if (!existingUser) return token;

        // Only update fields that are present in the response
        if (existingUser.name) token.name = existingUser.name;
        if (existingUser.email) token.email = existingUser.email;
        if (existingUser.firstName !== undefined) token.firstName = existingUser.firstName;
        if (existingUser.lastName !== undefined) token.lastName = existingUser.lastName;
        if (existingUser.bio !== undefined) token.bio = existingUser.bio;
        if (existingUser.avatar !== undefined) token.avatar = existingUser.avatar;
        if (existingUser.phoneNumber !== undefined) token.phoneNumber = existingUser.phoneNumber;
        if (existingUser.theme !== undefined) token.theme = existingUser.theme;
        if (existingUser.consent !== undefined) token.consent = existingUser.consent;
        // Keep emailVerified from existing token - account endpoint doesn't return this
        if (existingUser.isBusinessRegistrationComplete !== undefined)
          token.isBusinessRegistrationComplete = existingUser.isBusinessRegistrationComplete;
        if (existingUser.isLocationRegistrationComplete !== undefined)
          token.isLocationRegistrationComplete = existingUser.isLocationRegistrationComplete;
        if (existingUser.accountId) token.accountId = existingUser.accountId;
        if (existingUser.countryId !== undefined) token.countryId = existingUser.countryId;
        if (existingUser.countryCode !== undefined) token.countryCode = existingUser.countryCode;
      } catch {
        // If getUserById fails, keep existing token data
      }

      return token;
    },
  },
  ...authConfig,
});
