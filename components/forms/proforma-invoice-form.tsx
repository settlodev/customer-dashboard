"use client";

import { useState, useCallback, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Search,
  Package,
  Plus,
  Check,
  ChevronRight,
  User,
  ShoppingCart,
  Tag,
  Loader2,
  Trash2,
  CalendarDays,
  FileText,
  PercentIcon,
} from "lucide-react";
import { toast } from "sonner";
import { searchCustomer } from "@/lib/actions/customer-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import {
  createProforma,
  addItemsToProforma,
  removeItemsToProforma,
  updateProforma,
  updateProformaStatusAsCompleted,
} from "@/lib/actions/proforma-actions";
import { searchDiscount } from "@/lib/actions/discount-actions";
import { Proforma } from "@/types/proforma/type";
import { Customer } from "@/types/customer/type";
import { FormResponse } from "@/types/types";
import { Discount } from "@/types/discount/type";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  name?: string;
  price?: number;
  sellingPrice?: number;
}

interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
  quantity: number | null;
}

interface LineItem {
  itemId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
}

interface BusinessInfo {
  businessName: string | null;
  locationName: string | null;
  locationAddress: string | null;
  locationPhoneNumber: string | null;
  locationLogo: string | null;
  tinNumber?: string | null;
}

interface ProformaState {
  id: string | null;
  proformaNumber: string | null;
  proformaStatus: string | null;
  customer: Pick<
    Customer,
    "id" | "firstName" | "lastName" | "email" | "phoneNumber"
  > | null;
  items: LineItem[];
  discount: number;
  discountId: string | null;
  note: string;
  expiresAt: string;
  business: BusinessInfo | null;
}

