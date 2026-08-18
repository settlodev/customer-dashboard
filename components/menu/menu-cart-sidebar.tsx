"use client";

import React, { useState } from "react";
import {
  MenuPublicSettings,
  ServingType,
  MenuOrderRequest,
  MenuOrderResponse,
} from "@/types/online-menu/type";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Check,
  Clock,
  Package,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useMenuCart } from "./menu-cart-context";
import { placeMenuOrder } from "@/lib/actions/public-menu-actions";

interface MenuCartSidebarProps {
  primaryColor: string;
  settings: MenuPublicSettings;
  locationId: string;
  businessName: string;
}

type CheckoutStep = "cart" | "details" | "confirmation";

export function MenuCartSidebar({
  primaryColor,
  settings,
  locationId,
  businessName,
}: MenuCartSidebarProps) {
  const {
    state,
    removeFromCart,
    updateQuantity,
    clearCart,
    closeCart,
    getSubtotal,
    getItemCount,
  } = useMenuCart();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [servingType, setServingType] = useState<ServingType>(
    settings.pickupEnabled
      ? "TAKEAWAY"
      : settings.dineInEnabled
        ? "DINE_IN"
        : "DELIVERY",
  );
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderResponse, setOrderResponse] =
    useState<MenuOrderResponse | null>(null);

  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const deliveryFee =
    servingType === "DELIVERY" && settings.deliveryFee
      ? settings.deliveryFee
      : 0;
  const total = subtotal + deliveryFee;

  // Validation
  const minAmountMet =
    !settings.minimumOrderAmount || subtotal >= settings.minimumOrderAmount;
  const maxAmountMet =
    !settings.maximumOrderAmount || subtotal <= settings.maximumOrderAmount;
  const maxItemsMet =
    !settings.maxItemsPerOrder || itemCount <= settings.maxItemsPerOrder;
  const phoneValid = phone.trim().length >= 10;
  const deliveryAddressValid =
    servingType !== "DELIVERY" || deliveryAddress.trim().length > 0;

  const canCheckout = minAmountMet && maxAmountMet && maxItemsMet && itemCount > 0;
  const canSubmit = phoneValid && deliveryAddressValid;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setOrderError(null);

    const order: MenuOrderRequest = {
      servingType,
      customerPhoneNumber: phone,
      customerFirstName: firstName || undefined,
      customerLastName: lastName || undefined,
      customerEmail: email || undefined,
      comment: comment || undefined,
      deliveryAddress:
        servingType === "DELIVERY" ? deliveryAddress : undefined,
      items: state.items.map((item) => ({
        variant: item.variantId,
        quantity: item.quantity,
        comment: item.comment || undefined,
        modifiers: item.selectedModifiers.map((m) => ({
          modifier: m.itemId,
          quantity: m.quantity,
        })),
        addons: item.selectedAddons.map((a) => ({
          addon: a.addonId,
          quantity: a.quantity,
        })),
      })),
    };

    try {
      const response = await placeMenuOrder(locationId, order);
      setOrderResponse(response);
      setStep("confirmation");
      clearCart();
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : "Failed to place order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === "confirmation") {
      setStep("cart");
      setOrderResponse(null);
    }
    closeCart();
  };

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          {step === "details" ? (
            <button
              onClick={() => setStep("cart")}
              className="flex items-center gap-1 text-sm text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-gray-700" />
              <h2 className="font-semibold text-gray-900">
                {step === "confirmation" ? "Order Placed" : "Your Cart"}
              </h2>
            </div>
          )}
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === "cart" && <CartView />}
          {step === "details" && <DetailsView />}
          {step === "confirmation" && orderResponse && <ConfirmationView />}
        </div>

        {/* Footer actions */}
        {step === "cart" && itemCount > 0 && (
          <CartFooter />
        )}
        {step === "details" && (
          <DetailsFooter />
        )}
      </div>
    </div>
  );

  function CartView() {
    if (itemCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
          <p className="mt-3 font-medium text-gray-500">Your cart is empty</p>
          <p className="mt-1 text-sm text-gray-400">
            Add items from the menu to get started
          </p>
          <button
            onClick={handleClose}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Browse Menu
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3">
        {state.items.map((item) => {
          const modTotal = item.selectedModifiers.reduce(
            (s, m) => s + m.price * m.quantity,
            0,
          );
          const addonTotal = item.selectedAddons.reduce(
            (s, a) => s + a.price * a.quantity,
            0,
          );
          const lineTotal =
            (item.price + modTotal + addonTotal) * item.quantity;

          return (
            <div
              key={item.cartItemId}
              className="rounded-lg border border-gray-100 bg-gray-50/50 p-3"
            >
              <div className="flex gap-3">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-lg text-lg font-bold text-white/70"
                    style={{ backgroundColor: `${primaryColor}30` }}
                  >
                    {item.productName.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.variantName}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Modifiers & addons */}
                  {(item.selectedModifiers.length > 0 ||
                    item.selectedAddons.length > 0) && (
                    <div className="mt-1 space-y-0.5">
                      {item.selectedModifiers.map((m) => (
                        <p
                          key={`${m.modifierId}-${m.itemId}`}
                          className="text-[11px] text-gray-400"
                        >
                          + {m.itemName}
                          {m.price > 0 &&
                            ` (${m.price.toLocaleString()} TZS)`}
                        </p>
                      ))}
                      {item.selectedAddons.map((a) => (
                        <p
                          key={a.addonId}
                          className="text-[11px] text-gray-400"
                        >
                          + {a.addonTitle} ({a.price.toLocaleString()} TZS)
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-md border">
                      <button
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                        className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {lineTotal.toLocaleString()} TZS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Validation messages */}
        {!minAmountMet && (
          <p className="text-xs text-amber-600">
            Minimum order: {settings.minimumOrderAmount?.toLocaleString()} TZS
          </p>
        )}
        {!maxAmountMet && (
          <p className="text-xs text-red-600">
            Maximum order: {settings.maximumOrderAmount?.toLocaleString()} TZS
          </p>
        )}
        {!maxItemsMet && (
          <p className="text-xs text-red-600">
            Maximum {settings.maxItemsPerOrder} items per order
          </p>
        )}
      </div>
    );
  }

  function CartFooter() {
    return (
      <div className="border-t bg-white p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span className="font-semibold text-gray-900">
            {subtotal.toLocaleString()} TZS
          </span>
        </div>
        <button
          onClick={() => setStep("details")}
          disabled={!canCheckout}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          Continue to Checkout
        </button>
      </div>
    );
  }

  function DetailsView() {
    const servingTypes: Array<{
      type: ServingType;
      label: string;
      icon: React.ReactNode;
      enabled: boolean;
    }> = [
      {
        type: "TAKEAWAY",
        label: "Pickup",
        icon: <Package className="h-4 w-4" />,
        enabled: settings.pickupEnabled,
      },
      {
        type: "DELIVERY",
        label: "Delivery",
        icon: <Truck className="h-4 w-4" />,
        enabled: settings.deliveryEnabled,
      },
      {
        type: "DINE_IN",
        label: "Dine In",
        icon: <UtensilsCrossed className="h-4 w-4" />,
        enabled: settings.dineInEnabled,
      },
    ];

    const enabledTypes = servingTypes.filter((t) => t.enabled);

    return (
      <div className="p-4 space-y-5">
        {/* Serving type */}
        {enabledTypes.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              How would you like your order?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {enabledTypes.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setServingType(t.type)}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors"
                  style={
                    servingType === t.type
                      ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`,
                          color: primaryColor,
                        }
                      : { color: "#6b7280" }
                  }
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delivery address */}
        {servingType === "DELIVERY" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Delivery address *
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
            />
            {settings.deliveryFee && settings.deliveryFee > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Delivery fee: {settings.deliveryFee.toLocaleString()} TZS
              </p>
            )}
          </div>
        )}

        {/* Customer details */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
          />
        </div>

        {!settings.allowGuestCheckout && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
              />
            </div>
          </>
        )}

        {/* Comment */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Order notes
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any special requests?"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none resize-none focus:border-gray-300"
          />
        </div>

        {orderError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {orderError}
          </p>
        )}
      </div>
    );
  }

  function DetailsFooter() {
    return (
      <div className="border-t bg-white p-4 space-y-2">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString()} TZS</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span>
              <span>{deliveryFee.toLocaleString()} TZS</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{total.toLocaleString()} TZS</span>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing order...
            </>
          ) : (
            `Place Order – ${total.toLocaleString()} TZS`
          )}
        </button>
      </div>
    );
  }

  function ConfirmationView() {
    if (!orderResponse) return null;

    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Check className="h-8 w-8" style={{ color: primaryColor }} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-gray-900">
          Order Placed!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your order has been sent to {businessName}
        </p>

        <div className="mt-6 w-full rounded-xl border bg-gray-50 p-4 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order number</span>
            <span className="font-semibold text-gray-900">
              {orderResponse.orderNumber}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" />
              {orderResponse.status}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">
              {orderResponse.netAmount.toLocaleString()} TZS
            </span>
          </div>
          {orderResponse.estimatedPrepTimeMinutes && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Est. prep time</span>
              <span className="font-medium text-gray-700">
                ~{orderResponse.estimatedPrepTimeMinutes} min
              </span>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="mt-4 w-full space-y-2">
          {orderResponse.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{item.quantity}x</span>
                <span className="text-gray-700">{item.name}</span>
              </div>
              <span className="text-gray-600">
                {item.totalPrice.toLocaleString()} TZS
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleClose}
          className="mt-6 w-full rounded-lg border py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Menu
        </button>
      </div>
    );
  }
}
