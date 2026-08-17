"server only";

import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { ExtendedUser } from "@/types/types";
import { createAuthToken, getAuthToken } from "@/lib/auth-utils";
import { AUTH_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth-constants";

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  // Required for NextAuth callbacks to work across apex + admin.* subdomain
  // on the same deployment.
  trustHost: true,
  // Match the authToken cookie's lifetime (lib/auth-constants.ts) so this
  // session can't outlive it — otherwise middleware.ts (which only checks
  // authToken) can treat the browser as logged out while a stale session
  // for a previous account is still readable by server components.
  session: { strategy: "jwt", maxAge: AUTH_COOKIE_MAX_AGE_SECONDS },
  pages: {
    signIn: "/login",
    error: "/auth-error",
    newUser: "/business-registration",
  },
  events: {
    async signIn({ user }) {
      const existing = await getAuthToken();
      if (!existing?.accessToken) {
        await createAuthToken(user);
      }
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
        session.user.emailVerified = token.emailVerified as Date;
        session.user.isBusinessRegistrationComplete =
          token.isBusinessRegistrationComplete as boolean;
        session.user.isLocationRegistrationComplete =
          token.isLocationRegistrationComplete as boolean;
        session.user.hasInvitedAccess = token.hasInvitedAccess as boolean;
        session.user.accountId = token.accountId as string;
        session.user.countryId = token.countryId as string;
        session.user.countryCode = token.countryCode as string;
        session.user.consent = (token.consent as boolean) ?? null;
        session.user.theme = (token.theme as string) ?? "light";
      }

      return session;
    },

    async jwt({ token, user }) {
      if (!token.sub) return token;

      if (user) {
        const u = user as any;
        token.name = user.name;
        token.email = user.email;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.phoneNumber = u.phoneNumber;
        token.emailVerified = u.emailVerified;
        token.isBusinessRegistrationComplete = u.isBusinessRegistrationComplete;
        token.isLocationRegistrationComplete = u.isLocationRegistrationComplete;
        token.hasInvitedAccess = u.hasInvitedAccess;
        token.accountId = u.accountId;
        token.countryId = u.countryId;
        token.countryCode = u.countryCode;
        token.theme = u.theme;
        token.avatar = u.pictureUrl;
        return token;
      }

      return token;
    },
  },
  ...authConfig,
});
