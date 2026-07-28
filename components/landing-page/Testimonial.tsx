"use client";

import Image from "next/image";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useCallback, useEffect } from "react";

interface Testimonial {
  id: number;
  name: string;
  title: string;
  text: string;
  image: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Yolanda",
    title: "Business Owner",
    text: "I travel a lot, hivyo Settlo inanisaidia ku-access sales na pia kuangalia inventory. Lakini pia, huwa natumia app kuhakikisha kwamba naona kitu gani kinauzika zaidi. Hii inanisaidia kupanga ratiba yangu ya kutengeneza au kuagiza bidhaa, I will always choose Settlo.",
    image: "/images/customers/yolanda.png",
    rating: 5,
  },
  {
    id: 2,
    name: "White",
    title: "Business Owner",
    text: "Wafanyakazi waliiba na wakaiba tena. Baada ya kuweka Settlo wakaacha kazi....sababu ukitumia Settlo hata nisipokua dukani naona kila kinachoendelea",
    image: "/images/customers/white.png",
    rating: 5,
  },
  {
    id: 3,
    name: "Roras",
    title: "Sales Manager",
    text: "Settlo inanisaidia kufanya mauzo na kurekodi taarifa za mauzo ili kutoa ripoti kwa bosi wangu. Sababu ni kwamba hata kama hayupo dukani, anaweza kuona kinachoendelea. Hata kabla sijampigia simu, anaweza kuona kabisa ni bidhaa gani zimebaki na zipi zinahitaji kununuliwa.",
    image: "/images/customers/roras.png",
    rating: 5,
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({
  testimonial,
}) => {
  return (
    <div className="flex-shrink-0 w-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300">
      {/* Quote icon */}
      <div className="mb-5">
        <Quote className="w-8 h-8 text-primary/20" />
      </div>

      {/* Stars */}
      <div className="flex gap-1 mb-5">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>

      {/* Text */}
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm flex-grow mb-8">
        {testimonial.text}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/10">
          <Image
            src={testimonial.image}
            alt={testimonial.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {testimonial.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {testimonial.title}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const maxIndex = Math.max(0, testimonials.length - 3);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning, maxIndex],
  );

  const prev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const next = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  // Auto-scroll
  useEffect(() => {
    if (maxIndex === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [maxIndex]);

  return (
    <section
      id="testimonials"
      className="relative w-full py-24 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-light to-primary-light dark:from-gray-950 dark:via-gray-900 dark:to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(235,127,68,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(235,127,68,0.08),transparent_50%)]" />

      <div className="relative max-w-[85rem] mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4"
            style={{ lineHeight: "1.35" }}
          >
            Real Businesses.{" "}
            <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              Real Results.
            </span>
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Learn how Settlo is helping businesses across Tanzania operate smarter, sell more, and grow faster.
          </p>
        </div>

        <div className="flex justify-end mb-6">
          {/* Navigation arrows */}
          {maxIndex > 0 && (
            <div className="flex gap-2">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={next}
                disabled={currentIndex >= maxIndex}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / 3 + 5 / 3)}%)`,
            }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="w-full min-w-[calc(33.333%-0.875rem)] max-w-[calc(33.333%-0.875rem)] hidden lg:flex"
              >
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
            {/* Mobile: show one at a time */}
            {testimonials.map((testimonial) => (
              <div
                key={`mobile-${testimonial.id}`}
                className="w-full min-w-full lg:hidden"
              >
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
