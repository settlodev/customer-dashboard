import { headers } from "next/headers";
import type { MetadataRoute } from "next";

import { isIndexableHost, SITE_URL } from "@/lib/crawl-policy";

export const dynamic = "force-dynamic";

/**
 * Public, indexable URLs only. Anything listed here must also be present in
 * `publicRoutes` (routes.ts) — otherwise middleware redirects the crawler to
 * /login and the URL is dropped from the index.
 */
const ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /**
   * Only "/" and "/sw" are translations of one another, so only they carry
   * the hreflang pair. Annotating pages that have no translated equivalent
   * builds a non-reciprocal cluster, which Google discards wholesale.
   */
  translationPair?: boolean;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, translationPair: true },
  // Keyword landing pages — the primary organic entry points.
  { path: "/pos-system-tanzania", changeFrequency: "weekly", priority: 0.9 },
  { path: "/inventory-management", changeFrequency: "weekly", priority: 0.9 },
  { path: "/accounting-software", changeFrequency: "weekly", priority: 0.9 },
  { path: "/empowering-smes", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sw", changeFrequency: "weekly", priority: 0.9, translationPair: true },
  // Supporting pages.
  { path: "/contact-us", changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  if (!isIndexableHost(host)) {
    return [];
  }

  const lastModified = new Date();

  return ROUTES.map(({ path, changeFrequency, priority, translationPair }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
    ...(translationPair
      ? {
          // Mirrors the hreflang tags on the pages themselves.
          alternates: {
            languages: {
              "en-TZ": SITE_URL,
              "sw-TZ": `${SITE_URL}/sw`,
            },
          },
        }
      : {}),
  }));
}
