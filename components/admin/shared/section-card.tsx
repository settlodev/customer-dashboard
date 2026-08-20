import React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { StubBadge } from "@/components/admin/catalog/package-detail/stub-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * SectionCard — the white rounded card with a title / mono-subtitle header
 * and an optional right-aligned link or action. The workhorse container for
 * the admin dashboard and account-detail panels. Matches the design mock's
 * `.card` + `.card-head` rules (16px radius, hairline border, 20px padding).
 */

// Orange-deep accent for inline "→" links. Pinned to the exact design link
// colour #C25E26 (the `text-primary-dark` token now resolves to the same
// burnt orange via --primary-dark, but this keeps the admin link value exact).
export const ACCENT_LINK =
  "inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#C25E26] transition-colors hover:text-[#a04d1d]";

export function CardLink({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const content = (
    <>
      {children}
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(ACCENT_LINK, className)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cn(ACCENT_LINK, className)}>
      {content}
    </button>
  );
}

interface SectionCardProps {
  title?: React.ReactNode;
  /** Explanatory text shown in a hover tooltip next to the title. */
  tooltip?: string;
  subtitle?: React.ReactNode;
  /** Right-aligned accent link rendered as "label →". */
  linkLabel?: string;
  linkHref?: string;
  /** Arbitrary right-aligned slot (overrides linkLabel when provided). */
  action?: React.ReactNode;
  /** Marks the card's data as placeholder — shows a "Live data pending" pill. */
  stub?: boolean;
  /** Drop the body padding (for full-bleed tables). Header keeps its inset. */
  flush?: boolean;
  /** Optional element id (e.g. for in-page anchor links). */
  id?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  tooltip,
  subtitle,
  linkLabel,
  linkHref,
  action,
  stub,
  flush,
  id,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  const hasHeader = title || subtitle || linkLabel || action || stub;
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-6 rounded-2xl border border-line bg-card",
        flush ? "pb-1.5 pt-5" : "p-5",
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cn(
            "mb-4 flex items-start justify-between gap-3",
            flush && "px-5",
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.01em] text-ink">
                {title}
                {tooltip && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex flex-shrink-0 text-muted-foreground/70 hover:text-muted-foreground focus:outline-none"
                          aria-label={`About ${typeof title === "string" ? title : "this section"}`}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-[260px] text-xs font-normal">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {stub && <StubBadge />}
            {action ?? (linkLabel ? <CardLink href={linkHref}>{linkLabel}</CardLink> : null)}
          </div>
        </header>
      )}
      <div className={cn(flush ? "" : "", bodyClassName)}>{children}</div>
    </section>
  );
}
