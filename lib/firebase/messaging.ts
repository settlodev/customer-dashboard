import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const DEVICE_ID_KEY = "settlo.fcm.deviceId";

let messagingSingleton: Messaging | null = null;

/** True only in a browser that supports FCM web push (SW + Notification + Firebase isSupported). */
export async function isMessagingSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/** Returns the Messaging singleton, or null if unsupported. */
export async function getMessagingClient(): Promise<Messaging | null> {
  if (!(await isMessagingSupported())) return null;
  if (!messagingSingleton) {
    messagingSingleton = getMessaging(getFirebaseApp());
  }
  return messagingSingleton;
}

/** Stable per-browser device id, persisted in localStorage. */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Requests notification permission (if not already decided) and returns an FCM token,
 * or null if unsupported / denied / failed.
 */
export async function requestPermissionAndGetToken(
  swRegistration?: ServiceWorkerRegistration,
): Promise<string | null> {
  const messaging = await getMessagingClient();
  if (!messaging || !VAPID_KEY) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  try {
    return await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
  } catch {
    return null;
  }
}
