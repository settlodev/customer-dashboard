"use client";

import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, boolean, object, string, preprocess, number, array } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { StockIntake } from "@/types/stock-intake/type";
import {
  createStockIntake,
  updateStockIntake,
} from "@/lib/actions/stock-intake-actions";
import SupplierSelector from "../widgets/supplier-selector";
import DateTimePicker from "../widgets/datetimepicker";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Fingerprint,
  Plus,
  Trash2,
  Package,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  Truck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getStockVariantById } from "@/lib/actions/stock-actions";
import { NumericFormat } from "react-number-format";
import { UniqueIdentifierInput } from "../widgets/serial-number-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Schema ───────────────────────────────────────────────────────────────────

const StockLineItemSchema = object({
  stockVariant: string({ message: "Please select a stock item" }).uuid(),
  quantity: preprocess(
    (val) =>
      typeof val === "string" && val.trim() !== "" ? parseFloat(val) : val,
    number({ message: "Quantity is required" })
      .nonnegative()
      .gt(0, { message: "Quantity cannot be zero" }),
  ),
  value: preprocess(
    (val) =>
      typeof val === "string" && val.trim() !== "" ? parseFloat(val) : val,
    number({ message: "Value is required" })
      .nonnegative()
      .gt(0, { message: "Value cannot be zero" }),
  ),
  orderDate: string({ required_error: "Order date is required" }),
  batchExpiryDate: string().optional(),
  status: boolean().optional(),
});

