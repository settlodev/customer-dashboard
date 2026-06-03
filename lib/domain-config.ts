type EnvConfig = {
  rootDomain: string;
  plainDomain: string;
  rootUrl: string;
  getSubOrigin: (slug: string) => string;
};

export function getDomainConfig(): EnvConfig {
  const port = process.env.DEV_PORT ?? "3000";

  if (process.env.NODE_ENV === "production") {
    return {
      rootDomain: ".settlopay.co.tz",
      plainDomain: "settlopay.co.tz",
      rootUrl: "https://settlopay.co.tz",
      getSubOrigin: (slug) => `https://${slug}.settlopay.co.tz`,
    };
  }

  // Local development
  return {
    rootDomain: ".lvh.me",
    plainDomain: "lvh.me",
    rootUrl: `http://lvh.me:${port}`,
    getSubOrigin: (slug) => `http://${slug}.lvh.me:${port}`,
  };
}
