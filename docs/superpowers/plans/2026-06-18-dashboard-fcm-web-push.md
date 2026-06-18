# Dashboard FCM Web Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register the dashboard browser as an `OWNER_APP` FCM device and receive owner push notifications — foreground toasts + background OS notifications — closing the end-to-end owner-notification loop.

**Architecture:** A client Firebase Messaging singleton + a static background service worker, coordinated by a `FirebaseMessagingProvider` mounted under the session. The existing Notifications "Push" toggle requests permission + registers the token; on load (permission already granted) it re-registers idempotently. Register/delete go through server actions calling the Communications Service via the existing `ApiClient`.

**Tech Stack:** Next.js 15 (app router, Turbopack) / React 19 / TypeScript / NextAuth v5 / Yarn 1.x; `firebase` web SDK (new dep); existing `ApiClient` (axios) + `use-toast`.

## Global Constraints

- **No JS test framework exists in this repo** (no jest/vitest/RTL). Per-task verification is **`npx tsc --noEmit`** (type-check) + **`yarn lint`** (`next lint`); the final task runs **`yarn build`** and a **manual device-verification checklist**. Do NOT add a test framework. Do NOT write `*.test.ts` files (nothing would run them).
- **Live/device verification is gated on two user-provided prerequisites** (NOT this plan's work): (1) the Communications Service exposed through the gateway + a `COMMUNICATIONS_SERVICE_URL` value; (2) the `settlo-v3` Firebase web config + Web Push VAPID key. Build the code now; full device test happens once these land.
- **All Firebase/messaging access is client-only and SSR-guarded** (`typeof window === "undefined"` early-returns / `await isSupported()`); it must never execute during server render.
- **Token registration is via server actions** using `new ApiClient("communications")` — never a direct client fetch (the client stamps the JWT + `X-*` headers server-side).
- **Registration payload (comms contract, verified):** `{ fcmToken: string, platform: "WEB", deviceId: string, appVersion?: string }` to `POST /api/v1/devices/push-tokens`; removal via `DELETE /api/v1/devices/push-tokens/{deviceId}`. `deviceId` is a stable per-browser UUID in `localStorage` (key `settlo.fcm.deviceId`).
- **Env naming:** `COMMUNICATIONS_SERVICE_URL` (server-only, via `requireEnv`); `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (client, public).
- TS path alias `@/*` → repo root. Commit only the files each task names (`.env` is local/secret — do not commit real values).

---

### Task 1: Dependency + config plumbing (Firebase dep, comms ApiClient variant, env)

**Files:**
- Modify: `package.json` (add `firebase`)
- Modify: `lib/settlo-api-client.ts` (add `communications` service variant)
- Modify: `.env` / `.env.example` (add the new vars — names only; real values from the user)

**Interfaces:**
- Produces: `new ApiClient("communications")` → base URL `COMMUNICATIONS_SERVICE_URL`. Consumed by Task 4.

- [ ] **Step 1: Add the firebase dependency**

Run: `yarn add firebase`
Expected: `firebase` appears in `package.json` `dependencies`.

- [ ] **Step 2: Add the `communications` variant to ApiClient**

In `lib/settlo-api-client.ts`, after the `ACCOUNTING_SERVICE_URL` const (the `requireEnv` block ~lines 36-43) add:

```typescript
const COMMUNICATIONS_SERVICE_URL = requireEnv("COMMUNICATIONS_SERVICE_URL");
```

In the constructor's `service` union type, add `"communications"`:

```typescript
  service:
    | "accounts"
    | "auth"
    | "reports"
    | "payments"
    | "orders"
    | "billing"
    | "inventory"
    | "accounting"
    | "communications"
    | boolean = "accounts",
```

In the base-URL ternary chain, add the `communications` case (just before the final `: ACCOUNTS_SERVICE_URL;`):

```typescript
                    : service === "accounting"
                      ? ACCOUNTING_SERVICE_URL
                      : service === "communications"
                        ? COMMUNICATIONS_SERVICE_URL
                        : ACCOUNTS_SERVICE_URL;
```

- [ ] **Step 3: Add env var names**

Add to `.env` (and `.env.example` if present) — leave values for the user to fill (the comms URL mirrors the other gateway URLs; the Firebase values come from the `settlo-v3` console):

```
COMMUNICATIONS_SERVICE_URL=https://gateway.settlo.co.tz:8443/alpha/comms
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=settlo-v3
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no new type errors (the union/ternary edit type-checks). If `COMMUNICATIONS_SERVICE_URL` is unset in the local `.env`, `requireEnv` throws only at runtime, not during type-check — that's fine.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock lib/settlo-api-client.ts .env.example
git commit -m "feat(notifications): add firebase dep + communications ApiClient variant"
```
(Do not commit `.env` with real values.)

---

### Task 2: Firebase messaging client singleton + helpers

**Files:**
- Create: `lib/firebase/messaging.ts`

**Interfaces:**
- Produces: `isMessagingSupported(): Promise<boolean>`, `getMessagingClient(): Promise<Messaging | null>`, `getOrCreateDeviceId(): string`, `requestPermissionAndGetToken(swRegistration?: ServiceWorkerRegistration): Promise<string | null>`. Consumed by Tasks 5 and 6.

- [ ] **Step 1: Create the singleton + helpers**

Create `lib/firebase/messaging.ts`:

```typescript
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors (resolves `firebase/app` + `firebase/messaging` types from the dep added in Task 1).

- [ ] **Step 3: Commit**

```bash
git add lib/firebase/messaging.ts
git commit -m "feat(notifications): firebase messaging client singleton + token helpers"
```

---

### Task 3: Background service worker

**Files:**
- Create: `public/firebase-messaging-sw.js`

**Interfaces:**
- Produces: a service worker at `/firebase-messaging-sw.js` (root scope) handling background FCM messages. Consumed by Task 5 (registered there).

- [ ] **Step 1: Create the service worker**

Create `public/firebase-messaging-sw.js`. It uses the Firebase **compat** SDK via `importScripts` (the standard for FCM service workers) and inlines the **public** Firebase web config. These are CONFIG values (public by design — the same ones shipped in `NEXT_PUBLIC_FIREBASE_*`), to be filled by the user with the `settlo-v3` web app values:

```javascript
/* Firebase Cloud Messaging service worker — handles background (tab closed/unfocused) messages. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Public Firebase web config — fill with the settlo-v3 web app values
// (identical to the NEXT_PUBLIC_FIREBASE_* env vars; public by design, safe to commit).
firebase.initializeApp({
  apiKey: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "settlo-v3",
  messagingSenderId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || "Settlo";
  const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || "";
  self.registration.showNotification(title, {
    body: body,
    icon: "/web-app-manifest-192x192.png",
    data: payload.data || {},
  });
});
```

> The `REPLACE_WITH_*` entries are configuration the user supplies (the public web config), not code to implement — leave them as the literal markers until the user provides the `settlo-v3` values. The app will register this SW regardless; background delivery works once the config is filled. (Alternative, if you want to avoid the duplicated values: serve the SW from a Next.js route handler that injects the public env config — out of scope for this task.)

- [ ] **Step 2: Verify**

Run: `yarn build`
Expected: build succeeds; `public/firebase-messaging-sw.js` is served as a static asset at `/firebase-messaging-sw.js` (Next.js serves `public/` at root). (This file is plain JS, not type-checked.)

- [ ] **Step 3: Commit**

```bash
git add public/firebase-messaging-sw.js
git commit -m "feat(notifications): FCM background service worker"
```

---

### Task 4: Push-token server actions

**Files:**
- Create: `lib/actions/push-token-actions.ts`

**Interfaces:**
- Consumes: `new ApiClient("communications")` (Task 1).
- Produces: `registerPushToken(input: { fcmToken: string; deviceId: string; appVersion?: string }): Promise<{ ok: boolean }>`, `deletePushToken(deviceId: string): Promise<{ ok: boolean }>`. Consumed by Tasks 5 and 6.

- [ ] **Step 1: Create the server actions**

Create `lib/actions/push-token-actions.ts`:

```typescript
"use server";

import ApiClient from "@/lib/settlo-api-client";

const BASE = "/api/v1/devices/push-tokens";

/**
 * Registers (upserts) this browser's FCM token as an OWNER_APP device on the
 * Communications Service. Scope (business/user) is resolved server-side from the JWT.
 */
export async function registerPushToken(input: {
  fcmToken: string;
  deviceId: string;
  appVersion?: string;
}): Promise<{ ok: boolean }> {
  try {
    const apiClient = new ApiClient("communications");
    await apiClient.post(BASE, {
      fcmToken: input.fcmToken,
      platform: "WEB",
      deviceId: input.deviceId,
      appVersion: input.appVersion ?? null,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Removes this browser's OWNER_APP token (by deviceId) on the Communications Service. */
export async function deletePushToken(deviceId: string): Promise<{ ok: boolean }> {
  try {
    const apiClient = new ApiClient("communications");
    await apiClient.delete(`${BASE}/${encodeURIComponent(deviceId)}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors (`ApiClient.post`/`delete` resolve; `"communications"` is a valid variant from Task 1).

- [ ] **Step 3: Commit**

```bash
git add lib/actions/push-token-actions.ts
git commit -m "feat(notifications): push-token register/delete server actions"
```

---

### Task 5: FirebaseMessagingProvider (SW registration + foreground toast + auto-register)

**Files:**
- Create: `components/firebase-messaging-provider.tsx`
- Modify: `app/providers.tsx` (mount it)

**Interfaces:**
- Consumes: `isMessagingSupported`, `getMessagingClient`, `getOrCreateDeviceId`, `requestPermissionAndGetToken` (Task 2); `registerPushToken` (Task 4); `useToast` (`@/hooks/use-toast`); `useSession` (`next-auth/react`).

- [ ] **Step 1: Create the provider**

Create `components/firebase-messaging-provider.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { onMessage } from "firebase/messaging";
import { useToast } from "@/hooks/use-toast";
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

  useEffect(() => {
    if (status !== "authenticated") return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      if (!(await isMessagingSupported())) return;

      let swRegistration: ServiceWorkerRegistration | undefined;
      try {
        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      } catch {
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

      const messaging = await getMessagingClient();
      if (messaging && !cancelled) {
        unsubscribe = onMessage(messaging, (payload) => {
          toast({
            title: payload.notification?.title ?? payload.data?.title ?? "Settlo",
            description: payload.notification?.body ?? payload.data?.body ?? "",
          });
        });
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [status, toast]);

  return null;
}
```

- [ ] **Step 2: Mount it in Providers**

In `app/providers.tsx`, import and render the provider inside `CartProvider` (it self-gates on session, so it can be mounted unconditionally):

```tsx
import { FirebaseMessagingProvider } from "@/components/firebase-messaging-provider";
```

```tsx
      <CartProvider>
        <FirebaseMessagingProvider />
        {children}
      </CartProvider>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && yarn lint`
Expected: no type errors; lint clean for the new files.

- [ ] **Step 4: Commit**

```bash
git add components/firebase-messaging-provider.tsx app/providers.tsx
git commit -m "feat(notifications): FirebaseMessagingProvider (SW reg + foreground toast + auto-register)"
```

---

### Task 6: Wire the Push toggle (enable → permission + register; disable → delete)

**Files:**
- Modify: `components/settings/panels/notifications-panel.tsx`

**Interfaces:**
- Consumes: `requestPermissionAndGetToken`, `getOrCreateDeviceId` (Task 2); `registerPushToken`, `deletePushToken` (Task 4); `useToast`.

- [ ] **Step 1: Add the toggle handler + replace the Push `onChange`**

In `components/settings/panels/notifications-panel.tsx` (a client component), add imports:

```tsx
import { useToast } from "@/hooks/use-toast";
import { getOrCreateDeviceId, requestPermissionAndGetToken } from "@/lib/firebase/messaging";
import { registerPushToken, deletePushToken } from "@/lib/actions/push-token-actions";
```

Inside the component body (where `p` = the `useSettingsPanel` result is in scope), add:

```tsx
  const { toast } = useToast();

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const swReg = await navigator.serviceWorker?.getRegistration("/firebase-messaging-sw.js");
      const token = await requestPermissionAndGetToken(swReg ?? undefined);
      if (!token) {
        toast({
          variant: "destructive",
          title: "Couldn't enable notifications",
          description: "Allow notifications for this site in your browser, then try again.",
        });
        return; // leave the toggle off
      }
      await registerPushToken({ fcmToken: token, deviceId: getOrCreateDeviceId() });
      p.setField("enablePushNotifications", true);
    } else {
      await deletePushToken(getOrCreateDeviceId());
      p.setField("enablePushNotifications", false);
    }
  };
```

Replace the Push `SettingsSwitchRow`'s `onChange`:

```tsx
<SettingsSwitchRow
  label="Push"
  checked={!!v.enablePushNotifications}
  onChange={(x) => void handlePushToggle(x)}
  disabled={p.isPending}
/>
```

(The per-location `enablePushNotifications` preference persists via the section's existing Save button as before; this handler additionally registers/deletes the browser token at toggle time.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && yarn lint`
Expected: no type errors; lint clean.

- [ ] **Step 3: Commit**

```bash
git add components/settings/panels/notifications-panel.tsx
git commit -m "feat(notifications): Push toggle requests permission + registers/deletes FCM token"
```

---

## Final verification

- [ ] **Build**

Run: `yarn build`
Expected: production build succeeds (full type-check + compile, incl. the new provider/actions/helpers).

- [ ] **Lint**

Run: `yarn lint`
Expected: no new lint errors from the added files.

- [ ] **Manual / device verification (gated on the two prerequisites)**

Once the comms gateway route + `COMMUNICATIONS_SERVICE_URL` and the `settlo-v3` Firebase config + VAPID key are in place (and `public/firebase-messaging-sw.js` config filled):
1. Log in as an owner; open Settings → Notifications; toggle **Push** on → browser prompts for permission → grant. Confirm a `push_tokens` row (OWNER_APP, WEB) is created for the business (check the Communications Service / DB).
2. Trigger an owner event (e.g. cancel an order at a location with push enabled). With the dashboard tab **focused** → a toast appears. With the tab **backgrounded/closed** → an OS notification appears (service worker).
3. Toggle **Push** off → confirm the token row is removed (`DELETE /{deviceId}`).
4. Reload with permission already granted → confirm the token is silently re-registered (no prompt).
5. Test an unsupported browser (e.g. iOS Safari without installed PWA) → confirm graceful no-op (no crash; enabling shows the "allow in browser" toast).

## Out of scope (later)

- **B1** in-app notification center: wiring the bell icon into a list/read-state view (the Comms-side owner `Notification` records seed it).
- Multi-device management UI; per-category preferences; owner mobile app (reuses this same `OWNER_APP` registration path).

## Self-review

- **Spec coverage:** Firebase singleton/helpers (spec §7) → Task 2; SW (§7) → Task 3; provider (SW reg + foreground toast + auto-register, §6/§7) → Task 5; server actions + comms variant (§5/§7) → Tasks 1+4; toggle hook (§7) → Task 6; env/prereqs (§3) → Task 1 + the gated manual step. Errors/SSR/support (§8) → embedded in Tasks 2/5/6. ✅
- **Placeholder scan:** The SW `REPLACE_WITH_*` entries are user-supplied public CONFIG (like the env vars), explicitly flagged — not code placeholders. No `TBD`/`implement-later`/empty error-handling. Verification steps are `tsc`/`lint`/`build` + a concrete manual checklist (no test framework in the repo, per Global Constraints).
- **Type consistency:** `requestPermissionAndGetToken(swRegistration?)`, `getOrCreateDeviceId(): string`, `registerPushToken({fcmToken,deviceId,appVersion?})`, `deletePushToken(deviceId)`, `new ApiClient("communications")`, payload `{fcmToken, platform:"WEB", deviceId, appVersion}` — consistent across Tasks 1–6.
