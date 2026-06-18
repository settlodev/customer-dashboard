"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { onMessage } from "firebase/messaging";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/context/notificationContext";
import {
  isMessagingSupported,
  getMessagingClient,
  getOrCreateDeviceId,
  requestPermissionAndGetToken,
} from "@/lib/firebase/messaging";
import { registerPushToken } from "@/lib/actions/push-token-actions";

/**
 * For an authenticated owner: registers the FCM service worker, re-registers the
 * device token if permission is already granted (idempotent), and shows foreground
 * messages as toasts. No-op when unauthenticated or on unsupported browsers.
 */
export function FirebaseMessagingProvider() {
  const { status } = useSession();
  const { toast } = useToast();
  const { refreshCount } = useNotifications();

  useEffect(() => {
    if (status !== "authenticated") return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      if (!(await isMessagingSupported())) return;

      let swRegistration: ServiceWorkerRegistration | undefined;
      try {
        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      } catch (e) {
        console.error("FCM service worker registration failed", e);
        return;
      }
      if (cancelled) return;

      // Keep the token fresh for browsers that already granted permission (no prompt).
      if (Notification.permission === "granted") {
        const token = await requestPermissionAndGetToken(swRegistration);
        if (token && !cancelled) {
          await registerPushToken({ fcmToken: token, deviceId: getOrCreateDeviceId() });
        }
      }
      if (cancelled) return;

      const messaging = await getMessagingClient();
      if (messaging && !cancelled) {
        unsubscribe = onMessage(messaging, (payload) => {
          toast({
            title: payload.notification?.title ?? payload.data?.title ?? "Settlo",
            description: payload.notification?.body ?? payload.data?.body ?? "",
          });
          void refreshCount();
        });
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [status, toast, refreshCount]);

  return null;
}
