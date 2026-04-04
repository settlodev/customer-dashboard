"use client";

import React, { useState } from "react";
import { MenuCategory, MenuProduct, MenuPublicSettings } from "@/types/online-menu/type";
import { Plus } from "lucide-react";
import { MenuProductDetail } from "./menu-product-detail";

interface MenuProductGridProps {
  categories: MenuCategory[];
  primaryColor: string;
  settings: MenuPublicSettings;
}

export function MenuProductGrid({
  categories,
  primaryColor,
  settings,
}: MenuProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);

  return (
    <>
      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {category.name}
              </h2>
              <div
                className="h-px flex-1"
                style={{ backgroundColor: `${primaryColor}20` }}
              />
              <span className="text-sm text-gray-400">
                {category.productCount} {category.productCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryColor={primaryColor}
                  onSelect={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedProduct && (
        <MenuProductDetail
          product={selectedProduct}
          primaryColor={primaryColor}
          settings={settings}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}

function ProductCard({
  product,
  primaryColor,
  onSelect,
}: {
  product: MenuProduct;
  primaryColor: string;
  onSelect: () => void;
}) {
  const hasMultipleVariants = product.variantCount > 1;

  return (
    <button
      onClick={onSelect}
      className="group flex gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      {product.image ? (
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-white/80"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          {product.name.charAt(0)}
        </div>
      )}

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: primaryColor }}>
            {hasMultipleVariants && (
              <span className="text-xs font-normal text-gray-400">From </span>
            )}
            {product.startingPrice.toLocaleString()} TZS
          </span>

          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform group-hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
