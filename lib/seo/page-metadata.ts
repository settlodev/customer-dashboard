import type { Metadata } from "next";

import { SITE_URL } from "@/lib/crawl-policy";

/**
 * Builds per-page metadata for the public marketing pages.
 *
 * Every solution page needs its own canonical, its own OG/Twitter pair and
 * the hreflang set — a page inheriting the root layout's `canonical: "/"`
 * would tell Google it is a duplicate of the homepage and drop it from the
 * index, which is exactly the failure mode these pages exist to avoid.
 */
export function solutionMetadata({
  path,
  title,
  description,
  keywords,
  locale = "en_TZ",
  translationPair = false,
}: {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  locale?: "en_TZ" | "sw_TZ";
  /**
   * Set only on the two pages that are genuine translations of each other —
   * the English homepage and the Swahili "/sw" page. hreflang clusters must
   * be reciprocal: a page that claims "/" as its English alternate when "/"
   * does not claim it back forms a broken cluster, and Google discards the
   * whole annotation set rather than just the bad edge. The solution pages
   * have no translated equivalent, so they declare none.
   */
  translationPair?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
      ...(translationPair
        ? {
            languages: {
              "en-TZ": "/",
              "sw-TZ": "/sw",
              "x-default": "/",
            },
          }
        : {}),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Settlo",
      type: "website",
      locale,
      alternateLocale: locale === "en_TZ" ? "sw_TZ" : "en_TZ",
      countryName: "Tanzania",
      images: [
        {
          url: `${SITE_URL}/images/settlo_share_image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@settlo",
      creator: "@settlo",
      images: [`${SITE_URL}/images/settlo_share_image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}
