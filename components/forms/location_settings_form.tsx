"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import {
  Loader2Icon,
  ImageIcon,
  FileText,
  Trash2,
  Smartphone,
  Building2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  getAllDigitalReceiptPaymentDetails,
  getAllPhysicalReceiptPaymentDetails,
  deleteReceiptPaymentDetail,
  updateLocationSettings,
} from "@/lib/actions/settings-actions";
import { toast } from "@/hooks/use-toast";
import {
  LocationSettings,
  SettingField,
  SETTINGS_CONFIG,
} from "@/types/settings/type";
import { LocationSettingsSchema } from "@/types/settings/schema";
import { ImageUploadModal } from "@/components/settings/uploadImage";
import { PaymentDetailsModal } from "@/components/settings/paymentDetailsModal";
import CountrySelector from "@/components/widgets/country-selector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiPaymentDetail {
  id: string;
  acceptedPaymentMethodType: string;
  acceptedPaymentMethodTypeName: string;
  accountNumber: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isBank = (d: ApiPaymentDetail) =>
  d.acceptedPaymentMethodTypeName?.toLowerCase().includes("bank") ?? false;

const LoadingSkeleton = () => {
  const categories = [
    "basic",
    "receipt-management",
    "feature",
    "printing",
    "inventory",
    "order",
    "system",
  ];
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-12" />
                  </div>
                </div>
              ))}
            </div>
            <Separator />
          </div>
        ))}
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

const CATEGORY_TITLES = {
  basic: "Basic Settings",
  receipt: "Receipt Management",
  feature: "Feature Settings",
  printing: "Printing Settings",
  inventory: "Inventory Settings",
  order: "Order Settings",
  loyalty: "Customer Loyalty Points",
  "staff-points": "Staff Points",
} as const;

const groupSettingsByCategory = (settings: SettingField[]) =>
  settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) acc[setting.category] = [];
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, SettingField[]>,
  );

// ─── Payment Details Card ─────────────────────────────────────────────────────

interface PaymentDetailsCardProps {
  details: ApiPaymentDetail[];
  isLoading: boolean;
  type: "physical" | "digital";
  onEdit: () => void;
  onDelete: (id: string) => Promise<void>;
}

