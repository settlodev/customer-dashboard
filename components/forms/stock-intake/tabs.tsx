"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  FileSpreadsheet,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { StockPurchase } from "@/types/stock-purchases/type";
import { searchStockPurchases } from "@/lib/actions/stock-purchase-actions";
import StockIntakeForm from "@/components/forms/stock_intake_form";
import StockIntakeCsv from "@/components/forms/stock-intake/stock-intake-csv";
import StockIntakeLpoForm from "@/components/forms/stock-intake/lpo-form";

type TabId = "manual" | "csv" | "lpo";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "manual", label: "Normal Entry", icon: ClipboardList },
  { id: "csv", label: "CSV Upload", icon: FileSpreadsheet },
  { id: "lpo", label: "From LPO", icon: ShoppingCart },
];

function LpoPanel() {
  const [lpos, setLpos] = useState<StockPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    searchStockPurchases("", 1, 100)
      .then((res) => {
        setLpos(res.content.filter((l) => l.status === "ACCEPTED"));
      })
      .catch(() => setFetchError("Failed to load purchase orders."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2.5" />
        <span className="text-sm">Loading local purchase orders…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive font-medium">{fetchError}</p>
      </div>
    );
  }

  return <StockIntakeLpoForm lpos={lpos} />;
}

export default function StockIntakeTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("manual");

  return (
    <div className="space-y-0">
      <div className="inline-flex items-center gap-0.5 rounded-xl bg-orange-50 p-1 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap select-none",
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
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "manual" && <StockIntakeForm item={null} />}
        {activeTab === "csv" && <StockIntakeCsv />}
        {activeTab === "lpo" && <LpoPanel />}
      </div>
    </div>
  );
}
