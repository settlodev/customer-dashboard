import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "./providers";
import { auth } from "@/auth";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.settlo.co.tz"),
  alternates: {
    canonical: "/",
    languages: {
      "sw-TZ": "/sw",
    },
  },
  applicationName: "Settlo",
  description:
    "Tanzania's premier POS and business management platform helping African SMEs streamline their  operations with sales tracking, inventory control, payments for retail, restaurant & service businesses.",
  generator: "Settlo",
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
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  itunes: {
    appId: "6740162721",
    appArgument: "https://settlo.co.tz", // Deep link URL
  },
  openGraph: {
    title: "Settlo - Daftari la kidigitali",
    description:
      "Tanzania's premier POS and business management platform helping African SMEs streamline their  operations with sales tracking, inventory control, payments for retail, restaurant & service businesses.",
    url: "https://settlo.co.tz",
    siteName: "Settlo",
    images: [
      {
        url: "/public/images/logo.png",
        width: 852,
        height: 841,
        alt: "Settlo - Daftari la kidigitali",
      },
    ],
    locale: "en_TZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settlo - Daftari la kidigitali",
    description:
      "Tanzania's premier POS and business management platform helping African SMEs streamline their  operations with sales tracking, inventory control, payments for retail, restaurant & service businesses..",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    // Google Play app association
    "google-play-app": "app-id=tz.co.settlo",

    // Android App Links
    "al:android:url": "settlo://home",
    "al:android:app_name": "Settlo",
    "al:android:package": "tz.co.settlo",

    // Web App Manifest link (for PWA support)
    "mobile-web-app-capable": "yes",

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
        logo: "https://settlo.co.tz/logo.png",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en" className="bg-whiten" suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body className="antialiased bg-whiten dark:bg-boxdark-2 dark:text-bodydark">
        <SessionProvider session={session}>
          <Providers>{children}</Providers>
        </SessionProvider>
        <Analytics />
        <GoogleAnalytics gaId="G-7FEFKJQ300" />
      </body>
    </html>
  );
}
