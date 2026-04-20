"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getOpenLposForReceiving } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { Lpo } from "@/types/lpo/type";
import { LPO_STATUS_LABELS } from "@/types/lpo/type";

export interface LpoWithSupplierName extends Lpo {
  supplierName: string | null;
}

interface Props {
  onPick: (lpo: LpoWithSupplierName) => void;
  triggerLabel?: string;
}

export function LpoPickerDialog({ onPick, triggerLabel = "Pick from LPO" }: Props) {
  const [open, setOpen] = useState(false);
  const [lpos, setLpos] = useState<Lpo[]>([]);
  const [supplierMap, setSupplierMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [openLpos, suppliers] = await Promise.all([
        getOpenLposForReceiving(),
        fetchAllSuppliers(),
      ]);
      setLpos(openLpos);
      setSupplierMap(
        Object.fromEntries(suppliers.map((s) => [s.id, s.name])),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const enriched = useMemo<LpoWithSupplierName[]>(
    () =>
      lpos.map((l) => ({
        ...l,
        supplierName: supplierMap[l.supplierId] ?? null,
      })),
    [lpos, supplierMap],
  );

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(
      (l) =>
        l.lpoNumber.toLowerCase().includes(q) ||
        (l.supplierName ?? "").toLowerCase().includes(q) ||
        l.items.some((i) => (i.variantName ?? "").toLowerCase().includes(q)),
    );
  }, [enriched, search]);

  const handlePick = (lpo: LpoWithSupplierName) => {
    onPick(lpo);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Purchase Order</DialogTitle>
          <DialogDescription>
            Pick an LPO to pre-fill supplier and line items. Only approved or
            partially-received orders are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by LPO number, supplier, or item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Separator />

        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No open purchase orders found.
            </div>
          ) : (
            filtered.map((lpo) => {
              const outstandingUnits = lpo.items.reduce(
                (sum, i) =>
                  sum +
                  Math.max(
                    0,
                    Number(i.orderedQuantity || 0) - Number(i.receivedQuantity || 0),
                  ),
                0,
              );
              const lineTotal = lpo.items.reduce(
                (sum, i) => sum + Number(i.orderedQuantity || 0) * Number(i.unitCost || 0),
                0,
              );
              return (
                <button
                  key={lpo.id}
                  type="button"
                  onClick={() => handlePick(lpo)}
                  className="w-full text-left rounded-lg border border-gray-200 px-4 py-3 hover:border-orange-200 hover:bg-orange-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {lpo.lpoNumber}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {LPO_STATUS_LABELS[lpo.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-800 truncate">
                        {lpo.supplierName || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lpo.items.length} item{lpo.items.length === 1 ? "" : "s"} ·
                        {" "}
                        {outstandingUnits.toLocaleString()} outstanding
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      <Money amount={lineTotal} currency={lpo.currency || DEFAULT_CURRENCY} />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
