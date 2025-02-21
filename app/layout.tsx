import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "./providers";
import { auth } from "@/auth";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.settlo.co.tz"),
  alternates: {
    canonical: "/",
    languages: {
      "sw-TZ": "/sw",
    },
  },
  applicationName: "Settlo",
  title: {
    default: "Settlo - Daftari la kidigitali",
    template: "%s | Settlo",
  },
  description:
    "Tanzania's premier POS and business management platform helping African SMEs streamline their  operations with sales tracking, inventory control, payments for retail, restaurant & service businesses.",
  generator: "Settlo",
  keywords: [
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
  openGraph: {
    title: "Settlo - Daftari la kidigitali",
    description:
      "Tanzania's premier POS and business management platform helping African SMEs streamline their  operations with sales tracking, inventory control, payments for retail, restaurant & service businesses.",
    url: "https://settlo.co.tz",
    siteName: "Settlo",
    images: [
      {
        url: "/public/images/logo.png",
        width: 1200,
        height: 630,
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
    "script:ld+json": [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Settlo",
        "url": "https://settlo.co.tz",
        "logo": "https://settlo.co.tz/logo.png",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Victoria Noble Centre",
          "addressLocality": "Bagamoyo Rd",
          "addressRegion": "Dar es Salaam",
          "postalCode": "0255",
          "addressCountry": "TZ"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+255759229777",
          "contactType": "customer service",
          "areaServed": "TZ",
          "availableLanguage": ["en", "sw"]
        },
        "sameAs": [
          "https://facebook.com/settlo",
          "https://twitter.com/settlo",
          "https://linkedin.com/company/settlo",
          "https://instagram.com/settlo"
        ],
        "openingHours": "Mo,Tu,We,Th,Fr 09:00-17:00",
        "location": {
          "@type": "Place",
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "-6.7793289",
            "longitude": "39.2516968"
          }
        }
      }
    ].map(schema => JSON.stringify(schema))
  }
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
      <body className="antialiased bg-whiten dark:bg-boxdark-2 dark:text-bodydark">
        <SessionProvider session={session}>
          <Providers>{children}</Providers>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
