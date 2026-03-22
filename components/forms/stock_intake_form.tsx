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
  Box,
  Hash,
  DollarSign,
  User,
  Calendar,
  CalendarClock,
  Truck,
  Fingerprint,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getStockVariantById } from "@/lib/actions/stock-actions";
import { NumericFormat } from "react-number-format";
import { UniqueIdentifierInput } from "../widgets/serial-number-input";
import { Button } from "@/components/ui/button";
import { LpoPrefill } from "@/components/forms/stock-intake/lpo-form";
import { StockIntakePayload } from "@/types/stock-intake/schema";
import { StockIntakeSuccessModal } from "./stock-intake/success-modal";

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
  createDirectStockIntakeReceipt: true,
});

const labelClass = "font-medium flex items-center gap-2 text-sm text-gray-700";
const iconClass = "h-4 w-4 text-gray-400";
const inputClass =
  "flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function StockIntakeForm({
  item,
  prefill,
}: {
  item: StockIntake | null | undefined;
  prefill?: LpoPrefill;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    receiptId: string | undefined;
    count: number;
  }>({ open: false, receiptId: undefined, count: 0 });

  const [orderDate, setOrderDate] = useState<Date | undefined>(
    item?.orderDate ? new Date(item.orderDate) : undefined,
  );
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    item?.deliveryDate ? new Date(item.deliveryDate) : new Date(),
  );

  const [lineStates, setLineStates] = useState<LineState[]>([
    defaultLineState(),
  ]);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockItem");

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
      : prefill
        ? {
            supplier: prefill.supplier,
            deliveryDate: prefill.deliveryDate,
            stockIntakes: prefill.stockIntakes.map((line) => ({
              stockVariant: line.stockVariant,
              quantity: line.quantity,
              value: line.value,
              orderDate: line.orderDate,
              batchExpiryDate: undefined,
              status: true,
            })),
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
  useEffect(() => {
    if (!prefill) return;

    prefill.stockIntakes.forEach((line, index) => {
      if (!line.stockVariant) return;
      getStockVariantById(line.stockVariant)
        .then((info) => updateLineState(index, { variantInfo: info }))
        .catch(console.error);
    });

    if (prefill.deliveryDate) {
      setDeliveryDate(new Date(prefill.deliveryDate));
    }

    if (prefill.stockIntakes[0]?.orderDate) {
      setOrderDate(new Date(prefill.stockIntakes[0].orderDate));
    }

    setLineStates(prefill.stockIntakes.map(() => defaultLineState()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockIntakes",
  });

  useEffect(() => {
    if (!stockVariantId) return;
    form.setValue("stockIntakes.0.stockVariant", stockVariantId);
    getStockVariantById(stockVariantId)
      .then((info) => updateLineState(0, { variantInfo: info }))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockVariantId]);

  const updateLineState = (index: number, patch: Partial<LineState>) =>
    setLineStates((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] ?? defaultLineState()), ...patch };
      return next;
    });

  const ls = (index: number): LineState =>
    lineStates[index] ?? defaultLineState();

  const addLine = () => {
    append(defaultLineItem());
    setLineStates((prev) => [...prev, defaultLineState()]);
  };

  const removeLine = (index: number) => {
    remove(index);
    setLineStates((prev) => prev.filter((_, i) => i !== index));
  };

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
          if (data?.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/stock-intakes");
          }
        });
        return;
      }

      const payload: StockIntakePayload = {
        staff: values.staff,
        supplier: values.supplier,
        deliveryDate: values.deliveryDate,
        ...(prefill?.stockIntakePurchaseOrderId
          ? { stockIntakePurchaseOrderId: prefill.stockIntakePurchaseOrderId }
          : {}),
        items: values.stockIntakes.map((lineItem, index) => {
          const state = ls(index);
          const identifiers = state.hasUniqueIdentifiers
            ? state.serialNumbers.filter((s) => s.trim() !== "")
            : [];
          return {
            stockVariantId: lineItem.stockVariant,
            quantity: lineItem.quantity,
            value: lineItem.value,
            orderDate: lineItem.orderDate,
            ...(lineItem.batchExpiryDate
              ? { batchExpiryDate: lineItem.batchExpiryDate }
              : {}),
            ...(identifiers.length ? { identifiers } : {}),
          };
        }),
      };

      console.log("payload to be submitted is", payload);
      createStockIntake(payload)
        .then((result) => {
          if (result?.responseType === "success") {
            console.log("The results after completing stock intake", result);
            const receiptId = (result?.data as { id?: string })?.id;
            setSuccessModal({
              open: true,
              receiptId,
              count: values.stockIntakes.length,
            });
          } else {
            setError("Failed to save stock intake.");
          }
        })
        .catch(() => setError("An unexpected error occurred."));
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-5 sm:space-y-6"
      >
        <FormError message={error} />

        {/* ── Shared delivery fields (Staff, Delivery Date, Supplier) ───────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Staff */}
          <FormField
            control={form.control}
            name="staff"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  <User className={iconClass} />
                  Staff Member <span className="text-red-500">*</span>
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

          {/* Delivery Date */}
          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  <Truck className={iconClass} />
                  Delivery Date <span className="text-red-500">*</span>
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

          {/* Supplier */}
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  <Truck className={iconClass} />
                  Supplier{" "}
                  <span className="text-xs text-muted-foreground font-normal">
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
        </div>

        <Separator />

        {/* ── Stock line items ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {fields.map((field, index) => {
            const state = ls(index);
            const qty = form.watch(`stockIntakes.${index}.quantity`);
            const variantLabel = state.variantInfo
              ? `${state.variantInfo.stockName}${state.variantInfo.variant?.name ? ` — ${state.variantInfo.variant.name}` : ""}`
              : `Stock Item ${index + 1}`;

            return (
              <div
                key={field.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Card header — only shown when there are multiple items */}
                {fields.length > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600 truncate max-w-xs">
                      {variantLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateLineState(index, {
                            collapsed: !state.collapsed,
                          })
                        }
                        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 transition-colors"
                      >
                        {state.collapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>
                      {!item && !prefill && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Card body */}
                {!state.collapsed && (
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                      {/* Stock Variant */}
                      <FormField
                        control={form.control}
                        name={`stockIntakes.${index}.stockVariant`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>
                              <Box className={iconClass} />
                              Stock Item <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelector
                                {...f}
                                isRequired
                                isDisabled={
                                  !!item ||
                                  isPending ||
                                  (!!prefill &&
                                    !!prefill.stockIntakes[index]?.stockVariant)
                                }
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
                            <FormLabel className={labelClass}>
                              <Hash className={iconClass} />
                              Quantity <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <NumericFormat
                                className={inputClass}
                                value={f.value || ""}
                                disabled={isPending}
                                placeholder=""
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
                            <FormLabel className={labelClass}>
                              <DollarSign className={iconClass} />
                              Value <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <NumericFormat
                                className={inputClass}
                                value={f.value || ""}
                                disabled={isPending}
                                placeholder=""
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
                            <FormLabel className={labelClass}>
                              <Calendar className={iconClass} />
                              Order Date <span className="text-red-500">*</span>
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
                          <FormItem>
                            <FormLabel className={labelClass}>
                              <CalendarClock className={iconClass} />
                              Batch Expiry
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
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel className="font-medium">
                                  Status
                                </FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Toggle the current status of this stock intake
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

                    {/* ── Unique Identifiers ───────────────────────────────── */}
                    {!item && (
                      <>
                        <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
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
                            className="mt-0.5"
                          />
                          <div className="flex flex-col gap-0.5">
                            <label
                              htmlFor={`uid-${index}`}
                              className="text-sm font-medium text-gray-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Fingerprint className="h-4 w-4 text-gray-500" />
                              Does this stock have unique identifier(s)?
                            </label>
                            <p className="text-xs text-gray-500">
                              Enable this if each item has a serial number,
                              barcode, or batch code that needs to be tracked
                              individually.
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
                          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
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

          {/* Add another item */}
          {!item && !prefill && (
            <Button
              type="button"
              variant="outline"
              onClick={addLine}
              disabled={isPending}
              className="w-full border-dashed h-10 text-sm text-muted-foreground hover:text-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add another stock item
            </Button>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
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
      <StockIntakeSuccessModal
        open={successModal.open}
        count={successModal.count}
        receiptId={successModal.receiptId}
        onViewGRN={() =>
          router.push(`/goods-received/${successModal.receiptId}`)
        }
        onViewAll={() => router.push("/stock-intakes")}
      />
    </Form>
  );
}

export default StockIntakeForm;
