"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardCheck,
  Coins,
  Globe,
  HandCoins,
  Headset,
  LayoutDashboard,
  Landmark,
  Layers,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  PackagePlus,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCog,
  Users,
  Wallet,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutStaff } from "@/lib/actions/auth-actions";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { AuthToken } from "@/types/types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Internal permissions that grant access (ANY-of). Omitted/empty = visible to
   * all internal staff. Capability-based so custom roles work, not role names.
   */
  permissions?: string[];
}

interface NavGroup {
  /**
   * Uppercase section heading rendered above the group. Omit for the primary
   * block, which is shown without a heading (matches the admin design).
   */
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    // Primary block — day-to-day navigation, shown without a heading.
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Accounts",
        href: "/accounts",
        icon: Building2,
        permissions: [PERM.ACCOUNTS_READ],
      },
      {
        title: "Businesses",
        href: "/businesses",
        icon: Briefcase,
        permissions: [PERM.ACCOUNTS_READ],
      },
      {
        title: "Locations",
        href: "/locations",
        icon: MapPin,
        permissions: [PERM.BUSINESS_ANALYTICS_READ],
      },
      {
        title: "Customers",
        href: "/customers",
        icon: Users,
        permissions: [PERM.USERS_IMPERSONATE],
      },
      {
        title: "Refunds",
        href: "/refunds",
        icon: RotateCcw,
        permissions: [PERM.SUPPORT_TICKETS_MANAGE],
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        title: "Packages",
        href: "/packages",
        icon: Package,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
      {
        title: "Addons",
        href: "/addons",
        icon: PackagePlus,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
      {
        title: "Features",
        href: "/features",
        icon: Layers,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
      {
        title: "Discounts",
        href: "/discounts",
        icon: Sparkles,
        permissions: [PERM.SUPPORT_TICKETS_MANAGE],
      },
      {
        title: "Coupons",
        href: "/coupons",
        icon: Ticket,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
      {
        title: "Credit packs",
        href: "/credit-packs",
        icon: Coins,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
      {
        title: "Whitelabel pricing",
        href: "/whitelabel-pricing",
        icon: Globe,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
    ],
  },
  {
    label: "Financing",
    items: [
      {
        title: "Loan products",
        href: "/loans/products",
        icon: Landmark,
        permissions: [PERM.LOANS_READ, PERM.LOANS_PRODUCT_MANAGE],
      },
      {
        title: "Loan applications",
        href: "/loans/applications",
        icon: ClipboardCheck,
        permissions: [PERM.LOANS_APPLICATIONS_READ],
      },
      {
        title: "Loans",
        href: "/loans/portfolio",
        icon: HandCoins,
        permissions: [PERM.LOANS_APPLICATIONS_READ],
      },
      {
        title: "Funding sources",
        href: "/loans/funding-sources",
        icon: Wallet,
        permissions: [PERM.LOANS_FUNDING_MANAGE],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        // SaaS analytics (MRR/churn/cohorts) is platform-wide with no per-account
        // dimension; saas:revenue:read is held by admins + board, not sales.
        permissions: [PERM.SAAS_REVENUE_READ],
      },
      {
        title: "Activity Log",
        href: "/activity-log",
        icon: ScrollText,
        permissions: [PERM.ACTIVITY_LOG_READ],
      },
      {
        title: "Stuck Writes",
        href: "/stuck-writes",
        icon: WifiOff,
        permissions: [PERM.ACTIVITY_LOG_READ],
      },
    ],
  },
  {
    label: "Team & Access",
    items: [
      {
        title: "Internal Users",
        href: "/users",
        icon: UserCog,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
      {
        title: "Roles",
        href: "/roles",
        icon: ShieldCheck,
        permissions: [PERM.ROLES_MANAGE],
      },
      {
        title: "External Agents",
        href: "/support-agents",
        icon: Headset,
        permissions: [PERM.ACCOUNTS_MANAGE],
      },
    ],
  },
];

interface AdminSidebarProps {
  token: AuthToken | null;
  isMobile?: boolean;
  onClose?: () => void;
}

function visibleGroups(token: AuthToken | null | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasInternalPermission(token, ...item.permissions);
    }),
  })).filter((group) => group.items.length > 0);
}

function pathMatches(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminSidebarContent({ token, isMobile, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const groups = visibleGroups(token);
  const [isLoggingOut, startLogout] = useTransition();

  const roleLabel = token?.internalRole
    ? token.internalRole.replace(/_/g, " ").toLowerCase()
    : "";

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
      <nav className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {groups.map((group, groupIndex) => (
          <div key={group.label ?? "primary"}>
            {groupIndex > 0 && <div className="mx-2 my-2 h-px bg-line" />}
            {group.label && (
              <div className="px-2 pb-1 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
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
