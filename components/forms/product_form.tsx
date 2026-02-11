"use client";

import React, { useCallback, useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Trash2,
  Plus,
  ListPlus,
  Settings,
  Building2,
  Info,
  Sparkles,
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
import { CardContent, Card } from "@/components/ui/card";
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
  generateAIDescription,
  updateProduct,
} from "@/lib/actions/product-actions";
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

export default function ProductForm({ item }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [imageUrl, setImageUrl] = useState(item?.image || "");
  const { toast } = useToast();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

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

  // DEBUG: Watch trackingType changes
  useEffect(() => {
    const trackingType = form.watch("trackingType");
    console.log("🔍 [FORM] TrackingType changed to:", trackingType);
  }, [form.watch("trackingType")]);

  // Clear both stockItem and recipeItem when trackingType changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "trackingType") {
        console.log("🧹 [FORM] Clearing items due to trackingType change");
        fields.forEach((_, index) => {
          const currentStockItem = form.getValues(
            `variants.${index}.stockItem`,
          );
          const currentRecipeItem = form.getValues(
            `variants.${index}.recipeItem`,
          );

          console.log(`🧹 [FORM] Variant ${index} before clear:`, {
            stockItem: currentStockItem,
            recipeItem: currentRecipeItem,
          });

          form.setValue(`variants.${index}.stockItem`, null);
          form.setValue(`variants.${index}.recipeItem`, null);

          console.log(`✅ [FORM] Variant ${index} after clear - set to null`);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, fields]);

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("❌ [FORM] Validation errors:", errors);
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const handleTrackingTypeSelect = (type: string) => {
    console.log("🎯 [FORM] handleTrackingTypeSelect called with type:", type);

    form.setValue("trackInventory", true);
    form.setValue("trackingType", type);

    fields.forEach((_, index) => {
      console.log(`🔄 [FORM] Setting variant ${index} trackingType to:`, type);
      form.setValue(`variants.${index}.trackInventory`, true);
      form.setValue(`variants.${index}.trackingType`, type);
      form.setValue(`variants.${index}.stockItem`, null);
      form.setValue(`variants.${index}.recipeItem`, null);
      form.setValue(`variants.${index}.trackItem`, null);
    });

    setShowTrackingModal(false);

    // Verify the values were set
    setTimeout(() => {
      const trackingType = form.getValues("trackingType");
      console.log("✅ [FORM] Verified trackingType after modal:", trackingType);
      fields.forEach((_, index) => {
        const variantTrackingType = form.getValues(
          `variants.${index}.trackingType`,
        );
        console.log(
          `✅ [FORM] Verified variant ${index} trackingType:`,
          variantTrackingType,
        );
      });
    }, 100);
  };

  const handleTrackingDisable = () => {
    console.log("🚫 [FORM] handleTrackingDisable called");

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

    console.log("➕ [FORM] Adding variant with:", {
      trackInventory: currentTrackInventory,
      trackingType: currentTrackingType,
    });

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

  const submitData = (values: z.infer<typeof ProductSchema>) => {
    console.log("📤 [SUBMIT] Starting submission process");
    console.log(
      "📤 [SUBMIT] Raw form values:",
      JSON.stringify(values, null, 2),
    );
    // First, update the form values with trackItem
    const updatedValues = { ...values };

    updatedValues.variants = updatedValues.variants.map((variant, index) => {
      const trackingType = form.getValues(`variants.${index}.trackingType`);

      // Get the correct trackItem from the form fields
      const trackItem =
        trackingType === "STOCK"
          ? form.getValues(`variants.${index}.stockItem`)
          : trackingType === "RECIPE"
            ? form.getValues(`variants.${index}.recipeItem`)
            : null;

      console.log(`Variant ${index}:`, {
        trackingType,
        stockItem: form.getValues(`variants.${index}.stockItem`),
        recipeItem: form.getValues(`variants.${index}.recipeItem`),
        trackItem,
      });

      return {
        ...variant,
        trackItem: trackItem || variant.trackItem,
      };
    });

    console.log(
      "Updated values with trackItem:",
      JSON.stringify(updatedValues, null, 2),
    );

    // Now validate
    const result = ProductSchema.safeParse(updatedValues);

    if (!result.success) {
      console.log(
        "Zod validation errors:",
        JSON.stringify(result.error, null, 2),
      );
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

    console.log(
      "🚀 [SUBMIT] Sending to API:",
      JSON.stringify(productData, null, 2),
    );

    startTransition(() => {
      if (item) {
        updateProduct(item.id, productData, paginationState).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({
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
        description: "Please enter a product name and select a category first.",
      });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const aiDescription = await generateAIDescription(name, category);
      form.setValue("description", aiDescription);
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        variant: "destructive",
        title: "Description Generation Failed",
        description: "Unable to generate description. Please try again.",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6 max-w-[1400px] mx-auto"
      >
        {/* Top Section - Basic Info and Settings */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <Card className=" mt-4 lg:col-span-2">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <div className="flex flex-col items-center mb-6">
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
                </div>

                <div className="col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
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
                            variant="default"
                            size="sm"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDescription || isPending}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI Description
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Enter product description"
                            disabled={isPending}
                            className="resize-none h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="lg:my-6" />

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Classification
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
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
            </CardContent>
          </Card>

          {/* Right Column - Settings */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="trackInventory"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Track Inventory</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable inventory tracking
                        </div>
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
                    <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Sell Online</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make available in online store
                        </div>
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
                    <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Tax class</FormLabel>
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
                    <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Tax Included</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Include tax in price
                        </div>
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
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Variants */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ListPlus className="w-5 h-5" />
                  Product Variants
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add at least one variant for this product
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAppendVariant}
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Variant {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1 || isPending}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Variant Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter variant name"
                                {...field}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!form.watch("trackInventory") && (
                        <FormField
                          control={form.control}
                          name={`variants.${index}.purchasingPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purchasing Price</FormLabel>
                              <FormControl>
                                <NumericFormat
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                  value={field.value ?? 0}
                                  onValueChange={(values) => {
                                    field.onChange(Number(values.value));
                                  }}
                                  thousandSeparator={true}
                                  placeholder="Enter purchase price"
                                  disabled={isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selling Price</FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={field.value}
                                onValueChange={(values) => {
                                  field.onChange(Number(values.value));
                                }}
                                thousandSeparator={true}
                                placeholder="Enter selling price"
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.sku`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter SKU"
                                disabled={isPending}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.barcode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter barcode"
                                disabled={isPending}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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

                      {/* SEPARATE FIELDS - Stock Item */}
                      {/* SEPARATE FIELDS - Stock Item */}
                      {form.watch("trackingType") === "STOCK" && (
                        <FormField
                          control={form.control}
                          name={`variants.${index}.stockItem`}
                          render={({ field: formField }) => {
                            console.log(
                              `🏪 [RENDER] StockVariantSelector rendering for variant ${index}:`,
                              {
                                trackingType: form.watch("trackingType"),
                                value: formField.value,
                              },
                            );

                            return (
                              <FormItem>
                                <FormLabel>Stock Item</FormLabel>
                                <FormControl>
                                  <StockVariantSelector
                                    value={formField.value ?? ""}
                                    isDisabled={isPending}
                                    placeholder="Select stock item"
                                    onChange={(value) => {
                                      console.log(
                                        `🏪 [SELECTOR] StockVariantSelector onChange:`,
                                        {
                                          variantIndex: index,
                                          newValue: value,
                                        },
                                      );
                                      formField.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      )}

                      {/* SEPARATE FIELDS - Recipe Item */}
                      {form.watch("trackingType") === "RECIPE" && (
                        <FormField
                          control={form.control}
                          name={`variants.${index}.recipeItem`}
                          render={({ field: formField }) => {
                            console.log(
                              `📋 [RENDER] RecipeSelector rendering for variant ${index}:`,
                              {
                                trackingType: form.watch("trackingType"),
                                value: formField.value,
                              },
                            );

                            return (
                              <FormItem>
                                <FormLabel>Recipe</FormLabel>
                                <FormControl>
                                  <RecipeSelector
                                    value={formField.value ?? ""}
                                    placeholder="Select recipe"
                                    isDisabled={isPending}
                                    onChange={(value) => {
                                      console.log(
                                        `📋 [SELECTOR] RecipeSelector onChange:`,
                                        {
                                          variantIndex: index,
                                          newValue: value,
                                        },
                                      );
                                      formField.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-4" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update product" : "Create product"}
          />
        </div>
      </form>

      {/* Tracking Modal */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Tracking Type</DialogTitle>
            <DialogDescription>
              Choose how you want to track this item in inventory
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleTrackingTypeSelect("RECIPE")}
            >
              Track as Recipe
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleTrackingTypeSelect("STOCK")}
            >
              Track as Stock Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
