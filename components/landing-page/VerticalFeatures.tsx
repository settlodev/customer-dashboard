'use client'

import { useState } from 'react';
import {Activity, ArrowRight, BadgeDollarSign, ChartSpline, LucideIcon, Store, Users, Workflow} from 'lucide-react';
import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  image?: string;
  imageAlt?: string;
}

interface Feature extends FeatureCardProps {
  icon: LucideIcon;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
                                                   title,
                                                   description,
                                                   icon: Icon,
                                                   image,
                                                   imageAlt
                                                 }) => (
    <div className="group relative bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl border border-gray-100 hover:border-emerald-100">
      <div className="relative z-10">
        {/* Icon with gradient background */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300">
          {Icon && <Icon className="w-6 h-6" />}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed mb-4">{description}</p>

        {image && (
            <div className="relative mt-6 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Image
                  src={image}
                  alt={imageAlt || title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-xl"
              />
            </div>
        )}
      </div>

      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10" />
    </div>
);

export const VerticalFeatures: React.FC = () => {
  const [showAll, setShowAll] = useState<boolean>(false);

  const features: Feature[] = [
    {
      title: "Inventory Management",
      description: "Stay on top of your stock with real-time tracking, low stock alerts, and multi-location management—all from one intuitive dashboard.",
      image: '/images/features/dashboard.png',
      imageAlt: "Inventory Management",
      icon: ChartSpline
    },
    {
      title: "Sales Monitoring & Reporting",
      description: "Transform data into insights with robust analytics tools that help you track performance and make informed business decisions.",
      image: '/images/features/dashboard2.png',
      imageAlt: "Sales Monitoring",
      icon: Activity
    },
    {
      title: "Payment Processing",
      description: "Accept all payment methods seamlessly—from cash to cards to mobile payments—for a frictionless checkout experience.",
      icon: BadgeDollarSign
    },
    {
      title: "Customer Relationship Management",
      description: "Build stronger connections with customer profiles, personalized experiences, and data-driven loyalty programs.",
      image: "/images/features/dashboard.png",
      imageAlt: 'Customer Management',
      icon: Users
    },
    {
      title: "Employee Management",
      description: "Streamline team operations with integrated performance tracking, scheduling, and payroll management tools.",
      image: "/images/features/employees.jpg",
      imageAlt: 'Employee Management',
      icon: Users
    },
    {
      title: "Omnichannel Integration",
      description: "Unite your physical and digital presence with seamless integration across all sales channels and platforms.",
      icon: Workflow
    },
    {
      title: "Multi-Store Management",
      description: "Control your entire retail empire from a single dashboard with real-time visibility across all locations.",
      icon: Store
    },
    {
      title: "Mobile POS",
      description: "Take your business anywhere with powerful mobile point-of-sale capabilities that enhance customer service.",
      image: "/images/features/devices.png",
      imageAlt: 'Mobile Devices',
      icon: Store
    }
  ];

  const displayedFeatures = showAll ? features : features.slice(0, 6);

  return (
      <section id="features" className="relative w-full overflow-hidden py-24">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-tl from-white via-emerald-50/30 to-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.15),transparent_50%)]" />
        </div>

        <div className="relative container mx-auto px-4">
          {/* Header Section */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Powerful Features for Modern Business
            </h2>
            <p className="text-xl text-gray-600">
              Experience a comprehensive suite of tools designed to streamline your operations,
              enhance customer experiences, and drive business growth.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayedFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
            ))}
          </div>

          {/* View More Button */}
          {features.length > 6 && (
              <div className="text-center">
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center px-8 py-3 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105"
                >
                  {showAll ? 'Show Less' : 'View All Features'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
          )}
        </div>
      </section>
  );
};
