

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ExtendedProduct } from '@/types/site/type';

export interface CartItem extends ExtendedProduct {
  quantity: number;
  comment?: string;
  variantId?: string; 
  selectedVariant?: any;
  cartItemId: string;
  modifiers?: Array<{
    quantity: number;
    modifier: string;
  }>;
  addons?: Array<{
    quantity: number;
    addon: string;
  }>;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | '';
  emailAddress: string;
}

export interface CartState {
  orderRequestitems: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
  customerDetails: CustomerDetails;
  globalComment: string;
  discount?: string;
  tableAndSpace?: string;
  reservation?: string;
}

interface CartContextType {
  state: CartState;
  addToCart: (product: ExtendedProduct, quantity?: number, variantId?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemComment: (cartItemId: string, comment: string) => void;
  updateCustomerDetails: (details: Partial<CustomerDetails>) => void;
  updateGlobalComment: (comment: string) => void;
  updateOrderDetails: (details: { discount?: string; tableAndSpace?: string; reservation?: string }) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalPrice: () => number;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: ExtendedProduct; quantity: number; variantId?: string } }
  | { type: 'REMOVE_FROM_CART'; payload: { cartItemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { cartItemId: string; quantity: number } }
  | { type: 'UPDATE_ITEM_COMMENT'; payload: { cartItemId: string; comment: string } }
  | { type: 'UPDATE_CUSTOMER_DETAILS'; payload: Partial<CustomerDetails> }
  | { type: 'UPDATE_GLOBAL_COMMENT'; payload: string }
  | { type: 'UPDATE_ORDER_DETAILS'; payload: { discount?: string; tableAndSpace?: string; reservation?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const CartContext = createContext<CartContextType | undefined>(undefined);

const getProductPrice = (product: ExtendedProduct, variantId?: string): number => {
  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      return parseFloat(variant.price as unknown as string) || 0;
    }
  }
  
  // If no specific variant ID provided, use the first variant if available
  if (product.variants && product.variants.length > 0) {
    return parseFloat(product.variants[0].price as unknown as string) || 0;
  }
  
  return parseFloat(product.price as string) || 0;
};

const getVariantId = (product: ExtendedProduct, providedVariantId?: string): string | undefined => {
  // If variant ID is provided, use it
  if (providedVariantId) {
    return providedVariantId;
  }
  
  // If product has variants, use the first one as default
  if (product.variants && product.variants.length > 0) {
    return product.variants[0].id;
  }
  
  // No variants available
  return undefined;
};

const generateCartItemId = (productId: string, variantId?: string): string => {
  return `${productId}_${variantId || 'no-variant'}_${Date.now()}`;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity, variantId: providedVariantId } = action.payload;
      
      // Determine the correct variant ID to use
      const variantId = getVariantId(product, providedVariantId);
      
      // Check if item with same product and variant already exists
      const existingItemIndex = state.orderRequestitems.findIndex(
        item => item.id === product.id && item.variantId === variantId
      );

      let newItems: CartItem[];
      
      if (existingItemIndex > -1) {
        // Update existing item quantity
        newItems = state.orderRequestitems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        const selectedVariant = variantId && product.variants
          ? product.variants.find(v => v.id === variantId)
          : null;
          
        const cartItem: CartItem = {
          ...product,
          quantity,
          variantId,
          selectedVariant,
          cartItemId: generateCartItemId(product.id, variantId),
          modifiers: [],
          addons: [],
        };
        newItems = [...state.orderRequestitems, cartItem];
      }

      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const total = newItems.reduce((sum, item) => 
        sum + (getProductPrice(item, item.variantId) * item.quantity), 0
      );

      return {
        ...state,
        orderRequestitems: newItems,
        itemCount,
        total,
      };
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.orderRequestitems.filter(item => item.cartItemId !== action.payload.cartItemId);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const total = newItems.reduce((sum, item) => 
        sum + (getProductPrice(item, item.variantId) * item.quantity), 0
      );

      return {
        ...state,
        orderRequestitems: newItems,
        itemCount,
        total,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { cartItemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: { cartItemId } });
      }

      const newItems = state.orderRequestitems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );

      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const total = newItems.reduce((sum, item) => 
        sum + (getProductPrice(item, item.variantId) * item.quantity), 0
      );

      return {
        ...state,
        orderRequestitems: newItems,
        itemCount,
        total,
      };
    }

    case 'UPDATE_ITEM_COMMENT': {
      const { cartItemId, comment } = action.payload;
      const newItems = state.orderRequestitems.map(item =>
        item.cartItemId === cartItemId ? { ...item, comment } : item
      );

      return {
        ...state,
        orderRequestitems: newItems,
      };
    }

    case 'UPDATE_CUSTOMER_DETAILS': {
      return {
        ...state,
        customerDetails: {
          ...state.customerDetails,
          ...action.payload,
        },
      };
    }

    case 'UPDATE_GLOBAL_COMMENT': {
      return {
        ...state,
        globalComment: action.payload,
      };
    }

    case 'UPDATE_ORDER_DETAILS': {
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'CLEAR_CART':
      return {
        ...initialState,
        isOpen: state.isOpen,
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

const initialState: CartState = {
  orderRequestitems: [],
  total: 0,
  itemCount: 0,
  isOpen: false,
  customerDetails: {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    emailAddress: '',
  },
  globalComment: '',
  // discount: undefined,
  // tableAndSpace: undefined,
  // reservation: undefined,
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      }
    }
  }, []);

  // Save cart to localStorage on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(state));
    }
  }, [state]);

  const addToCart = (product: ExtendedProduct, quantity = 1, variantId?: string) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity, variantId } });
  };

  const removeFromCart = (cartItemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { cartItemId } });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { cartItemId, quantity } });
  };

  const updateItemComment = (cartItemId: string, comment: string) => {
    dispatch({ type: 'UPDATE_ITEM_COMMENT', payload: { cartItemId, comment } });
  };

  const updateCustomerDetails = (details: Partial<CustomerDetails>) => {
    dispatch({ type: 'UPDATE_CUSTOMER_DETAILS', payload: details });
  };

  const updateGlobalComment = (comment: string) => {
    dispatch({ type: 'UPDATE_GLOBAL_COMMENT', payload: comment });
  };

  const updateOrderDetails = (details: { discount?: string; tableAndSpace?: string; reservation?: string }) => {
    dispatch({ type: 'UPDATE_ORDER_DETAILS', payload: details });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const getTotalPrice = () => {
    return state.orderRequestitems.reduce((sum, item) => 
      sum + (getProductPrice(item, item.variantId) * item.quantity), 0
    );
  };

  const contextValue: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemComment,
    updateCustomerDetails,
    updateGlobalComment,
    updateOrderDetails,
    clearCart,
    toggleCart,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};