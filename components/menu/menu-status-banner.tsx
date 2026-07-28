"use client";

import React from "react";
import { MenuBusiness, MenuCategory } from "@/types/online-menu/type";
import { Clock, XCircle, Ban } from "lucide-react";

interface MenuStatusBannerProps {
  type: "paused" | "closed" | "unavailable";
  message?: string | null;
  business: MenuBusiness;
  primaryColor: string;
  categories?: MenuCategory[];
}

export function MenuStatusBanner({
  type,
  message,
  business,
  primaryColor,
  categories,
}: MenuStatusBannerProps) {
  const logo = business.locationLogo || business.logo;

  const config = {
    paused: {
      icon: Clock,
      title: "Ordering is paused",
      defaultMessage:
        "We're temporarily not accepting orders. Please check back shortly.",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    closed: {
      icon: XCircle,
      title: "Ordering is closed",
      defaultMessage:
        "We're currently closed. Please check our opening hours and try again later.",
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
    },
    unavailable: {
      icon: Ban,
      title: "Menu unavailable",
      defaultMessage: "This menu is currently not available.",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-500",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          {logo && (
            <img
              src={logo}
              alt={business.businessName}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <h1 className="text-lg font-bold text-gray-900">
            {business.locationName || business.businessName}
          </h1>
        </div>
      </header>

      {/* Status card */}
      <div className="flex flex-1 items-start justify-center px-4 pt-20">
        <div className="w-full max-w-md text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor}`}
          >
            <Icon className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            {config.title}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {message || config.defaultMessage}
          </p>

          {business.openingTime && business.closingTime && (
            <p className="mt-4 text-sm text-gray-400">
              Opening hours: {business.openingTime} – {business.closingTime}
            </p>
          )}

          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="mt-3 inline-block text-sm font-medium underline"
              style={{ color: primaryColor }}
            >
              Contact us: {business.phone}
            </a>
          )}

          {/* Browse-only categories when paused */}
          {type === "paused" && categories && categories.length > 0 && (
            <div className="mt-10 text-left">
              <p className="mb-4 text-center text-sm text-gray-400">
                You can still browse our menu
              </p>
              {categories.map((cat) => (
                <div key={cat.id} className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">
                    {cat.name}
                  </h3>
                  <div className="space-y-2">
                    {cat.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">{p.name}</span>
                        <span className="text-sm font-medium text-gray-500">
                          {p.startingPrice.toLocaleString()} TZS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
