// lib/domain-config.ts
type EnvConfig = {
  rootDomain: string;
  rootUrl: string;
  getSubOrigin: (slug: string) => string;
};

export function getDomainConfig(): EnvConfig {
  const isProd = process.env.NODE_ENV === "production";
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV; // "production" | "staging" | "development"

  if (appEnv === "production") {
    return {
      rootDomain: ".settlo.co.tz",
      rootUrl: "https://settlo.co.tz",
      getSubOrigin: (slug) => `https://${slug}.settlo.co.tz`,
    };
  }

  if (appEnv === "staging") {
    return {
      rootDomain: ".demo.settlo.co.tz",
      rootUrl: "https://demo.settlo.co.tz",
      getSubOrigin: (slug) => `https://${slug}.demo.settlo.co.tz`,
    };
  }

  // Local development
  const port = process.env.DEV_PORT ?? "3000";
  return {
    rootDomain: ".lvh.me",
    rootUrl: `http://lvh.me:${port}`,
    getSubOrigin: (slug) => `http://${slug}.lvh.me:${port}`,
  };
}
