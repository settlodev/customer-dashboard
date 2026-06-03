import { getDomainConfig } from "@/lib/domain-config";

export function getCookieConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const { rootDomain } = getDomainConfig();
  return {
    domain: isProduction ? rootDomain : ".lvh.me", // ← leading dot
    secure: isProduction,
    sameSite: "lax" as const,
    httpOnly: true,
    path: "/",
  };
}
