import type { Metadata } from "next";

import { Base } from "@/components/landing-page/Base";
import { JsonLd } from "@/components/seo/json-ld";
import { HOME_FAQS } from "@/lib/content/faqs";
import { SITE_URL } from "@/lib/crawl-policy";
import { faqPageSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  // The root layout's `title.default` already leads with the head term, and
  // `title.template` would otherwise append a second " | Settlo" here.
  alternates: {
    canonical: "/",
    languages: {
      "en-TZ": "/",
      "sw-TZ": "/sw",
      "x-default": "/",
    },
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Mirrors the accordion rendered by <FAQS /> inside <Base />. */}
      <JsonLd schema={faqPageSchema(HOME_FAQS, SITE_URL)} />
      <Base />
    </>
  );
}
