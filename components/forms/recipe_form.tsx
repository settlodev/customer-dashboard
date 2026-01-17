"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus } from "lucide-react";
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
import { CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createRecipe, updateRecipe } from "@/lib/actions/recipe-actions";
import { useTransition } from "react";
import { FormError } from "@/components/widgets/form-error";
import { FormResponse } from "@/types/types";
import { Recipe } from "@/types/recipe/type";
import { RecipeSchema } from "@/types/recipe/schema";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import CancelButton from "@/components/widgets/cancel-button";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/widgets/submit-button";

type RecipeFormProps = {
  item: Recipe | null | undefined;
  onFormSubmitted?: (response: FormResponse) => void;
};

export default function RecipeForm({ item, onFormSubmitted }: RecipeFormProps) {
  console.log("The item/recipe to be edited is", item);
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RecipeSchema>>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: {
      name: item?.name || "",
      status: item?.status ?? true,
      stockVariants: item?.recipeStockVariants.map((variant) => ({
        id: variant.stockVariant,
        quantity: parseFloat(String(variant.quantity)),
      })) || [{ id: "", quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockVariants",
  });

  // Get all currently selected stock variant IDs
  const selectedStockVariants = fields
    .map(
      (field, index) => form.getValues(`stockVariants.${index}.id`) as string,
    )
    .filter(Boolean);

  const submitData = (values: z.infer<typeof RecipeSchema>) => {
    setResponse(undefined);

    startTransition(() => {
      if (item) {
        updateRecipe(item.id, values).then((data) => {
          if (data) {
            setResponse(data);
            onFormSubmitted?.(data);
          }
        });
      } else {
        createRecipe(values).then((data) => {
          if (data) {
            setResponse(data);
            onFormSubmitted?.(data);
          }
        });
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form className="space-y-6" onSubmit={form.handleSubmit(submitData)}>
        <CardContent className="space-y-6 max-w-screen-md">
          {/* Recipe Name */}
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

          {/* Stock Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Ingredients</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: "", quantity: 0 })}
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-4 items-center p-4 rounded-lg border bg-card"
              >
                <div className="flex-1 grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`stockVariants.${index}.id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <StockVariantSelector
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select stock variant"
                              isDisabled={isPending}
                              disabledValues={selectedStockVariants.filter(
                                (id) => id !== field.value,
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`stockVariants.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              disabled={isPending}
                              placeholder="Quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1 || isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {/* Status Switch */}
          {item && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <FormLabel>Recipe Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? "Active" : "Inactive"}
                    </div>
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
        </CardContent>

        <div className="flex h-5 items-center space-x-4 mt-4">
          <CancelButton />
          <Separator orientation="vertical" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update recipe" : "Create recipe"}
          />
        </div>
      </form>
    </Form>
  );
}
