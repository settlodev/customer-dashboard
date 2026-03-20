"use client";
import React, { useState } from "react";
import { CreditCard, BookOpen } from "lucide-react";
import PaymentIntegrations from "./payment-integrations";
import AccountingIntegrations from "./accounting-integrations";

type IntegrationTab = "payments" | "accounting";

const tabs: { id: IntegrationTab; label: string; icon: React.ElementType }[] = [
  { id: "payments", label: "Payment Providers", icon: CreditCard },
  { id: "accounting", label: "Accounting", icon: BookOpen },
];

export default function IntegrationsSettings() {
  const [activeTab, setActiveTab] = useState<IntegrationTab>("payments");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Integrations
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect third-party services to your business
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "payments" && <PaymentIntegrations />}
      {activeTab === "accounting" && <AccountingIntegrations />}
    </div>
  );
}
