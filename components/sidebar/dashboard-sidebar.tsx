"use client";

/**
 * Dashboard sidebar — the single floating chrome for `(protected)` pages.
 *
 * Replaces the old `SidebarWrapper` + `NavbarWrapper` combo from the
 * pre-redesign layout. Everything that used to live in the topbar
 * (Settlo logo, search trigger, notifications bell, location switcher,
 * user dropdown) now lives inside this sidebar, so the canvas around
 * the page content has nothing else floating on it.
 *
 * Layout (top → bottom):
 *   1. Logo row + search + bell
 *   2. SidebarLocationSwitcher — destination toggle (location/warehouse/store)
 *   3. Workspace nav (accordion, derived from `menuItems()`)
 *   4. Footer: Billing, Settings, divider, SidebarAccountMenu (which
 *      absorbs business-switching + user account into one popover),
 *      copyright
 *
 * Mobile: the desktop aside is hidden below `lg`; a small round trigger
 * pinned top-left opens the same content inside a Sheet.
 */

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Boxes,
  Menu,
  Search,
  ShoppingBag,
  Sliders,
  UserCog,
  Users,
  Warehouse,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { SidebarLocationSwitcher } from "./sidebar-location-switcher";
import { SidebarAccountMenu } from "./sidebar-account-menu";

import { menuItems } from "@/types/menu_items";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { ExtendedUser } from "@/types/types";

interface MenuItemShape {
  link: string;
  title: string;
  id?: string;
}

interface DashboardSidebarContentProps {
  data: BusinessPropsType;
  user: ExtendedUser | null;
  onClose?: () => void;
  isMobile?: boolean;
}

function getSectionIcon(name: string) {
  const props = { className: "h-4 w-4" };
  switch (name) {
    case "dashboard":
      return <LayoutDashboard {...props} />;
    case "inventory":
      return <Boxes {...props} />;
    case "stock":
      return <Warehouse {...props} />;
    case "sales":
      return <ShoppingBag {...props} />;
    case "customers":
      return <Users {...props} />;
    case "users":
      return <UserCog {...props} />;
    case "general":
    default:
      return <Sliders {...props} />;
  }
}

