import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {Instagram, Linkedin, Mail, MapPin, Phone} from 'lucide-react';
import { FooterCopyright } from './FooterCopyright';

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
  { name: 'Instagram', href: 'https://www.instagram.com/settlo__', icon: <Instagram className="w-5 h-5" /> },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/settlo', icon: <Linkedin className="w-5 h-5" /> },
];

const businessType: FooterLink[] = [
  { name: 'Retails', href: '/' },
  { name: 'Restaurants', href: '/' },
  { name: 'Hotels', href: '/' },
  { name: 'Bars & Breweries', href: '/' },
];

const quickLinks: FooterLink[] = [
  { name: 'About Us', href: '/' },
  { name: 'Culture', href: '/' },
  { name: 'Join Our Team', href: '/' },
];

const legalLinks: FooterLink[] = [
  { name: 'Privacy Policy', href: '/' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'FAQ', href: '/' },
];

const contactLinks: ContactLink[] = [
  { to: 'support@settlo.co.tz', icon: <Mail className="w-5 h-5" /> },
  { to: '(+255) 0759 229 777', icon: <Phone className="w-5 h-5" /> },
  { to: '8th Floor Noble Centre Building, Bagamoyo Road, Dar es Salaam, Tanzania', icon: <MapPin className="w-5 h-5" /> },
];

export const Footer = () => {
  return (
      <footer className="w-full bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="space-y-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-3 group"
                >
                  <div className="relative w-8 h-8 bg-white rounded-md overflow-hidden">
                    <Image
                        src="/images/logo.png"
                        alt="Settlo"
                        fill
                        className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                  Settlo
                </span>
                </Link>

                {/* Contact Information */}
                <div className="space-y-4">
                  {contactLinks.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 group">
                        <div className="mt-1 text-emerald-500 transition-colors duration-200 group-hover:text-emerald-400">
                          {item.icon}
                        </div>
                        <p className="text-sm">
                          {item.to}
                        </p>
                      </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  {socialMedia.map((item) => (
                      <Link
                          key={item.name}
                          href={item.href}
                          className="text-gray-400 hover:text-emerald-500 transition-colors duration-200"
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
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Business Type
                  </h3>
                  <ul className="space-y-3">
                    {businessType.map((item) => (
                        <li key={item.name}>
                          <Link
                              href={item.href}
                              className="text-base hover:text-emerald-500 transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        </li>
                    ))}
                  </ul>
                </div>

                {/* Company Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Company
                  </h3>
                  <ul className="space-y-3">
                    {quickLinks.map((item) => (
                        <li key={item.name}>
                          <Link
                              href={item.href}
                              className="text-base hover:text-emerald-500 transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        </li>
                    ))}
                  </ul>
                </div>

                {/* Legal Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Legal
                  </h3>
                  <ul className="space-y-3">
                    {legalLinks.map((item) => (
                        <li key={item.name}>
                          <Link
                              href={item.href}
                              className="text-base hover:text-emerald-500 transition-colors duration-200"
                          >
                            {item.name}
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
