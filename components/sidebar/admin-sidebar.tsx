"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  Coins,
  Globe,
  Headset,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  PackagePlus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutStaff } from "@/lib/actions/auth-actions";
import { AuthToken, InternalRole } from "@/types/types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles allowed to see this item. Empty = visible to all internal roles. */
  roles?: InternalRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Accounts",
    href: "/accounts",
    icon: Building2,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT", "SALES_TEAM"],
  },
  {
    title: "Businesses",
    href: "/businesses",
    icon: Briefcase,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT", "SALES_TEAM"],
  },
  {
    title: "Locations",
    href: "/locations",
    icon: MapPin,
    roles: [
      "SYSTEM_ADMIN",
      "SUPER_ADMIN",
      "SUPPORT_AGENT",
      "BOARD_MEMBER",
      "SALES_TEAM",
    ],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT"],
  },
  {
    title: "Refunds",
    href: "/refunds",
    icon: RotateCcw,
    roles: ["SYSTEM_ADMIN", "SUPPORT_AGENT"],
  },
  {
    title: "Packages",
    href: "/packages",
    icon: Package,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Addons",
    href: "/addons",
    icon: PackagePlus,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Features",
    href: "/features",
    icon: Layers,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Discounts",
    href: "/discounts",
    icon: Sparkles,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT"],
  },
  {
    title: "Coupons",
    href: "/coupons",
    icon: Ticket,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Credit packs",
    href: "/credit-packs",
    icon: Coins,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Whitelabel pricing",
    href: "/whitelabel-pricing",
    icon: Globe,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    // SaaS analytics (MRR/churn/cohorts) is platform-wide with no per-account
    // dimension, so it isn't shown to sales reps (whose views are account-scoped).
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN", "BOARD_MEMBER"],
  },
  {
    title: "Internal Users",
    href: "/users",
    icon: UserCog,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Roles",
    href: "/roles",
    icon: ShieldCheck,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "External Agents",
    href: "/support-agents",
    icon: Headset,
    roles: ["SYSTEM_ADMIN", "SUPER_ADMIN"],
  },
];

interface AdminSidebarProps {
  token: AuthToken | null;
  isMobile?: boolean;
  onClose?: () => void;
}

function visibleNavItems(role: InternalRole | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return role ? item.roles.includes(role) : false;
  });
}

function pathMatches(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminSidebarContent({ token, isMobile, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const role = token?.internalRole ?? null;
  const items = visibleNavItems(role);
  const [isLoggingOut, startLogout] = useTransition();

  const roleLabel = role ? role.replace(/_/g, " ").toLowerCase() : "";

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await logoutStaff();
      } finally {
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 py-3">
        <Link
          href="/dashboard"
          onClick={isMobile ? onClose : undefined}
          className="flex flex-1 items-center gap-2 rounded-md px-1 py-1 hover:bg-canvas"
        >
          <Image
            src="/images/logo_new.png"
            alt="Settlo"
            width={92}
            height={28}
            className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
            priority
          />
          <span className="ml-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
            Staff
          </span>
        </Link>
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

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathMatches(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-ink text-card"
                  : "text-ink-3 hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-card" : "text-primary",
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Account footer */}
      <div className="space-y-2 border-t border-line px-3 py-3">
        {token?.email && (
          <div className="space-y-0.5 px-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {token.email}
            </p>
            {roleLabel && (
              <p className="truncate font-mono text-[11px] capitalize text-muted-foreground">
                {roleLabel}
              </p>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full justify-start gap-2 text-ink-3 hover:bg-canvas hover:text-ink"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out
        </Button>
      </div>
    </div>
  );
}

interface AdminSidebarShellProps {
  token: AuthToken | null;
}

export function AdminSidebarShell({ token }: AdminSidebarShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger (lives in the page when shell is mounted) */}
      <div className="fixed left-3 top-3 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-ink shadow-sm"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop floating sidebar */}
      <aside className="my-3 ml-3 hidden w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_0_rgba(20,17,12,0.02),0_14px_40px_-16px_rgba(20,17,12,0.10),0_4px_10px_-4px_rgba(20,17,12,0.05)] lg:flex lg:flex-col">
        <AdminSidebarContent token={token} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] bg-card p-0" hideClose>
          <AdminSidebarContent
            token={token}
            isMobile
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
