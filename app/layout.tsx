import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "./providers";
import { auth } from "@/auth";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import WhatsAppButton from "@/components/whatsapp-button";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.settlo.co.tz"),
  title: {
    default: "Settlo - Daftari la Kidigitali | POS & Business Management",
    template: "%s | Settlo",
  },
  description:
    "Tanzania's premier POS and business management platform helping African SMEs streamline their operations with sales tracking, inventory control, payments for retail, restaurant & service businesses.",
  applicationName: "Settlo",
  generator: "Settlo",
  referrer: "origin-when-cross-origin",
  creator: "Settlo Technologies",
  publisher: "Settlo Technologies",
  category: "business",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "sw-TZ": "/sw",
    },
  },
  keywords: [
    "POS Tanzania",
    "POS system",
    "Mfumo",
    "Tanzania",
    "business management software",
    "retail POS",
    "restaurant management system",
    "inventory management",
    "sales tracking",
    "payment solutions Tanzania",
    "business analytics",
    "omnichannel commerce",
    "Settlo",
    "POS",
    "Best",
    "Daftari",
    "Digitali",
    "Kuza Biashara",
    "Biashara",
  ],
  itunes: {
    appId: "6740162721",
    appArgument: "https://settlo.co.tz",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Settlo",
  },
  openGraph: {
    title: "Settlo - Daftari la Kidigitali | POS & Business Management",
    description:
      "Run your entire business smarter — All in one POS. Save time, cut costs and eliminate guesswork with an efficient platform built for modern businesses.",
    url: "https://settlo.co.tz",
    siteName: "Settlo",
    images: [
      {
        url: "https://www.settlo.co.tz/images/logo_new.png",
        width: 498,
        height: 220,
        alt: "Settlo - Daftari la Kidigitali",
        type: "image/png",
      },
    ],
    locale: "en_TZ",
    alternateLocale: "sw_TZ",
    type: "website",
    countryName: "Tanzania",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settlo - Daftari la Kidigitali | POS & Business Management",
    description:
      "Run your entire business smarter — All in one POS. Save time, cut costs and eliminate guesswork with an efficient platform built for modern businesses.",
    site: "@settlo",
    creator: "@settlo",
    images: [
      {
        url: "https://www.settlo.co.tz/images/logo_new.png",
        width: 498,
        height: 220,
        alt: "Settlo - Daftari la Kidigitali",
      },
    ],
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
  appLinks: {
    ios: {
      url: "https://settlo.co.tz",
      app_store_id: "6740162721",
      app_name: "Settlo",
    },
    android: {
      package: "tz.co.settlo",
      app_name: "Settlo",
      url: "settlo://home",
    },
    web: {
      url: "https://settlo.co.tz",
      should_fallback: true,
    },
  },
  other: {
    "google-play-app": "app-id=tz.co.settlo.v3",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": "#EB7F44",
    "msapplication-config": "none",

    "script:ld+json": [
      {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        name: "Settlo",
        operatingSystem: "ANDROID",
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "TZS",
          offerCount: "3",
          highPrice: "60000",
          lowPrice: "10000",
          offers: [
            {
              "@type": "Offer",
              name: "Settlo Silver",
              price: "10000",
              priceCurrency: "TZS",
              itemOffered: {
                "@type": "Service",
                name: "Settlo Silver",
                description:
                  "Includes: Supplier Management (Unlimited), POS, Reports, Inventory Management (1 - 100 Products), Staff Management (2 Users), Customer Management",
              },
              priceSpecification: [
                {
                  "@type": "UnitPriceSpecification",
                  price: "10000",
                  priceCurrency: "TZS",
                  unitCode: "MON",
                  name: "Monthly billing",
                },
                {
                  "@type": "UnitPriceSpecification",
                  price: "110000",
                  priceCurrency: "TZS",
                  unitCode: "ANN",
                  name: "Annual billing - Save 1 month",
                  referenceQuantity: {
                    "@type": "QuantitativeValue",
                    value: "12",
                    unitCode: "MON",
                  },
                },
              ],
              description: "Perfect for small businesses just getting started",
            },
            {
              "@type": "Offer",
              name: "Settlo Platinum",
              price: "25000",
              priceCurrency: "TZS",
              itemOffered: {
                "@type": "Service",
                name: "Settlo Platinum",
                description:
                  "Includes: Supplier Management (Unlimited), POS, Reports, Inventory Management (1 - 1,000 Products), Staff Management (1-10 Users), Customer Management, Recipe Management",
              },
              priceSpecification: [
                {
                  "@type": "UnitPriceSpecification",
                  price: "25000",
                  priceCurrency: "TZS",
                  unitCode: "MON",
                  name: "Monthly billing",
                },
                {
                  "@type": "UnitPriceSpecification",
                  price: "275000",
                  priceCurrency: "TZS",
                  unitCode: "ANN",
                  name: "Annual billing - Save 1 month",
                  referenceQuantity: {
                    "@type": "QuantitativeValue",
                    value: "12",
                    unitCode: "MON",
                  },
                },
              ],
              description: "Most popular - Ideal for growing businesses",
            },
            {
              "@type": "Offer",
              name: "Settlo Diamond",
              price: "60000",
              priceCurrency: "TZS",
              itemOffered: {
                "@type": "Service",
                name: "Settlo Diamond",
                description:
                  "Includes: Supplier Management (Unlimited), POS, Reports, Inventory Management (1 - 5,000 Products), Staff Management (1-25 Users), Customer Management, Table Reservation, Kitchen Display, Recipe Management, Room Booking",
              },
              priceSpecification: [
                {
                  "@type": "UnitPriceSpecification",
                  price: "60000",
                  priceCurrency: "TZS",
                  unitCode: "MON",
                  name: "Monthly billing",
                },
                {
                  "@type": "UnitPriceSpecification",
                  price: "660000",
                  priceCurrency: "TZS",
                  unitCode: "ANN",
                  name: "Annual billing - Save 1 month",
                  referenceQuantity: {
                    "@type": "QuantitativeValue",
                    value: "12",
                    unitCode: "MON",
                  },
                },
              ],
              description: "Premium features for established businesses",
            },
          ],
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.5",
          ratingCount: "1000",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Settlo",
        url: "https://settlo.co.tz",
        logo: "https://www.settlo.co.tz/images/logo_new.png",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Victoria Noble Centre",
          addressLocality: "Bagamoyo Rd",
          addressRegion: "Dar es Salaam",
          postalCode: "0255",
          addressCountry: "TZ",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+255759229777",
          contactType: "customer service",
          areaServed: "TZ",
          availableLanguage: ["en", "sw"],
        },
        sameAs: [
          "https://facebook.com/settlo",
          "https://twitter.com/settlo",
          "https://linkedin.com/company/settlo",
          "https://instagram.com/settlo",
        ],
        openingHours: "Mo,Tu,We,Th,Fr 09:00-17:00",
        location: {
          "@type": "Place",
          geo: {
            "@type": "GeoCoordinates",
            latitude: "-6.7793289",
            longitude: "39.2516968",
          },
        },
      },
    ].map((schema) => JSON.stringify(schema)),
  },
};

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F0D4BC",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const cookieStore = await cookies();

  let businessName: string | undefined;
  let locationName: string | undefined;

  try {
    const bizCookie = cookieStore.get("currentBusiness");
    if (bizCookie) businessName = JSON.parse(bizCookie.value)?.name;
  } catch {}

  try {
    const locCookie = cookieStore.get("currentLocation");
    if (locCookie) locationName = JSON.parse(locCookie.value)?.name;
  } catch {}

  return (
    <html
      lang="en"
      className="bg-primary-light"
      suppressHydrationWarning={true}
    >
      <head />
      <body
        className={`${openSans.className} antialiased bg-primary-light dark:bg-boxdark-2 dark:text-bodydark`}
      >
        <SessionProvider session={session}>
          <Providers>{children}</Providers>
        </SessionProvider>
        <WhatsAppButton
          userName={session?.user?.name ?? undefined}
          businessName={businessName}
          locationName={locationName}
          hideOnReserve
        />
        <Analytics />
        <GoogleAnalytics gaId="G-7FEFKJQ300" />
      </body>
    </html>
  );
}
