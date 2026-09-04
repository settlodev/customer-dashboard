import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "./providers";
import { auth } from "@/auth";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { JsonLd } from "@/components/seo/json-ld";
import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.settlo.co.tz"),
  title: {
    default:
      "POS System in Tanzania | Inventory & Accounting Software | Settlo",
    template: "%s | Settlo",
  },
  description:
    "Settlo is the all-in-one POS system in Tanzania for retail, restaurant and service businesses — mfumo wa kurekodi mauzo, inventory management, accounting and reports in one place. Free 7-day trial, from TZS 10,000/month.",
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
      "en-TZ": "/",
      "sw-TZ": "/sw",
      "x-default": "/",
    },
  },
  keywords: [
    // English — head and long-tail terms we target.
    "POS",
    "POS system",
    "POS Tanzania",
    "POS system in Tanzania",
    "best POS system in Tanzania",
    "point of sale system Tanzania",
    "inventory management",
    "inventory management system Tanzania",
    "stock management software",
    "accounting systems",
    "accounting software Tanzania",
    "business management software",
    "retail POS",
    "restaurant POS Tanzania",
    "empowering SMEs",
    "SME software Tanzania",
    "sales tracking",
    "business analytics",
    "payment solutions Tanzania",
    // Swahili — how Tanzanian merchants actually search.
    "mfumo wa kurekodi mauzo",
    "mfumo wa mauzo",
    "mfumo wa biashara",
    "programu ya mauzo",
    "kudhibiti stoo",
    "daftari la kidigitali",
    "kuza biashara",
    "Settlo",
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
        url: "https://www.settlo.co.tz/images/settlo_share_image.jpg",
        width: 1200,
        height: 630,
        alt: "Settlo - Daftari la Kidigitali",
        type: "image/jpeg",
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
        url: "https://www.settlo.co.tz/images/settlo_share_image.jpg",
        width: 1200,
        height: 630,
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
  },
};

// App-wide fonts. Single source of truth — every other reference should
// route through `var(--font-sans)` / `var(--font-mono)` (or the Tailwind
// `font-sans` / `font-mono` utilities). Email templates and PDF widgets
// stay on inline font-family strings because their renderers don't share
// runtime fonts.
const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
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

  return (
    <html
      lang="en"
      className="bg-primary-light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning={true}
    >
      <head />
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-primary-light dark:bg-boxdark-2 dark:text-bodydark`}
      >
        <SessionProvider session={session}>
          <Providers>{children}</Providers>
        </SessionProvider>
        <JsonLd
          schema={[
            organizationSchema,
            websiteSchema,
            softwareApplicationSchema,
          ]}
        />
        <Analytics />
        <GoogleAnalytics gaId="G-7FEFKJQ300" />
      </body>
    </html>
  );
}