const PaymentDetailsCard: React.FC<PaymentDetailsCardProps> = ({
  details,
  isLoading,
  type,
  onEdit,
  onDelete,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        Loading payment details...
      </div>
    );
  }

  if (details.length === 0) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
        <FileText className="h-4 w-4 mr-2" />
        Add payment details
      </Button>
    );
  }

  const banks = details.filter(isBank);
  const mnos = details.filter((d) => !isBank(d));

  const renderRow = (
    detail: ApiPaymentDetail,
    i: number,
    arr: ApiPaymentDetail[],
  ) => (
    <div
      key={detail.id}
      className={`flex items-center gap-2.5 px-3 py-2 ${
        i < arr.length - 1 ? "border-b border-border/50" : ""
      }`}
    >
      <div className="w-8 h-8 rounded-md bg-primary-light dark:bg-primary-light/95 flex items-center justify-center flex-shrink-0">
        {isBank(detail) ? (
          <Building2 className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Smartphone className="w-3.5 h-3.5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground leading-none mb-0.5">
          {detail.acceptedPaymentMethodTypeName}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          ••••{String(detail.accountNumber).slice(-4)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
        onClick={() => handleDelete(detail.id)}
        disabled={deletingId === detail.id}
      >
        {deletingId === detail.id ? (
          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Banks */}
      {banks.length > 0 && (
        <>
          <p className="px-3 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Banks
          </p>
          {banks.map((d, i, arr) => renderRow(d, i, arr))}
        </>
      )}

      {/* Divider */}
      {banks.length > 0 && mnos.length > 0 && (
        <div className="border-t border-border mx-3" />
      )}

      {/* MNOs */}
      {mnos.length > 0 && (
        <>
          <p className="px-3 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Mobile money
          </p>
          {mnos.map((d, i, arr) => renderRow(d, i, arr))}
        </>
      )}

      {/* Footer */}
      <div className="border-t border-border p-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onEdit}
        >
          <FileText className="h-3.5 w-3.5 mr-2" />
          Edit payment details
        </Button>
      </div>
    </div>
  );
};

// ─── Main Form ────────────────────────────────────────────────────────────────

const LocationSettingsForm = ({
  item,
  categories,
}: {
  item: LocationSettings | null | undefined;
  categories?: string[];
}) => {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [, setResponse] = useState<FormResponse | undefined>();

  // Modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<
    "physical" | "digital"
  >("physical");

  // Image
  const [receiptImage, setReceiptImage] = useState<string>("");

  // Payment display lists
  const [digitalPaymentDetails, setDigitalPaymentDetails] = useState<
    ApiPaymentDetail[]
  >([]);
  const [isLoadingDigitalPayments, setIsLoadingDigitalPayments] =
    useState(true);

  const [physicalPaymentDetails, setPhysicalPaymentDetails] = useState<
    ApiPaymentDetail[]
  >([]);
  const [isLoadingPhysicalPayments, setIsLoadingPhysicalPayments] =
    useState(true);

  const form = useForm<z.infer<typeof LocationSettingsSchema>>({
    resolver: zodResolver(LocationSettingsSchema),
    defaultValues: { ...item, status: true },
  });

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchPaymentDetails = async (type: "physical" | "digital") => {
    const fetchFn =
      type === "physical"
        ? getAllPhysicalReceiptPaymentDetails
        : getAllDigitalReceiptPaymentDetails;

    const setDetails =
      type === "physical"
        ? setPhysicalPaymentDetails
        : setDigitalPaymentDetails;

    const setLoading =
      type === "physical"
        ? setIsLoadingPhysicalPayments
        : setIsLoadingDigitalPayments;

    try {
      setLoading(true);
      const data = await fetchFn();
      const list: ApiPaymentDetail[] = Array.isArray(data)
        ? data
        : (data?.data ?? []);
      setDetails(list);
    } catch (error) {
      console.error(`Failed to fetch ${type} payment details:`, error);
      toast({
        variant: "destructive",
        title: "Failed to load",
        description: `Could not load ${type} payment details.`,
      });
    } finally {
      setLoading(false);
    }
  };

  // On mount
  useEffect(() => {
    fetchPaymentDetails("digital");
    fetchPaymentDetails("physical");
  }, []);

  useEffect(() => {
    if (item) {
      form.reset(item);
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [item, form]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openPaymentModal = (type: "physical" | "digital") => {
    setPaymentModalType(type);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSaved = () => {
    fetchPaymentDetails(paymentModalType);
  };

  const handleDeletePayment = async (
    id: string,
    type: "physical" | "digital",
  ) => {
    try {
      await deleteReceiptPaymentDetail(id, type);
      // Optimistic removal from display list
      if (type === "physical") {
        setPhysicalPaymentDetails((prev) => prev.filter((d) => d.id !== id));
      } else {
        setDigitalPaymentDetails((prev) => prev.filter((d) => d.id !== id));
      }
      toast({ title: "Deleted", description: "Payment method removed." });
    } catch {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not remove the payment method. Please try again.",
      });
    }
  };

  const onInvalid = useCallback((errors: FieldErrors) => {
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description:
        typeof errors.message === "string"
          ? errors.message
          : "There was an issue submitting your form, please try later",
    });
  }, []);

  const submitData = (values: z.infer<typeof LocationSettingsSchema>) => {
    setResponse(undefined);
    startTransition(() => {
      if (item) {
        updateLocationSettings(item.id, {
          ...values,
          receiptImage,
        } as any).then((data) => {
          if (data) {
            setResponse(data);
            toast({
              title: "Settings Updated",
              description:
                "Your location settings have been updated successfully.",
            });
          }
        });
      }
    });
  };

  const getFilteredSettings = () => {
    const currentValues = form.watch();
    return SETTINGS_CONFIG.filter((setting) => {
      if (categories && !categories.includes(setting.category)) return false;
      if (setting.dependencies?.length) {
        return setting.dependencies.every(
          (dep) => currentValues[dep as keyof typeof currentValues],
        );
      }
      return true;
    });
  };

  // ── Render controls ────────────────────────────────────────────────────────

  const renderFormControl = (field: SettingField) => {
    const { key, type, placeholder, helperText, inputType, min, max, step } =
      field;

    switch (type) {
      case "switch":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    {field.label}
                  </FormLabel>
                  {helperText && (
                    <FormDescription className="text-xs">
                      {helperText}
                    </FormDescription>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={isPending || field.disabled}
                    className="bg-green-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case "button":
        return (
          <div key={key as any} className="rounded-lg border p-4">
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">
                {field.label}
              </FormLabel>
              {helperText && (
                <FormDescription className="text-xs">
                  {helperText}
                </FormDescription>
              )}
              <div className="pt-2">
                {key === "receiptImageUpload" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {receiptImage ? "Change Image" : "Upload Image"}
                  </Button>
                )}

                {key === "physicalReceiptPaymentDetails" && (
                  <PaymentDetailsCard
                    details={physicalPaymentDetails}
                    isLoading={isLoadingPhysicalPayments}
                    type="physical"
                    onEdit={() => openPaymentModal("physical")}
                    onDelete={(id) => handleDeletePayment(id, "physical")}
                  />
                )}

                {key === "digitalReceiptPaymentDetails" && (
                  <PaymentDetailsCard
                    details={digitalPaymentDetails}
                    isLoading={isLoadingDigitalPayments}
                    type="digital"
                    onEdit={() => openPaymentModal("digital")}
                    onDelete={(id) => handleDeletePayment(id, "digital")}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case "input":
      case "text":
      case "password":
      case "number":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={
                      inputType ||
                      (type === "password"
                        ? "password"
                        : type === "number"
                          ? "number"
                          : "text")
                    }
                    placeholder={placeholder}
                    disabled={isPending || field.disabled}
                    value={formField.value ?? ""}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => {
                      if (type === "number") {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        formField.onChange(isNaN(value) ? 0 : value);
                      } else {
                        formField.onChange(e.target.value);
                      }
                    }}
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "select":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Select
                    value={formField.value ?? ""}
                    onValueChange={formField.onChange}
                    disabled={isPending || field.disabled}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={placeholder || "Select an option"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "country-select":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <CountrySelector
                    value={formField.value ?? ""}
                    onChange={formField.onChange}
                    isDisabled={isPending || field.disabled}
                    placeholder={placeholder}
                    valueKey="currencyCode"
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        console.warn(`Unsupported field type: ${type} for field: ${key}`);
        return null;
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  const filteredSettings = getFilteredSettings();
  const settingsGroups = groupSettingsByCategory(filteredSettings);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitData, onInvalid)}
              className="space-y-6"
            >
              {Object.entries(settingsGroups).map(
                ([category, settings], index, array) => (
                  <React.Fragment key={category}>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        {CATEGORY_TITLES[
                          category as keyof typeof CATEGORY_TITLES
                        ] ||
                          category.charAt(0).toUpperCase() + category.slice(1)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {settings.map((field) => renderFormControl(field))}
                      </div>
                    </div>
                    {index < array.length - 1 && <Separator />}
                  </React.Fragment>
                ),
              )}

              <div className="flex justify-end pt-6">
                {isPending ? (
                  <Button disabled className="w-full md:w-auto">
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Updating Settings...
                  </Button>
                ) : (
                  <Button type="submit" className="w-full md:w-auto">
                    Update Settings
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSave={(imageUrl) => {
          setReceiptImage(imageUrl);
          setIsImageModalOpen(false);
        }}
        currentImage={receiptImage}
      />

      <PaymentDetailsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSaved={handlePaymentSaved}
        receiptType={paymentModalType}
      />
    </>
  );
};

export default LocationSettingsForm;
