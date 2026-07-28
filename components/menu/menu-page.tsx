"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MenuResolveResponse, MenuCatalogResponse, MenuCategory } from "@/types/online-menu/type";
import { getMenuCatalog } from "@/lib/actions/public-menu-actions";
import { MenuHeader } from "./menu-header";
import { MenuCategoryNav } from "./menu-category-nav";
import { MenuProductGrid } from "./menu-product-grid";
import { MenuFooter } from "./menu-footer";
import { MenuCartSidebar } from "./menu-cart-sidebar";
import { MenuStatusBanner } from "./menu-status-banner";
import { MenuCartProvider, useMenuCart } from "./menu-cart-context";
import { Loader2, ShoppingBag } from "lucide-react";

interface MenuPageProps {
  menuData: MenuResolveResponse;
}

function MenuPageInner({ menuData }: MenuPageProps) {
  const { business, settings } = menuData;
  const [catalog, setCatalog] = useState<MenuCatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const primaryColor = business.primaryColor || "#EB7F44";
  const secondaryColor = business.secondaryColor || "#1A1A2E";

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await getMenuCatalog(menuData.locationId);
        setCatalog(data);
      } catch {
        setError("Failed to load the menu. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, [menuData.locationId]);

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const filteredCategories: MenuCategory[] = catalog
    ? catalog.categories
        .map((cat) => ({
          ...cat,
          products: cat.products.filter(
            (p) =>
              !searchQuery ||
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.products.length > 0)
    : [];

  // Menu not visible
  if (!settings.menuVisible) {
    return (
      <MenuStatusBanner
        type="unavailable"
        business={business}
        primaryColor={primaryColor}
      />
    );
  }

  // Menu paused or closed
  if (settings.orderingStatus !== "ACTIVE") {
    return (
      <MenuStatusBanner
        type={settings.orderingStatus === "PAUSED" ? "paused" : "closed"}
        message={
          settings.orderingStatus === "PAUSED"
            ? settings.pausedMessage
            : settings.closedMessage
        }
        business={business}
        primaryColor={primaryColor}
        categories={catalog?.categories}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ "--menu-primary": primaryColor, "--menu-secondary": secondaryColor } as React.CSSProperties}
    >
      <MenuHeader
        business={business}
        primaryColor={primaryColor}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category nav */}
      {!isLoading && catalog && (
        <MenuCategoryNav
          categories={catalog.categories}
          activeCategory={activeCategory}
          onSelectCategory={scrollToCategory}
          primaryColor={primaryColor}
        />
      )}

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: primaryColor }}
            />
            <p className="mt-3 text-sm text-gray-500">Loading menu...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg px-4 py-2 text-sm text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Try Again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-lg font-medium text-gray-700">
              {searchQuery ? "No items match your search" : "No items available"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-sm underline"
                style={{ color: primaryColor }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <MenuProductGrid
            categories={filteredCategories}
            primaryColor={primaryColor}
            settings={settings}
          />
        )}
      </main>

      <MenuCartSidebar
        primaryColor={primaryColor}
        settings={settings}
        locationId={menuData.locationId}
        businessName={business.businessName}
      />

      <FloatingCartButton primaryColor={primaryColor} />

      <MenuFooter business={business} primaryColor={primaryColor} />
    </div>
  );
}

function FloatingCartButton({ primaryColor }: { primaryColor: string }) {
  const { openCart, getItemCount, getSubtotal } = useMenuCart();
  const count = getItemCount();
  const subtotal = getSubtotal();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <button
        onClick={openCart}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-white shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {count}
          </span>
        </div>
        <span className="text-sm font-semibold">View Cart</span>
        <span className="text-sm font-bold">
          {subtotal.toLocaleString()} TZS
        </span>
      </button>
    </div>
  );
}

export function MenuPage({ menuData }: MenuPageProps) {
  return (
    <MenuCartProvider>
      <MenuPageInner menuData={menuData} />
    </MenuCartProvider>
  );
}
