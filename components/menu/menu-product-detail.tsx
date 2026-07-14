"use client";

import React, { useState, useEffect } from "react";
import {
  MenuProduct,
  MenuVariant,
  MenuModifier,
  MenuPublicSettings,
} from "@/types/online-menu/type";
import { X, Minus, Plus, Check, ShoppingBag } from "lucide-react";
import { useMenuCart, MenuCartItem } from "./menu-cart-context";

interface MenuProductDetailProps {
  product: MenuProduct;
  primaryColor: string;
  settings: MenuPublicSettings;
  onClose: () => void;
}

export function MenuProductDetail({
  product,
  primaryColor,
  settings,
  onClose,
}: MenuProductDetailProps) {
  const { addToCart, openCart } = useMenuCart();
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant>(
    product.variants[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>(
    {},
  );
  const [added, setAdded] = useState(false);

  // Reset selections when variant changes
  useEffect(() => {
    setSelectedModifiers({});
    setSelectedAddons({});
  }, [selectedVariant]);

  const toggleModifierItem = (modifier: MenuModifier, itemId: string) => {
    setSelectedModifiers((prev) => {
      const current = prev[modifier.id] || [];
      if (current.includes(itemId)) {
        return { ...prev, [modifier.id]: current.filter((id) => id !== itemId) };
      }
      if (modifier.maximumSelection && current.length >= modifier.maximumSelection) {
        // Replace last selection if at max
        return {
          ...prev,
          [modifier.id]: [...current.slice(0, -1), itemId],
        };
      }
      return { ...prev, [modifier.id]: [...current, itemId] };
    });
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const copy = { ...prev };
      if (copy[addonId]) {
        delete copy[addonId];
      } else {
        copy[addonId] = 1;
      }
      return copy;
    });
  };

  // Calculate total
  const modifierTotal = selectedVariant.modifiers.reduce((sum, mod) => {
    const selected = selectedModifiers[mod.id] || [];
    return (
      sum +
      mod.items
        .filter((item) => selected.includes(item.id))
        .reduce((s, item) => s + item.price, 0)
    );
  }, 0);

  const addonTotal = selectedVariant.addons.reduce((sum, addon) => {
    return sum + (selectedAddons[addon.id] ? addon.price : 0);
  }, 0);

  const unitPrice = selectedVariant.price + modifierTotal + addonTotal;
  const totalPrice = unitPrice * quantity;

  // Check mandatory modifiers
  const mandatoryMet = selectedVariant.modifiers
    .filter((m) => m.isMandatory)
    .every((m) => (selectedModifiers[m.id] || []).length > 0);

  const canAdd =
    mandatoryMet && settings.orderingStatus === "ACTIVE" && quantity > 0;

  const handleAdd = () => {
    const modifiers: MenuCartItem["selectedModifiers"] = [];
    for (const mod of selectedVariant.modifiers) {
      const selectedIds = selectedModifiers[mod.id] || [];
      for (const itemId of selectedIds) {
        const item = mod.items.find((i) => i.id === itemId);
        if (item) {
          modifiers.push({
            modifierId: mod.id,
            modifierName: mod.name,
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            quantity: 1,
          });
        }
      }
    }

    const addons: MenuCartItem["selectedAddons"] = [];
    for (const addon of selectedVariant.addons) {
      if (selectedAddons[addon.id]) {
        addons.push({
          addonId: addon.id,
          addonTitle: addon.title,
          price: addon.price,
          quantity: 1,
        });
      }
    }

    addToCart(product, selectedVariant, quantity, modifiers, addons);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      openCart();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Image */}
        {product.image ? (
          <div className="h-52 w-full sm:h-64">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className="flex h-32 w-full items-center justify-center text-5xl font-bold text-white/60"
            style={{ backgroundColor: `${primaryColor}30` }}
          >
            {product.name.charAt(0)}
          </div>
        )}

        <div className="p-5">
          {/* Name & description */}
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          {product.description && (
            <p className="mt-1 text-sm text-gray-500">{product.description}</p>
          )}

          {/* Variants */}
          {product.variantCount > 1 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Choose an option
              </h3>
              <div className="space-y-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
                    style={
                      selectedVariant.id === v.id
                        ? {
                            borderColor: primaryColor,
                            backgroundColor: `${primaryColor}08`,
                          }
                        : {}
                    }
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {v.name}
                      </span>
                      {v.description && (
                        <p className="text-xs text-gray-500">{v.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: primaryColor }}
                      >
                        {v.price.toLocaleString()} TZS
                      </span>
                      {selectedVariant.id === v.id && (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {selectedVariant.modifiers.map((mod) => (
            <div key={mod.id} className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {mod.name}
                </h3>
                {mod.isMandatory && (
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                    Required
                  </span>
                )}
                {mod.maximumSelection > 0 && (
                  <span className="text-xs text-gray-400">
                    (max {mod.maximumSelection})
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {mod.items.map((item) => {
                  const isSelected = (
                    selectedModifiers[mod.id] || []
                  ).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleModifierItem(mod, item.id)}
                      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
                      style={
                        isSelected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: `${primaryColor}08`,
                            }
                          : {}
                      }
                    >
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-2">
                        {item.price > 0 && (
                          <span className="text-xs text-gray-500">
                            +{item.price.toLocaleString()} TZS
                          </span>
                        )}
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded border transition-colors"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: primaryColor,
                                  borderColor: primaryColor,
                                }
                              : { borderColor: "#d1d5db" }
                          }
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Addons */}
          {selectedVariant.addons.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Add extras
              </h3>
              <div className="space-y-1.5">
                {selectedVariant.addons.map((addon) => {
                  const isSelected = !!selectedAddons[addon.id];
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
                      style={
                        isSelected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: `${primaryColor}08`,
                            }
                          : {}
                      }
                    >
                      <span className="text-sm text-gray-700">
                        {addon.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          +{addon.price.toLocaleString()} TZS
                        </span>
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded border transition-colors"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: primaryColor,
                                  borderColor: primaryColor,
                                }
                              : { borderColor: "#d1d5db" }
                          }
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => {
                  const max = settings.maxItemsPerOrder || 99;
                  setQuantity(Math.min(max, quantity + 1));
                }}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Add to cart – {totalPrice.toLocaleString()} TZS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
