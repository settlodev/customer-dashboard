# Dashboard FCM Web Push — Owner Notifications (Phase B part 2)

- **Date:** 2026-06-18
- **Status:** Design approved. Pending implementation plan.
- **Repo:** Customer-Dashboard (Next.js 15 / React 19 / NextAuth v5).
- **Builds on:** the Comms backend slice (`OwnerNotificationService` → `OWNER_APP` token push) shipped on the Communications Service `alpha` branch. This is the client half: register the browser as an `OWNER_APP` device and receive/display the pushes.

## 1. Goal

Make owner push notifications actually reach a device. When an owner enables notifications, the dashboard requests browser permission, obtains a Firebase Cloud Messaging (FCM) web token, and registers it with the Communications Service as an `OWNER_APP` device. Foreground messages show a toast; background messages show an OS notification via a service worker. This closes the end-to-end owner-notification loop the future mobile app will reuse.

## 2. Decisions (from brainstorming)

| # | Decision |
|---|----------|
| D1 | **Full slice with a background service worker** — real push when the tab is closed/backgrounded, plus foreground toasts (not foreground-only). |
| D2 | **Toggle-driven enable + idempotent auto-register on load.** The existing Notifications-panel "Push" toggle requests permission + registers this browser's token (and saves the per-location pref); on load, if permission is already granted, silently re-register. |
| D3 | **Registration via server actions** using the existing `apiClient` (auto Bearer JWT + `X-*` headers). |
| D4 | **No comms-side change** — `Platform.WEB` exists and the controller already exposes register (`POST`) + delete-by-device (`DELETE /{deviceId}`). Slice is purely dashboard + the two prerequisites below. |
| D5 | **Bell-badge click-through / in-app notification center is B1** — out of scope here (this slice = foreground toast + background OS notification). |

## 3. Prerequisites (user-provided, outside dashboard code)

1. **Gateway exposure of the Communications Service** + a `COMMUNICATIONS_SERVICE_URL` env value (e.g. `https://gateway.settlo.co.tz:8443/alpha/comms`), mirroring the other service URLs. The user confirmed they will add this. Until then the registration call has no endpoint.
2. **Firebase web app for `settlo-v3`**: `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId`, and a **Web Push VAPID key**. The user is creating these. They populate `NEXT_PUBLIC_FIREBASE_*` env vars + the inlined SW config.

## 4. Current state (grounded — dashboard)

- **Push toggle** exists: `components/settings/panels/notifications-panel.tsx` renders a "Push" `SettingsSwitchRow` bound to `enablePushNotifications`; `use-settings-panel` persists via `updateLocationSettings` → `PUT /api/v1/locations/{locationId}/settings` (Accounts service). This is the hook point for permission + registration.
- **API/auth plumbing ready:** `lib/settlo-api-client.ts` defines per-service base URLs from env and auto-stamps `Authorization: Bearer <accessToken>` + `X-Account-Id`/`X-User-Id`/`X-Business-Id`/`X-Location-Id`, with proactive + 401 refresh. **No comms URL is configured yet** (prereq 1). `getAuthToken()` / `auth()` / `getCurrentDestination()` provide token + `businessId`/`userId`/`locationId` in server actions.
- **No Firebase, no service worker.** PWA manifest exists (`app/manifest.ts`, `public/manifest.json`); `public/` is served at root scope. Zero `firebase`/`messaging`/`vapid` references.
- **Foreground UI ready:** `hooks/use-toast.ts` + `components/ui/toaster.tsx` (Radix toast, used app-wide). `components/icons/navbar/notificationicon.tsx` (bell) exists but is unwired.
- **Init point:** `app/providers.tsx` (client `Providers`, wraps the app under `SessionProvider`); the realtime listener pattern (`components/realtime/settlo-realtime-listener.tsx`) is the precedent for a per-session client singleton.

## 5. Comms contract (ready — verified)

- `POST /api/v1/devices/push-tokens` — body `RegisterPushTokenRequest { fcmToken (≤4096, required), platform (enum, required), deviceId (≤128, required), appVersion (≤50, optional) }`. Scope (`OWNER_APP`, `accountId`/`businessId`/`userId`) is resolved from the JWT — never the body.
- `Platform` enum includes `WEB`.
- `DELETE /api/v1/devices/push-tokens/{deviceId}` — removes the calling user's token for that device. (`DELETE` with no path removes all.)

## 6. Architecture

A client-side Firebase Messaging singleton + a static background service worker, coordinated by a `FirebaseMessagingProvider` mounted in the authenticated area:

