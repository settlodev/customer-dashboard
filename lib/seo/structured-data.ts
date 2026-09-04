import { SITE_URL } from "@/lib/crawl-policy";

/**
 * schema.org structured data for the public marketing surface.
 *
 * Everything here is rendered through <JsonLd> as a real
 * `application/ld+json` script tag. Keep the values in sync with what the
 * page actually shows — Google treats markup that contradicts visible page
 * content as spam, and the penalty is the whole site losing rich results.
 */

const SUPPORT_PHONE = "+255759229777";
const SUPPORT_EMAIL = "support@settlo.co.tz";

/** Profiles verified against components/landing-page/Footer.tsx. */
const SOCIAL_PROFILES = [
  "https://www.instagram.com/settlo__",
  "https://www.linkedin.com/company/settlo",
];

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Settlo",
  legalName: "Settlo Technologies",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/images/logo_badge.png`,
  },
  image: `${SITE_URL}/images/settlo_share_image.jpg`,
  description:
    "Settlo builds point-of-sale, inventory management and accounting software for small and medium businesses in Tanzania.",
  // The current office, after the move from Noble Centre. Google
  // cross-references this against the visible NAP and the Google Business
  // Profile, so this must stay in step with Footer.tsx, Location.tsx and
  // contact_us_form.tsx — all four now carry the same address.
  address: {
    "@type": "PostalAddress",
    streetAddress: "5th Floor, Auditax International, Coca-Cola Road, Mikocheni",
    postOfficeBoxNumber: "8059",
    addressLocality: "Dar es Salaam",
    addressRegion: "Dar es Salaam",
    addressCountry: "TZ",
  },
  // No `geo` on purpose. The only coordinates in the codebase come from the
  // Google Maps embed in Location.tsx, whose URL is stamped v=1705520169789
  // (January 2024) — i.e. it predates the move from Noble Centre, so those
  // coordinates most likely still point at the old office. Publishing a
  // wrong GeoCoordinates would pin the business to the previous address;
  // omitting it lets Google geocode the (verified) streetAddress instead.
  // Re-add it once the embed is regenerated for the Auditax building.
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: SUPPORT_PHONE,
      email: SUPPORT_EMAIL,
      contactType: "customer service",
      areaServed: "TZ",
      availableLanguage: ["en", "sw"],
    },
    {
      "@type": "ContactPoint",
      telephone: SUPPORT_PHONE,
      contactType: "sales",
      areaServed: "TZ",
      availableLanguage: ["en", "sw"],
    },
  ],
  areaServed: {
    "@type": "Country",
    name: "Tanzania",
  },
  sameAs: SOCIAL_PROFILES,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Settlo",
  description:
    "POS, inventory management and accounting software for businesses in Tanzania.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: ["en-TZ", "sw-TZ"],
};

type PricingTier = {
  name: string;
  monthly: string;
  annual: string;
  summary: string;
  includes: string;
};

/** Mirrors the plans rendered by components/landing-page/Pricing.tsx. */
export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Settlo Silver",
    monthly: "10000",
    annual: "110000",
    summary: "Perfect for small businesses just getting started",
    includes:
      "POS, Reports, Inventory Management (1–100 products), Staff Management (2 users), Customer Management, Supplier Management",
  },
  {
    name: "Settlo Platinum",
    monthly: "25000",
    annual: "275000",
    summary: "Most popular — ideal for growing businesses",
    includes:
      "POS, Reports, Inventory Management (1–1,000 products), Staff Management (1–10 users), Customer Management, Recipe Management, Supplier Management",
  },
  {
    name: "Settlo Diamond",
    monthly: "60000",
    annual: "660000",
    summary: "Premium features for established businesses",
    includes:
      "POS, Reports, Inventory Management (1–5,000 products), Staff Management (1–25 users), Customer Management, Table Reservation, Kitchen Display, Recipe Management, Room Booking",
  },
];

/**
 * The product itself. `aggregateRating` is deliberately absent: Google
 * requires ratings to come from real users AND be visible on the page that
 * carries the markup. The previous hard-coded "4.5 from 1000 ratings" was
 * never displayed anywhere on the site, so emitting it now — as a script tag
 * Google actually parses — would risk a spammy-structured-markup manual
 * action. Wire it to real Play Store / App Store review counts and render
 * them on the page before adding it back.
 */
export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "Settlo POS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Point of Sale Software",
  operatingSystem: "Android, iOS, Web",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  description:
    "All-in-one POS, inventory management and accounting software for retail, restaurant and service businesses in Tanzania.",
  featureList: [
    "Point of sale and checkout",
    "Real-time inventory management across multiple locations",
    "Accounting, ledger and financial reporting",
    "Sales and performance analytics",
    "Procurement — RFQs, purchase orders and goods receiving",
    "Staff management and payroll",
    "Customer profiles and loyalty",
    "Mobile money, card and cash payments",
  ],
  availableOnDevice: "Android phone, Android tablet, iPhone, iPad, Web browser",
  countriesSupported: "TZ",
  inLanguage: ["en", "sw"],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "TZS",
    lowPrice: "10000",
    highPrice: "60000",
    offerCount: String(PRICING_TIERS.length),
    offers: PRICING_TIERS.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: tier.monthly,
      priceCurrency: "TZS",
      description: tier.summary,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/#pricing`,
      itemOffered: {
        "@type": "Service",
        name: tier.name,
        description: `Includes: ${tier.includes}`,
      },
      priceSpecification: [
        {
          "@type": "UnitPriceSpecification",
          price: tier.monthly,
          priceCurrency: "TZS",
          unitCode: "MON",
          name: "Monthly billing",
        },
        {
          "@type": "UnitPriceSpecification",
          price: tier.annual,
          priceCurrency: "TZS",
          unitCode: "ANN",
          name: "Annual billing — save one month",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "12",
            unitCode: "MON",
          },
        },
      ],
    })),
  },
};

export type Faq = { question: string; answer: string };

/**
 * FAQPage markup. Only emit this for FAQs that are actually rendered on the
 * same page — Google requires the answer text to be visible to the user.
 */
export function faqPageSchema(faqs: Faq[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Breadcrumb trail. `path` is site-relative, e.g. "/pos-system-tanzania". */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

/** Marketing page wrapper, tying a solution page back to the product. */
export function webPageSchema({
  path,
  name,
  description,
  language = "en-TZ",
}: {
  path: string;
  name: string;
  description: string;
  language?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name,
    description,
    inLanguage: language,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#software` },
    primaryImageOfPage: `${SITE_URL}/images/settlo_share_image.jpg`,
  };
}
