"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X, AlertTriangle } from "lucide-react";

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { settingsNavItems } from "@/types/constants";
import Loading from "@/components/ui/loading";
import SessionExpired, { isSessionExpiredError } from "@/components/auth/session-expired";

import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { getCurrentBusiness, getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getSingleBusiness } from "@/lib/actions/business-actions";
import { getLocationById } from "@/lib/actions/location-actions";

import type { LocationSettings } from "@/types/location-settings/type";
import type { Business } from "@/types/business/type";
import type { Location } from "@/types/location/type";
import type { UUID } from "node:crypto";

// Non-rebuilt (kept as-is)
import BusinessDetailsSettings from "@/components/settings/business-details";
import BusinessSettingsPanel from "@/components/settings/business-settings-panel";
import EFDSettings from "@/components/settings/efd";
import DigitalMenuSettings from "@/components/settings/digital-menu-settings";
import AcceptedPaymentMethodsPage from "@/components/settings/acceptedPaymentMethods";
import IntegrationsSettings from "@/components/settings/integrations";
import DeviceSettings from "@/components/settings/device-settings";
import ReservationSettings from "@/components/settings/reservations";

// New — rebuilt panels
import { LocationProfilePanel } from "@/components/settings/panels/location-profile-panel";
import { OrdersPosPanel } from "@/components/settings/panels/orders-pos-panel";
import { OrderChannelsPanel } from "@/components/settings/panels/order-channels-panel";
import { PaymentOpsPanel } from "@/components/settings/panels/payment-ops-panel";
import { DocketsPanel } from "@/components/settings/panels/dockets-panel";
import { ReceiptsInvoicingPanel } from "@/components/settings/panels/receipts-panel";
import { NotificationsPanel } from "@/components/settings/panels/notifications-panel";
import { LoyaltyRewardsPanel } from "@/components/settings/panels/loyalty-panel";
import { StockInventoryPanel } from "@/components/settings/panels/stock-inventory-panel";
import { DaySessionsPanel } from "@/components/settings/panels/day-sessions-panel";
import { ClosureDatesPanel } from "@/components/settings/panels/closure-dates-panel";
import { AccountingMappingsPanel } from "@/components/settings/panels/accounting-mappings-panel";
import { ExchangeRatesPanel } from "@/components/settings/panels/exchange-rates-panel";
import { DangerZonePanel } from "@/components/settings/panels/danger-zone-panel";
import { BrandSocialPanel } from "@/components/settings/panels/brand-social-panel";
import { CustomerPanel } from "@/components/settings/panels/customer-panel";
import { StaffHrPanel } from "@/components/settings/panels/staff-hr-panel";
import { DigitalMenuConfigPanel } from "@/components/settings/panels/digital-menu-config-panel";

type TabId =
  | "business"
  | "business-settings"
  | "location"
  | "brand-social"
  | "orders-pos"
  | "order-channels"
  | "payment-ops"
  | "dockets"
  | "receipts"
  | "notifications"
  | "customer"
  | "loyalty-points"
  | "staff-hr"
  | "stock-inventory"
  | "day-sessions"
  | "digital-menu-config"
  | "closure-dates"
  | "accounting"
  | "exchange-rates"
  | "danger-zone"
  | "efd"
  | "reservations"
  | "digital-menu"
  | "payments"
  | "devices"
  | "integrations";

export default function SettingsPage() {
  const [settings, setSettings] = useState<LocationSettings | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusinessLoading, setIsBusinessLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionDead, setIsSessionDead] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getLocationSettings();
      setSettings(res);
    } catch (err) {
      if (isSessionExpiredError(err)) setIsSessionDead(true);
      else setError("Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    (async () => {
      try {
        setIsBusinessLoading(true);
        const current = await getCurrentBusiness();
        if (current?.id) {
          const full = await getSingleBusiness(current.id as UUID);
          setBusiness(full);
        }
      } catch (err) {
        if (isSessionExpiredError(err)) setIsSessionDead(true);
      } finally {
        setIsBusinessLoading(false);
      }
    })();
    (async () => {
      try {
        setIsLocationLoading(true);
        const full = await getLocationById();
        setLocation(full);
      } catch (err) {
        if (isSessionExpiredError(err)) setIsSessionDead(true);
      } finally {
        setIsLocationLoading(false);
      }
    })();
  }, [loadSettings]);

  if (isSessionDead) return <SessionExpired />;

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
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">Error Loading Settings</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
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
        settings={settings}
        setSettings={setSettings}
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
  const tab = (searchParams.get("tab") as TabId) || "business";
  const subtab = searchParams.get("subtab") || undefined;
  return { tab, subtab };
}

