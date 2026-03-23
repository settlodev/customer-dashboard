"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X } from "lucide-react";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NotificationsSettings from "@/components/settings/notifications";
import { settingsNavItems } from "@/types/constants";
import FeatureSettings from "@/components/settings/feature-settings";
import PrintingSettings from "@/components/settings/printing-settings";
import OrdersInventorySettings from "@/components/settings/orders-inventory-settings";
import ReservationSettings from "@/components/settings/reservations";
import { fetchLocationSettings } from "@/lib/actions/settings-actions";
import Loading from "@/components/ui/loading";
import LoyaltyPointsSettings from "@/components/settings/loyalty-points-settings";
import EFDSettings from "@/components/settings/efd";
import DigitalMenuSettings from "@/components/settings/digital-menu-settings";
import AcceptedPaymentMethodsPage from "@/components/settings/acceptedPaymentMethods";
import BusinessDetailsSettings from "@/components/settings/business-details";
import IntegrationsSettings from "@/components/settings/integrations";
import DeviceSettings from "@/components/settings/device-settings";
import LocationDetailsSettings from "@/components/settings/location-details";
import { LocationSettings } from "@/types/settings/type";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { getSingleBusiness } from "@/lib/actions/business-actions";
import { getLocationById } from "@/lib/actions/location-actions";
import { UUID } from "node:crypto";

export default function SettingsPage() {
  const [locationSettings, setLocationSettings] =
    useState<LocationSettings | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusinessLoading, setIsBusinessLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const settings = await fetchLocationSettings();
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

    const loadBusiness = async () => {
      try {
        setIsBusinessLoading(true);
        const currentBusiness = await getCurrentBusiness();
        if (currentBusiness?.id) {
          const fullBusiness = await getSingleBusiness(
            currentBusiness.id as UUID,
          );
          setBusiness(fullBusiness);
        }
      } catch (error) {
        console.error("Failed to load business:", error);
      } finally {
        setIsBusinessLoading(false);
      }
    };

    const loadLocation = async () => {
      try {
        setIsLocationLoading(true);
        const fullLocation = await getLocationById();
        setLocation(fullLocation);
      } catch (error) {
        console.error("Failed to load location:", error);
      } finally {
        setIsLocationLoading(false);
      }
    };

    loadSettings();
    loadBusiness();
    loadLocation();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
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
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 min-h-screen">
      <SettingsLayout
        locationSettings={locationSettings}
        business={business}
        isBusinessLoading={isBusinessLoading}
        location={location}
        isLocationLoading={isLocationLoading}
      />
    </div>
  );
}

function useSettingsParams() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "business";
  const subtab = searchParams.get("subtab") || undefined;
  return { tab, subtab };
}

const SettingsLayout = ({
  locationSettings,
  business,
  isBusinessLoading,
  location,
  isLocationLoading,
}: {
  locationSettings: LocationSettings | null;
  business: Business | null;
  isBusinessLoading: boolean;
  location: Location | null;
  isLocationLoading: boolean;
}) => {
  const { tab: initialTab, subtab } = useSettingsParams();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const breadcrumbItems = [{ title: "Settings", link: "/settings" }];

  const renderContent = () => {
    switch (activeTab) {
      case "business":
        return (
          <BusinessDetailsSettings
            business={business}
            isLoading={isBusinessLoading}
          />
        );
      case "location":
        return (
          <LocationDetailsSettings
            location={location}
            isLoading={isLocationLoading}
            locationSettings={locationSettings}
          />
        );
      case "features":
        return <FeatureSettings locationSettings={locationSettings} />;
      case "printing":
        return <PrintingSettings locationSettings={locationSettings} />;
      case "orders-inventory":
        return (
          <OrdersInventorySettings locationSettings={locationSettings} />
        );
      case "notifications":
        return <NotificationsSettings />;
      case "reservations":
        return <ReservationSettings defaultTab={subtab} />;
      case "digital-menu":
        return <DigitalMenuSettings />;
      case "payments":
        return <AcceptedPaymentMethodsPage />;
      case "loyalty-points":
        return (
          <LoyaltyPointsSettings locationSettings={locationSettings} />
        );
      case "efd":
        return <EFDSettings />;
      case "devices":
        return <DeviceSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      default:
        return (
          <BusinessDetailsSettings
            business={business}
            isLoading={isBusinessLoading}
          />
        );
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const currentTabLabel =
    settingsNavItems.find((item) => item.id === activeTab)?.label || "Settings";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          <span className="text-primary">Settings</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your workspace preferences and configurations
        </p>
      </div>

      {/* Mobile Tab Selector */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-expanded={isMobileMenuOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-3">
            {(() => {
              const item = settingsNavItems.find((i) => i.id === activeTab);
              if (item) {
                const Icon = item.icon;
                return <Icon className="h-5 w-5 text-primary" />;
              }
              return null;
            })()}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {currentTabLabel}
            </span>
          </div>
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-400" />
          ) : (
            <Menu className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute z-50 left-4 right-4 mt-2 bg-white dark:bg-gray-900 border rounded-xl shadow-lg overflow-hidden">
            <nav
              className="py-1"
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
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-primary-light dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`}
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

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar Navigation */}
        <nav
          className="hidden lg:block lg:w-64 flex-shrink-0"
          role="navigation"
          aria-label="Settings navigation"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 space-y-1 sticky top-24 overflow-hidden shadow-sm">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-primary-light dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      isActive
                        ? "bg-primary/15"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
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

        {/* Content Area */}
        <main className="flex-1 min-w-0" role="main">
          {renderContent()}
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
