"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Boxes,
  Menu,
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

import { NotificationBell } from "@/components/notifications/notification-bell";

import { SidebarLocationSwitcher } from "./sidebar-location-switcher";
import { SidebarAccountMenu } from "./sidebar-account-menu";

import { menuItems } from "@/types/menu_items";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { ExtendedUser } from "@/types/types";
import { usePermissions } from "@/context/permissionsContext";

interface SidebarContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error(
      "useSidebar must be used inside <SidebarProvider> — wrap the protected layout.",
    );
  }
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function MobileSidebarTrigger({ className }: { className?: string }) {
  const { setMobileOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-ink shadow-sm",
        className,
      )}
      aria-label="Open navigation"
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}

export function MobileTopBar() {
  return (
    <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-line bg-canvas/95 px-3 backdrop-blur lg:hidden">
      <MobileSidebarTrigger />
      <Link
        href="/dashboard"
        aria-label="Go to dashboard"
        className="flex items-center"
      >
        <Image
          src="/images/logo_new.png"
          alt="Settlo"
          width={92}
          height={28}
          className="h-6 w-auto object-contain dark:brightness-0 dark:invert"
          priority
        />
      </Link>
      <div className="ml-auto">
        <NotificationBell />
      </div>
    </div>
  );
}

interface MenuItemShape {
  link: string;
  title: string;
  id?: string;
  permission?: string;
  permissions?: string[];
}

interface MenuSectionShape {
  label: string;
  icon: string;
  link?: string;
  items: MenuItemShape[];
  permission?: string;
  permissions?: string[];
}

interface DashboardSidebarContentProps {
  data: BusinessPropsType;
  user: ExtendedUser | null;
  onClose?: () => void;
  isMobile?: boolean;
  reportsReadAll?: boolean;
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

const linkMatchesPath = (link: string, pathname: string) =>
  pathname === link || pathname.startsWith(link + "/");

const isItemActiveAmong = (
  itemLink: string,
  pathname: string,
  siblings: { link: string }[],
) => {
  if (!linkMatchesPath(itemLink, pathname)) return false;
  return !siblings.some(
    (other) =>
      other.link !== itemLink &&
      other.link.length > itemLink.length &&
      linkMatchesPath(other.link, pathname),
  );
};

function DashboardSidebarContent({
  data,
  user,
  onClose,
  isMobile,
  reportsReadAll = true,
}: DashboardSidebarContentProps) {
  const pathname = usePathname();
  const { hasAnyPermission, loading: permsLoading } = usePermissions();
  const sections = menuItems({
    menuType: "normal",
    isCurrentItem: false,
    hasMultipleDestinations: data.hasMultipleDestinations,
    reportsReadAll,
  }) as unknown as MenuSectionShape[];

  // Permission-gate the nav. Fail OPEN: an entry with no permission tag, or
  // any entry while permissions are still loading, is always shown — the
  // backend @PreAuthorize is the real security gate, so this only declutters
  // the nav for invited, limited-scope members (owners hold the full catalog
  // and therefore keep every item). A tagged entry is hidden only once perms
  // have loaded AND the user holds none of its key(s). Sections that end up
  // with no visible items (and aren't standalone links) are dropped.
  const canSee = (entry: { permission?: string; permissions?: string[] }) => {
    if (permsLoading) return true;
    const keys = entry.permissions ?? (entry.permission ? [entry.permission] : []);
    if (keys.length === 0) return true;
    return hasAnyPermission(keys);
  };

  const visibleSections = useMemo(() => {
    return sections
      .filter((section) => canSee(section))
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => canSee(item)),
      }))
      .filter(
        (section) =>
          // Keep standalone links (have a link, no items) even when empty;
          // drop grouped sections that have no visible children left.
          (section.link && (!section.items || section.items.length === 0)) ||
          section.items.length > 0,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, permsLoading, hasAnyPermission]);

  const [openIndex, setOpenIndex] = useState<number>(-1);
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    const findActive = () =>
      visibleSections.findIndex((section) =>
        section.items.some(
          (item: MenuItemShape) =>
            pathname === item.link || pathname.startsWith(item.link + "/"),
        ),
      );

    if (prevPathRef.current === pathname && openIndex !== -1) return;
    prevPathRef.current = pathname;
    const idx = findActive();
    if (idx !== -1) setOpenIndex(idx);
  }, [pathname, visibleSections]);

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

        {!isMobile && <NotificationBell />}

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
        {visibleSections.map((section, sectionIndex) => {
          const sectionLink = section.link;
          if (sectionLink && (!section.items || section.items.length === 0)) {
            const isActive =
              pathname === sectionLink ||
              pathname.startsWith(sectionLink + "/");
            return (
              <div key={section.label} className="py-0.5">
                <Link
                  href={sectionLink}
                  onClick={isMobile ? onClose : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors",
                    isActive
                      ? "bg-ink text-card"
                      : "text-ink-3 hover:bg-canvas hover:text-ink",
                  )}
                >
                  <span className={cn(isActive ? "text-card" : "text-primary")}>
                    {getSectionIcon(section.icon)}
                  </span>
                  <span>{section.label}</span>
                </Link>
              </div>
            );
          }

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
                    const isItemActive = isItemActiveAmong(
                      item.link,
                      pathname,
                      section.items,
                    );
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
  reportsReadAll?: boolean;
}

export function DashboardSidebarShell({
  data,
  user,
  reportsReadAll = true,
}: DashboardSidebarShellProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop floating sidebar */}
      <aside className="my-3 ml-3 hidden w-[296px] flex-shrink-0 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_0_rgba(20,17,12,0.02),0_14px_40px_-16px_rgba(20,17,12,0.10),0_4px_10px_-4px_rgba(20,17,12,0.05)] lg:flex lg:flex-col">
        <DashboardSidebarContent data={data} user={user} reportsReadAll={reportsReadAll} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[296px] bg-card p-0"
          style={{
            top: "var(--banner-h, 0px)",
            height: "auto",
          }}
          hideClose
        >
          <DashboardSidebarContent
            data={data}
            user={user}
            isMobile
            reportsReadAll={reportsReadAll}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
