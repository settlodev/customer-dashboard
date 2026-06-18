# Dashboard Notification Center (B1d) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an owner notification center to the Customer-Dashboard — a sidebar/mobile bell with a per-user unread badge, a dropdown list, mark-as-read, and real-time/FCM refresh — fed by the B1 Comms backend REST API.

**Architecture:** A client `NotificationProvider` (React Context + `useReducer`) holds shared state (`unreadCount`, `items`, `open`) and the read actions. `"use server"` server actions call the comms API via `new ApiClient("communications")` (JWT-scoped — no `businessId` argument). A `NotificationBell` (sidebar + `MobileTopBar`) reads the provider; a `NotificationRealtimeBridge` (protected layout, `businessId` prop) and the existing FCM `onMessage` poke the provider to refresh.

**Tech Stack:** Next.js 15 / React 19 / NextAuth v5 / Tailwind / lucide-react / Yarn. No JS test framework.

## Global Constraints

- **All comms access via `"use server"` server actions** using `new ApiClient("communications")`. The comms controller derives `businessId`/`userId` from the JWT and `ApiClient` auto-stamps the Bearer token + `X-Business-Id` — so actions take **NO `businessId` argument**. Actions **never throw to the client**: wrap in `try/catch`, log, return a safe default (`0` / empty `ApiResponse` / `{ok:false}`).
- **`businessId` reaches the client only for the realtime channel string**, prop-drilled from the protected server layout (like `CustomerCacheRealtimeBinder businessId={currentBusiness?.id}`).
- **Shared state via `NotificationProvider`** (Context + `useReducer`, mirroring `context/cartContext.tsx`), mounted in `app/providers.tsx` **wrapping** `FirebaseMessagingProvider`; the initial count fetch is gated on `useSession()` `status === "authenticated"`.
- **Bell in the sidebar + `MobileTopBar`** — one shared `NotificationBell`; dynamic badge shows the count, caps at `"9+"`, hidden when `0`.
- **No JS test framework** — verify each task with `npx tsc --noEmit`; the final task also runs `yarn lint` + `yarn build` + a manual checklist. **Do NOT add a test stack.**
- **Match the app's existing Tailwind tokens** (e.g. `text-ink`, `border-line`, `bg-card`, `bg-canvas`, `bg-danger` as used in `components/sidebar/dashboard-sidebar.tsx`); adjust any token that differs.
- **Branch `alpha`. The working tree may contain unrelated user WIP** (e.g. `stock-variants` pages, `stock-actions.tsx`) — stage ONLY the files each task lists with `git add <explicit paths>`, **never `git add -A`/`git add .`**, and do not touch unrelated files. Commit messages end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- B1c (gateway routing) and `COMMUNICATIONS_SERVICE_URL`/FCM are external prerequisites; the feature must degrade gracefully (bell shows `0`, no crash) without them.

---

### Task 1: Type + server actions (data layer)

**Files:**
- Create: `types/notification.ts`
- Create: `lib/actions/notification-actions.ts`

**Interfaces:**
- Produces: `OwnerNotification` type; `getUnreadCount(): Promise<number>`, `listNotifications(page?, size?): Promise<ApiResponse<OwnerNotification>>`, `markRead(id: string): Promise<{ ok: boolean }>`, `markAllRead(): Promise<{ ok: boolean }>`. Consumed by Tasks 2–4.

- [ ] **Step 1: Add the type**

Create `types/notification.ts`:

```ts
export interface OwnerNotification {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: string | null;
  createdAt: string;
  read: boolean;
}
```

- [ ] **Step 2: Add the server actions**

Create `lib/actions/notification-actions.ts` (mirrors `lib/actions/order-actions.tsx`: `"use server"`, `ApiClient`, `parseStringify`, try/catch → safe default):

```ts
"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { OwnerNotification } from "@/types/notification";

const comms = () => new ApiClient("communications");

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await comms().get<{ count: number }>(
      "/api/v1/notifications/unread-count",
    );
    return data?.count ?? 0;
  } catch (error) {
    console.error("getUnreadCount failed", error);
    return 0;
  }
}

export async function listNotifications(
  page = 0,
  size = 20,
): Promise<ApiResponse<OwnerNotification>> {
  try {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const data = await comms().get<ApiResponse<OwnerNotification>>(
      `/api/v1/notifications?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("listNotifications failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: page,
      size,
      first: true,
      last: true,
    } as unknown as ApiResponse<OwnerNotification>;
  }
}

