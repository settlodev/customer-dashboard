"use client"

import React from 'react';
import Image from 'next/image';
import { ArrowDown } from 'lucide-react';

const brandLogos = [
  { src: '/images/brand/africanboy.jpeg', alt: 'African Boy' },
  { src: '/images/brand/bongekuku.jpeg', alt: 'Bonge Kuku' },
  { src: '/images/brand/borntoshine.png', alt: 'Born to shine' },
  { src: '/images/brand/paaz.png', alt: 'Coco Paaz' },
  { src: '/images/brand/markjuice.jpeg', alt: 'Mak Juice' },
];

export const Sponsors = () => {
  const scrollToTestimonials = () => {
    const testimonials = document.getElementById('testimonials');
    if (testimonials) {
      testimonials.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
      <section className="bg-white py-24 w-full">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-6 mb-16">
          <span className="inline-block text-emerald-600 font-medium">
            Trusted By Industry Leaders
          </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Powering Businesses Across Tanzania
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of businesses thriving with Settlo&lsquo;s smart POS solution
              that simplifies operations and accelerates growth.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 items-center justify-items-center">
            {brandLogos.map((logo) => (
                <div
                    key={logo.src}
                    className="relative group"
                >
                  {/* Subtle background for logo container */}
                  <div className="absolute inset-0 bg-gray-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Logo container */}
                  <div className="relative w-28 h-28 flex items-center justify-center p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300">
                    <Image
                        src={logo.src}
                        alt={logo.alt}
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 768px) 112px, 120px"
                    />
                  </div>
                </div>
            ))}
          </div>

          <div className="flex justify-center mt-16">
            <button
                onClick={scrollToTestimonials}
                className="group inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors py-2 px-4 rounded-full hover:bg-emerald-50"
            >
              View Customer Success Stories
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-1" />
            </button>
          </div>
        </div>
      </section>
  );
};