interface ProformaInvoiceFormProps {
  item?: Proforma | null;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Customer", icon: User },
  { num: 2, label: "Items", icon: ShoppingCart },
  { num: 3, label: "Details", icon: Tag },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        const Icon = s.icon;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  active
                    ? "text-blue-600"
                    : done
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 mb-4 transition-all duration-500 ${
                  current > s.num ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Customer Search ──────────────────────────────────────────────────────────

function CustomerSearch({ onSelect }: { onSelect: (c: Customer) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchCustomer(q, 1, 10);
      setResults(res.content ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search customer by name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 h-11"
        />
      </div>
      {open && (query || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-auto">
          {loading && (
            <div className="p-4 text-sm text-gray-500 text-center">
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="p-4 text-sm text-gray-500 text-center">
              No customers found
            </div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0 transition-colors"
              onClick={() => {
                onSelect(c);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                {c.firstName?.[0]}
                {c.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {c.firstName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {c.phoneNumber}
                  {c.email ? ` · ${c.email}` : ""}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Variant Search ───────────────────────────────────────────────────

function ProductVariantSearch({
  onAdd,
}: {
  onAdd: (
    item: Omit<LineItem, "quantity" | "itemId">,
    quantity: number,
  ) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Omit<
    LineItem,
    "quantity" | "itemId"
  > | null>(null);
  const [qty, setQty] = useState(1);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await searchProducts(q, 1, 10);
      setResults(res.content ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectVariant = (p: Product, v: ProductVariant) => {
    setPending({
      variantId: v.id,
      productName: p.name,
      variantName: v.name ?? "",
      unitPrice: v.sellingPrice ?? v.price ?? 0,
    });
    setQty(1);
    setOpen(false);
    setQuery("");
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setAdding(true);
    await onAdd(pending, qty);
    setAdding(false);
    setPending(null);
    setQty(1);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div ref={containerRef} className="space-y-3">
      {!pending ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search product or variant…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
                if (!query) search("");
              }}
              className="pl-9 h-11"
            />
          </div>
          {open && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-auto">
              {loading && (
                <div className="p-3 text-xs text-gray-500 text-center">
                  Searching…
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="p-3 text-xs text-gray-500 text-center">
                  No products found
                </div>
              )}
              {results.map((p) =>
                p.variants && p.variants.length > 0 ? (
                  p.variants.map((v) => {
                    const price = v.sellingPrice ?? v.price ?? 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-green-50 text-left border-b border-gray-50 last:border-0 transition-colors"
                        onClick={() => selectVariant(p, v)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="w-4 h-4 text-green-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {p.name}
                            </p>
                            {v.name && (
                              <p className="text-xs text-gray-400">{v.name}</p>
                            )}
                          </div>
                        </div>
                        {price > 0 && (
                          <span className="text-sm font-semibold text-gray-700 shrink-0">
                            {fmt(price)}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-green-50 text-left transition-colors"
                    onClick={() => selectVariant(p, { id: p.id })}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-900">{p.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">No variants</span>
                  </button>
                ),
              )}
            </div>
          )}
        </>
      ) : (
        <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {pending.productName}
                {pending.variantName && (
                  <span className="text-gray-500 font-normal">
                    {" "}
                    — {pending.variantName}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Unit price:{" "}
                <span className="font-semibold">{fmt(pending.unitPrice)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center border bg-white rounded-lg overflow-hidden shadow-sm">
              <button
                type="button"
                className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg font-medium"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-14 text-center text-sm font-bold border-x py-2 focus:outline-none"
              />
              <button
                type="button"
                className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg font-medium"
                onClick={() => setQty(qty + 1)}
              >
                +
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-bold text-gray-900">
                {fmt(pending.unitPrice * qty)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
            disabled={adding}
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Add to Proforma
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Discount Search Dropdown ─────────────────────────────────────────────────

function DiscountSearch({ onSelect }: { onSelect: (d: Discount) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Discount[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await searchDiscount(q, 1, 20);
      setResults(res.content ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search available discounts…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (!query) search("");
          }}
          className="pl-9 h-10"
        />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-auto">
          {loading && (
            <div className="p-3 text-xs text-gray-500 text-center">
              Loading…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-3 text-xs text-gray-500 text-center">
              No discounts found
            </div>
          )}
          {results.map((d) => {
            const valueLabel =
              d.discountType === "PERCENTAGE"
                ? `${d.discountValue}%`
                : new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: "TZS",
                    minimumFractionDigits: 0,
                  }).format(d.discountValue);
            return (
              <button
                key={d.id}
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0 transition-colors"
                onClick={() => {
                  onSelect(d);
                  setQuery(d.name);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <PercentIcon className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-sm text-gray-900">{d.name}</span>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0">
                  {valueLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Details Step ─────────────────────────────────────────────────────────────

function DetailsStep({
  grossTotal,
  pending,
  finalisePending,
  initialNote,
  initialExpiresAt,
  initialDiscount,
  onSave,
  onBack,
  onFinish,
}: {
  grossTotal: number;
  pending: boolean;
  finalisePending: boolean;
  initialNote: string;
  initialExpiresAt: string;
  initialDiscount: number;
  onSave: (opts: {
    note: string;
    expiresAt: string;
    discountId: string | null;
    manualDiscountAmount: number;
  }) => Promise<void>;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [applyDiscount, setApplyDiscount] = useState<boolean | null>(
    initialDiscount > 0 ? true : null,
  );
  const [discountSource, setDiscountSource] = useState<"api" | "manual">(
    initialDiscount > 0 ? "manual" : "api",
  );
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null,
  );
  const [manualAmount, setManualAmount] = useState(
    initialDiscount > 0 ? String(initialDiscount) : "",
  );
  const [saved, setSaved] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(n);

  const effectiveDiscountAmount = (() => {
    if (!applyDiscount || (!selectedDiscount && !manualAmount)) return 0;
    if (discountSource === "api" && selectedDiscount) {
      return selectedDiscount.discountType === "PERCENTAGE"
        ? Math.round((grossTotal * selectedDiscount.discountValue) / 100)
        : selectedDiscount.discountValue;
    }
    return parseFloat(manualAmount) || 0;
  })();

  const netTotal = Math.max(0, grossTotal - effectiveDiscountAmount);

  const hasValidDiscount =
    discountSource === "api"
      ? !!selectedDiscount
      : (parseFloat(manualAmount) || 0) > 0;

  const canSave = !applyDiscount || (applyDiscount && hasValidDiscount);

  const handleSave = async () => {
    await onSave({
      note,
      expiresAt,
      discountId:
        discountSource === "api" ? (selectedDiscount?.id ?? null) : null,
      manualDiscountAmount:
        discountSource === "manual" ? parseFloat(manualAmount) || 0 : 0,
    });
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Final Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Add notes, expiry date and optional discount
        </p>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <FileText className="w-4 h-4 text-gray-400" /> Note{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Textarea
          placeholder="Payment should be wired through our bank account…"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          className="resize-none text-sm"
          rows={3}
        />
      </div>

      {/* Expires At */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <CalendarDays className="w-4 h-4 text-gray-400" /> Expires At{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Input
          type="date"
          value={expiresAt}
          onChange={(e) => {
            setExpiresAt(e.target.value);
            setSaved(false);
          }}
          className="h-10"
        />
      </div>

      <Separator />

      {/* Apply Discount */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Apply a discount?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Yes, apply discount",
              sub: "From list or manual entry",
              value: true,
            },
            {
              label: "No discount",
              sub: "Proceed at full price",
              value: false,
            },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                setApplyDiscount(opt.value);
                setSaved(false);
              }}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                applyDiscount === opt.value
                  ? opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-400 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p
                className={`text-sm font-semibold ${applyDiscount === opt.value ? (opt.value ? "text-blue-700" : "text-gray-800") : "text-gray-600"}`}
              >
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Discount selector */}
      {applyDiscount === true && (
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            {(["api", "manual"] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  setDiscountSource(src);
                  setSelectedDiscount(null);
                  setManualAmount("");
                  setSaved(false);
                }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  discountSource === src
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {src === "api"
                  ? "From available discounts"
                  : "Manual amount (TZS)"}
              </button>
            ))}
          </div>

          {discountSource === "api" ? (
            <>
              <DiscountSearch
                onSelect={(d) => {
                  setSelectedDiscount(d);
                  setSaved(false);
                }}
              />
              {selectedDiscount && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PercentIcon className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        {selectedDiscount.name}
                      </p>
                      <p className="text-xs text-blue-500">
                        {selectedDiscount.discountType === "PERCENTAGE"
                          ? `${selectedDiscount.discountValue}% off`
                          : fmt(selectedDiscount.discountValue) + " off"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDiscount(null);
                      setSaved(false);
                    }}
                    className="text-blue-300 hover:text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                TZS
              </span>
              <Input
                type="number"
                placeholder="Enter discount amount"
                value={manualAmount}
                onChange={(e) => {
                  setManualAmount(e.target.value);
                  setSaved(false);
                }}
                className="pl-12 h-10"
              />
            </div>
          )}

          {effectiveDiscountAmount > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Gross Total</span>
                <span>{fmt(grossTotal)}</span>
              </div>
              <div className="flex justify-between text-red-500 font-medium">
                <span>Discount</span>
                <span>− {fmt(effectiveDiscountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Net Total</span>
                <span>{fmt(netTotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save + status */}
      {!saved ? (
        <Button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          disabled={pending || !canSave}
          onClick={handleSave}
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Save Details"
          )}
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Check className="w-4 h-4" /> Details saved successfully
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-1">
        <Button variant="outline" type="button" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={!saved || finalisePending}
          onClick={onFinish}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {finalisePending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalising…
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" /> Finalise Proforma
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function ProformaPreview({ state }: { state: ProformaState }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 2,
    }).format(n);

  const grossTotal = state.items.reduce(
    (s, it) => s + it.unitPrice * it.quantity,
    0,
  );
  const discountedTotal = Math.max(0, grossTotal - (state.discount ?? 0));

  const fmtDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-[12.5px] sticky top-4">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-start gap-3">
          {state.business?.locationLogo && (
            <img
              src={state.business.locationLogo}
              alt="Business logo"
              className="w-10 h-10 rounded-lg object-contain border border-gray-100 shrink-0"
            />
          )}
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {state.business?.businessName ?? "—"}
            </p>
            {state.business?.locationName && (
              <p className="text-gray-500 text-[11px] font-medium">
                {state.business.locationName}
              </p>
            )}
            {state.business?.locationAddress && (
              <p className="text-gray-400 text-[11px]">
                {state.business.locationAddress}
              </p>
            )}
            {state.business?.locationPhoneNumber && (
              <p className="text-gray-400 text-[11px]">
                {state.business.locationPhoneNumber}
              </p>
            )}
            {state.business?.tinNumber && (
              <p className="text-gray-300 text-[11px] mt-0.5">
                TIN: {state.business.tinNumber}
              </p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            Proforma Invoice
          </span>
          {state.proformaNumber ? (
            <p className="text-gray-400 text-[11px] mt-1.5">
              #{state.proformaNumber}
            </p>
          ) : (
            <div className="mt-1.5 h-3 w-28 bg-gray-100 rounded animate-pulse ml-auto" />
          )}
          {state.expiresAt && (
            <p className="text-gray-400 text-[11px] mt-1">
              Expires: {fmtDate(state.expiresAt)}
            </p>
          )}
          {state.proformaStatus && (
            <p className="text-gray-400 text-[11px] mt-1">
              Status: {state.proformaStatus}
            </p>
          )}
        </div>
      </div>

      <Separator className="mb-4" />

      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold mb-1.5">
          Bill To
        </p>
        {state.customer ? (
          <div className="space-y-0.5">
            <p className="font-bold text-gray-900">
              {state.customer.firstName}
            </p>
            {state.customer.email && (
              <p className="text-gray-500">{state.customer.email}</p>
            )}
            {state.customer.phoneNumber && (
              <p className="text-gray-500">{state.customer.phoneNumber}</p>
            )}
          </div>
        ) : (
          <div className="h-14 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
            <p className="text-gray-300 italic text-xs">
              Customer details will appear here
            </p>
          </div>
        )}
      </div>

      <div className="mb-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Item", "Price", "Qty", "Total"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-2 text-[10px] uppercase tracking-wider text-gray-400 font-semibold ${i === 0 ? "text-left" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <ShoppingCart className="w-6 h-6 text-gray-200" />
                    <p className="text-gray-300 italic text-xs">No items yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              state.items.map((it) => (
                <tr key={it.itemId} className="border-b border-gray-50">
                  <td className="py-2 text-gray-800">
                    {it.productName}
                    {it.variantName && (
                      <span className="text-gray-400"> — {it.variantName}</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-500">
                    {it.quantity.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-gray-500">
                    {fmt(it.unitPrice)}
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    {fmt(it.unitPrice * it.quantity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-5">
        <div className="w-52 space-y-1.5 text-[12.5px]">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{fmt(grossTotal)}</span>
          </div>
          {state.discount > 0 && (
            <div className="flex justify-between text-red-500 font-medium">
              <span>Discount</span>
              <span>− {fmt(state.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
            <span>Total</span>
            <span>{fmt(discountedTotal)}</span>
          </div>
        </div>
      </div>

      {state.note && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Note
          </p>
          <p className="text-gray-600 text-[11px]">{state.note}</p>
        </div>
      )}

      <Separator className="mb-3" />
      <div className="mt-4 flex justify-between text-[10px] text-black">
        <span>Powered by Settlo Technologies Ltd</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function ProformaWizard({ item }: ProformaInvoiceFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [step, setStep] = useState(item ? 3 : 1);
  const [error, setError] = useState<string | null>(null);
  const [detailsPending, setDetailsPending] = useState(false);
  const [finalisePending, setFinalisePending] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const [state, setState] = useState<ProformaState>(() => {
    if (!item) {
      return {
        id: null,
        proformaNumber: null,
        proformaStatus: null,
        customer: null,
        items: [],
        discount: 0,
        discountId: null,
        note: "",
        expiresAt: "",
        business: null,
      };
    }

    return {
      id: item.id,
      proformaNumber: item.proformaNumber,
      proformaStatus: item.proformaStatus,
      customer: {
        id: item.customer,
        name: `${item.customerFirstName} ${item.customerLastName}`,
        firstName: item.customerFirstName,
        lastName: item.customerLastName,
        email: item.customerEmail,
        phoneNumber: item.customerPhoneNumber,
        physicalAddress: null,
        customerAccountNumber: "",
      },
      items: item.items.map((i) => ({
        itemId: i.id,
        variantId: i.id,
        productName: i.productName,
        variantName: i.productVariantName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      discount: item.appliedDiscountAmount ?? 0,
      discountId: null,
      note: item.notes ?? "",
      expiresAt: item.expiresAt ? String(item.expiresAt).split("T")[0] : "",
      business: {
        businessName: item.businessName ?? null,
        locationName: item.locationName ?? null,
        locationAddress: item.locationAddress ?? null,
        locationPhoneNumber: item.locationPhoneNumber ?? null,
        locationLogo: item.locationLogo ?? null,
      },
    };
  });

  // ── Step 1: Customer → createProforma ─────────────────────────────────────
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setError(null);
    startTransition(async () => {
      const result: void | FormResponse<any> = await createProforma({
        customer: customer.id,
      });

      if (result?.responseType === "error") {
        setError(result.message);
        return;
      }

      const proformaId = result?.data?.id;
      const proformaNumber = result?.data?.proformaNumber;

      if (!proformaId) {
        setError("Could not retrieve proforma ID — please try again");
        return;
      }

      const business: BusinessInfo = {
        businessName: result.data.businessName ?? null,
        locationName: result.data.locationName ?? null,
        locationAddress: result.data.locationAddress ?? null,
        locationPhoneNumber: result.data.locationPhoneNumber ?? null,
        locationLogo: result.data.locationLogo ?? null,
        tinNumber: result.data.tinNumber ?? null,
      };

      setState((prev) => ({
        ...prev,
        id: proformaId,
        proformaNumber,
        customer,
        business,
      }));
      setStep(2);
      toast.success(`Proforma created for ${customer.firstName}`);
    });
  }, []);

  // ── Step 2: Add item → addItemsToProforma ─────────────────────────────────
  const handleAddItem = useCallback(
    async (
      newItem: Omit<LineItem, "quantity" | "itemId">,
      quantity: number,
    ) => {
      if (!state.id) return;
      setError(null);

      const result = await addItemsToProforma(state.id, {
        productVariantId: newItem.variantId,
        quantity,
      });

      if (result?.responseType === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      // Prefer the server-returned line item ID; fall back to variantId
      const itemId: string =
        (result?.data as { id?: string })?.id ?? newItem.variantId;
      setState((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem, itemId, quantity }],
      }));
      toast.success("Item added");
    },
    [state.id],
  );

  // ── Step 2: Remove item → removeItemsToProforma ───────────────────────────
  const handleRemoveItem = useCallback(
    async (index: number) => {
      const lineItem = state.items[index];
      if (!state.id || !lineItem) return;
      setError(null);
      setRemovingIndex(index);

      const result = await removeItemsToProforma(state.id, lineItem.itemId);

      setRemovingIndex(null);

      if (result?.responseType === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
      toast.success("Item removed");
    },
    [state.id, state.items],
  );

  // ── Step 3: Save details → updateProforma ────────────────────────────────
  const handleSaveDetails = useCallback(
    async (opts: {
      note: string;
      expiresAt: string;
      discountId: string | null;
      manualDiscountAmount: number;
    }) => {
      if (!state.id) return;
      setError(null);
      setDetailsPending(true);

      const result = await updateProforma(
        state.id,
        opts.note,
        opts.discountId ?? "",
        opts.manualDiscountAmount,
        opts.expiresAt,
      );

      console.log("The result is", result);

      setDetailsPending(false);

      if (result?.responseType === "error") {
        setError(result.message);
        return;
      }

      const data = result?.data as Record<string, unknown> | undefined;
      const apiApplied =
        typeof data?.appliedDiscountAmount === "number"
          ? data.appliedDiscountAmount
          : undefined;
      const appliedDiscount =
        typeof apiApplied === "number" ? apiApplied : opts.manualDiscountAmount;

      setState((prev) => ({
        ...prev,
        note: opts.note,
        expiresAt: opts.expiresAt,
        discountId: opts.discountId,
        discount: appliedDiscount,
      }));

      toast.success("Proforma updated successfully");
    },
    [state.id],
  );

  // ── Finalise ──────────────────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (!state.id) return;
    setError(null);
    setFinalisePending(true);

    const result = await updateProformaStatusAsCompleted(state.id);

    setFinalisePending(false);

    if (result?.responseType === "error") {
      setError(result.message);
      toast.error(result.message);
      return;
    }

    toast.success("Proforma invoice finalised!");
    router.push(`/proforma-invoices/details/${state.id}`);
  }, [state.id, router]);

  const grossTotal = state.items.reduce(
    (s, it) => s + it.unitPrice * it.quantity,
    0,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Card>
        <CardContent className="pt-6">
          <StepIndicator current={step} />

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Select Customer
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Search and select the customer to bill
                </p>
              </div>
              <CustomerSearch onSelect={handleCustomerSelect} />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Add Items
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Search and add products — repeat for each item
                  </p>
                </div>
                {state.customer && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {state.customer.firstName?.[0]}
                      {state.customer.lastName?.[0]}
                    </div>
                    <span className="text-xs font-medium text-blue-800">
                      {state.customer.firstName}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <ProductVariantSearch onAdd={handleAddItem} />
              </div>

              {state.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Added items ({state.items.length})
                  </p>
                  {state.items.map((it, i) => (
                    <div
                      key={it.itemId}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {it.productName}
                            {it.variantName && (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                — {it.variantName}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {it.quantity} ×{" "}
                            {new Intl.NumberFormat("en", {
                              style: "currency",
                              currency: "TZS",
                              minimumFractionDigits: 0,
                            }).format(it.unitPrice)}
                            {" = "}
                            <span className="font-semibold text-gray-700">
                              {new Intl.NumberFormat("en", {
                                style: "currency",
                                currency: "TZS",
                                minimumFractionDigits: 0,
                              }).format(it.unitPrice * it.quantity)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(i)}
                        disabled={removingIndex === i}
                        className="text-gray-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {removingIndex === i ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-sm">
                    <span className="text-gray-500">Gross Total</span>
                    <span className="font-bold text-gray-900">
                      {new Intl.NumberFormat("en", {
                        style: "currency",
                        currency: "TZS",
                        minimumFractionDigits: 0,
                      }).format(grossTotal)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep(item ? 3 : 1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={state.items.length === 0 || removingIndex !== null}
                  onClick={() => setStep(3)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <DetailsStep
              grossTotal={grossTotal}
              pending={detailsPending}
              finalisePending={finalisePending}
              initialNote={state.note}
              initialExpiresAt={state.expiresAt}
              initialDiscount={state.discount}
              onSave={handleSaveDetails}
              onBack={() => setStep(2)}
              onFinish={handleFinish}
            />
          )}
        </CardContent>
      </Card>

      <div className="hidden lg:block">
        <ProformaPreview state={state} />
      </div>
    </div>
  );
}
