"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  MenuProduct,
  MenuVariant,
  MenuAddon,
  MenuModifierItem,
} from "@/types/online-menu/type";

export interface MenuCartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  comment?: string;
  cartItemId: string;
  selectedModifiers: Array<{
    modifierId: string;
    modifierName: string;
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
  selectedAddons: Array<{
    addonId: string;
    addonTitle: string;
    price: number;
    quantity: number;
  }>;
}

export interface MenuCartState {
  items: MenuCartItem[];
  isOpen: boolean;
}

interface MenuCartContextType {
  state: MenuCartState;
  addToCart: (
    product: MenuProduct,
    variant: MenuVariant,
    quantity: number,
    modifiers?: MenuCartItem["selectedModifiers"],
    addons?: MenuCartItem["selectedAddons"],
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemComment: (cartItemId: string, comment: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

type CartAction =
  | { type: "ADD"; payload: MenuCartItem }
  | { type: "REMOVE"; payload: string }
  | { type: "UPDATE_QTY"; payload: { cartItemId: string; quantity: number } }
  | { type: "UPDATE_COMMENT"; payload: { cartItemId: string; comment: string } }
  | { type: "CLEAR" }
  | { type: "TOGGLE" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "LOAD"; payload: MenuCartState };

const initialState: MenuCartState = { items: [], isOpen: false };

function cartReducer(state: MenuCartState, action: CartAction): MenuCartState {
  switch (action.type) {
    case "ADD": {
      const item = action.payload;
      // Merge if same variant + same modifiers/addons selection
      const existingIdx = state.items.findIndex(
        (i) =>
          i.variantId === item.variantId &&
          JSON.stringify(i.selectedModifiers) === JSON.stringify(item.selectedModifiers) &&
          JSON.stringify(i.selectedAddons) === JSON.stringify(item.selectedAddons),
      );
      if (existingIdx > -1) {
        const updated = state.items.map((i, idx) =>
          idx === existingIdx ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, item] };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => i.cartItemId !== action.payload),
      };
    case "UPDATE_QTY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => i.cartItemId !== action.payload.cartItemId,
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.cartItemId === action.payload.cartItemId
            ? { ...i, quantity: action.payload.quantity }
            : i,
        ),
      };
    }
    case "UPDATE_COMMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.cartItemId === action.payload.cartItemId
            ? { ...i, comment: action.payload.comment }
            : i,
        ),
      };
    case "CLEAR":
      return { ...initialState };
    case "TOGGLE":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "LOAD":
      return { ...action.payload, isOpen: false };
    default:
      return state;
  }
}

const MenuCartContext = createContext<MenuCartContextType | undefined>(undefined);

export function MenuCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !initialized.current) {
      const saved = localStorage.getItem("menuCart");
      if (saved) {
        try {
          dispatch({ type: "LOAD", payload: JSON.parse(saved) });
        } catch {
          localStorage.removeItem("menuCart");
        }
      }
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && initialized.current) {
      const t = setTimeout(() => {
        localStorage.setItem("menuCart", JSON.stringify(state));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [state]);

  const addToCart = useCallback(
    (
      product: MenuProduct,
      variant: MenuVariant,
      quantity: number,
      modifiers: MenuCartItem["selectedModifiers"] = [],
      addons: MenuCartItem["selectedAddons"] = [],
    ) => {
      const cartItem: MenuCartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        variantId: variant.id,
        variantName: variant.name,
        price: variant.price,
        quantity,
        cartItemId: `${product.id}_${variant.id}_${Date.now()}`,
        selectedModifiers: modifiers,
        selectedAddons: addons,
      };
      dispatch({ type: "ADD", payload: cartItem });
    },
    [],
  );

  const removeFromCart = useCallback((cartItemId: string) => {
    dispatch({ type: "REMOVE", payload: cartItemId });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", payload: { cartItemId, quantity } });
  }, []);

  const updateItemComment = useCallback(
    (cartItemId: string, comment: string) => {
      dispatch({ type: "UPDATE_COMMENT", payload: { cartItemId, comment } });
    },
    [],
  );

  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const toggleCart = useCallback(() => dispatch({ type: "TOGGLE" }), []);
  const openCart = useCallback(() => dispatch({ type: "OPEN" }), []);
  const closeCart = useCallback(() => dispatch({ type: "CLOSE" }), []);

  const getItemTotal = (item: MenuCartItem) => {
    const modTotal = item.selectedModifiers.reduce(
      (s, m) => s + m.price * m.quantity,
      0,
    );
    const addonTotal = item.selectedAddons.reduce(
      (s, a) => s + a.price * a.quantity,
      0,
    );
    return (item.price + modTotal + addonTotal) * item.quantity;
  };

  const getSubtotal = useCallback(
    () => state.items.reduce((sum, item) => sum + getItemTotal(item), 0),
    [state.items],
  );

  const getItemCount = useCallback(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items],
  );

  return (
    <MenuCartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemComment,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        getSubtotal,
        getItemCount,
      }}
    >
      {children}
    </MenuCartContext.Provider>
  );
}

export function useMenuCart() {
  const ctx = useContext(MenuCartContext);
  if (!ctx) throw new Error("useMenuCart must be used within MenuCartProvider");
  return ctx;
}
