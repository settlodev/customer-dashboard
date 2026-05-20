// "server only";
//
// import { getUserById, validateEmail } from "@/lib/actions/auth-actions";
// import { UUID } from "node:crypto";
// import NextAuth from "next-auth";
//
// import authConfig from "@/auth.config";
// import { SpringAuthAdapter } from "@/lib/spring-auth-adapter";
// import { ExtendedUser } from "@/types/types";
// import { createAuthToken } from "@/lib/auth-utils";
//
// declare module "next-auth" {
//   interface Session {
//     user: ExtendedUser;
//     upstreamService?: string | null;
//     handoffToken?: string | null;
//   }
// }
//
// export const { auth, handlers, signIn, signOut } = NextAuth({
//   adapter: SpringAuthAdapter(process.env.SERVICE_URL!),
//   session: { strategy: "jwt" },
//   pages: {
//     signIn: "/login",
//     error: "/auth-error",
//     newUser: "/business-registration",
//   },
//   events: {
//     async linkAccount({ user }) {
//       await validateEmail(user.id!);
//     },
//     async signIn({ user }) {
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-expect-error
//       await createAuthToken(user);
//     },
//     async signOut() {
//       // Cookie deletion is handled in the logout() server action (auth-actions.tsx)
//       // Deleting cookies here fails because NextAuth events don't run
//       // in a Server Action or Route Handler context
//     },
//   },
//   callbacks: {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     async signIn({ user, account }) {
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       //const existingUser = await getUserById(user.id!);
//
//       //Check if email is verified
//       //return existingUser?.emailVerified != null;
//
//       return true;
//     },
//     async session({ token, session }) {
//       if (token.sub && session.user) {
//         session.user.id = token.sub;
//       }
//
//       if (token.email && session.user.email) {
//         session.user.email = token.email;
//       }
//
//       if (session.user) {
//         session.user.name = token.name as string;
//         session.user.email = token.email as string;
//         session.user.firstName = token.firstName as string;
//         session.user.bio = token.bio as string;
//         session.user.role = token.role as UUID;
//         session.user.country = token.country as UUID;
//         session.user.lastName = token.lastName as string;
//         session.user.avatar = token.avatar ? (token.avatar as string) : null;
//         session.user.phoneNumber = token.phoneNumber as string;
//         session.user.businessId = token.businessId as UUID;
//         session.user.businessComplete = token.businessComplete as boolean;
//         session.user.emailVerified = token.emailVerified as Date;
//         session.user.phoneNumberVerified = token.emailVerified as Date;
//         //session.user.emailVerificationToken = token.emailVerificationToken as string;
//         session.user.consent = (token.consent as boolean) ?? null;
//         session.user.theme = (token.theme as string) ?? "light";
//       }
//
//       (session as any).upstreamService = token.upstreamService;
//       (session as any).handoffToken = token.handoffToken;
//       return session;
//     },
//
//     async jwt({ token, user }) {
//       // On initial sign-in, capture upstream routing info from authorize()
//       if (user) {
//         token.upstreamService = (user as any).upstreamService;
//         token.handoffToken = (user as any).handoffToken;
//       }
//       if (!token.sub) return token;
//
//       const existingUser = await getUserById(token.sub);
//
//       if (!existingUser) return token;
//
//       token.bio = existingUser.bio;
//       token.role = existingUser.role;
//       token.country = existingUser.country;
//       token.name = existingUser.name;
//       token.email = existingUser.email;
//       token.firstName = existingUser.firstName;
//       token.lastName = existingUser.lastName;
//       token.avatar = existingUser.avatar;
//       token.phoneNumber = existingUser.phoneNumber;
//       token.theme = existingUser.theme;
//       token.consent = existingUser.consent;
//       token.phoneNumberVerified = existingUser.phoneNumberVerified;
//       token.emailVerified = existingUser.emailVerified;
//       token.businessComplete = existingUser.businessComplete;
//       //token.emailVerificationToken = existingUser.emailVerificationToken;
//       return token;
//     },
//   },
//   ...authConfig,
// });

"server only";

import { getUserById, validateEmail } from "@/lib/actions/auth-actions";
import { UUID } from "node:crypto";
import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { SpringAuthAdapter } from "@/lib/spring-auth-adapter";
import { ExtendedUser } from "@/types/types";
import { createAuthToken } from "@/lib/auth-utils";

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
    upstreamService?: string | null;
    handoffToken?: string | null;
  }
}

// Normalize "alpha-auth-service" → "alpha", "dev-auth-service" → "dev"
function normalizeService(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split("-")[0];
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
    async signOut() {
      // Cookie deletion handled in logout() server action
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

      if (token.email && session.user.email) {
        session.user.email = token.email;
      }

      if (session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.bio = token.bio as string;
        session.user.role = token.role as UUID;
        session.user.country = token.country as UUID;
        session.user.lastName = token.lastName as string;
        session.user.avatar = token.avatar ? (token.avatar as string) : null;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.businessId = token.businessId as UUID;
        session.user.businessComplete = token.businessComplete as boolean;
        session.user.emailVerified = token.emailVerified as Date;
        session.user.phoneNumberVerified = token.emailVerified as Date;
        session.user.consent = (token.consent as boolean) ?? null;
        session.user.theme = (token.theme as string) ?? "light";
      }

      // Expose upstream routing info for the login server action
      session.upstreamService = token.upstreamService as string | null;
      session.handoffToken = token.handoffToken as string | null;

      console.log(
        "🟣 [session] upstreamService exposed:",
        session.upstreamService,
      );

      return session;
    },

    async jwt({ token, user }) {
      // On initial sign-in, capture upstream routing info from authorize()
      if (user) {
        token.upstreamService = (user as any).upstreamService;
        token.handoffToken = (user as any).handoffToken;
        console.log(
          "🟢 [jwt] initial sign-in, upstreamService:",
          token.upstreamService,
        );
      }

      if (!token.sub) return token;

      // ✨ APPROACH A: Skip user enrichment if user belongs to a different service.
      // Calling getUserById here would hit the WRONG gateway
      // (e.g., dev SERVICE_URL when user belongs to alpha).
      // The login action will redirect the user, and the destination
      // environment will enrich its own session using its own SERVICE_URL.
      const upstream = normalizeService(token.upstreamService as string);
      const current = normalizeService(process.env.SERVICE_NAME);

      if (upstream && current && upstream !== current) {
        console.log(
          "⏭️  [jwt] skipping getUserById — user belongs to:",
          upstream,
          "current:",
          current,
        );
        return token;
      }

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

      return token;
    },
  },
  ...authConfig,
});
