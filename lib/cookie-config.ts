export function getCookieConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    domain: isProduction ? ".settlo.co.tz" : ".lvh.me", // ← leading dot
    secure: isProduction,
    sameSite: "lax" as const,
    httpOnly: true,
    path: "/",
  };
}