export async function markRead(id: string): Promise<{ ok: boolean }> {
  try {
    await comms().post(`/api/v1/notifications/${id}/read`, {});
    return { ok: true };
  } catch (error) {
    console.error("markRead failed", error);
    return { ok: false };
  }
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  try {
    await comms().post("/api/v1/notifications/read-all", {});
    return { ok: true };
  } catch (error) {
    console.error("markAllRead failed", error);
    return { ok: false };
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors in `types/notification.ts` or `lib/actions/notification-actions.ts`. (If `ApiResponse`'s required fields differ, the `as unknown as ApiResponse<…>` cast in the empty shell — the same pattern `order-actions`/`customer-ar-actions` use — keeps it clean.)

- [ ] **Step 4: Commit**

```bash
git add types/notification.ts lib/actions/notification-actions.ts
git commit -m "feat(dashboard): notification-center server actions + type

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: NotificationProvider (shared state) + mount

**Files:**
- Create: `context/notificationContext.tsx`
- Modify: `app/providers.tsx`

**Interfaces:**
- Consumes: the server actions from Task 1; `useSession` from `next-auth/react`.
- Produces: `NotificationProvider` and `useNotifications(): { unreadCount, items, loading, open, setOpen, refreshCount, loadList, markOneRead, markAllRead, applyIncoming }`. Consumed by Tasks 3–4.

- [ ] **Step 1: Add the context/provider**

Create `context/notificationContext.tsx` (mirrors `context/cartContext.tsx`: `"use client"`, `createContext<…|undefined>`, `useReducer`, guarded hook):

```tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useSession } from "next-auth/react";

import { OwnerNotification } from "@/types/notification";
import {
  getUnreadCount,
  listNotifications,
  markRead as markReadAction,
  markAllRead as markAllReadAction,
} from "@/lib/actions/notification-actions";

interface NotificationState {
  unreadCount: number;
  items: OwnerNotification[];
  loading: boolean;
  open: boolean;
}

type Action =
  | { type: "SET_COUNT"; count: number }
  | { type: "SET_ITEMS"; items: OwnerNotification[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_OPEN"; open: boolean }
  | { type: "MARK_ONE"; id: string }
  | { type: "MARK_ALL" };

const initialState: NotificationState = {
  unreadCount: 0,
  items: [],
  loading: false,
  open: false,
};

function reducer(state: NotificationState, action: Action): NotificationState {
  switch (action.type) {
    case "SET_COUNT":
      return { ...state, unreadCount: Math.max(0, action.count) };
    case "SET_ITEMS":
      return { ...state, items: action.items };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_OPEN":
      return { ...state, open: action.open };
    case "MARK_ONE": {
      const wasUnread = state.items.some((n) => n.id === action.id && !n.read);
      return {
        ...state,
        items: state.items.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - (wasUnread ? 1 : 0)),
      };
    }
    case "MARK_ALL":
      return {
        ...state,
        items: state.items.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      };
    default:
      return state;
  }
}

interface NotificationContextType extends NotificationState {
  setOpen: (open: boolean) => void;
  refreshCount: () => Promise<void>;
  loadList: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  applyIncoming: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status } = useSession();

  const refreshCount = useCallback(async () => {
    const count = await getUnreadCount();
    dispatch({ type: "SET_COUNT", count });
  }, []);

  const loadList = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    const res = await listNotifications(0, 20);
    dispatch({ type: "SET_ITEMS", items: res.content ?? [] });
    dispatch({ type: "SET_LOADING", loading: false });
  }, []);

  const setOpen = useCallback(
    (open: boolean) => dispatch({ type: "SET_OPEN", open }),
    [],
  );

  const markOneRead = useCallback(
    async (id: string) => {
      dispatch({ type: "MARK_ONE", id });
      const { ok } = await markReadAction(id);
      if (!ok) await refreshCount();
    },
    [refreshCount],
  );

  const markAllRead = useCallback(async () => {
    dispatch({ type: "MARK_ALL" });
    const { ok } = await markAllReadAction();
    if (!ok) await refreshCount();
  }, [refreshCount]);

  const applyIncoming = useCallback(() => {
    void refreshCount();
    if (state.open) void loadList();
  }, [refreshCount, loadList, state.open]);

  useEffect(() => {
    if (status === "authenticated") void refreshCount();
  }, [status, refreshCount]);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        setOpen,
        refreshCount,
        loadList,
        markOneRead,
        markAllRead,
        applyIncoming,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};