function SettingsLayout({
  settings,
  setSettings,
  business,
  isBusinessLoading,
  location,
  isLocationLoading,
}: {
  settings: LocationSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<LocationSettings | null>>;
  business: Business | null;
  isBusinessLoading: boolean;
  location: Location | null;
  isLocationLoading: boolean;
}) {
  const { tab: initialTab, subtab } = useSettingsParams();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const breadcrumbItems = [{ title: "Settings", link: "/settings" }];
  const onSettingsSaved = (next: LocationSettings) => setSettings(next);

  const content = () => {
    switch (activeTab) {
      case "business":
        return <BusinessDetailsSettings business={business} isLoading={isBusinessLoading} />;
      case "business-settings":
        return <BusinessSettingsPanel business={business} />;
      case "location":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <LocationProfilePanel settings={settings} onSaved={onSettingsSaved} />;
      case "brand-social":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <BrandSocialPanel settings={settings} onSaved={onSettingsSaved} />;
      case "orders-pos":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <OrdersPosPanel settings={settings} onSaved={onSettingsSaved} />;
      case "order-channels":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <OrderChannelsPanel settings={settings} onSaved={onSettingsSaved} />;
      case "payment-ops":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <PaymentOpsPanel settings={settings} onSaved={onSettingsSaved} />;
      case "dockets":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <DocketsPanel settings={settings} onSaved={onSettingsSaved} />;
      case "receipts":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <ReceiptsInvoicingPanel settings={settings} onSaved={onSettingsSaved} />;
      case "notifications":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <NotificationsPanel settings={settings} onSaved={onSettingsSaved} />;
      case "customer":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <CustomerPanel settings={settings} onSaved={onSettingsSaved} />;
      case "loyalty-points":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <LoyaltyRewardsPanel settings={settings} onSaved={onSettingsSaved} />;
      case "staff-hr":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <StaffHrPanel settings={settings} onSaved={onSettingsSaved} />;
      case "stock-inventory":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <StockInventoryPanel settings={settings} onSaved={onSettingsSaved} />;
      case "day-sessions":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <DaySessionsPanel settings={settings} onSaved={onSettingsSaved} />;
      case "digital-menu-config":
        if (!settings) return <EmptyState label="Location settings unavailable" />;
        return <DigitalMenuConfigPanel settings={settings} onSaved={onSettingsSaved} />;
      case "closure-dates":
        return <ClosureDatesPanel />;
      case "accounting":
        if (!location?.id) return <EmptyState label="No active location" />;
        return <AccountingMappingsPanel locationId={location.id} />;
      case "exchange-rates":
        return <ExchangeRatesPanel />;
      case "danger-zone":
        return <DangerZonePanel onReset={onSettingsSaved} />;
      case "efd":
        return <EFDSettings />;
      case "reservations":
        return <ReservationSettings defaultTab={subtab} />;
      case "digital-menu":
        return <DigitalMenuSettings />;
      case "payments":
        return <AcceptedPaymentMethodsPage />;
      case "devices":
        return <DeviceSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      default:
        return <BusinessDetailsSettings business={business} isLoading={isBusinessLoading} />;
    }
  };

  const currentLabel =
    settingsNavItems.find((item) => item.id === activeTab)?.label || "Settings";

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span className="text-primary">Settings</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {location?.name ? `Configuring ${location.name}` : "Configuring this location"}
          {isLocationLoading ? "…" : ""}
        </p>
      </div>

      {/* Mobile selector */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl shadow-sm"
        >
          <span className="font-medium">{currentLabel}</span>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {isMobileMenuOpen && (
          <div className="absolute z-50 left-4 right-4 mt-2 bg-white border rounded-xl shadow-lg">
            <nav className="py-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as TabId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
                    <div>
                      <span className="font-medium text-sm">{item.label}</span>
                      <p className={`text-xs mt-0.5 ${isActive ? "text-primary/70" : "text-gray-400"}`}>{item.description}</p>
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
          <div className="bg-white dark:bg-gray-900 border rounded-xl p-2 space-y-1 sticky top-24 shadow-sm">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? "bg-primary/15" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-gray-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-sm font-medium block ${isActive ? "text-primary" : ""}`}>
                      {item.label}
                    </span>
                    <span className={`text-xs block truncate ${isActive ? "text-primary/60" : "text-gray-400"}`}>
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 min-w-0">{content()}</main>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
        {label}
      </CardContent>
    </Card>
  );
}
