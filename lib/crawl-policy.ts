export const SITE_URL = "https://www.settlo.co.tz";

/** Hosts crawlers may index. Everything else this app serves is closed. */
const INDEXABLE_HOSTS = new Set([
  "www.settlo.co.tz",
  "settlo.co.tz",
  "localhost",
  "127.0.0.1",
]);

/**
 * First DNS label of internal/staging/API hosts. robots.txt is origin-scoped,
 * so these only apply when this Next app actually serves that host (admin,
 * beta). Other services (e.g. gateway.settlo.co.tz) need their own robots.txt.
 */
const BLOCKED_SUBDOMAIN_LABELS = new Set([
  "admin",
  "beta",
  "gateway",
  "api",
  "ws",
  "wss",
  "staging",
  "dev",
]);

export function hostnameFromHostHeader(hostHeader: string | null): string {
  return (hostHeader ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isIndexableHost(hostHeader: string | null): boolean {
  const hostname = hostnameFromHostHeader(hostHeader);
  if (!hostname) return false;
  if (BLOCKED_SUBDOMAIN_LABELS.has(hostname.split(".")[0])) return false;
  return INDEXABLE_HOSTS.has(hostname);
}

export function robotsTxtForHost(hostHeader: string | null): string {
  if (!isIndexableHost(hostHeader)) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /select-business",
    "Disallow: /select-location",
    "Disallow: /warehouse",
    "Disallow: /billing",
    "Disallow: /impersonate/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}
