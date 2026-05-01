/**
 * Page shell — consistent container, header, and breadcrumb scaffolding
 * for `(protected)` dashboard pages.
 *
 * Why this exists: every protected page used to roll its own padding,
 * max-width, title size, and breadcrumb position. After the redesign
 * we want one place that decides those, so a settings page and a
 * products list page agree on every visual hairline.
 *
 * Usage:
 *
 *   <PageShell>
 *     <PageBreadcrumbs items={[{ title: "Products", href: "/products" }]} />
 *     <PageHeader
 *       title="Products"
 *       subtitle="Catalog of items sold from this location."
 *       actions={<Button>Add product</Button>}
 *     />
 *     <PageBody>
 *       ...page content...
 *     </PageBody>
 *   </PageShell>
 *
 * `PageBody` is optional — if you want full bleed, just drop content
 * directly inside `PageShell`. Otherwise it adds the standard 24px gap
 * between header and content.
 */

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// PageShell — outermost wrapper. Sets the container width, the canvas
// padding, and the vertical scroll surface. Each protected page should
// have exactly one of these as its top-level element.
// ─────────────────────────────────────────────────────────────────────

interface PageShellProps {
  children: React.ReactNode;
  /** Override the max-width when a page genuinely needs more room. */
  maxWidth?: "default" | "wide" | "full";
  /** Add extra room around the content (rare — defaults are fine). */
  className?: string;
}

const MAX_WIDTH_MAP: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  default: "max-w-[1500px]",
  wide: "max-w-[1800px]",
  full: "max-w-none",
};

export function PageShell({
  children,
  maxWidth = "default",
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 md:px-8 md:py-8 lg:pl-4",
        MAX_WIDTH_MAP[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PageBreadcrumbs — lightweight crumbs row that sits inline on the
// canvas (no card surface). The first crumb is always "Home", linking
// back to /dashboard. Pass the rest via `items`; the last item renders
// as the current page (non-clickable styling).
// ─────────────────────────────────────────────────────────────────────

export interface PageBreadcrumbItem {
  title: string;
  href?: string;
}

export function PageBreadcrumbs({ items }: { items: PageBreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 transition-colors hover:text-ink-2"
      >
        <Home className="h-3 w-3" />
        Home
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.title}-${idx}`}>
            <ChevronRight className="h-3 w-3 text-muted-2" />
            {isLast || !item.href ? (
              <span className="font-medium text-ink">{item.title}</span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-ink-2"
              >
                {item.title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PageHeader — the title + subtitle + actions row. Keeps its
// typography aligned across every page so a settings detail and a
// products list feel like they share the same template.
// ─────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned action slot (buttons, search, etc.). */
  actions?: React.ReactNode;
  /** Optional pill rendered next to the title (status, count, etc.). */
  titleAccessory?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  titleAccessory,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-3 text-[26px] font-semibold leading-tight tracking-tight text-ink">
          {title}
          {titleAccessory && (
            <span className="self-center">{titleAccessory}</span>
          )}
        </h1>
        {subtitle && (
          <p className="mt-1 font-mono text-[13px] text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PageBody — optional content wrapper. Adds a consistent vertical
// rhythm under the header. Skip it if your page wants flush content.
// ─────────────────────────────────────────────────────────────────────

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}
