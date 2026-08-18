# Dashboard Notification Center (owner) — B1d Design

- **Date:** 2026-06-18
- **Status:** Design approved. Pending implementation plan.
- **Repo:** Customer-Dashboard (Next.js 15 / React 19 / NextAuth v5 / Yarn).
- **Builds on:** the **B1 Comms backend** (shipped local on the Communications Service `alpha`): a JWT-scoped notification-center REST API + an `OWNER_NOTIFICATION_CREATED` Kafka publish. This is the client half — the bell, the dropdown, per-user read state, and real-time refresh.
- **Sibling slices:** B1c (external gateway repo — routes `OWNER_NOTIFICATION_CREATED` → `business:{id}:notifications`) and the FCM web-push slice (already built here) feed B1d's real-time/bump paths; B1d works on-demand without them.

## 1. Goal

Give owners an in-app notification center in the dashboard: a header/sidebar **bell** with a per-user **unread badge**, a **dropdown** listing their owner notifications newest-first, **mark-as-read** (one + all), and **real-time** arrival via the WebSocket gateway (with FCM foreground pushes also bumping the badge).

## 2. Decisions (from brainstorming)

| # | Decision |
|---|----------|
| D1 | **Shared state via a new `NotificationProvider`** (React Context + `useReducer`) — the app has no React Query/SWR/Zustand; this matches `CartProvider`/`EntitlementProvider`. It is the single source the bell, realtime bridge, FCM handler, and mark-read actions read/poke. |
| D2 | **Bell in the sidebar + `MobileTopBar`** — one shared `NotificationBell` rendered in both (no desktop top bar exists; the sidebar is the desktop chrome). |
| D3 | **All comms access through `"use server"` server actions** using `new ApiClient("communications")`. The comms controller derives `businessId` from the JWT and `ApiClient` auto-stamps the Bearer token + `X-Business-Id`, so the actions take **no `businessId` argument**. |
| D4 | **`businessId` reaches the client only for the realtime channel string**, prop-drilled from the protected server layout (like `CustomerCacheRealtimeBinder businessId={currentBusiness?.id}`). |
| D5 | **Real-time via the gateway channel `business:{id}:notifications`** + FCM `onMessage` bump; **no polling**. Pre-gateway interim: the count refreshes on bell-open/navigation and via FCM. |

## 3. Current state (grounded)

- **`ApiClient`** (`lib/settlo-api-client.ts`, `"use server"`): constructor selects a service variant incl. `"communications"` → `COMMUNICATIONS_SERVICE_URL`. `get<T>/post<T,U>/put/patch/delete<T>` throw `SettloApiError` on non-2xx. The request interceptor attaches `Authorization: Bearer`, `X-Account-Id`, `X-User-Id`, `X-Business-Id`, `X-Location-Id`. Server-only — client components call server actions.
- **Server-action list pattern** (`lib/actions/order-actions.tsx`, `customer-ar-actions.ts`): `"use server"`; `new ApiClient(...)`; `.get(url)`; `parseStringify(data)`; `try/catch` → empty `ApiResponse` shell on failure. `ApiResponse<T> = { content, totalPages, totalElements, number, size, first, last }` (Spring `Page` shape).
- **Realtime** (`hooks/use-realtime-channel.ts`): `useRealtimeChannel<P>(channels, handler)` — accepts a string / array / null (safe before `businessId` resolves; subscribes when it becomes non-empty). `handler: (msg: WsMessage<P>) => void`, `WsMessage { id?, type, payload? , … }`. Channel convention `business:{id}:customers`, `location:{id}:orders`. Precedent: `CustomerCacheRealtimeBinder businessId={currentBusiness?.id}` mounted in `app/(protected)/layout.tsx` (~line 212).
- **Identity:** client components do NOT get `businessId` from `useSession()`; the pattern is prop-drill from the server layout (`getCurrentBusiness()`/`getAuthToken()`), or call `getAuthToken()` in a `useEffect`. Server actions are JWT-scoped automatically.
- **No global client state** (no React Query/SWR/Zustand) — plain Context + `useReducer` (`CartProvider`, `EntitlementProvider`, …).
- **Bell + dropdown scaffolding is orphaned:** `components/icons/navbar/notificationicon.tsx` (`NotificationIcon`, hardcoded "2" badge) and `components/navigation/DropdownNotification.tsx` (stub, fake data, `ClickOutside`, local `useState`, no Radix Popover) are **imported nowhere**. `lucide-react`'s `Bell` is already imported in `dashboard-sidebar.tsx`.
- **Shell:** authenticated app uses `components/sidebar/dashboard-sidebar.tsx` — a desktop sidebar (`DashboardSidebarContent` + `SidebarAccountMenu` at the foot) + `MobileTopBar` (hamburger + logo, **empty right side**, `lg:hidden`). No desktop top bar. The public `components/navigation/header.tsx` (with `DarkModeSwitcher`/`UserDropdown`) is **not** used in the protected layout.
- **FCM provider** (`components/firebase-messaging-provider.tsx`, `"use client"`): `onMessage` currently only `toast(...)` (lines ~53–57). Mounted in `app/providers.tsx` inside `CartProvider`, under `SessionProvider`.
- **No JS test framework** (only `dev/build/start/lint` scripts).

