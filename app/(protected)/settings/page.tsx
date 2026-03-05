"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X } from "lucide-react";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NotificationsSettings from "@/components/settings/notifications";
import { settingsNavItems } from "@/types/constants";
import PreferenceSettings from "@/components/settings/preference";
import {
  acceptOrderPaymentMethods,
  fetchLocationSettings,
} from "@/lib/actions/settings-actions";
import Loading from "@/app/loading";
import EFDSettings from "@/components/settings/efd";
import { LocationSettings } from "@/types/settings/type";

export default function SettingsPage() {
  const [locationSettings, setLocationSettings] =
    useState<LocationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const settings = await fetchLocationSettings();
        const orderPaymentMethods = await acceptOrderPaymentMethods();
        setLocationSettings(settings);
      } catch (error) {
        console.error("Failed to load settings:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load settings",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Error Loading Settings
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SettingsLayout locationSettings={locationSettings} />
    </div>
  );
}

const SettingsLayout = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null;
}) => {
  const [activeTab, setActiveTab] = useState("preferences");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const breadcrumbItems = [{ title: "Settings", link: "/settings" }];

  const renderContent = () => {
    switch (activeTab) {
      case "preferences":
        return <PreferenceSettings locationSettings={locationSettings} />;
      case "notifications":
        return <NotificationsSettings />;
      case "Efd":
        return <EFDSettings />;
      default:
        return <EFDSettings />;
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  // Get current tab label for mobile display
  const currentTabLabel =
    settingsNavItems.find((item) => item.id === activeTab)?.label || "Settings";

  return (
    <div className="mt-4 md:mt-12 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="hidden sm:block">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <div className="mt-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Settings
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Customize to match your workflows
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-expanded={isMobileMenuOpen}
          aria-haspopup="true"
        >
          <span className="font-medium text-gray-900">{currentTabLabel}</span>
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-400" />
          ) : (
            <Menu className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute z-50 w-full left-0 right-0 mx-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <nav
              className="py-2"
              role="navigation"
              aria-label="Settings navigation"
            >
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus:outline-none focus:bg-gray-50 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Desktop Sidebar Navigation */}
        <nav
          className="hidden lg:block lg:w-64 space-y-2"
          role="navigation"
          aria-label="Settings navigation"
        >
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0" role="main">
          <div className="w-full">{renderContent()}</div>
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
