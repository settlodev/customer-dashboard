"use client";

import * as React from "react";
import { NotificationProvider } from "@/context/notificationContext";
import { FirebaseMessagingProvider } from "@/components/firebase-messaging-provider";

/**
 * Notification context + Firebase push, scoped to the authenticated app shells
 * — the customer dashboard (app/(protected)) and the warehouse console
 * (app/(warehouse)).
 *
 * Deliberately NOT mounted at the root. NotificationProvider fires an
 * unread-count fetch the moment the session becomes authenticated, but the
 * communications service requires a `business_id` JWT claim. On the
 * pre-business screens (login → /select-business, onboarding) that claim does
 * not exist yet, so a root-level mount fired a doomed request that 400'd
 * ("Missing required JWT claim: business_id") on every login before the user
 * had picked a business. Mounting here means the providers only run once a
 * destination is active. Admin (admin.) and marketing/auth routes never mount
 * them at all.
 */
export function AppNotificationProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <FirebaseMessagingProvider />
      {children}
    </NotificationProvider>
  );
}
