"use client";

import { useState } from "react";
import { ClipboardList, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

import StockIntakeForm from "@/components/forms/stock_intake_form";
import StockIntakeCsv from "@/components/forms/stock-intake/stock-intake-csv";

type TabId = "manual" | "csv";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "manual", label: "Normal Entry", icon: ClipboardList },
  { id: "csv", label: "CSV Upload", icon: FileSpreadsheet },
];

export default function StockIntakeTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("manual");

  return (
    <div className="space-y-0">
      <div
        className={cn(
          "mb-6",
          "flex w-full rounded-xl bg-orange-50 p-1",
          "sm:inline-flex sm:w-auto",
        )}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg",
                "text-sm font-medium transition-all duration-150 select-none",
                "flex-1 flex-col sm:flex-row sm:flex-none",
                "px-3 py-2 sm:px-4 sm:py-1.5",
                isActive
                  ? "bg-white border border-orange-100 text-orange-500 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-orange-500" : "text-gray-400",
                )}
              />
              <span className="text-xs sm:text-sm leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "manual" && <StockIntakeForm />}
        {activeTab === "csv" && <StockIntakeCsv />}
      </div>
    </div>
  );
}