## 4. Comms API (ready — from B1 backend)

JWT-scoped (USER/STAFF subject); business + user derived from the token.
- `GET /api/v1/notifications?page=&size=` → Spring `Page<OwnerNotificationDto>` (= `ApiResponse<OwnerNotification>`), each item `{ id, type, title, body, data, createdAt, read }`, newest-first.
- `GET /api/v1/notifications/unread-count` → `{ count }`.
- `POST /api/v1/notifications/{id}/read` → 204.
- `POST /api/v1/notifications/read-all` → 204.

## 5. Architecture & components (all in Customer-Dashboard)

1. **`lib/actions/notification-actions.ts`** (`"use server"`):
   - `getUnreadCount(): Promise<number>` — GET `/unread-count`, unwrap `{count}`; catch → `0`.
   - `listNotifications(page = 0, size = 20): Promise<ApiResponse<OwnerNotification>>` — GET list; catch → empty shell.
   - `markRead(id: string): Promise<{ ok: boolean }>` — POST `/{id}/read`; catch → `{ok:false}`.
   - `markAllRead(): Promise<{ ok: boolean }>` — POST `/read-all`; catch → `{ok:false}`.
   All via `new ApiClient("communications")`, `parseStringify` on returned data, `console.error` on catch. No `businessId` param.
2. **`OwnerNotification` type** (`types/notification.ts` or `types/types.ts`): `{ id: string; type: string; title: string | null; body: string | null; data: string | null; createdAt: string; read: boolean }`.
3. **`context/notificationContext.tsx`** — `NotificationProvider` (Context + `useReducer`) + `useNotifications()`:
   - State `{ unreadCount: number; items: OwnerNotification[]; loading: boolean; open: boolean }`.
   - Actions `{ setOpen, refreshCount, loadList, markOneRead, markAllRead, applyIncoming }`.
   - On `useSession()` `status === "authenticated"`, call `refreshCount()` once. `markOneRead`: optimistic (mark item read + decrement count), reconcile via `refreshCount()` if the action returns `{ok:false}`. `applyIncoming(msg)`: `refreshCount()` (+ `loadList` if `open`).
   - Mounted in `app/providers.tsx` **wrapping** `FirebaseMessagingProvider` (and children) so the FCM handler can call `useNotifications()`.
