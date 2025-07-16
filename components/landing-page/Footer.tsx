import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { FooterCopyright } from "./FooterCopyright";

interface FooterLink {
  name: string;
  href: string;
}

interface ContactLink {
  to: string;
  icon: React.ReactNode;
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const socialMedia: SocialLink[] = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/settlo__",
    icon: <Instagram className="w-5 h-5" />,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/settlo",
    icon: <Linkedin className="w-5 h-5" />,
  },
];

const quickLinks: FooterLink[] = [
  { name: "Contact support", href: "/contact-us" },
  { name: "Join Our Team", href: "/careers" },
];

const legalLinks: FooterLink[] = [
  { name: "Terms of Service", href: "/terms" },
  { name: "FAQ", href: "/#faqs" },
];

const contactLinks: ContactLink[] = [
  { to: "support@settlo.co.tz", icon: <Mail className="w-5 h-5" /> },
  { to: "(+255) 0759 229 777", icon: <Phone className="w-5 h-5" /> },
  {
    to: "8th Floor Noble Centre Building, Bagamoyo Road, Dar es Salaam, Tanzania",
    icon: <MapPin className="w-5 h-5" />,
  },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-gray-300 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="space-y-8">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="relative w-10 h-10 bg-gradient-to-br from-white to-gray-100 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
                  <Image
                    src="/images/logo.png"
                    alt="Settlo Technologies Limited"
                    fill
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                  Settlo Technologies Limited
                </span>
              </Link>

              {/* Contact Information */}
              <div className="space-y-5">
                {contactLinks.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 transition-all duration-200 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 group-hover:scale-110">
                      {item.icon}
                    </div>
                    <p className="text-sm leading-relaxed text-gray-300 group-hover:text-white transition-colors duration-200">
                      {item.to}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {socialMedia.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="p-3 rounded-xl bg-gray-800/50 text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 backdrop-blur-sm border border-gray-700/50 hover:border-emerald-500/30"
                    aria-label={item.name}
                    target="_blank"
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="space-y-4">
                <></>
              </div>

              {/* Company Links */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400/80 relative">
                  Company
                  <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent"></div>
                </h3>
                <ul className="space-y-4">
                  {quickLinks.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block relative group"
                      >
                        <span className="relative z-10">{item.name}</span>
                        <div className="absolute inset-0 -left-2 w-0 bg-emerald-500/10 rounded transition-all duration-200 group-hover:w-full"></div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Links */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400/80 relative">
                  Legal
                  <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent"></div>
                </h3>
                <ul className="space-y-4">
                  {legalLinks.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block relative group"
                      >
                        <span className="relative z-10">{item.name}</span>
                        <div className="absolute inset-0 -left-2 w-0 bg-emerald-500/10 rounded transition-all duration-200 group-hover:w-full"></div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <FooterCopyright />
    </footer>
  );
};
