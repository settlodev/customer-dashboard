"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
import { CartProvider } from "@/context/cartContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

// Root-level, app-wide providers only (theme + cart). Notification context and
// Firebase push are intentionally NOT here — they require an active business
// and are mounted per authenticated shell via <AppNotificationProviders> in
// app/(protected)/layout.tsx and app/(warehouse)/layout.tsx. See that wrapper
// for the rationale.
export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider defaultTheme='light' attribute='class' {...themeProps}>
      <CartProvider>
        {children}
      </CartProvider>
    </NextThemesProvider>
  );
}
