"use client";

import React from "react";
import { MenuBusiness } from "@/types/online-menu/type";
import { MapPin, Phone, Mail, Clock, Globe } from "lucide-react";

interface MenuFooterProps {
  business: MenuBusiness;
  primaryColor: string;
}

const socialIcons: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export function MenuFooter({ business, primaryColor }: MenuFooterProps) {
  const address = [business.street, business.city, business.region]
    .filter(Boolean)
    .join(", ");

  const socials = Object.entries(business.socials).filter(
    ([, url]) => url,
  );

  return (
    <footer className="border-t bg-white pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Contact
            </h3>
            <div className="space-y-2 text-sm text-gray-500">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 hover:text-gray-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-2 hover:text-gray-700"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {business.email}
                </a>
              )}
              {address && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {address}
                </p>
              )}
            </div>
          </div>

          {/* Hours */}
          {business.openingTime && business.closingTime && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Hours
              </h3>
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {business.openingTime} – {business.closingTime}
              </p>
            </div>
          )}

          {/* Socials */}
          {socials.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Follow us
              </h3>
              <div className="flex flex-wrap gap-2">
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {key === "website" && <Globe className="h-3 w-3" />}
                    {socialIcons[key] || key}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-gray-400">
          Powered by{" "}
          <a
            href="https://settlo.co.tz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            Settlo
          </a>
        </div>
      </div>
    </footer>
  );
}
