import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { FooterCopyright } from "./FooterCopyright";

const socialMedia = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/settlo__",
    icon: <Instagram className="w-4 h-4" />,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/settlo",
    icon: <Linkedin className="w-4 h-4" />,
  },
];

const quickLinks = [
  { name: "Contact Support", href: "/contact-us" },
  { name: "Join Our Team", href: "/careers" },
];

const legalLinks = [
  { name: "Terms of Service", href: "/terms" },
  { name: "FAQ", href: "/#faqs" },
];

const contactLinks = [
  { text: "support@settlo.co.tz", icon: <Mail className="w-4 h-4" />, href: "mailto:support@settlo.co.tz" },
  { text: "(+255) 0759 229 777", icon: <Phone className="w-4 h-4" />, href: "tel:+255759229777" },
  { text: "8th Floor Noble Centre, Bagamoyo Road, Dar es Salaam", icon: <MapPin className="w-4 h-4" />, href: undefined },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-gray-400">
      <div className="max-w-[85rem] mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/images/logo_new.png"
                alt="Settlo"
                width={120}
                height={40}
                className="h-9 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              The all-in-one POS platform built for modern businesses across Tanzania and beyond.
            </p>
            <div className="flex gap-2">
              {socialMedia.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-primary/20 hover:text-primary transition-all duration-200"
                  aria-label={item.name}
                  target="_blank"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Company
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-primary transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-primary transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Contact
            </h3>
            <ul className="space-y-3">
              {contactLinks.map((item, index) => (
                <li key={index}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="flex items-start gap-2.5 text-sm text-gray-500 hover:text-primary transition-colors duration-200"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-primary/60">{item.icon}</span>
                      {item.text}
                    </a>
                  ) : (
                    <span className="flex items-start gap-2.5 text-sm text-gray-500">
                      <span className="mt-0.5 flex-shrink-0 text-primary/60">{item.icon}</span>
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <FooterCopyright />
    </footer>
  );
};