```
[owner enables Push toggle]
  → requestPermissionAndGetToken(vapidKey, swReg)         (client)
  → registerPushToken({fcmToken, deviceId, platform:WEB}) (server action → apiClient → comms POST)
  + updateLocationSettings(enablePushNotifications: true)  (existing, Accounts)

[app load, authenticated, Notification.permission === 'granted']
  → getToken → registerPushToken (idempotent upsert by deviceId)

[incoming push]
  foreground → onMessage → useToast()   |   background → SW onBackgroundMessage → showNotification

[owner disables Push toggle]
  → deletePushToken(deviceId) (server action → comms DELETE /{deviceId}) + pref off
```

`deviceId` is a stable per-browser UUID persisted in `localStorage`, so re-registration upserts the same row and delete targets it.

## 7. Components / files (all in Customer-Dashboard)

- **env / config:** add `COMMUNICATIONS_SERVICE_URL`; `NEXT_PUBLIC_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_MESSAGING_SENDER_ID`, `…_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`. Add `comms` to the `ApiClient` service variants (mirroring an existing service).
- **`lib/firebase/messaging.ts`** — `firebase/app` + `firebase/messaging` singleton; `isMessagingSupported()` (wraps `isSupported()` + `'serviceWorker' in navigator` + `'Notification' in window`); `getOrCreateDeviceId()` (UUID in `localStorage`); `requestPermissionAndGetToken(swRegistration)` (returns token or null). Client-only, SSR-guarded.
- **`public/firebase-messaging-sw.js`** — imports the Firebase compat messaging SDK, `initializeApp(<inlined public config>)`, `onBackgroundMessage` → `self.registration.showNotification(title, { body, data, icon })`. (Static file; the public FCM config is inlined since it cannot read `NEXT_PUBLIC_*` at runtime.)
- **`components/firebase-messaging-provider.tsx`** — `"use client"`, mounted in `Providers`, gated on an authenticated session: registers `/firebase-messaging-sw.js`, sets up `onMessage` → `useToast({title, description})` (+ optional bell badge), and on mount auto-registers the token when permission is already granted. No-op when unsupported.
- **`lib/actions/push-token-actions.ts`** — `registerPushToken({fcmToken, deviceId, platform, appVersion})` → `apiClient(comms).post("/api/v1/devices/push-tokens", …)`; `deletePushToken(deviceId)` → `apiClient(comms).delete("/api/v1/devices/push-tokens/" + deviceId)`. Both rely on the apiClient's auth.
- **`components/settings/panels/notifications-panel.tsx` / `use-settings-panel`** — Push toggle `onChange`: on enable → `requestPermissionAndGetToken` → `registerPushToken` (toast on permission-denied/unsupported), then save the pref; on disable → `deletePushToken(getOrCreateDeviceId())` + save pref off.

## 8. Error handling & browser support

- Feature-detect before any Firebase call (`isMessagingSupported()`); on unsupported browsers (notably Safari/iOS web-push limitations) the provider and toggle path are graceful no-ops (with an explanatory toast when the user explicitly tries to enable).
- `Notification.requestPermission()` denied → toast ("Enable notifications in your browser settings"), pref not set on.
- All Firebase/messaging access is client-only and guarded for SSR (`typeof window`/dynamic import) so it never runs during server render.
- Registration failures (network/401) surface a toast but don't block the settings save; auto-register-on-load failures are logged silently.

## 9. Testing

Confirm the dashboard's JS test setup during planning (Jest/Vitest + RTL, or none). Testable units: the `push-token-actions` server actions (mock `apiClient`; assert the request body shape `{fcmToken, platform:"WEB", deviceId, appVersion?}` and the `DELETE /{deviceId}` path) and the `getOrCreateDeviceId`/support-guard helpers. The permission → `getToken` → SW → `onMessage` flow is verified manually in the running app (and against a real device once the Firebase app + gateway route exist).

## 10. Risks & dependencies

1. **Prereqs (§3)** gate end-to-end verification: no comms gateway route → no registration endpoint; no Firebase app/VAPID → no token. The dashboard code can be built and unit-tested before they land; live verification waits on them.
2. **Service-worker scope:** `firebase-messaging-sw.js` must be served from the site root (`/firebase-messaging-sw.js`) — `public/` provides this in Next.js.
3. **iOS/Safari web push** is limited (requires installed PWA on iOS); treated as an unsupported-graceful path for the MVP.
4. **Inlined SW config** duplicates the public Firebase values in the static SW file; acceptable (public by design), but keep it in sync with the env config.

## 11. Out of scope (later)

- **B1** in-app notification center: wiring the bell into a list/read-state view (the persisted owner `Notification` records seed it).
- Per-category preferences; multi-device management UI; the owner **mobile** app (reuses the same `OWNER_APP` registration path).