const FormSchema = object({
  staff: string({ message: "Please select a staff member" }).uuid(),
  supplier: string({ message: "Please select a supplier" }).uuid().optional(),
  deliveryDate: string({ required_error: "Delivery date is required" }),
  stockIntakes: array(StockLineItemSchema).min(1, {
    message: "At least one stock item must be added",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

// ─── Per-line UI state ────────────────────────────────────────────────────────

interface LineState {
  serialNumbers: string[];
  hasUniqueIdentifiers: boolean;
  variantInfo: { stockName: string; variant?: { name: string } } | null;
  batchExpiryDate: Date | undefined;
  collapsed: boolean;
}

const defaultLineState = (): LineState => ({
  serialNumbers: [],
  hasUniqueIdentifiers: false,
  variantInfo: null,
  batchExpiryDate: undefined,
  collapsed: false,
});

const defaultLineItem = () => ({
  stockVariant: "",
  quantity: 0,
  value: 0,
  orderDate: "",
  batchExpiryDate: undefined,
  status: true,
});

// ─── Component ────────────────────────────────────────────────────────────────

function StockIntakeForm({ item }: { item: StockIntake | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  // ✅ FIX: renamed from generateGRN → goodReceiveNote to match the action signature
  const [goodReceiveNote, setGoodReceiveNote] = useState(false);

  const [orderDate, setOrderDate] = useState<Date | undefined>(
    item?.orderDate ? new Date(item.orderDate) : undefined,
  );
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    item?.deliveryDate ? new Date(item.deliveryDate) : undefined,
  );

  const [lineStates, setLineStates] = useState<LineState[]>([
    defaultLineState(),
  ]);

  const [, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockItem");

  // ── Form ────────────────────────────────────────────────────────────────────

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: item
      ? {
          staff: item.staff,
          supplier: item.supplier,
          deliveryDate: item.deliveryDate,
          stockIntakes: [
            {
              stockVariant: item.stockVariant,
              quantity: item.quantity,
              value: item.value,
              orderDate: item.orderDate,
              batchExpiryDate: item.batchExpiryDate,
              status: item.status,
            },
          ],
        }
      : {
          stockIntakes: [
            {
              ...defaultLineItem(),
              ...(stockVariantId ? { stockVariant: stockVariantId } : {}),
            },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockIntakes",
  });

  // ── Preload variant from URL param ─────────────────────────────────────────

  useEffect(() => {
    if (!stockVariantId) return;
    form.setValue("stockIntakes.0.stockVariant", stockVariantId);
    getStockVariantById(stockVariantId)
      .then((info) => updateLineState(0, { variantInfo: info }))
      .catch(console.error);
  }, [stockVariantId, form]);

  // ── Line state helpers ──────────────────────────────────────────────────────

  const updateLineState = (index: number, patch: Partial<LineState>) =>
    setLineStates((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] ?? defaultLineState()), ...patch };
      return next;
    });

  const ls = (index: number): LineState =>
    lineStates[index] ?? defaultLineState();

  // ── Add / Remove lines ──────────────────────────────────────────────────────

  const addLine = () => {
    append(defaultLineItem());
    setLineStates((prev) => [...prev, defaultLineState()]);
  };

  const removeLine = (index: number) => {
    remove(index);
    setLineStates((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Variant change ──────────────────────────────────────────────────────────

  const handleVariantChange = async (index: number, value: string) => {
    form.setValue(`stockIntakes.${index}.stockVariant`, value);
    if (!value) {
      updateLineState(index, { variantInfo: null });
      return;
    }
    try {
      const info = await getStockVariantById(value);
      updateLineState(index, { variantInfo: info });
    } catch {
      updateLineState(index, { variantInfo: null });
    }
  };

  // ── Shared time handler ─────────────────────────────────────────────────────

  const handleSharedTimeChange = (type: "hour" | "minutes", value: string) => {
    const apply = (d: Date | undefined) => {
      if (!d) return d;
      const n = new Date(d);
      type === "hour" ? n.setHours(Number(value)) : n.setMinutes(Number(value));
      return n;
    };
    setOrderDate((d) => apply(d));
    setDeliveryDate((d) => apply(d));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateLines = (): string | null => {
    for (let i = 0; i < lineStates.length; i++) {
      const state = ls(i);
      if (!state.hasUniqueIdentifiers) continue;
      const qty = form.getValues(`stockIntakes.${i}.quantity`);
      const filled = state.serialNumbers.filter((s) => s.trim() !== "");
      if (filled.length !== qty)
        return `Item ${i + 1}: Please enter all ${qty} unique identifiers.`;
      if (new Set(filled).size !== filled.length)
        return `Item ${i + 1}: Duplicate unique identifiers found.`;
    }
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation error",
      description: "Please check all fields and try again.",
    });
  }, [toast]);

  const submitData = (values: FormValues) => {
    setError(undefined);

    if (deliveryDate && orderDate && deliveryDate < orderDate) {
      setError("Delivery date cannot be before the order date.");
      return;
    }

    const lineErr = validateLines();
    if (lineErr) {
      setError(lineErr);
      return;
    }

    startTransition(() => {
      if (item) {
        updateStockIntake(item.id, {
          value: values.stockIntakes[0].value,
        }).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({ title: "Success", description: data.message });
            router.push("/stock-intakes");
          }
        });
        return;
      }

      const shared = {
        staff: values.staff,
        supplier: values.supplier,
        deliveryDate: values.deliveryDate,
      };

      // ✅ FIX: pass goodReceiveNote as the third argument — matches the action signature:
      //   createStockIntake(stockIntake, identifiers, goodReceiveNote)
      const promises = values.stockIntakes.map((lineItem, index) => {
        const state = ls(index);
        const identifiers = state.hasUniqueIdentifiers
          ? state.serialNumbers.filter((s) => s.trim() !== "")
          : [];
        return createStockIntake(
          { ...shared, ...lineItem },
          identifiers,
          goodReceiveNote, // ✅ was missing before
        );
      });

      Promise.all(promises)
        .then((results) => {
          const failed = results.filter((r) => r?.responseType !== "success");
          if (failed.length === 0) {
            toast({
              title: "Success",
              description: `${results.length} stock intake(s) recorded.${goodReceiveNote ? " GRN generated." : ""}`,
            });
            router.push("/stock-intakes");
          } else {
            setError(`${failed.length} intake(s) failed to save.`);
          }
        })
        .catch(() => setError("An unexpected error occurred."));
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        <FormError message={error} />

        {/* ── Delivery Details Section ─────────────────────────────────────── */}
        <div className="rounded-xl border border-orange-200 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-orange-50 border-b border-orange-200">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 border border-orange-300">
              <Truck className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black leading-tight">
                Delivery Details
              </h3>
              <p className="text-xs text-black leading-tight">
                Staff, supplier &amp; delivery date
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 p-5 bg-white">
            {/* Staff */}
            <FormField
              control={form.control}
              name="staff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    Staff Member
                  </FormLabel>
                  <FormControl>
                    <StaffSelectorWidget
                      {...field}
                      isRequired
                      isDisabled={!!item || isPending}
                      placeholder="Select staff member"
                      label="Select staff member"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplier */}
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700">
                    Supplier{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <SupplierSelector
                      {...field}
                      isDisabled={!!item || isPending}
                      placeholder="Select supplier"
                      label="Select supplier"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delivery Date */}
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Delivery Date
                  </FormLabel>
                  <DateTimePicker
                    field={field}
                    date={deliveryDate}
                    setDate={setDeliveryDate}
                    handleTimeChange={handleSharedTimeChange}
                    onDateSelect={(d) => {
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      if (orderDate && d < orderDate) {
                        setError(
                          "Delivery date cannot be before the order date.",
                        );
                        return;
                      }
                      if (d > today) {
                        setError("Delivery date cannot exceed today's date.");
                        return;
                      }
                      setError(undefined);
                      setDeliveryDate(d);
                    }}
                    minDate={orderDate}
                    maxDate={new Date()}
                    disabled={!!item}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Stock Items Section ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 border border-orange-300">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-black leading-tight">
                Stock Items
              </h3>
              <p className="text-xs text-black leading-tight">
                Add one or more stock items to this intake
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-xs tabular-nums bg-orange-100 text-orange-700 border border-orange-300"
            >
              {fields.length} {fields.length === 1 ? "item" : "items"}
            </Badge>
          </div>

          {fields.map((field, index) => {
            const state = ls(index);
            const qty = form.watch(`stockIntakes.${index}.quantity`);
            const variantLabel = state.variantInfo
              ? `${state.variantInfo.stockName}${state.variantInfo.variant?.name ? ` — ${state.variantInfo.variant.name}` : ""}`
              : "New Item";

            return (
              <div
                key={field.id}
                className={`rounded-xl overflow-hidden shadow-sm border transition-colors ${state.variantInfo ? "border-orange-200" : "border-gray-200"}`}
              >
                {/* Card header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b transition-colors ${state.variantInfo ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${state.variantInfo ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-600"}`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`text-sm font-medium truncate max-w-xs ${state.variantInfo ? "text-orange-800" : "text-gray-500"}`}
                    >
                      {variantLabel}
                    </span>
                    {state.variantInfo && (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium text-orange-700 border-orange-400 bg-orange-100"
                      >
                        Selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateLineState(index, { collapsed: !state.collapsed })
                      }
                      className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {state.collapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                    {fields.length > 1 && !item && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card body */}
                {!state.collapsed && (
                  <div className="p-5 space-y-5 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* Stock Variant */}
                      <FormField
                        control={form.control}
                        name={`stockIntakes.${index}.stockVariant`}
                        render={({ field: f }) => (
                          <FormItem className="lg:col-span-2">
                            <FormLabel className="font-medium text-gray-700">
                              Stock Item
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelector
                                {...f}
                                isRequired
                                isDisabled={!!item || isPending}
                                placeholder="Select stock item"
                                onChange={(val) =>
                                  handleVariantChange(index, val)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`stockIntakes.${index}.quantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-gray-700">
                              Quantity
                            </FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors text-gray-900 placeholder:text-gray-400"
                                value={f.value || ""}
                                disabled={isPending}
                                placeholder="0"
                                thousandSeparator
                                allowNegative={false}
                                onValueChange={(vals) =>
                                  f.onChange(
                                    Number(vals.value.replace(/,/g, "")),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Value */}
                      <FormField
                        control={form.control}
                        name={`stockIntakes.${index}.value`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-gray-700">
                              Value
                            </FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors text-gray-900 placeholder:text-gray-400"
                                value={f.value || ""}
                                disabled={isPending}
                                placeholder="0.00"
                                thousandSeparator
                                allowNegative={false}
                                onValueChange={(vals) =>
                                  f.onChange(
                                    Number(vals.value.replace(/,/g, "")),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Order Date */}
                      <FormField
                        control={form.control}
                        name={`stockIntakes.${index}.orderDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-gray-700 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              Order Date
                            </FormLabel>
                            <DateTimePicker
                              field={field}
                              date={orderDate}
                              setDate={setOrderDate}
                              handleTimeChange={handleSharedTimeChange}
                              onDateSelect={(d) => {
                                setOrderDate(d);
                                if (deliveryDate && deliveryDate < d) {
                                  setDeliveryDate(undefined);
                                  form.setValue("deliveryDate", "");
                                }
                              }}
                              maxDate={new Date()}
                              disabled={!!item}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Batch Expiry */}
                      <FormField
                        control={form.control}
                        name={`stockIntakes.${index}.batchExpiryDate`}
                        render={({ field: f }) => (
                          <FormItem className="lg:col-span-2">
                            <FormLabel className="font-medium text-gray-700 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              Batch Expiry{" "}
                              <span className="text-xs font-normal text-gray-400">
                                (optional)
                              </span>
                            </FormLabel>
                            <DateTimePicker
                              field={f}
                              date={state.batchExpiryDate}
                              setDate={(d) =>
                                updateLineState(index, { batchExpiryDate: d })
                              }
                              handleTimeChange={(type, val) => {
                                const d = state.batchExpiryDate;
                                if (!d) return;
                                const n = new Date(d);
                                type === "hour"
                                  ? n.setHours(Number(val))
                                  : n.setMinutes(Number(val));
                                updateLineState(index, { batchExpiryDate: n });
                              }}
                              onDateSelect={(d) =>
                                updateLineState(index, { batchExpiryDate: d })
                              }
                              disabled={!!item}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Status (edit mode only) */}
                      {item && (
                        <FormField
                          control={form.control}
                          name={`stockIntakes.${index}.status`}
                          render={({ field: f }) => (
                            <FormItem className="flex items-center justify-between lg:col-span-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
                              <div>
                                <FormLabel className="font-medium text-gray-700">
                                  Status
                                </FormLabel>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Toggle this intake&apos;s status
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={f.value}
                                  onCheckedChange={f.onChange}
                                  disabled={isPending}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* ── Unique Identifiers ─────────────────────────────── */}
                    {!item && (
                      <>
                        <div className="flex items-start gap-3 p-4 border border-orange-200 rounded-xl bg-orange-50/70">
                          <Checkbox
                            id={`uid-${index}`}
                            checked={state.hasUniqueIdentifiers}
                            onCheckedChange={(checked) =>
                              updateLineState(index, {
                                hasUniqueIdentifiers: checked === true,
                                serialNumbers: checked
                                  ? state.serialNumbers
                                  : [],
                              })
                            }
                            disabled={isPending}
                            className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <div className="flex flex-col gap-0.5">
                            <label
                              htmlFor={`uid-${index}`}
                              className="text-sm font-medium text-gray-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Fingerprint className="h-4 w-4 text-orange-500" />
                              Does this stock have unique identifier(s)?
                            </label>
                            <p className="text-xs text-gray-500">
                              Enable if each item has a serial number, barcode,
                              or batch code to track individually.
                            </p>
                          </div>
                        </div>

                        {state.hasUniqueIdentifiers && qty > 0 && (
                          <UniqueIdentifierInput
                            quantity={qty}
                            value={state.serialNumbers}
                            onChange={(sns) =>
                              updateLineState(index, { serialNumbers: sns })
                            }
                            disabled={isPending}
                          />
                        )}

                        {state.hasUniqueIdentifiers && !qty && (
                          <p className="text-sm text-orange-700 bg-orange-500 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-orange-500" />
                            Please enter a quantity above to start entering
                            unique identifiers.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add line button */}
          {!item && (
            <Button
              type="button"
              variant="outline"
              onClick={addLine}
              disabled={isPending}
              className="w-full border-dashed border-2 border-orange-300 text-orange-600 bg-orange-50/40 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 transition-colors h-11 font-medium"
            >
              <Plus className="w-4 h-4 mr-2 text-orange-500" />
              Add another stock item
            </Button>
          )}
        </div>

        {/* ── GRN Checkbox ─────────────────────────────────────────────────── */}
        {!item && (
          <div className="flex items-start gap-3 p-4 border border-orange-200 rounded-xl bg-orange-50">
            <Checkbox
              id="goodReceiveNote"
              checked={goodReceiveNote}
              onCheckedChange={(checked) =>
                setGoodReceiveNote(checked === true)
              }
              disabled={isPending}
              className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <div className="flex flex-col gap-0.5">
              <label
                htmlFor="goodReceiveNote"
                className="text-sm font-semibold text-black flex items-center gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-black" />
                Generate Goods Received Note (GRN)
              </label>
              <p className="text-xs text-orange-600/70">
                A GRN document will be generated and attached to this intake
                record.
              </p>
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex h-5 items-center space-x-4">
          <CancelButton />
          <Separator orientation="vertical" />
          <SubmitButton
            label={
              item
                ? "Update stock intake"
                : fields.length > 1
                  ? `Record ${fields.length} stock intakes`
                  : "Record stock intake"
            }
            isPending={isPending}
          />
        </div>
      </form>
    </Form>
  );
}

export default StockIntakeForm;
