"use client";

import React, { useRef } from "react";
import { MenuCategory } from "@/types/online-menu/type";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MenuCategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  primaryColor: string;
}

export function MenuCategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
  primaryColor,
}: MenuCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  if (categories.length === 0) return null;

  return (
    <nav className="sticky top-[52px] z-20 border-b bg-white md:top-[84px]">
      <div className="relative mx-auto max-w-6xl px-4">
        {/* Scroll left */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-md backdrop-blur-sm md:left-1"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-1 overflow-x-auto px-6 py-2"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
                style={
                  isActive
                    ? { backgroundColor: primaryColor, color: "#fff" }
                    : { backgroundColor: "#f3f4f6", color: "#374151" }
                }
              >
                {cat.name}
                <span className="ml-1 text-xs opacity-70">
                  ({cat.productCount})
                </span>
              </button>
            );
          })}
        </div>

        {/* Scroll right */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-md backdrop-blur-sm md:right-1"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </nav>
  );
}
