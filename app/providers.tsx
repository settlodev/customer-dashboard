"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
import { CartProvider } from "@/context/cartContext";
import { NotificationProvider } from "@/context/notificationContext";
import { FirebaseMessagingProvider } from "@/components/firebase-messaging-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider defaultTheme='light' attribute='class' {...themeProps}>
      <CartProvider>
        <NotificationProvider>
          <FirebaseMessagingProvider />
          {children}
        </NotificationProvider>
      </CartProvider>
    </NextThemesProvider>
  );
}
