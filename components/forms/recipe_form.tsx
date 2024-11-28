"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
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
import { Switch } from "../ui/switch";
import { Stock } from "@/types/stock/type";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Product } from "@/types/product/type";
import { fectchAllProducts } from "@/lib/actions/product-actions";
import { MultiSelect } from "../ui/multi-select";
import { Recipe } from "@/types/recipe/type";
import { RecipeSchema } from "@/types/recipe/schema";
import { createRecipe, updateRecipe } from "@/lib/actions/recipe-actions";
import { StockVariant } from "@/types/stockVariant/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


// interface StockVariantType {
//   id: string;
//   displayName: string;
//   quantity: number;
// }

// interface StockVariantWithDisplayName extends StockVariant {
//   displayName: string;
// }

function RecipeForm({ item }: { item: Recipe | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const [, setStocks] = useState<Stock[]>([]);
  const [,] = useState<StockVariant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCombinedProductOptions] = useState<{ id: string; displayName: string }[]>([]);
  const [combinedStockOptions, setCombinedStockOptions] = useState<{ id: string; displayName: string }[]>([]);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof RecipeSchema>>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: {
      name: item?.name || "",
      status: item?.status || false,
      variant: item?.variant ? item.variant.toString() : "",
      stockVariants: item?.recipeStockVariants.map((recipeVariant) => ({
        id: recipeVariant.stockVariant,
        displayName: "", 
        quantity: parseFloat(recipeVariant.quantity.toString()) || 0,
      })) || [],
    },

  });

  useEffect(() => {
    const getData = async () => {
      try {
        const [stockResponse, productResponse] = await Promise.all([
          fetchStock(),
          fectchAllProducts(),
        ]);

        setStocks(stockResponse);
        setProducts(productResponse);

        // Combine product and stock variant options for selection
        const combinedProductVariant = productResponse.flatMap((product) =>
          product.variants.map((variant) => ({
            id: variant.id,
            displayName: `${product.name} - ${variant.name}`,
          }))
        );
        setCombinedProductOptions(combinedProductVariant);

        const combinedOptions = stockResponse.flatMap((stock) =>
          stock.stockVariants.map((variant) => ({
            id: variant.id,
            displayName: `${stock.name} - ${variant.name}`,
          }))
        );
        setCombinedStockOptions(combinedOptions);

        // Pre-select stock variants if updating an existing recipe
        if (item) {
          form.setValue("variant", item.variant.toString() || "");

          const preSelectedVariants = item.recipeStockVariants.map((recipeVariant) => {
            const matchedStock = stockResponse.find((stock) =>
              stock.stockVariants.some(
                (variant) => variant.id === recipeVariant.stockVariant
              )
            );

            // console.log("Matched stock:", matchedStock);

            const matchedStockVariant = matchedStock?.stockVariants.find(
              (variant) => variant.id === recipeVariant.stockVariant
            );

            console.log("Matched stock variant:", matchedStockVariant);

            return {
              id: recipeVariant.stockVariant,
              displayName: matchedStockVariant
                ? `${matchedStock?.name} - ${matchedStockVariant.name}`
                : "",
                quantity: parseFloat(recipeVariant.quantity.toString()) || 0,
            };
          });

          form.setValue("stockVariants", preSelectedVariants);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    getData();
  }, [item, form]);



  const { fields: selectedVariants, append, remove } = useFieldArray({
    control: form.control,
    name: "stockVariants",
  })

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("The errors while submitting the form are: ", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof RecipeSchema>) => {
    console.log("Submitting data:", values);
    startTransition(() => {
      if (item) {
        updateRecipe(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createRecipe(values)
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
          <FormError message={error} />
          <FormSuccess message={success} />
          <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter recipe name"
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
              name="variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Variant</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product Variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) =>
                          product.variants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {`${product.name} - ${variant.name}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockVariants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Variant</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={combinedStockOptions.map((option) => ({
                        label: option.displayName,
                        value: option.id,
                      }))}
                      onValueChange={(selectedValues) => {
                        const existingVariants = form.getValues("stockVariants") || [];

                        const updatedVariants = selectedValues.map((value) => {
                          const existingVariant = existingVariants.find((variant) => variant.id === value);
                          const stockVariant = combinedStockOptions.find((option) => option.id === value);

                          return {
                            id: value,
                            displayName: stockVariant ? stockVariant.displayName : "",
                            quantity: existingVariant?.quantity || 0,
                          };
                        });

                        remove(); // Clear field array
                        updatedVariants.forEach((variant) => append(variant));
                      }}
                      {...field}
                      placeholder="Select variant"
                      value={form.watch("stockVariants")?.map((variant) => variant.id) || []}
                    />


                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col">
              {selectedVariants.map((variant, index) => (
                <FormField
                  key={variant.id}
                  control={form.control}
                  name={`stockVariants.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      @ts-ignore
                      {/* <FormLabel>Quantity for {variant.displayName}</FormLabel> */}
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field} // Correctly bind field props
                          value={field.value || variant.quantity} // Preserve existing value
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value);
                            field.onChange(newValue); // Update form state
                            form.setValue(`stockVariants.${index}.quantity`, newValue); // Explicitly set value
                          }}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

            </div>

            {item && (
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel>Recipe Status</FormLabel>
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

          <div className="flex h-5 items-center space-x-4 mt-10">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update recipe details" : "Add recipe"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default RecipeForm;