```

- [ ] **Step 2: Mount it in `app/providers.tsx` (wrapping FCM)**

Edit `app/providers.tsx` — add the import and wrap `FirebaseMessagingProvider` + `children` with `NotificationProvider` (so the FCM handler in Task 4 can call `useNotifications()`):

```tsx
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
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (`NotificationProvider` is under `SessionProvider` — which already wraps `Providers` — so `useSession()` resolves.)

- [ ] **Step 4: Commit**

```bash
git add context/notificationContext.tsx app/providers.tsx
git commit -m "feat(dashboard): NotificationProvider shared state (unread count + read actions)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: NotificationBell component + render in sidebar + MobileTopBar

**Files:**
- Create: `components/notifications/notification-bell.tsx`
- Modify: `components/sidebar/dashboard-sidebar.tsx` (render in `MobileTopBar` and the desktop sidebar)

**Interfaces:**
- Consumes: `useNotifications()` (Task 2); `ClickOutside` (default export, `onClick: () => void`, `className?`); lucide `Bell`; `cn` from `@/lib/utils`.
- Produces: `NotificationBell` (named export).

- [ ] **Step 1: Add the bell component**

Create `components/notifications/notification-bell.tsx`:

```tsx
"use client";

import { Bell } from "lucide-react";

import ClickOutside from "@/components/ClickOutside";
import { useNotifications } from "@/context/notificationContext";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const {
    unreadCount,
    items,
    loading,
    open,
    setOpen,
    loadList,
    markOneRead,
    markAllRead,
  } = useNotifications();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadList();
  };

  return (
    <ClickOutside onClick={() => setOpen(false)} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-card"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[28rem] w-80 overflow-y-auto rounded-lg border border-line bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-ink/70 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-ink/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink/60">
              No notifications yet
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void markOneRead(n.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 border-t border-line px-4 py-3 text-left hover:bg-canvas",
                      !n.read && "bg-canvas/60",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      {!n.read && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-danger" />
                      )}
                      {n.title ?? "Notification"}
                    </span>
                    {n.body && <span className="text-xs text-ink/70">{n.body}</span>}
                    <span className="text-[11px] text-ink/50">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ClickOutside>
  );
}
```

- [ ] **Step 2: Render in `MobileTopBar`**

In `components/sidebar/dashboard-sidebar.tsx`, import the bell at the top:

```tsx
import { NotificationBell } from "@/components/notifications/notification-bell";
```

In `MobileTopBar` (the `flex h-12 … lg:hidden` bar), add the bell pushed to the right, after the logo `<Link>`:

```tsx
      <div className="ml-auto">
        <NotificationBell />
      </div>
```

- [ ] **Step 3: Render in the desktop sidebar**

In `DashboardSidebarContent` (the desktop sidebar body), render `<NotificationBell />` in a visible slot — e.g. a header row alongside `SidebarLocationSwitcher`, or in the `SidebarAccountMenu` footer region. It must remain a descendant of `NotificationProvider` (it is, via the protected layout). Keep it visible only where the desktop sidebar shows (it can sit inside the always-rendered sidebar column). Use the smallest change that places one `<NotificationBell />` where an owner would expect a bell on desktop.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. Confirm the Tailwind tokens used (`text-ink`, `border-line`, `bg-card`, `bg-canvas`, `bg-danger`) exist in the app; swap any that differ for the nearest existing token (purely cosmetic).

- [ ] **Step 5: Commit**

```bash
git add components/notifications/notification-bell.tsx components/sidebar/dashboard-sidebar.tsx
git commit -m "feat(dashboard): notification bell + dropdown in sidebar and mobile top bar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Realtime bridge + FCM bump + final verification

**Files:**
- Create: `components/notifications/notification-realtime-bridge.tsx`
- Modify: `app/(protected)/layout.tsx` (mount the bridge)
- Modify: `components/firebase-messaging-provider.tsx` (bump on foreground push)

**Interfaces:**
- Consumes: `useRealtimeChannel(channels, handler)` (`hooks/use-realtime-channel.ts` — accepts a string/`null`); `useNotifications()` (Task 2); `currentBusiness?.id` (already resolved in the protected layout).
- Produces: `NotificationRealtimeBridge` (named export).

- [ ] **Step 1: Add the realtime bridge**

Create `components/notifications/notification-realtime-bridge.tsx`:

