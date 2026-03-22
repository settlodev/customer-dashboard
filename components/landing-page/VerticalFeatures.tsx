'use client'

import {
  Activity,
  BadgeDollarSign,
  Heart,
  LucideIcon,
  Package,
  Users,
  Wallet,
} from 'lucide-react';
import Image from "next/image";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const features: Feature[] = [
  {
    title: "Sales & Performance Insights",
    description:
      "Make smarter decisions, faster. Gain real-time visibility into your sales, trends, and performance with advanced analytics designed to drive revenue and growth.",
    icon: Activity,
  },
  {
    title: "Seamless Payment Experience",
    description:
      "Close every sale effortlessly. Accept cash, cards, and mobile payments with a fast, secure, and frictionless checkout experience your customers will love.",
    icon: BadgeDollarSign,
  },
  {
    title: "Inventory Control",
    description:
      "Never lose track of stock again. Monitor inventory in real time, receive intelligent low-stock alerts, and manage multiple locations with precision and ease.",
    icon: Package,
  },
  {
    title: "Customer Growth & Loyalty",
    description:
      "Turn first-time buyers into loyal customers. Leverage rich customer profiles, personalized experiences, and data-driven loyalty programs to increase retention and lifetime value.",
    icon: Heart,
  },
  {
    title: "Financial Clarity",
    description:
      "Stay in control of your business finances. Track expenses with precision and access clear, detailed insights into your cash flow at any time.",
    icon: Wallet,
  },
  {
    title: "Team & Operations Management",
    description:
      "Run a more efficient operation. Manage staff scheduling, performance, and payroll from a single platform designed for clarity and control.",
    icon: Users,
  },
];

export const VerticalFeatures = () => {
  return (
    <section id="features" className="relative z-10 w-full pt-20 md:pt-28 overflow-visible">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-primary-light dark:from-gray-950 dark:via-gray-950 dark:to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(235,127,68,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(235,127,68,0.04),transparent_50%)]" />

      <div className="relative max-w-[85rem] mx-auto px-4">
        {/* Two-column layout: Image left, Content right */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image — bottom-aligned, overflows into the next section */}
          <div className="relative lg:self-end lg:mb-[-8rem]">
            <Image
              src="/images/2.png"
              alt="Settlo POS features overview"
              width={480}
              height={360}
              className="w-full h-auto drop-shadow-xl"
              priority
            />
          </div>

          {/* Content: Header + Feature list — centered vertically */}
          <div className="lg:self-center pb-16 md:pb-24">
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-8" style={{ lineHeight: '1.35' }}>
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent" style={{ lineHeight: 'inherit' }}>
                grow your business
              </span>
            </h2>
            {/* Feature list with dot indicators */}
            <div className="space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1.5">
                    <span className="block w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 leading-relaxed">
                      {feature.title}
                    </h3>
                    <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
