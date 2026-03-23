"use client";

import React, { useState } from "react";
import { MenuBusiness } from "@/types/online-menu/type";
import { Search, Clock, MapPin, Phone, X, ShoppingBag } from "lucide-react";
import { useMenuCart } from "./menu-cart-context";

interface MenuHeaderProps {
  business: MenuBusiness;
  primaryColor: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function MenuHeader({
  business,
  primaryColor,
  searchQuery,
  onSearchChange,
}: MenuHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { openCart, getItemCount } = useMenuCart();
  const itemCount = getItemCount();

  const logo = business.locationLogo || business.logo;

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      {/* Top bar */}
      <div
        className="hidden text-xs text-white/90 md:block"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-4">
            {business.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {business.phone}
              </span>
            )}
            {(business.address || business.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[business.street, business.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          {business.openingTime && business.closingTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {business.openingTime} – {business.closingTime}
            </span>
          )}
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo & name */}
        <div className="flex items-center gap-3">
          {logo && (
            <img
              src={logo}
              alt={business.businessName}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {business.locationName || business.businessName}
            </h1>
            {business.businessType && (
              <p className="text-xs text-gray-500">{business.businessType}</p>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Desktop search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search menu..."
              className="h-9 w-56 rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition-all focus:w-72 focus:border-gray-300 focus:bg-white"
            />
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Cart button */}
          <button
            onClick={openCart}
            className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="border-t px-4 py-2 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search menu..."
              autoFocus
              className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm outline-none focus:border-gray-300 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
