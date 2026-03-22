// components/forms/stock-intake-lpo-form.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, FileText, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { StockPurchase } from "@/types/stock-purchases/type";
import { LPOSelectionList } from "@/components/widgets/lpo-list";
import StockIntakeForm from "@/components/forms/stock_intake_form";

export interface LpoPrefill {
  supplier: string;
  deliveryDate: string;
  stockIntakePurchaseOrderId?: string;
  stockIntakes: {
    stockVariant: string;
    quantity: number;
    value: number;
    orderDate: string;
  }[];
}

function lpoToPrefill(lpo: StockPurchase): LpoPrefill {
  console.log(
    "LPO items:",
    JSON.stringify(lpo.stockIntakePurchaseOrderItems, null, 2),
  );

  return {
    supplier: lpo.supplier,
    deliveryDate: lpo.deliveryDate,
    stockIntakePurchaseOrderId: lpo.id,
    stockIntakes: lpo.stockIntakePurchaseOrderItems.map((item) => ({
      stockVariant: item.stockVariant,
      quantity: item.quantity,
      value: item.quantity * (item.unitCost ?? 0),
      orderDate: lpo.dateCreated ?? lpo.deliveryDate,
    })),
  };
}

function SelectedLpoBanner({
  lpo,
  onBack,
}: {
  lpo: StockPurchase;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="self-start sm:self-auto text-blue-700 hover:text-blue-900 hover:bg-blue-100 -ml-1 shrink-0"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change LPO
      </Button>

      <div className="hidden sm:block w-px h-8 bg-blue-200" />

      {/* LPO summary */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm min-w-0">
        <span className="flex items-center gap-1.5 font-semibold text-blue-800">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          {lpo.orderNumber}
        </span>
        <Badge variant="secondary" className="text-xs">
          {lpo.status}
        </Badge>
        <span className="flex items-center gap-1.5 text-blue-700">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          {lpo.supplierName}
        </span>
        <span className="flex items-center gap-1.5 text-blue-600 text-xs">
          <Calendar className="h-3 w-3 shrink-0" />
          Delivery: {format(new Date(lpo.deliveryDate), "MMM dd, yyyy")}
        </span>
      </div>
    </div>
  );
}

export default function StockIntakeLpoForm({
  lpos,
}: {
  lpos: StockPurchase[];
}) {
  const [selectedLpo, setSelectedLpo] = useState<StockPurchase | null>(null);

  if (!selectedLpo) {
    return (
      <LPOSelectionList lpos={lpos} onSelect={(lpo) => setSelectedLpo(lpo)} />
    );
  }

  // ── Step 2: StockIntakeForm pre-filled from the selected LPO ───────────────
  const prefill = lpoToPrefill(selectedLpo);

  return (
    <div className="space-y-5">
      {/* Banner showing which LPO was selected + back button */}
      <SelectedLpoBanner
        lpo={selectedLpo}
        onBack={() => setSelectedLpo(null)}
      />

      <StockIntakeForm item={null} prefill={prefill} />
    </div>
  );
}
