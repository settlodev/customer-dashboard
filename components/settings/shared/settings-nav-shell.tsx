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
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card border rounded-xl shadow-sm"
        >
          <span className="font-medium">{currentLabel}</span>
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        {isMobileMenuOpen && (
          <div className="absolute z-50 left-4 right-4 mt-2 bg-white border rounded-xl shadow-lg">
            <nav className="py-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => select(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`}
                    />
                    <div>
                      <span className="font-medium text-sm">{item.label}</span>
                      <p
                        className={`text-xs mt-0.5 ${isActive ? "text-primary/70" : "text-gray-400"}`}
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
          <div className="bg-card border rounded-xl p-2 space-y-1 sticky top-24 shadow-sm">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? "bg-primary/15" : "bg-gray-100 dark:bg-gray-800"}`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-primary" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-sm font-medium block ${isActive ? "text-primary" : ""}`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs block truncate ${isActive ? "text-primary/60" : "text-gray-400"}`}
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
