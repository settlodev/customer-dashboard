"server only";

import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { ExtendedUser } from "@/types/types";
import { createAuthToken, getAuthToken } from "@/lib/auth-utils";

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
      // Only create the authToken cookie if one doesn't already exist.
      // The pre-authenticated login flow (server action) creates the cookie
      // via createAuthTokenFromLogin() BEFORE calling signIn(), so we must
      // not overwrite it — NextAuth strips custom fields (accessToken, etc.)
      // from the user object, which would blank out the tokens.
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
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
        session.user.emailVerified = token.emailVerified as Date;
        session.user.isBusinessRegistrationComplete =
          token.isBusinessRegistrationComplete as boolean;
        session.user.isLocationRegistrationComplete =
          token.isLocationRegistrationComplete as boolean;
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

      // ── Initial sign-in: populate token from the user object ──────
      // The `user` object is only present on the first JWT creation
      // (during signIn). All the data is already there from authorize().
      if (user) {
        const u = user as any;
        token.name = user.name;
        token.email = user.email;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.phoneNumber = u.phoneNumber;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.emailVerified = u.emailVerified;
        token.isBusinessRegistrationComplete = u.isBusinessRegistrationComplete;
        token.isLocationRegistrationComplete = u.isLocationRegistrationComplete;
        token.accountId = u.accountId;
        token.countryId = u.countryId;
        token.countryCode = u.countryCode;
        token.theme = u.theme;
        token.avatar = u.pictureUrl;
        return token;
      }

      // ── Subsequent requests: keep existing token data ──────────────
      // All user data is set on initial sign-in. The authToken cookie
      // (managed by our server actions) is the source of truth for
      // routing and display. No API call needed here — avoids hammering
      // the accounts service on every session check.
      return token;
    },
  },
  ...authConfig,
});
