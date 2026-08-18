"use client";

/**
 * Fixed list of mobile-money providers supported for invoice payments.
 *
 * Invoices accept a hardcoded set of MNOs — different from the per-location
 * payment-method tree the POS uses (which comes from the Payment Service).
 * The UUIDs below are seeded as fixed values in the Payment Service:
 * `Settlo Payment Service/src/main/.../PaymentMethodSeeder.java:139-141`.
 * Logos live in `/public/images/billing/`.
 *
 * To add a brand: drop the SVG in `/public/images/billing/`, then append a
 * row to `SUPPORTED_TELCOS` with the matching seeded `paymentMethodId`.
 */

import React from "react";

export type BrandId = "airtel" | "mixx" | "mpesa";

export interface TelcoBrand {
  id: BrandId;
  /** The seeded payment_method UUID this brand sends to the payment service. */
  paymentMethodId: string;
  /** Display name shown under the logo. */
  label: string;
  /** Brand-coloured accent used on the selected card border. */
  accent: string;
  /** Path to the logo SVG in /public. */
  logoSrc: string;
}

export const SUPPORTED_TELCOS: TelcoBrand[] = [
  {
    id: "airtel",
    paymentMethodId: "e651d4ca-8505-4818-8452-ba0b8041ee49",
    label: "Airtel Money",
    accent: "#ED1C24",
    logoSrc: "/images/billing/airtelmoney.svg",
  },
  {
    id: "mixx",
    paymentMethodId: "5c211074-fb4f-46d8-b039-e719cc526302",
    label: "Mixx by Yas",
    accent: "#FFD500",
    logoSrc: "/images/billing/mixx.svg",
  },
  {
    id: "mpesa",
    paymentMethodId: "c5020456-6966-4a12-87d0-2e8d1e7012d7",
    label: "Vodacom M-Pesa",
    accent: "#E60000",
    logoSrc: "/images/billing/vodacommpesa.svg",
  },
];

/**
 * Standardised logo tile. Renders the brand SVG centred inside a neutral
 * card so different artwork sizes still look uniform.
 */
export function TelcoLogo({
  brand,
  className,
}: {
  brand: TelcoBrand;
  className?: string;
}) {
  return (
    <span
      className={
        "flex h-12 w-full items-center justify-center rounded-lg bg-card " +
        (className ?? "")
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.logoSrc}
        alt={brand.label}
        className="h-9 w-auto max-w-[80%] object-contain"
      />
    </span>
  );
}