function DashboardSidebarContent({
  data,
  user,
  onClose,
  isMobile,
}: DashboardSidebarContentProps) {
  const pathname = usePathname();
  const sections = menuItems({
    menuType: "normal",
    isCurrentItem: false,
    hasMultipleDestinations: data.hasMultipleDestinations,
  });

  // Auto-expand the section that owns the current route. Only fires on
  // navigation, so manually collapsing a section while the URL stays the
  // same does not snap it back open.
  const [openIndex, setOpenIndex] = useState<number>(-1);
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    const findActive = () =>
      sections.findIndex((section) =>
        section.items.some(
          (item: MenuItemShape) =>
            pathname === item.link || pathname.startsWith(item.link + "/"),
        ),
      );

    if (prevPathRef.current === pathname && openIndex !== -1) return;
    prevPathRef.current = pathname;
    const idx = findActive();
    if (idx !== -1) setOpenIndex(idx);
    // sections is derived from a stable input; re-running on every
    // pathname tick is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!data.business) return null;

  return (
    <div className="flex h-full flex-col bg-card">
      {/* ── Top: brand + search + bell ───────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-3">
        <Link
          href="/dashboard"
          className="flex flex-1 items-center gap-2 rounded-md px-1 py-1 hover:bg-canvas"
          onClick={isMobile ? onClose : undefined}
        >
          <Image
            src="/images/logo_new.png"
            alt="Settlo"
            width={92}
            height={28}
            className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
            priority
          />
        </Link>

        <button
          type="button"
          aria-label="Search"
          title="Search (⌘K)"
          className="grid h-8 w-8 place-items-center rounded-md text-ink-3 hover:bg-canvas hover:text-ink"
          onClick={() => {
            // TODO: open command-palette overlay. The handler is a stub
            // until the search backend lands.
          }}
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative grid h-8 w-8 place-items-center rounded-md text-ink-3 hover:bg-canvas hover:text-ink"
          onClick={() => {
            // TODO: open notifications drawer. The orange dot below is
            // a static signal until the feed is wired up.
          }}
        >
          <Bell className="h-4 w-4" />
          <span className="pointer-events-none absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-card bg-primary" />
        </button>

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Top toggle: location / warehouse / store ─────────────────
          Single segmented popover. Replaces the old separate
          BusinessSwitcher card + thin LocationSwitcher button — the
          business-switching responsibility now lives in the bottom
          AccountMenu instead. */}
      <div className="px-3 pb-2">
        <SidebarLocationSwitcher
          locationList={data.locationList}
          currentLocation={data.currentLocation}
          storeList={data.storeList}
          currentStore={data.currentStore}
          warehouseList={data.warehouseList}
          warehouse={data.warehouse}
        />
      </div>

      {/* ── Workspace nav (accordion sections) ───────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {sections.map((section, sectionIndex) => {
          const sectionHasActive = section.items.some(
            (item: MenuItemShape) =>
              pathname === item.link || pathname.startsWith(item.link + "/"),
          );
          const isOpen = openIndex === sectionIndex;
          return (
            <div key={section.label} className="py-0.5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : sectionIndex)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium transition-colors",
                  sectionHasActive
                    ? "bg-ink text-card"
                    : "text-ink-3 hover:bg-canvas hover:text-ink",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      sectionHasActive ? "text-card" : "text-primary",
                    )}
                  >
                    {getSectionIcon(section.icon)}
                  </span>
                  <span>{section.label}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isOpen && "rotate-180",
                    sectionHasActive ? "text-card/70" : "text-muted-2",
                  )}
                />
              </button>

              {isOpen && (
                <div className="mt-1 ml-2 space-y-0.5 border-l border-line pl-3">
                  {section.items.map((item: MenuItemShape) => {
                    const isItemActive =
                      pathname === item.link ||
                      pathname.startsWith(item.link + "/");
                    return (
                      <Link
                        key={item.title}
                        href={item.link}
                        onClick={isMobile ? onClose : undefined}
                        className={cn(
                          "relative flex w-full items-center rounded-md px-2 py-1.5 text-[13px] transition-colors",
                          isItemActive
                            ? "bg-canvas font-medium text-ink before:absolute before:left-[-13px] before:top-1/2 before:h-4 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']"
                            : "text-muted-foreground hover:bg-canvas/60 hover:text-ink",
                        )}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Foot: account menu (with embedded business switcher) ─── */}
      <div className="border-t border-line px-3 py-3">
        {user && (
          <SidebarAccountMenu
            user={user}
            currentBusiness={data.business}
            businessList={data.businessList ?? []}
          />
        )}
      </div>
    </div>
  );
}

interface DashboardSidebarShellProps {
  data: BusinessPropsType;
  user: ExtendedUser | null;
}

/**
 * Renders the desktop floating sidebar, the mobile-only trigger button,
 * and the mobile Sheet — all wired to a single open/close state. Drop
 * this once near the top of the protected layout's main row.
 */
export function DashboardSidebarShell({
  data,
  user,
}: DashboardSidebarShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile-only floating menu trigger. Pinned top-left so it stays
          reachable even on long pages. The fixed positioning means it
          doesn't take grid space when desktop sidebar is visible. */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-ink shadow-sm lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Desktop floating sidebar */}
      <aside className="my-3 ml-3 hidden w-[296px] flex-shrink-0 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_0_rgba(20,17,12,0.02),0_14px_40px_-16px_rgba(20,17,12,0.10),0_4px_10px_-4px_rgba(20,17,12,0.05)] lg:flex lg:flex-col">
        <DashboardSidebarContent data={data} user={user} />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[296px] bg-card p-0">
          <DashboardSidebarContent
            data={data}
            user={user}
            isMobile
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
