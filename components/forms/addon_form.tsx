"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useForm } from "react-hook-form";
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
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { AddonSchema } from "@/types/addon/schema";
import { createAddon, updateAddon } from "@/lib/actions/addon-actions";
import { Addon } from "@/types/addon/type";
import { Switch } from "../ui/switch";
import { Stock } from "@/types/stock/type";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Product } from "@/types/product/type";
import { fectchAllProducts } from "@/lib/actions/product-actions";
import StockSelector from "../widgets/stock-selector";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { StockVariant } from "@/types/stockVariant/type";
import { Variant } from "@/types/variant/type";
import { MultiSelect } from "../ui/multi-select";
import ProductSelector from "../widgets/product-selector";

function AddonForm({ item }: { item: Addon | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error, ] = useState<string | undefined>("");
  const [success, ] = useState<string | undefined>("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [,setSelectedStock] = useState<Stock | null>(null);
  const [stockVariants, setStockVariants] = useState<StockVariant[]>([]);
  const [addonTracking, setAddonTracking] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productVariants, setProductVariants] = useState<Variant[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const getData = async () => {
      try {
        const [stockResponse,productResponse] = await Promise.all([
            fetchStock(),
            fectchAllProducts(),
        ])
        setStocks(stockResponse);
        setProducts(productResponse);
    } catch (error) {

        throw error;
        // toast({ title: "Error loading data", description: error.message });
    }
    };
    getData();
}, []);

const handleAddonTrackingChange = (value: boolean) => {
  setAddonTracking(value);
  toast({
    title: "Addon Tracking",
    description: value
      ? "You will need to select stock and product variant(s) to track this addon."
      : "You won't be able to track the stock and product variant for this addon.",
    variant:value ? "default" : "destructive",
    duration: 3000,
  })
};

const handleStockChange = (stockId: string) => {
  const stock = stocks.find((stk) => stk.id === stockId) || null;
  setSelectedStock(stock);
  setStockVariants(stock ? stock.stockVariants : []);
};

const handleProductChange = (productId: string) => {
  const product = products.find((prd) => prd.id === productId) || null;
  setSelectedProduct(product);
  setProductVariants(product ? product.variants : []);
};

  const form = useForm<z.infer<typeof AddonSchema>>({
    resolver: zodResolver(AddonSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof AddonSchema>) => {
    startTransition(() => {
      if (item) {
        updateAddon(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createAddon(values)
          .then((data) => {
            console.log(data);
            if (data) setResponse(data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={`gap-1`}
      >
        <div>
          <>

            <>
            <FormError message={error}/>
            <FormSuccess message={success}/>
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Addon Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter addon title e.g. Cheese"
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Addon Price</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter addon price"
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
                                        name="addonTracking"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                                <FormLabel>Allow Addon Tracking</FormLabel>
                                                <FormControl>
                                                    <Switch

                                                        checked={field.value}
                                                        onCheckedChange={(value) => {
                                                            field.onChange(value);
                                                            handleAddonTrackingChange(value);
                                                        }}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                   {addonTracking && (
                    <>
                                  <FormField
                                        control={form.control}
                                        name="stock"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stock </FormLabel>
                                                <FormControl>
                                                    <StockSelector
                                                        value={field.value}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            handleStockChange(value);
                                                        }}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Stock"
                                                        placeholder="Select stock"
                                                        stocks={stocks}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="stockVariant"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stock Variant</FormLabel>
                                                <FormControl>
                                                    <StockVariantSelector
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Stock Variant"
                                                        placeholder="Select stock variant"
                                                        stockVariants={stockVariants}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                   <FormField
                                        control={form.control}
                                        name="product"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product </FormLabel>
                                                <FormControl>
                                                    <ProductSelector
                                                        value={field.value}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            handleProductChange(value);
                                                        }}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Product"
                                                        placeholder="Select Product"
                                                        products={products}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                  <FormField
                                        control={form.control}
                                        name="productVariant"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Variant </FormLabel>
                                                <FormControl>
                                                    <MultiSelect
                                                        options={
                                                            [
                                                              ...productVariants.map(
                                                                (variant) => ({
                                                                    label: variant.name,
                                                                    value: variant.id,
                                                                })
                                                            )
                                                            ]
                                                        }
                                                        onValueChange={(field as any).onChange}
                                                        defaultValue={(field as any).value}
                                                        placeholder="Select variant"
                                                        variant="inverted"
                                                        animation={2}
                                                        maxCount={3}
                                                        {...field}
                                                      />

                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                    </>
                                )}

{                item && (
                  <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel>Addon Status</FormLabel>
                      <FormControl>
                        <Switch

                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                )
              }
              </div>
            </>
          </>
          <div className="flex h-5 items-center space-x-4 mt-10">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update Addon details" : "Add Addon"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default AddonForm;