```tsx
"use client";

import { useCallback } from "react";

import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useNotifications } from "@/context/notificationContext";

export function NotificationRealtimeBridge({
  businessId,
}: {
  businessId?: string;
}) {
  const { applyIncoming } = useNotifications();
  const handler = useCallback(() => applyIncoming(), [applyIncoming]);
  useRealtimeChannel(
    businessId ? `business:${businessId}:notifications` : null,
    handler,
  );
  return null;
}
```

- [ ] **Step 2: Mount the bridge in the protected layout**

In `app/(protected)/layout.tsx`, import it and mount it beside `CustomerCacheRealtimeBinder` (which already receives `businessId={currentBusiness?.id}`):

```tsx
import { NotificationRealtimeBridge } from "@/components/notifications/notification-realtime-bridge";
```

```tsx
      <CustomerCacheRealtimeBinder businessId={currentBusiness?.id} />
      <NotificationRealtimeBridge businessId={currentBusiness?.id} />
```

- [ ] **Step 3: Bump the badge on a foreground FCM push**

In `components/firebase-messaging-provider.tsx`, import and call the provider's `refreshCount` from the `onMessage` handler (in addition to the existing `toast`). Add near the existing hooks:

```tsx
import { useNotifications } from "@/context/notificationContext";
```

```tsx
  const { refreshCount } = useNotifications();
```

In the `onMessage(messaging, (payload) => { … })` callback, after the existing `toast({...})` call, add:

```tsx
        void refreshCount();
```

Add `refreshCount` to that `useEffect`'s dependency array (it is a stable `useCallback`, so this won't cause re-subscription churn).

- [ ] **Step 4: Type-check, lint, build**

Run: `npx tsc --noEmit` → no new errors.
Run: `yarn lint` → no new errors in the touched files.
Run: `yarn build` → succeeds. (If a stale `.next` cache causes an unrelated route error, `rm -rf .next && yarn build` and retry — see the prior dashboard slice.)

- [ ] **Step 5: Commit**

```bash
git add components/notifications/notification-realtime-bridge.tsx "app/(protected)/layout.tsx" components/firebase-messaging-provider.tsx
git commit -m "feat(dashboard): realtime + FCM bump for the notification center

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Manual verification checklist (record results; live paths need the prerequisites)**

Type-check/lint/build are the automated gate. Manually (in a running app, once `COMMUNICATIONS_SERVICE_URL` is set) confirm:
- Badge shows the unread count; hidden at 0; caps at "9+".
- Opening the bell loads notifications newest-first; loading + empty states render.
- Clicking an item marks it read (dot clears, badge decrements); "Mark all read" clears the badge.
- A simulated `business:{id}:notifications` gateway message bumps the count (and refreshes the list if open).
- A foreground FCM message bumps the count.
Pre-prerequisite behavior: with no `COMMUNICATIONS_SERVICE_URL`, the actions return safe defaults — the bell renders "0" and never crashes.

---

## Out of scope (this plan)

- A full notifications **page**; click-through/deep-linking; categories/filters.
- Deleting the orphaned `components/icons/navbar/notificationicon.tsx` and `components/navigation/DropdownNotification.tsx` (now superseded but harmless) — optional cleanup, left to keep this diff additive.
- B1c (gateway routing, external repo) and B3 (payment/void/refund consumers).

## Self-review

- **Spec coverage:** server actions + type (spec §5.1/§5.2) → Task 1; `NotificationProvider` + mount wrapping FCM (§5.3, D1) → Task 2; bell in sidebar + MobileTopBar with dynamic badge (§5.4, D2) → Task 3; realtime bridge + protected-layout mount + FCM bump (§5.5/§5.6, D5) → Task 4; JWT-scoped actions with no `businessId` (D3) → Task 1; `businessId` client-side only for the channel (D4) → Task 4; graceful degradation (§7) → Task 1 catches + Task 4 manual checklist; testing via tsc/lint/build (§9) → each task + Task 4. ✅
- **Placeholder scan:** no TBD/empty bodies; the desktop-sidebar placement (Task 3 Step 3) is a bounded "render one `<NotificationBell />` in the sidebar column" instruction, not a placeholder — the component + its data are fully specified.
- **Type consistency:** `OwnerNotification` fields, `getUnreadCount/listNotifications/markRead/markAllRead` signatures, and `useNotifications()`'s `{ unreadCount, items, loading, open, setOpen, refreshCount, loadList, markOneRead, markAllRead, applyIncoming }` are consistent across Tasks 1–4.
