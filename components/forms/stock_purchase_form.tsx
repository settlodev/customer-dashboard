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
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import CancelButton from "../widgets/cancel-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { StockPurchase } from "@/types/stock-purchases/type";
import {
  Copy,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Printer,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Briefcase,
  Loader2,
  Check,
  UserPlus,
  Package,
  ClipboardList,
  Hash,
} from "lucide-react";
import DateTimePicker from "@/components/widgets/datetimepicker";
import { StockPurchaseSchema } from "@/types/stock-purchases/schema";
import { SupplierSchema } from "@/types/supplier/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createStockPurchase } from "@/lib/actions/stock-purchase-actions";
import { createSupplier } from "@/lib/actions/supplier-actions";
import { format } from "date-fns";

const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

type SupplierFormValues = z.infer<typeof SupplierSchema>;

// ─── Create Supplier Modal ────────────────────────────────────────────────────

function CreateSupplierModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      const result = await createSupplier(values);
      if (result?.responseType === "error") {
        setServerError(result.message ?? "Failed to create supplier");
        setLoading(false);
        return;
      }
    } catch (e: unknown) {
      setServerError(
        e instanceof Error
          ? e.message
          : "Something went wrong creating the supplier",
      );
      setLoading(false);
      return;
    }
    setLoading(false);
    setSuccessName(values.name);
    reset();
    onCreated();
    setTimeout(() => {
      setSuccessName(null);
      setOpen(false);
    }, 3500);
  };

  const inputClass = (hasError: boolean) =>
    `h-10 text-sm border transition-colors focus-visible:ring-1 focus-visible:ring-orange-400 focus-visible:border-orange-400 ${
      hasError ? "border-red-300 bg-red-50/40" : "border-gray-200"
    }`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          reset();
          setServerError(null);
          setSuccessName(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 h-10 w-10 border border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors"
          title="Add new supplier"
        >
          <UserPlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: PRIMARY_LIGHT }}
            >
              <Building2 className="w-4 h-4" style={{ color: PRIMARY }} />
            </div>
            New Supplier
          </DialogTitle>
        </DialogHeader>

        {successName ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Supplier created successfully!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium text-gray-700">{successName}</span>{" "}
                is now available in the supplier list.
              </p>
            </div>
            <p className="text-xs text-gray-400">Closing automatically…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
            {serverError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                {serverError}
              </div>
            )}

            {/* ── Company info ─────────────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Company Information
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    Supplier Name <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Acme Supplies Ltd"
                      {...register("name")}
                      className={`pl-9 ${inputClass(!!errors.name)}`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="info@acme.com"
                        {...register("email")}
                        className={`pl-9 ${inputClass(!!errors.email)}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      Phone <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="+255 712 345 678"
                        {...register("phoneNumber")}
                        className={`pl-9 ${inputClass(!!errors.phoneNumber)}`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-xs text-red-500">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    Physical Address{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="123 Main St, Dar es Salaam"
                      {...register("physicalAddress")}
                      className={`pl-9 ${inputClass(!!errors.physicalAddress)}`}
                    />
                  </div>
                  {errors.physicalAddress && (
                    <p className="text-xs text-red-500">
                      {errors.physicalAddress.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Contact person ────────────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Contact Person
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      Full Name <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Jane Doe"
                        {...register("contactPersonName")}
                        className={`pl-9 ${inputClass(!!errors.contactPersonName)}`}
                      />
                    </div>
                    {errors.contactPersonName && (
                      <p className="text-xs text-red-500">
                        {errors.contactPersonName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      Title{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Sales Manager"
                        {...register("contactPersonTitle")}
                        className={`pl-9 ${inputClass(!!errors.contactPersonTitle)}`}
                      />
                    </div>
                    {errors.contactPersonTitle && (
                      <p className="text-xs text-red-500">
                        {errors.contactPersonTitle.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      Phone <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="+255 712 345 678"
                        {...register("contactPersonPhone")}
                        className={`pl-9 ${inputClass(!!errors.contactPersonPhone)}`}
                      />
                    </div>
                    {errors.contactPersonPhone && (
                      <p className="text-xs text-red-500">
                        {errors.contactPersonPhone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">
                      Email{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="jane@acme.com"
                        {...register("contactPersonEmail")}
                        className={`pl-9 ${inputClass(!!errors.contactPersonEmail)}`}
                      />
                    </div>
                    {errors.contactPersonEmail && (
                      <p className="text-xs text-red-500">
                        {errors.contactPersonEmail.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 text-sm h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="text-white text-sm h-9 min-w-[150px] shadow-sm"
                style={{ backgroundColor: PRIMARY }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" /> Create Supplier
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

function StockPurchaseForm({
  item,
}: {
  item: StockPurchase | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [, setStocks] = useState<Stock[]>([]);
  const [shareLink, setShareLink] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [purchaseData, setPurchaseData] = useState<any>();
  const { toast } = useToast();
  const router = useRouter();
  // key used to force-remount the SupplierSelector after a new supplier is added
  const [supplierSelectorKey, setSupplierSelectorKey] = useState(0);

  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockVariant");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    item?.deliveryDate ? new Date(item.deliveryDate) : undefined,
  );

  useEffect(() => {
    const getData = async () => {
      try {
        const [stockResponse] = await Promise.all([fetchStock()]);
        setStocks(stockResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load form data. Please refresh the page.",
        });
      }
    };
    getData();
  }, [toast]);

  const handleDeliveryDateSelect = (date: Date) => {
    if (date < new Date()) {
      setError("Delivery date cannot be in the past.");
      return false;
    }
    setDeliveryDate(date);
    return true;
  };

  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!deliveryDate) return;
    const newDate = new Date(deliveryDate);
    if (type === "hour") newDate.setHours(Number(value));
    else if (type === "minutes") newDate.setMinutes(Number(value));
    setDeliveryDate(newDate);
    form.setValue("deliveryDate", newDate.toISOString());
  };

  const form = useForm<z.infer<typeof StockPurchaseSchema>>({
    resolver: zodResolver(StockPurchaseSchema),
    defaultValues: {
      supplier: item?.supplier || "",
      stockIntakePurchaseOrderItems: item?.stockIntakePurchaseOrderItems || [
        { stockVariantId: stockVariantId || "", quantity: 0 },
      ],
      deliveryDate: item?.deliveryDate || new Date().toISOString(),
      notes: item?.notes,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockIntakePurchaseOrderItems",
  });

  const addStockItem = () => append({ stockVariantId: "", quantity: 1 });

  const removeStockItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one stock item is required.",
      });
    }
  };

  const getTotalItems = () =>
    form
      .getValues("stockIntakePurchaseOrderItems")
      .filter((i) => i.stockVariantId).length;

  const getTotalQuantity = () =>
    form
      .getValues("stockIntakePurchaseOrderItems")
      .filter((i) => i.stockVariantId)
      .reduce((total, i) => total + (i.quantity || 0), 0);

  const onInvalid = useCallback(
    (errors: any) => {
      const getFirstMessage = (obj: any): string | undefined => {
        if (!obj || typeof obj !== "object") return undefined;
        if (typeof obj.message === "string") return obj.message;
        for (const value of Object.values(obj)) {
          const msg = getFirstMessage(value);
          if (msg) return msg;
        }
        return undefined;
      };
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          getFirstMessage(errors) || "Please check all required fields.",
      });
    },
    [toast],
  );

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link.",
      });
    }
  };

  const generateShareLink = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/stock-purchases/share/${id}`;
  };

  const submitData = (values: z.infer<typeof StockPurchaseSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      if (item) {
        console.log("Update logic for existing stock purchase");
      } else {
        createStockPurchase(values)
          .then((data) => {
            if (data && data.responseType === "success") {
              const purchaseOrder = data.data as StockPurchase;
              setPurchaseData(purchaseOrder);
              setSuccess(data.message);
              toast({
                variant: "success",
                title: "Success",
                description: data.message,
              });
              setShowPreview(true);
              const link = generateShareLink(purchaseOrder.orderNumber);
              setShareLink(link);
              setTimeout(() => {
                document
                  .getElementById("lpo-preview")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            } else if (data && data.responseType === "error") {
              setError(
                typeof data.message === "string"
                  ? data.message
                  : "An error occurred.",
              );
            }
          })
          .catch((err) => {
            console.error("Error creating stock purchase:", err);
            setError("An unexpected error occurred. Please try again.");
            toast({
              variant: "destructive",
              title: "Error",
              description: err.message || "Failed to create stock purchase.",
            });
          });
      }
    });
  };

  const handleBackToList = () => {
    setShowPreview(false);
    router.push("/stock-purchases");
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  if (showPreview && purchaseData) {
    const totalQty =
      purchaseData.stockIntakePurchaseOrderItems?.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ) ?? 0;
    const totalItems = purchaseData.stockIntakePurchaseOrderItems?.length ?? 0;

    return (
      <div className="min-h-screen py-8 px-4 sm:px-6" id="lpo-preview">
        <div className="max-w-4xl mx-auto">
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Purchases
            </Button>
          </div>

          <div
            id="lpo-content"
            className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
            style={{ border: `1px solid ${SECONDARY}` }}
          >
            <div className="px-6 lg:px-10 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-4" />
              <div className="lg:text-right">
                <h2
                  className="text-3xl lg:text-4xl font-light tracking-wide mb-2"
                  style={{ color: PRIMARY }}
                >
                  LOCAL PURCHASE ORDER
                </h2>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-semibold text-gray-800">
                    {purchaseData.businessName}
                  </p>
                  {purchaseData.locationName && (
                    <p>{purchaseData.locationName}</p>
                  )}
                  {purchaseData.locationPhone && (
                    <p>Mobile: {purchaseData.locationPhone}</p>
                  )}
                  {purchaseData.locationEmail && (
                    <p>{purchaseData.locationEmail}</p>
                  )}
                </div>
              </div>
            </div>

            <div
              className="mx-6 lg:mx-10"
              style={{ height: 1, backgroundColor: SECONDARY }}
            />

            <div className="px-6 lg:px-10 py-6 flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Supplier
                </p>
                <div className="text-sm text-gray-700 space-y-0.5">
                  <p className="font-semibold text-gray-900">
                    {purchaseData.supplierName}
                  </p>
                  {purchaseData.supplierPhoneNumber && (
                    <p>{purchaseData.supplierPhoneNumber}</p>
                  )}
                  {purchaseData.supplierEmail && (
                    <p>{purchaseData.supplierEmail}</p>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-80">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      {
                        label: "Order Number:",
                        value: purchaseData.orderNumber,
                        mono: true,
                      },
                      {
                        label: "Date Created:",
                        value: purchaseData.dateCreated
                          ? format(
                              new Date(purchaseData.dateCreated),
                              "MMMM dd, yyyy",
                            )
                          : format(new Date(), "MMMM dd, yyyy"),
                      },
                      {
                        label: "Expected Delivery:",
                        value: purchaseData.deliveryDate
                          ? format(
                              new Date(purchaseData.deliveryDate),
                              "MMMM dd, yyyy",
                            )
                          : "Not specified",
                      },
                      { label: "Total Items:", value: totalItems, bold: true },
                      {
                        label: "Total Quantity:",
                        value: totalQty.toLocaleString(),
                        bold: true,
                      },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: `1px solid ${SECONDARY}` }}
                      >
                        <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                          {row.label}
                        </td>
                        <td
                          className={`py-2 text-gray-900 text-right ${
                            (row as any).mono ? "font-mono text-xs" : ""
                          } ${(row as any).bold ? "font-bold" : ""}`}
                        >
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hidden lg:block px-10 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: PRIMARY }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white w-10">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                      Item Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white w-32">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseData.stockIntakePurchaseOrderItems?.map(
                    (item: any, index: number) => (
                      <tr
                        key={item.id}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : `${SECONDARY}40`,
                          borderBottom: `1px solid ${SECONDARY}`,
                        }}
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.stockName}
                          {item.stockVariantName &&
                          item.stockVariantName !== item.stockName
                            ? ` — ${item.stockVariantName}`
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {item.quantity?.toLocaleString()}
                        </td>
                      </tr>
                    ),
                  )}
                  <tr style={{ borderTop: `2px solid ${SECONDARY}` }}>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-sm font-semibold text-right"
                    >
                      Total Quantity:
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {totalQty.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:hidden px-4 mb-6 space-y-3">
              <div
                className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider"
                style={{ backgroundColor: PRIMARY }}
              >
                <span>Item</span>
                <span>Qty</span>
              </div>
              {purchaseData.stockIntakePurchaseOrderItems?.map(
                (item: any, index: number) => (
                  <div
                    key={item.id}
                    className="rounded-lg p-4"
                    style={{
                      border: `1px solid ${SECONDARY}`,
                      backgroundColor:
                        index % 2 === 0 ? "#ffffff" : `${SECONDARY}20`,
                    }}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          <span className="text-gray-400 mr-1">
                            {index + 1}.
                          </span>
                          {item.stockName}
                        </p>
                        {item.stockVariantName &&
                          item.stockVariantName !== item.stockName && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.stockVariantName}
                            </p>
                          )}
                      </div>
                      <p className="text-sm font-bold whitespace-nowrap">
                        {item.quantity?.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                ),
              )}
              <div className="flex justify-between items-center px-4 py-3 rounded-lg font-semibold text-sm">
                <span>
                  Total — {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
                <span>{totalQty.toLocaleString()} units</span>
              </div>
            </div>

            {purchaseData.notes && (
              <div
                className="px-6 lg:px-10 pb-6"
                style={{ borderTop: `1px solid ${SECONDARY}` }}
              >
                <p
                  className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold"
                  style={{ color: PRIMARY }}
                >
                  Special Instructions / Notes
                </p>
                <p
                  className="text-sm text-gray-600 p-4 rounded-lg leading-relaxed whitespace-pre-wrap"
                  style={{
                    backgroundColor: `${SECONDARY}40`,
                    border: `1px solid ${SECONDARY}`,
                  }}
                >
                  {purchaseData.notes}
                </p>
              </div>
            )}

            <div
              className="px-6 lg:px-10 pb-6"
              style={{ borderTop: `1px solid ${SECONDARY}` }}
            >
              <p
                className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold"
                style={{ color: PRIMARY }}
              >
                Terms & Conditions
              </p>
              <ol
                className="space-y-1.5 list-decimal list-inside text-xs text-gray-500 leading-relaxed p-4 rounded-lg"
                style={{
                  backgroundColor: `${SECONDARY}40`,
                  border: `1px solid ${SECONDARY}`,
                }}
              >
                {[
                  "Please confirm receipt of this purchase order within 24 hours.",
                  "Delivery must be made on or before the specified delivery date.",
                  "All items must meet the specified quality standards and match the descriptions provided.",
                  "Invoice should reference the purchase order number for processing.",
                  "Goods received are subject to inspection and approval.",
                  "Payment terms: Net 30 days from date of invoice.",
                ].map((term, i) => (
                  <li key={i} className="pl-1">
                    {term}
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="px-6 lg:px-10 py-6 flex justify-center items-center gap-4"
              style={{ borderTop: `1px solid ${SECONDARY}` }}
            >
              <div className="text-center flex-shrink-0">
                <p className="text-xs lg:text-sm font-semibold">
                  Thank you for your business and continued support
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Powered by Settlo Technologies
                </p>
              </div>
            </div>
          </div>

          <Card className="mt-5 print:hidden border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Share Purchase Order</CardTitle>
              <p className="text-sm text-gray-500">
                Copy and send this link directly to your supplier
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <p className="text-sm font-mono text-gray-600 truncate">
                    {shareLink}
                  </p>
                </div>
                <Button onClick={copyShareLink} className="gap-2 flex-shrink-0">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            @page {
              margin: 0.5in;
            }
          }
        `}</style>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full  mx-auto px-4 sm:px-6 py-6">
      {/* ── Page header — matches modal DialogTitle style ── */}
      <div className="flex items-center gap-2.5 mb-6">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: PRIMARY_LIGHT }}
        >
          <ClipboardList className="w-4 h-4" style={{ color: PRIMARY }} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            {item ? "Edit Purchase Order" : "New Purchase Order"}
          </h1>
          <p className="text-xs text-gray-500">
            {item
              ? "Update the details of this local purchase order"
              : "Create a local purchase order to send to your supplier"}
          </p>
        </div>
      </div>

      {/* ── White card — same feel as the modal DialogContent ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-5"
          >
            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            {/* ── ORDER SUMMARY section header ─────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Order Summary
              </p>
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: PRIMARY_LIGHT,
                  borderColor: `${PRIMARY}25`,
                }}
              >
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${PRIMARY}22` }}
                    >
                      <Hash
                        className="w-3.5 h-3.5"
                        style={{ color: PRIMARY }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-medium leading-none mb-0.5"
                        style={{ color: `${PRIMARY}bb` }}
                      >
                        Items
                      </p>
                      <p
                        className="text-base font-bold leading-none"
                        style={{ color: PRIMARY }}
                      >
                        {getTotalItems()}
                      </p>
                    </div>
                  </div>
                  <div
                    className="h-7 w-px"
                    style={{ backgroundColor: `${PRIMARY}30` }}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${PRIMARY}22` }}
                    >
                      <Package
                        className="w-3.5 h-3.5"
                        style={{ color: PRIMARY }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-medium leading-none mb-0.5"
                        style={{ color: `${PRIMARY}bb` }}
                      >
                        Total Qty
                      </p>
                      <p
                        className="text-base font-bold leading-none"
                        style={{ color: PRIMARY }}
                      >
                        {getTotalQuantity()}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addStockItem}
                  className="gap-1.5 text-white text-xs h-8 px-3 shadow-sm"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>
            </div>

            <Separator />

            {/* ── STOCK ITEMS section ───────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Stock Items <span className="text-red-400 normal-case">*</span>
              </p>

              <div className="space-y-2.5">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
                  >
                    {/* Numbered badge */}
                    <div className="hidden md:flex md:col-span-1 items-center justify-center pt-6">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        {index + 1}
                      </span>
                    </div>

                    <div className="md:col-span-7">
                      <FormField
                        control={form.control}
                        name={`stockIntakePurchaseOrderItems.${index}.stockVariantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              {fields.length > 1
                                ? `Item #${index + 1}`
                                : "Stock Item"}
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelector
                                {...field}
                                value={field.value}
                                isDisabled={isPending || !!item}
                                onChange={field.onChange}
                                placeholder="Select stock item"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`stockIntakePurchaseOrderItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Quantity
                            </FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-colors"
                                value={field.value}
                                disabled={isPending}
                                placeholder="0"
                                thousandSeparator={true}
                                allowNegative={false}
                                onValueChange={(values) => {
                                  field.onChange(
                                    Number(values.value.replace(/,/g, "")),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeStockItem(index)}
                        disabled={fields.length <= 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ghost add-row button */}
              <button
                type="button"
                onClick={addStockItem}
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add another item
              </button>
            </div>

            <Separator />

            {/* ── SUPPLIER & DELIVERY section ───────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Supplier & Delivery
              </p>

              <div className="space-y-3">
                {/* Supplier row — selector + add button side by side */}
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-gray-700">
                        Supplier <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2 items-start">
                        <FormControl className="flex-1">
                          <SupplierSelector
                            key={supplierSelectorKey}
                            {...field}
                            isDisabled={!!item || isPending}
                            placeholder="Select supplier"
                            label="Select supplier"
                          />
                        </FormControl>
                        {!item && (
                          <CreateSupplierModal
                            onCreated={() => {
                              setSupplierSelectorKey((k) => k + 1);
                              toast({
                                title: "Supplier added",
                                description:
                                  "You can now select the new supplier from the list.",
                              });
                            }}
                          />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery date */}
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-gray-700">
                        Expected Delivery Date{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          field={field}
                          date={deliveryDate}
                          setDate={setDeliveryDate}
                          handleTimeChange={handleTimeChange}
                          onDateSelect={handleDeliveryDateSelect}
                          minDate={new Date()}
                          disabled={!!item}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* ── NOTES section ─────────────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Special Instructions
              </p>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">
                      Notes{""} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add special instructions for this order…"
                        {...field}
                        disabled={isPending}
                        maxLength={500}
                        className="min-h-[90px] text-sm border-gray-200 resize-none focus-visible:ring-1 focus-visible:ring-orange-400 focus-visible:border-orange-400"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-400 mt-1">
                      {field.value?.length || 0}/500
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Actions ───────────────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 pt-1">
              <CancelButton />
              <Button
                type="submit"
                disabled={isPending}
                className="text-white text-sm h-9 min-w-[180px] shadow-sm"
                style={{ backgroundColor: PRIMARY }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {item ? "Updating…" : "Creating…"}
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    {item ? "Update Purchase" : "Create Purchase Order"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default StockPurchaseForm;
