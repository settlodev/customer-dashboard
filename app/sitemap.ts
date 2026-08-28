import { headers } from "next/headers";
import type { MetadataRoute } from "next";

import { isIndexableHost, SITE_URL } from "@/lib/crawl-policy";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  if (!isIndexableHost(host)) {
    return [];
  }

  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact-us`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
