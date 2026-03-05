"use client";
import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
import { CartProvider } from "@/context/cartContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextUIProvider>
      <NextThemesProvider
        defaultTheme='light'
        attribute='class'
        {...themeProps}>
          <CartProvider>
          {children}
          </CartProvider>
        
      </NextThemesProvider>
    </NextUIProvider>
  );
}
