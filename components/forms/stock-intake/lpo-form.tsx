// components/forms/stock-intake-lpo-form.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, FileText, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { StockPurchase } from "@/types/stock-purchases/type";
import { LPOSelectionList } from "@/components/widgets/lpo-list";
import { StockIntake } from "@/types/stock-intake/type";
import StockIntakeForm from "@/components/forms/stock_intake_form";

// ─────────────────────────────────────────────────────────────────────────────
// Map an LPO → a StockIntake-shaped object that StockIntakeForm can consume
// as its `item` prop (pre-filling all the fields).
//
// StockIntakeForm's defaultValues when `item` is set:
//   staff, supplier, deliveryDate,
//   stockIntakes[0].{ stockVariant, quantity, value, orderDate, batchExpiryDate, status }
//
// For multi-line LPOs we need to pre-fill stockIntakes[0] with the first item
// and let the user add more — BUT StockIntakeForm only accepts a single
// StockIntake as `item`. So instead we pass `item={null}` and use the
// `defaultValues` override approach via a wrapper that provides a pre-seeded
// form state. The cleanest way without touching StockIntakeForm's internals
// is to pass a fake StockIntake that carries the shared fields, and let each
// line item beyond index 0 be appended by the user.
//
// However — since the LPO can have MULTIPLE line items — we instead render
// StockIntakeForm with `item={null}` and pass a `prefill` prop.
// StockIntakeForm already checks `stockVariantId` from URL params; we add a
// similar `prefill` prop in the updated version below.
//
// If you prefer NOT to touch StockIntakeForm at all, use the single-item
// mapping approach: map only the first LPO item to `item`, and the user
// manually adds others. This file does the full multi-item pre-fill.
// ─────────────────────────────────────────────────────────────────────────────

export interface LpoPrefill {
  supplier: string; // supplier UUID
  deliveryDate: string; // ISO string
  stockIntakes: {
    stockVariant: string; // UUID
    quantity: number;
    value: number; // qty × unitCost
    orderDate: string; // ISO string (LPO order date)
  }[];
}

function lpoToPrefill(lpo: StockPurchase): LpoPrefill {
  return {
    supplier: lpo.supplier,
    deliveryDate: lpo.deliveryDate,
    stockIntakes: lpo.stockIntakePurchaseOrderItems.map((item) => ({
      stockVariant: item.stockVariantId,
      quantity: item.quantity,
      value: item.quantity * (item.unitCost ?? 0),
      orderDate: lpo.dateCreated ?? lpo.deliveryDate,
    })),
  };
}

// ─── Selected LPO banner ──────────────────────────────────────────────────────

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

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StockIntakeLpoForm({
  lpos,
}: {
  lpos: StockPurchase[];
}) {
  const [selectedLpo, setSelectedLpo] = useState<StockPurchase | null>(null);

  // ── Step 1: LPO selection list ─────────────────────────────────────────────
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

      {/*
        Pass the LPO data to StockIntakeForm via the `prefill` prop.
        StockIntakeForm needs a small update to accept `prefill` — see below.
      */}
      <StockIntakeForm item={null} prefill={prefill} />
    </div>
  );
}
