"use client";

import React, { useCallback, useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Archive,
  Trash2,
  Plus,
  Package,
  Sparkles,
  Tag,
  DollarSign,
  Hash,
  Box,
  ChevronDown,
  ChevronUp,
  Link2,
  Beaker,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import {
  createProduct,
  deleteVariant,
  generateAIDescription,
  updateProduct,
} from "@/lib/actions/product-actions";
import DeleteModal from "@/components/tables/delete-modal";
import { Product } from "@/types/product/type";
import { FormResponse } from "@/types/types";
import { ProductSchema } from "@/types/product/schema";
import BrandSelector from "@/components/widgets/brand-selector";
import DepartmentSelector from "@/components/widgets/department-selector";
import CategorySelector from "../widgets/category-selector";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import TaxClassSelector from "@/components/widgets/tax-class-selector";

type ProductFormProps = {
  item: Product | null | undefined;
};

const numericInputClass =
  "flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10";

export default function ProductForm({ item }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [collapsedVariants, setCollapsedVariants] = useState<
    Record<number, boolean>
  >({});
  const [archiveVariantIndex, setArchiveVariantIndex] = useState<number | null>(
    null,
  );
  const { toast } = useToast();

  const isEditing = !!item;

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      categoryIds: item?.categories?.map((c) => c.id) ?? [],
      departmentId: item?.departmentId ?? null,
      brandId: item?.brandId ?? "",
      imageUrl: imageUrl || item?.imageUrl || "",
      sellOnline: item?.sellOnline ?? true,
      trackStock: item?.trackStock ?? false,
      taxInclusive: item?.taxInclusive ?? false,
      taxClass: item?.taxClass ?? null,
      active: item?.active ?? true,
      tags: item?.tags ?? [],
      lifecycleStatus: item?.lifecycleStatus ?? "ACTIVE",
      variants: item?.variants?.length
        ? item.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            costPrice: v.costPrice ?? undefined,
            sku: v.sku,
            imageUrl: v.imageUrl,
            pricingStrategy: v.pricingStrategy ?? "MANUAL",
            markupPercentage: v.markupPercentage,
            markupAmount: v.markupAmount,
            unlimited: v.unlimited,
            availableQuantity: v.availableQuantity,
            stockLinkType: v.stockLinkType,
            stockVariantId: v.stockVariantId,
            directQuantity: v.directQuantity,
            consumptionRuleId: v.consumptionRuleId,
          }))
        : [{ name: "", price: 0, pricingStrategy: "MANUAL", unlimited: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const isMultiVariant = fields.length > 1;

  // ── Name sync: in single variant mode, variant[0] name = product name ──
  const productName = form.watch("name");
  useEffect(() => {
    if (!isMultiVariant && !isEditing) {
      const currentVariantName = form.getValues("variants.0.name");
      // Only sync if variant name is empty or was previously synced
      if (
        !currentVariantName ||
        currentVariantName === form.getValues("name")
      ) {
        // This will be set on next render via the watched value
      }
    }
  }, [productName, isMultiVariant, isEditing, form]);

  // ── Handlers ──────────────────────────────────────────────────────

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log(errors);
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const handleAddVariant = () => {
    const trackStock = form.getValues("trackStock");

    if (fields.length === 1 && !form.getValues("variants.0.name")) {
      form.setValue("variants.0.name", form.getValues("name"));
    }
    append({
      name: "",
      price: 0,
      pricingStrategy: "MANUAL",
      unlimited: !trackStock,
      stockLinkType: null,
      stockVariantId: null,
      consumptionRuleId: null,
    });
  };

  const toggleCollapse = (index: number) => {
    setCollapsedVariants((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleVariantRemove = (index: number) => {
    if (item) {
      setArchiveVariantIndex(index);
    } else {
      remove(index);
    }
  };

  const handleVariantArchive = async () => {
    if (archiveVariantIndex === null) return;
    const variant = item?.variants?.[archiveVariantIndex];
    if (!variant || !item) return;

    try {
      await deleteVariant(item.id, variant.id);
      remove(archiveVariantIndex);
      toast({ title: "Archived", description: `${variant.name} archived.` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to archive variant",
      });
    } finally {
      setArchiveVariantIndex(null);
    }
  };

  const handleGenerateDescription = async () => {
    const name = form.getValues("name");
    const categoryIds = form.getValues("categoryIds");
    if (!name || !categoryIds?.length) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Enter a product name and select a category first.",
      });
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const desc = await generateAIDescription(name, categoryIds[0]);
      form.setValue("description", desc);
    } catch {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Unable to generate description.",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleTrackStockToggle = (enabled: boolean) => {
    form.setValue("trackStock", enabled);
    fields.forEach((_, index) => {
      if (enabled) {
        form.setValue(`variants.${index}.unlimited`, false);
      } else {
        form.setValue(`variants.${index}.stockLinkType`, null);
        form.setValue(`variants.${index}.stockVariantId`, null);
        form.setValue(`variants.${index}.consumptionRuleId`, null);
      }
    });
  };

  const submitData = (values: z.infer<typeof ProductSchema>) => {
    // In single variant mode, sync variant name to product name
    if (!isMultiVariant) {
      values.variants[0].name = values.name;
    }

    const result = ProductSchema.safeParse(values);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: "Check your inputs.",
      });
      return;
    }

    const stored = localStorage.getItem("pagination-products");
    const paginationState = stored ? JSON.parse(stored) : null;
    setResponse(undefined);

    const productData = { ...result.data, imageUrl: imageUrl };

    startTransition(() => {
      if (item) {
        updateProduct(item.id, productData, paginationState).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({
              variant: "success",
              title: "Success",
              description: "Product updated.",
            });
          }
        });
      } else {
        createProduct(productData).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({
              variant: "success",
              title: "Success",
              description: "Product created.",
            });
          }
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sync single-variant name before validation fires
    if (!isMultiVariant) {
      form.setValue("variants.0.name", form.getValues("name"));
    }

    // Now trigger RHF validation + submitData
    form.handleSubmit(submitData, onInvalid)();
  };

  // ── Render helpers ────────────────────────────────────────────────

  const renderPricingFields = (index: number) => {
    const strategy =
      form.watch(`variants.${index}.pricingStrategy`) || "MANUAL";

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pricing Strategy */}
        <FormField
          control={form.control}
          name={`variants.${index}.pricingStrategy`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing</FormLabel>
              <Select
                value={field.value || "MANUAL"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual Price</SelectItem>
                  <SelectItem value="PERCENTAGE_MARKUP">% Markup</SelectItem>
                  <SelectItem value="FIXED_MARKUP">Fixed Markup</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Price (always shown for MANUAL, computed for markup strategies) */}
        <FormField
          control={form.control}
          name={`variants.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Selling Price{" "}
                {strategy === "MANUAL" && (
                  <span className="text-red-500">*</span>
                )}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <NumericFormat
                    className={numericInputClass}
                    value={field.value}
                    onValueChange={(v) => field.onChange(Number(v.value))}
                    thousandSeparator
                    placeholder="0"
                    disabled={isPending || strategy !== "MANUAL"}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cost Price */}
        <FormField
          control={form.control}
          name={`variants.${index}.costPrice`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Price</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <NumericFormat
                    className={numericInputClass}
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(v.value ? Number(v.value) : undefined)
                    }
                    thousandSeparator
                    placeholder="0"
                    disabled={isPending}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Markup % (for PERCENTAGE_MARKUP) */}
        {strategy === "PERCENTAGE_MARKUP" && (
          <FormField
            control={form.control}
            name={`variants.${index}.markupPercentage`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Markup %</FormLabel>
                <FormControl>
                  <NumericFormat
                    className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(v.value ? Number(v.value) : undefined)
                    }
                    suffix="%"
                    placeholder="25%"
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Markup Amount (for FIXED_MARKUP) */}
        {strategy === "FIXED_MARKUP" && (
          <FormField
            control={form.control}
            name={`variants.${index}.markupAmount`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Markup Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <NumericFormat
                      className={numericInputClass}
                      value={field.value ?? ""}
                      onValueChange={(v) =>
                        field.onChange(v.value ? Number(v.value) : undefined)
                      }
                      thousandSeparator
                      placeholder="0"
                      disabled={isPending}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* SKU */}
        <FormField
          control={form.control}
          name={`variants.${index}.sku`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    className="pl-10"
                    placeholder="Auto-generated"
                    {...field}
                    value={field.value ?? ""}
                    disabled={isPending}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );
  };

  const renderStockFields = (index: number) => {
    const trackStock = form.watch("trackStock");
    const stockLinkType = form.watch(`variants.${index}.stockLinkType`);

    if (trackStock) {
      return (
        <div className="space-y-3 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Link2 className="h-4 w-4" />
            Stock Tracking
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Link type */}
            <FormField
              control={form.control}
              name={`variants.${index}.stockLinkType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Link Type</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select link type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DIRECT">Direct Stock Item</SelectItem>
                      <SelectItem value="FIXED">
                        Consumption Rule (Fixed)
                      </SelectItem>
                      <SelectItem value="SCALED">
                        Consumption Rule (Scaled)
                      </SelectItem>
                      <SelectItem value="FORMULA">
                        Consumption Rule (Formula)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Stock Variant (for DIRECT) */}
            {stockLinkType === "DIRECT" && (
              <>
                <FormField
                  control={form.control}
                  name={`variants.${index}.stockVariantId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Stock Item</FormLabel>
                      <FormControl>
                        <StockVariantSelector
                          placeholder="Select stock item"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          isDisabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.directQuantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Units per sale</FormLabel>
                      <FormControl>
                        <NumericFormat
                          className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                          value={field.value ?? 1}
                          onValueChange={(v) =>
                            field.onChange(v.value ? Number(v.value) : 1)
                          }
                          placeholder="1"
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* BOM rules auto-resolve at deduction time by (business, location,
                product_variant) — no rule pointer stored on the variant. */}
          </div>
        </div>
      );
    }

    // Non-tracked: manual quantity + unlimited toggle
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name={`variants.${index}.availableQuantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs flex items-center gap-1">
                <Box className="h-3 w-3" />
                Available Quantity
              </FormLabel>
              <FormControl>
                <NumericFormat
                  className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                  value={field.value ?? ""}
                  onValueChange={(v) =>
                    field.onChange(v.value ? Number(v.value) : undefined)
                  }
                  thousandSeparator
                  placeholder="0"
                  disabled={
                    isPending || form.watch(`variants.${index}.unlimited`)
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`variants.${index}.unlimited`}
          render={({ field }) => (
            <FormItem className="flex items-end gap-3 pb-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormLabel className="text-xs flex items-center gap-1 cursor-pointer mb-0">
                <Infinity className="h-3 w-3" />
                Unlimited
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section 1: Product Details ──────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Image */}
              <div className="flex flex-col items-center">
                <UploadImageWidget
                  imagePath="products"
                  displayStyle="default"
                  displayImage={true}
                  showLabel={true}
                  label="Product Image"
                  setImage={setImageUrl}
                  image={imageUrl}
                />
              </div>

              {/* Name + Description */}
              <div className="lg:col-span-3 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Product Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product name"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Description</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleGenerateDescription}
                          disabled={isGeneratingDescription || isPending}
                          className="text-xs h-7 gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isGeneratingDescription
                            ? "Generating..."
                            : "AI Generate"}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Describe your product"
                          disabled={isPending}
                          className="resize-none h-20"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <CategorySelector
                      placeholder="Select category"
                      value={field.value?.[0] || ""}
                      onChange={(val) => field.onChange(val ? [val] : [])}
                      onBlur={field.onBlur}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <DepartmentSelector {...field} value={field.value ?? ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <BrandSelector {...field} value={field.value ?? ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Settings row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="sellOnline"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center rounded-lg border p-3 space-y-0">
                    <FormLabel className="text-sm cursor-pointer">
                      Sell Online
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trackStock"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center rounded-lg border p-3 space-y-0">
                    <FormLabel className="text-sm cursor-pointer">
                      Track Stock
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(v) =>
                          handleTrackStockToggle(v as boolean)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxInclusive"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center rounded-lg border p-3 space-y-0">
                    <FormLabel className="text-sm cursor-pointer">
                      Tax Inclusive
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Class</FormLabel>
                    <TaxClassSelector {...field} value={field.value ?? ""} />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Pricing & Variants ──────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-400" />
                  {isMultiVariant ? "Product Variants" : "Pricing"}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isMultiVariant
                    ? "Manage variants for this product"
                    : "Set the price for your product"}
                </p>
              </div>
              {!isMultiVariant && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Variant
                </Button>
              )}
              {isMultiVariant && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Variant
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const variantName =
                  form.watch(`variants.${index}.name`) ||
                  `Variant ${index + 1}`;
                const isCollapsed = collapsedVariants[index] ?? false;

                return (
                  <div
                    key={field.id}
                    className={
                      isMultiVariant ? "border rounded-xl overflow-hidden" : ""
                    }
                  >
                    {/* Variant header (multi-variant only) */}
                    {isMultiVariant && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                          {variantName}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleCollapse(index)}
                            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVariantRemove(index)}
                            disabled={fields.length === 1 || isPending}
                            className="p-1.5 rounded-md hover:bg-amber-50 text-gray-400 hover:text-amber-600 disabled:opacity-40 disabled:pointer-events-none"
                          >
                            {item ? (
                              <Archive className="w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Variant body */}
                    {!isCollapsed && (
                      <div
                        className={
                          isMultiVariant ? "p-5 space-y-4" : "space-y-4"
                        }
                      >
                        {/* Variant name (multi-variant only) */}
                        {isMultiVariant && (
                          <FormField
                            control={form.control}
                            name={`variants.${index}.name`}
                            render={({ field: nameField }) => (
                              <FormItem>
                                <FormLabel>
                                  Variant Name{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                      className="pl-10"
                                      placeholder="e.g. Small, Regular, Large"
                                      {...nameField}
                                      disabled={isPending}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Pricing fields */}
                        {renderPricingFields(index)}

                        {/* Stock / Quantity fields */}
                        {renderStockFields(index)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Status (edit only) ──────────────────────── */}
        {isEditing && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center rounded-lg border p-4 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm cursor-pointer">
                          Active
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {field.value
                            ? "Product is visible"
                            : "Product is hidden"}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lifecycleStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifecycle Status</FormLabel>
                      <Select
                        value={field.value || "ACTIVE"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="DISCONTINUED">
                            Discontinued
                          </SelectItem>
                          <SelectItem value="END_OF_LIFE">
                            End of Life
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update product" : "Create product"}
          />
        </div>
      </form>

      {/* Archive variant modal */}
      {archiveVariantIndex !== null && (
        <DeleteModal
          isOpen={archiveVariantIndex !== null}
          itemName={item?.variants?.[archiveVariantIndex]?.name || "variant"}
          onDelete={handleVariantArchive}
          onOpenChange={() => setArchiveVariantIndex(null)}
        />
      )}
    </Form>
  );
}
