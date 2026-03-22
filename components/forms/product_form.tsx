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
  Settings,
  Tag,
  Sparkles,
  Type,
  DollarSign,
  Hash,
  Barcode,
  Ruler,
  Box,
  ChefHat,
  ChevronDown,
  ChevronUp,
  ImageIcon,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Product } from "@/types/product/type";
import { FormResponse } from "@/types/types";
import { ProductSchema } from "@/types/product/schema";
import BrandSelector from "@/components/widgets/brand-selector";
import DepartmentSelector from "@/components/widgets/department-selector";
import CategorySelector from "../widgets/category-selector";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import RecipeSelector from "@/components/widgets/recipe-selector";
import UnitSelector from "@/components/widgets/unit-selector";
import TaxClassSelector from "@/components/widgets/tax-class-selector";

type ProductFormProps = {
  item: Product | null | undefined;
};

// ─── Shared style constants ──────────────────────────────────────────────────

const inputClass =
  "flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const numericInputClass =
  "flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductForm({ item }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [imageUrl, setImageUrl] = useState(item?.image || "");
  const { toast } = useToast();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [collapsedVariants, setCollapsedVariants] = useState<
    Record<number, boolean>
  >({});
  const [archiveVariantIndex, setArchiveVariantIndex] = useState<number | null>(
    null,
  );

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: item?.name,
      description: item?.description || "",
      category: item?.category,
      department: item?.department || null,
      brand: item?.brand || "",
      sku: item?.sku,
      sellOnline: item?.sellOnline || false,
      taxIncluded: item?.taxIncluded || false,
      taxClass: item?.taxClass || "1",
      status: item?.status ?? true,
      image: item?.image || "",
      trackInventory: item?.trackInventory || false,
      trackingType: item?.variants?.[0]?.trackingType || null,
      variants: item?.variants.map((variant) => ({
        ...variant,
        trackingType: variant.trackingType || null,
        stockItem: variant.trackingType === "STOCK" ? variant.trackItem : null,
        recipeItem:
          variant.trackingType === "RECIPE" ? variant.trackItem : null,
        trackItem: variant.trackItem || null,
        unit: variant.unit || null,
        barcode: variant.barcode || null,
        purchasingPrice: variant.purchasingPrice || 0,
      })) || [{}],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  useEffect(() => {
    form.watch("trackingType");
  }, [form.watch("trackingType")]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "trackingType") {
        fields.forEach((_, index) => {
          form.setValue(`variants.${index}.stockItem`, null);
          form.setValue(`variants.${index}.recipeItem`, null);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, fields]);

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const handleTrackingTypeSelect = (type: string) => {
    form.setValue("trackInventory", true);
    form.setValue("trackingType", type);

    fields.forEach((_, index) => {
      form.setValue(`variants.${index}.trackInventory`, true);
      form.setValue(`variants.${index}.trackingType`, type);
      form.setValue(`variants.${index}.stockItem`, null);
      form.setValue(`variants.${index}.recipeItem`, null);
      form.setValue(`variants.${index}.trackItem`, null);
    });

    setShowTrackingModal(false);
  };

  const handleTrackingDisable = () => {
    form.setValue("trackInventory", false);
    form.setValue("trackingType", null);

    fields.forEach((_, index) => {
      form.setValue(`variants.${index}.trackInventory`, false);
      form.setValue(`variants.${index}.trackingType`, null);
      form.setValue(`variants.${index}.stockItem`, null);
      form.setValue(`variants.${index}.recipeItem`, null);
    });
  };

  const handleAppendVariant = () => {
    const currentTrackInventory = form.getValues("trackInventory");
    const currentTrackingType = form.getValues("trackingType");

    append({
      name: "",
      price: 0,
      sku: "",
      barcode: "",
      description: "",
      unit: null,
      image: "",
      trackInventory: currentTrackInventory || false,
      trackingType: currentTrackingType || null,
      stockItem: null,
      recipeItem: null,
      trackItem: null,
      purchasingPrice: 0,
    });
  };

  const toggleVariantCollapse = (index: number) => {
    setCollapsedVariants((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleVariantRemove = (index: number) => {
    if (item) {
      // Editing — show archive confirmation
      setArchiveVariantIndex(index);
    } else {
      // Creating — just remove from the field array
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
      toast({
        title: "Archived",
        description: `${variant.name} has been archived successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to archive variant",
        description:
          (error as Error).message || "Please try again later.",
      });
    } finally {
      setArchiveVariantIndex(null);
    }
  };

  const submitData = (values: z.infer<typeof ProductSchema>) => {
    const updatedValues = { ...values };

    updatedValues.variants = updatedValues.variants.map((variant, index) => {
      const trackingType = form.getValues(`variants.${index}.trackingType`);

      const trackItem =
        trackingType === "STOCK"
          ? form.getValues(`variants.${index}.stockItem`)
          : trackingType === "RECIPE"
            ? form.getValues(`variants.${index}.recipeItem`)
            : null;

      return {
        ...variant,
        trackItem: trackItem || variant.trackItem,
      };
    });

    const result = ProductSchema.safeParse(updatedValues);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: "Please check your inputs and try again.",
      });
      return;
    }

    const stored = localStorage.getItem("pagination-products");
    const paginationState = stored ? JSON.parse(stored) : null;
    setResponse(undefined);

    const productData = {
      ...result.data,
      image: imageUrl,
    };

    startTransition(() => {
      if (item) {
        updateProduct(item.id, productData, paginationState).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({
              variant: "success",
              title: "Success",
              description: "Product updated successfully",
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
              description: "Product created successfully",
            });
          }
        });
      }
    });
  };

  const handleGenerateDescription = async () => {
    const name = form.getValues("name");
    const category = form.getValues("category");

    if (!name || !category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description:
          "Please enter a product name and select a category first.",
      });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const aiDescription = await generateAIDescription(name, category);
      form.setValue("description", aiDescription);
    } catch {
      toast({
        variant: "destructive",
        title: "Description Generation Failed",
        description: "Unable to generate description. Please try again.",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* ── Basic Information ──────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Basic Information
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Product name, image, and description
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image */}
                <div className="flex flex-col items-center">
                  <UploadImageWidget
                    imagePath="products"
                    displayStyle="default"
                    displayImage={true}
                    showLabel={true}
                    label="Upload product image"
                    setImage={setImageUrl}
                    image={imageUrl}
                  />
                </div>

                {/* Name & Description */}
                <div className="lg:col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Type className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              className="pl-10"
                              placeholder="Enter product name"
                              {...field}
                              disabled={isPending}
                            />
                          </div>
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
                            placeholder="Enter product description"
                            disabled={isPending}
                            className="resize-none h-28"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Classification ─────────────────────────────────────────── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Classification
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Organize your product by category, department, and brand
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <span className="text-red-500">*</span>
                      </FormLabel>
                      <CategorySelector
                        {...field}
                        placeholder="Select category"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <DepartmentSelector
                        {...field}
                        value={field.value ?? ""}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <BrandSelector {...field} value={field.value ?? ""} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* ── Settings ───────────────────────────────────────────────── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Settings
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Inventory tracking, tax, and online sales options
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trackInventory"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Track Inventory
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Enable stock or recipe tracking for this product
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setShowTrackingModal(true);
                            } else {
                              field.onChange(false);
                              handleTrackingDisable();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellOnline"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Sell Online
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Make available in your online store
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
                  name="taxClass"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Tax Class
                        </FormLabel>
                      </div>
                      <FormControl>
                        <TaxClassSelector
                          {...field}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Select tax class"
                          isRequired
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxIncluded"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Tax Included
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Include tax in the selling price
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Product Variants ──────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-400" />
                  Product Variants
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add at least one variant for this product
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAppendVariant}
                disabled={isPending}
                className="h-9"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const variantName = form.watch(`variants.${index}.name`);
                const isCollapsed = collapsedVariants[index] ?? false;

                return (
                  <div
                    key={field.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                  >
                    {/* Variant header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                        {variantName || `Variant ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-1">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleVariantCollapse(index)}
                            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleVariantRemove(index)}
                          disabled={fields.length === 1 || isPending}
                          className="p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {item ? (
                            <Archive className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Variant body */}
                    {!isCollapsed && (
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Variant Name */}
                          <FormField
                            control={form.control}
                            name={`variants.${index}.name`}
                            render={({ field }) => (
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
                                      {...field}
                                      disabled={isPending}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Selling Price */}
                          <FormField
                            control={form.control}
                            name={`variants.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Selling Price{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <NumericFormat
                                      className={numericInputClass}
                                      value={field.value}
                                      onValueChange={(values) => {
                                        field.onChange(Number(values.value));
                                      }}
                                      thousandSeparator={true}
                                      placeholder="0"
                                      disabled={isPending}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Purchasing Price (only when NOT tracking inventory) */}
                          {!form.watch("trackInventory") && (
                            <FormField
                              control={form.control}
                              name={`variants.${index}.purchasingPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Purchasing Price</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                      <NumericFormat
                                        className={numericInputClass}
                                        value={field.value ?? 0}
                                        onValueChange={(values) => {
                                          field.onChange(Number(values.value));
                                        }}
                                        thousandSeparator={true}
                                        placeholder="0"
                                        disabled={isPending}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
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
                                      {...field}
                                      placeholder="Enter SKU"
                                      disabled={isPending}
                                      value={field.value ?? ""}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Barcode */}
                          <FormField
                            control={form.control}
                            name={`variants.${index}.barcode`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Barcode</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                      className="pl-10"
                                      {...field}
                                      placeholder="Enter barcode"
                                      disabled={isPending}
                                      value={field.value ?? ""}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Unit */}
                          <FormField
                            control={form.control}
                            name={`variants.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <FormControl>
                                  <UnitSelector
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Select unit"
                                    isDisabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Stock Item (when tracking as STOCK) */}
                          {form.watch("trackingType") === "STOCK" && (
                            <FormField
                              control={form.control}
                              name={`variants.${index}.stockItem`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>
                                    Stock Item{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <StockVariantSelector
                                      value={formField.value ?? ""}
                                      isDisabled={isPending}
                                      placeholder="Select stock item"
                                      onChange={(value) => {
                                        formField.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Recipe Item (when tracking as RECIPE) */}
                          {form.watch("trackingType") === "RECIPE" && (
                            <FormField
                              control={form.control}
                              name={`variants.${index}.recipeItem`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>
                                    Recipe{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <RecipeSelector
                                      value={formField.value ?? ""}
                                      placeholder="Select recipe"
                                      isDisabled={isPending}
                                      onChange={(value) => {
                                        formField.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add another variant (dashed button) */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAppendVariant}
              disabled={isPending}
              className="w-full border-dashed h-10 text-sm text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add another variant
            </Button>
          </CardContent>
        </Card>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update product" : "Create product"}
          />
        </div>
      </form>

      {/* ── Tracking Type Modal ───────────────────────────────────────── */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Tracking Type</DialogTitle>
            <DialogDescription>
              Choose how you want to track this product&apos;s inventory
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <button
              type="button"
              onClick={() => handleTrackingTypeSelect("STOCK")}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Track as Stock Item
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Link to an existing stock item for quantity tracking
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTrackingTypeSelect("RECIPE")}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Track as Recipe
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Link to a recipe to auto-deduct ingredients on sale
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Variant Archive Modal ─────────────────────────────────────── */}
      <DeleteModal
        isOpen={archiveVariantIndex !== null}
        itemName={
          archiveVariantIndex !== null
            ? form.watch(`variants.${archiveVariantIndex}.name`) ||
              `Variant ${archiveVariantIndex + 1}`
            : ""
        }
        onDelete={handleVariantArchive}
        onOpenChange={() => setArchiveVariantIndex(null)}
      />
    </Form>
  );
}
