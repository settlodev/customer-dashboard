"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { StockIntake } from "@/types/stock-intake/type";
import { StockIntakeSchema } from "@/types/stock-intake/schema";
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
import { Calendar, Clock, Fingerprint } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getStockVariantById } from "@/lib/actions/stock-actions";
import { NumericFormat } from "react-number-format";
import { UniqueIdentifierInput } from "../widgets/serial-number-input";

function StockIntakeForm({ item }: { item: StockIntake | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [orderDate, setOrderDate] = useState<Date | undefined>(
    item?.orderDate ? new Date(item.orderDate) : undefined,
  );
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    item?.deliveryDate ? new Date(item.deliveryDate) : undefined,
  );
  const [batchExpiryDate, setBatchExpiryDate] = useState<Date | undefined>(
    item?.batchExpiryDate ? new Date(item.batchExpiryDate) : undefined,
  );
  const [, setResponse] = useState<FormResponse | undefined>();
  const [selectedVariantInfo, setSelectedVariantInfo] = useState<any>(null);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState<number>(0);
  const [hasUniqueIdentifiers, setHasUniqueIdentifiers] =
    useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockItem");

  const form = useForm<z.infer<typeof StockIntakeSchema>>({
    resolver: zodResolver(StockIntakeSchema),
    defaultValues: item
      ? item
      : {
          status: true,
          ...(stockVariantId ? { stockVariant: stockVariantId } : {}),
        },
  });

  useEffect(() => {
    async function loadVariantInfo() {
      const currentVariantId = form.getValues("stockVariant");
      if (currentVariantId) {
        try {
          const variantInfo = await getStockVariantById(currentVariantId);
          setSelectedVariantInfo(variantInfo);
        } catch (error) {
          console.error("Error loading variant info:", error);
        }
      }
    }
    if (stockVariantId || form.getValues("stockVariant")) {
      loadVariantInfo();
    }
  }, [stockVariantId, form]);

  useEffect(() => {
    if (stockVariantId) {
      form.setValue("stockVariant", stockVariantId);
    }
  }, [stockVariantId, form]);

  // Reset serial numbers when checkbox is unchecked
  useEffect(() => {
    if (!hasUniqueIdentifiers) {
      setSerialNumbers([]);
    }
  }, [hasUniqueIdentifiers]);

  const handleStockVariantChange = async (value: string) => {
    form.setValue("stockVariant", value);
    if (value) {
      try {
        const variantInfo = await getStockVariantById(value);
        setSelectedVariantInfo(variantInfo);
      } catch (error) {
        console.error("Error loading variant info:", error);
      }
    } else {
      setSelectedVariantInfo(null);
    }
  };

  const onInvalid = useCallback(
    (errors: any) => {
      console.log("Validation errors:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof StockIntakeSchema>) => {
    setError(undefined);

    if (deliveryDate && orderDate && deliveryDate < orderDate) {
      setError("Delivery date cannot be before order date.");
      return;
    }

    // Validate identifiers only when checkbox is enabled
    if (hasUniqueIdentifiers && currentQuantity > 0) {
      const filledSerials = serialNumbers.filter((s) => s.trim() !== "");
      const uniqueSerials = new Set(filledSerials);

      if (filledSerials.length !== currentQuantity) {
        setError(
          `Please enter all ${currentQuantity} unique identifiers before saving.`,
        );
        return;
      }

      if (uniqueSerials.size !== filledSerials.length) {
        setError(
          "Duplicate unique identifiers found. Each item must have a unique identifier.",
        );
        return;
      }
    }

    // Pass identifiers as a separate argument to avoid Next.js server action
    // serialization dropping undefined/extra fields from the schema object
    const identifiers = hasUniqueIdentifiers
      ? serialNumbers.filter((s) => s.trim() !== "")
      : [];

    startTransition(() => {
      if (item) {
        updateStockIntake(item.id, { value: values.value }).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ title: "Success", description: data.message });
            router.push("/stock-intakes");
          }
        });
      } else {
        createStockIntake(values, identifiers)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ title: "Success", description: data.message });
              router.push("/stock-intakes");
            }
          })
          .catch((err) => {
            console.log("Error while creating stock intake:", err);
          });
      }
    });
  };

  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!orderDate) return;
    const newDate = new Date(orderDate);
    const newDeliveryDate = new Date(orderDate);
    const newBatchExpiryDate = new Date(orderDate);
    if (type === "hour") {
      newDate.setHours(Number(value));
      newDeliveryDate.setHours(Number(value));
      newBatchExpiryDate.setHours(Number(value));
    } else {
      newDate.setMinutes(Number(value));
      newDeliveryDate.setMinutes(Number(value));
      newBatchExpiryDate.setMinutes(Number(value));
    }
    setOrderDate(newDate);
    setDeliveryDate(newDeliveryDate);
    setBatchExpiryDate(newBatchExpiryDate);
  };

  const handleDateSelect = (date: Date) => {
    setOrderDate(date);
    setDeliveryDate(date);
    setBatchExpiryDate(date);
  };

  const validateDates = (date: Date) => {
    if (orderDate && date < orderDate) {
      setError("Delivery date cannot be before the order date.");
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleDeliveryDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (validateDates(date) && date <= today) {
      setDeliveryDate(date);
    } else if (date > today) {
      setError("Delivery date cannot exceed today's date.");
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="space-y-8"
        >
          <FormError message={error} />

          {selectedVariantInfo && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-blue-800">Selected Stock Item</h3>
              <div className="text-sm text-blue-700 mt-1">
                {selectedVariantInfo.stockName} -{" "}
                {selectedVariantInfo.variant?.name}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="stockVariant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Stock Item</FormLabel>
                  <FormControl>
                    <StockVariantSelector
                      {...field}
                      isRequired
                      isDisabled={!!item || isPending}
                      placeholder="Select stock item"
                      onChange={handleStockVariantChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Quantity</FormLabel>
                  <FormControl>
                    <NumericFormat
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={field.value}
                      disabled={isPending}
                      placeholder=""
                      thousandSeparator={true}
                      allowNegative={false}
                      onValueChange={(values) => {
                        const rawValue = Number(values.value.replace(/,/g, ""));
                        field.onChange(rawValue);
                        setCurrentQuantity(rawValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Value</FormLabel>
                  <FormControl>
                    <NumericFormat
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={field.value}
                      disabled={isPending}
                      placeholder=""
                      thousandSeparator={true}
                      allowNegative={false}
                      onValueChange={(values) => {
                        const rawValue = Number(values.value.replace(/,/g, ""));
                        field.onChange(rawValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Staff Member</FormLabel>
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

            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Order Date
                  </FormLabel>
                  <DateTimePicker
                    field={field}
                    date={orderDate}
                    setDate={setOrderDate}
                    handleTimeChange={handleTimeChange}
                    onDateSelect={handleDateSelect}
                    maxDate={new Date()}
                    disabled={!!item}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Delivery Date
                  </FormLabel>
                  <DateTimePicker
                    field={field}
                    date={deliveryDate}
                    setDate={setDeliveryDate}
                    handleTimeChange={handleTimeChange}
                    onDateSelect={handleDeliveryDateSelect}
                    minDate={orderDate}
                    maxDate={new Date()}
                    disabled={!!item}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Batch Expiry
                  </FormLabel>
                  <DateTimePicker
                    field={field}
                    date={batchExpiryDate}
                    setDate={setBatchExpiryDate}
                    handleTimeChange={handleTimeChange}
                    onDateSelect={handleDateSelect}
                    disabled={!!item}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    Supplier{" "}
                    <span className="text-sm text-gray-500">(optional)</span>
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

            {item && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="font-medium">Status</FormLabel>
                      <p className="text-sm text-gray-500">
                        Toggle the current status of this stock intake
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* ── Unique Identifier Checkbox ── */}
          {!item && (
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
              <Checkbox
                id="hasUniqueIdentifiers"
                checked={hasUniqueIdentifiers}
                onCheckedChange={(checked) =>
                  setHasUniqueIdentifiers(checked === true)
                }
                disabled={isPending}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="hasUniqueIdentifiers"
                  className="text-sm font-medium text-gray-800 flex items-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="h-4 w-4 text-gray-500" />
                  Does this stock have unique identifier(s)?
                </label>
                <p className="text-xs text-gray-500">
                  Enable this if each item has a serial number, barcode, or
                  batch code that needs to be tracked individually.
                </p>
              </div>
            </div>
          )}

          {/* ── Identifier Entry Component ── */}
          {hasUniqueIdentifiers && !item && currentQuantity > 0 && (
            <UniqueIdentifierInput
              quantity={currentQuantity}
              value={serialNumbers}
              onChange={setSerialNumbers}
              disabled={isPending}
            />
          )}

          {/* Prompt to enter quantity first */}
          {hasUniqueIdentifiers && !item && currentQuantity === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Please enter a quantity above to start entering unique
              identifiers.
            </p>
          )}

          <div className="flex h-5 items-center space-x-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              label={item ? "Update stock intake" : "Record stock intake"}
              isPending={isPending}
            />
          </div>
        </form>
      </Form>
    </>
  );
}

export default StockIntakeForm;
