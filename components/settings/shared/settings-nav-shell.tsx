"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

/**
 * Two-column settings chrome: a sticky section list on the left (a dropdown on
 * mobile) and the active panel on the right. Shared so the location-scoped and
 * store-scoped settings pages are the same page with a different section list.
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentLabel =
    items.find((item) => item.id === activeId)?.label || "Settings";

  const select = (id: string) => {
    onSelect(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile selector */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-expanded={isMobileMenuOpen}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-ink shadow-sm transition-colors hover:border-ink-3"
        >
          <span className="text-[13px] font-medium">{currentLabel}</span>
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        {isMobileMenuOpen && (
          <div className="absolute left-4 right-4 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-card shadow-lg">
            <nav className="py-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => select(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-ink-2 hover:bg-canvas"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-muted-2"}`}
                    />
                    <div className="min-w-0">
                      <span className="block text-[13px] font-medium">
                        {item.label}
                      </span>
                      <p
                        className={`mt-0.5 text-[12px] ${isActive ? "text-primary/70" : "text-muted-foreground"}`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <nav className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-1 overflow-y-auto rounded-xl border border-line bg-card p-2 shadow-sm">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-ink-2 hover:bg-canvas"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      isActive ? "bg-primary/15" : "border border-line bg-canvas"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block text-[13px] font-medium ${isActive ? "text-primary" : "text-ink"}`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`block truncate text-[11.5px] ${isActive ? "text-primary/60" : "text-muted-foreground"}`}
                    >
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
