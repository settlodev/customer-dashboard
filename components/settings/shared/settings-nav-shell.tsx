"use client";

import React, { useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ControlInput } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  /**
   * Optional heading this item sits under. Items keep their array order —
   * grouping only inserts headings at the boundaries, it never re-sorts.
   */
  group?: string;
}

interface NavGroup {
  group: string | null;
  items: SettingsNavItem[];
}

/** Fold a flat list into contiguous runs by `group`, preserving order. */
function toGroups(items: readonly SettingsNavItem[]): NavGroup[] {
  const out: NavGroup[] = [];
  for (const item of items) {
    const group = item.group ?? null;
    const last = out[out.length - 1];
    if (last && last.group === group) last.items.push(item);
    else out.push({ group, items: [item] });
  }
  return out;
}

function matches(item: SettingsNavItem, term: string): boolean {
  return [item.label, item.description, item.group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(term);
}

/**
 * Two-column settings chrome: a sticky, grouped section list on the left and
 * the active panel on the right. On mobile the list becomes a bottom sheet.
 *
 * The sheet is a Radix dialog rather than an absolutely-positioned div, which
 * is what fixes the three things wrong with the old mobile menu: a list 29
 * items long scrolled away with the page instead of scrolling inside itself,
 * the scrim could end up as the only thing on screen with the close button
 * somewhere above the fold, and nothing trapped focus or locked body scroll.
 * The sheet gives a fixed viewport-height panel with its own scroll area, a
 * close button pinned in its header, escape-to-close, and scrim-tap-to-close.
 */
export function SettingsNavShell({
  items,
  activeId,
  onSelect,
  children,
}: {
  items: readonly SettingsNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState("");
  const [sheetQuery, setSheetQuery] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);

  const active = items.find((item) => item.id === activeId);
  const ActiveIcon = active?.icon ?? SlidersHorizontal;

  // A filter earns its place once the list is long enough to scroll; the
  // store-scoped nav has six entries and doesn't need one.
  const showFilter = items.length > 10;

  const desktopGroups = useMemo(() => {
    const term = desktopQuery.trim().toLowerCase();
    return toGroups(term ? items.filter((i) => matches(i, term)) : items);
  }, [items, desktopQuery]);

  const sheetGroups = useMemo(() => {
    const term = sheetQuery.trim().toLowerCase();
    return toGroups(term ? items.filter((i) => matches(i, term)) : items);
  }, [items, sheetQuery]);

  const handleSelect = (id: string) => {
    setIsSheetOpen(false);
    setSheetQuery("");
    onSelect(id);
    // Bring the panel back into view: picking "Devices" from the bottom of a
    // long page used to leave you exactly where you were, staring at the
    // previous panel's footer. rAF lets the new panel commit first.
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      shellRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  return (
    <div ref={shellRef} className="scroll-mt-24">
      {/* Mobile: current section + trigger for the sheet */}
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isSheetOpen}
        className="mb-4 flex w-full items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:border-ink-3 lg:hidden"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <ActiveIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            {active?.group ?? "Settings"}
          </span>
          <span className="block truncate text-[13px] font-medium text-ink">
            {active?.label ?? "Choose a section"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          hideClose
          overlayClassName="bg-foreground/40 backdrop-blur-[2px]"
          className="flex h-[85vh] flex-col gap-0 rounded-t-2xl border-line bg-card p-0"
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-[15px] font-semibold text-ink">
                Settings
              </SheetTitle>
              <SheetDescription className="text-[12px] text-muted-foreground">
                {items.length} sections
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={() => setIsSheetOpen(false)}
              aria-label="Close settings menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {showFilter && (
            <div className="border-b border-line px-3 py-2.5">
              <ControlInput
                compact
                value={sheetQuery}
                onChange={(e) => setSheetQuery(e.target.value)}
                placeholder="Search settings…"
                prefix={<Search className="h-3.5 w-3.5" />}
                aria-label="Search settings sections"
              />
            </div>
          )}

          {/* Its own scroll container, so the list can never run off-screen. */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <NavList
              groups={sheetGroups}
              activeId={activeId}
              onPick={handleSelect}
              showDescriptions
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav className="hidden shrink-0 lg:block lg:w-64">
          <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm">
            {showFilter && (
              <div className="border-b border-line p-2">
                <ControlInput
                  compact
                  value={desktopQuery}
                  onChange={(e) => setDesktopQuery(e.target.value)}
                  placeholder="Search settings…"
                  prefix={<Search className="h-3.5 w-3.5" />}
                  aria-label="Search settings sections"
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-2">
              <NavList
                groups={desktopGroups}
                activeId={activeId}
                onPick={handleSelect}
              />
            </div>
          </div>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────

function NavList({
  groups,
  activeId,
  onPick,
  showDescriptions = false,
}: {
  groups: NavGroup[];
  activeId: string;
  onPick: (id: string) => void;
  /** The sheet has room for the one-line summary; the sticky column doesn't. */
  showDescriptions?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
        No settings match that search.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {groups.map((group, index) => (
        <React.Fragment key={group.group ?? `ungrouped-${index}`}>
          {group.group && (
            <p
              className={cn(
                "px-2.5 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3",
                index === 0 ? "pt-1" : "pt-3",
              )}
            >
              {group.group}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id)}
                aria-current={isActive ? "page" : undefined}
                title={showDescriptions ? undefined : item.description}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors",
                  showDescriptions ? "py-2.5" : "py-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-ink-2 hover:bg-canvas hover:text-ink",
                )}
              >
                {showDescriptions ? (
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "border border-line bg-canvas text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ) : (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-ink-2",
                    )}
                  />
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {item.label}
                  </span>
                  {showDescriptions && item.description && (
                    <span
                      className={cn(
                        "mt-0.5 block text-[12px] leading-snug",
                        isActive ? "text-primary/70" : "text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </span>
                  )}
                </span>

                {showDescriptions && isActive && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