4. **`components/notifications/notification-bell.tsx`** (`"use client"`): bell button (lucide `Bell`) + unread badge (the count, capped `"9+"`, hidden when `0`) + dropdown panel (reuse `ClickOutside`; adapt the stub's list markup to real `items`; read vs unread styling; loading + empty states; a "Mark all read" action; relative/locale timestamp from `createdAt`). On open → `setOpen(true)` + `loadList()`. Item click → `markOneRead(id)`. Rendered in the sidebar (desktop) and `MobileTopBar` (mobile right side).
5. **`components/notifications/notification-realtime-bridge.tsx`** (`"use client"`): props `{ businessId?: string }`; `useRealtimeChannel(businessId ? \`business:${businessId}:notifications\` : null, handler)`; `handler` (memoized) → `useNotifications().applyIncoming(msg)`; renders `null`. Mounted in `app/(protected)/layout.tsx` beside `CustomerCacheRealtimeBinder`, `businessId={currentBusiness?.id}`.
6. **Wire-ups:** mount `NotificationProvider` in `app/providers.tsx`; render `<NotificationBell />` in `dashboard-sidebar.tsx` + `MobileTopBar`; mount the bridge in the protected layout; extend `FirebaseMessagingProvider` `onMessage` to also call `useNotifications().refreshCount()` (+ `loadList()` if open). Remove or supersede the orphaned `NotificationIcon` / `DropdownNotification` stub (the bell replaces them).

## 6. Data flow

Auth mount → `refreshCount`. Badge = `unreadCount`. Open bell → `loadList(0, 20)` (newest-first). Click item → `markOneRead` (optimistic). "Mark all read" → `markAllRead` (clear count, mark loaded read). Gateway event on `business:{id}:notifications` **or** FCM `onMessage` → `refreshCount` (+ `loadList` if open). **Pre-B1c interim:** bridge gets no events (the gateway doesn't emit the channel yet) → the badge updates on open/navigation + FCM bump (once the FCM prereqs land). No polling.

## 7. Error handling & degradation

- Server actions never throw to the client: catch → safe default (`0` / empty `ApiResponse` / `{ok:false}`) + `console.error`. So if the comms service is unreachable or errors (e.g. before the gateway/FCM prereqs land), the bell is a graceful "0" with no crash. NOTE: `COMMUNICATIONS_SERVICE_URL` itself is a **hard prerequisite** — `ApiClient` resolves it via `requireEnv` at module load (like every sibling service URL), so it must be set for the dashboard to boot; the graceful-0 path covers a *reachable-but-failing* service, not an unset var (§8.1).
- Provider fetches only when authenticated; the realtime bridge no-ops when `businessId` is absent (passes `null`).
- `markOneRead`/`markAllRead` optimistic with reconcile-on-failure (refetch count) so a failed write can't leave a wrong badge.

## 8. Prerequisites (user / other slices — outside this code)

1. **`COMMUNICATIONS_SERVICE_URL`** set in the dashboard env (the gateway exposure of the Communications Service) — same prerequisite as the FCM slice. It must be set for the dashboard to boot (`ApiClient` resolves it via `requireEnv` at module load, like sibling service URLs — an unset var throws at import, not gracefully). Once set, if the comms service is unreachable the actions return safe defaults.
2. **B1c gateway routing** (external repo): consume `OWNER_NOTIFICATION_CREATED` → fan out `business:{id}:notifications`. Until then the realtime bridge receives nothing (graceful).
3. **FCM prerequisites** (from the FCM slice) enable the `onMessage` bump on foreground pushes. Independent of the on-demand path.

## 9. Testing

No JS test framework exists (only `dev/build/start/lint`). Per the prior dashboard slice, verify via `npx tsc --noEmit` + `yarn lint` + `yarn build` and a manual checklist:
- Badge reflects the unread count; hidden at 0; "9+" cap.
- Dropdown lists owner notifications newest-first; read vs unread styling; loading + empty states.
- Clicking an item marks it read and decrements the badge; "Mark all read" clears it.
- A simulated `business:{id}:notifications` message bumps the count (+ refreshes the list if open).
- FCM `onMessage` bumps the count.
No test stack is added (matches the FCM slice decision).

## 10. Out of scope (later)

- A full notifications **page** (dropdown only for the MVP).
- Notification click-through/deep-linking to the related entity; categories/filters; retention/archival.
- B1c (gateway, external) and B3 (payment/void/refund consumers) — separate.
