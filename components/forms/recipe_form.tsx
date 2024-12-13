"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Loader2 } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createRecipe, updateRecipe } from "@/lib/actions/recipe-actions";
import { useTransition } from "react";
import {FormError} from "@/components/widgets/form-error";
import {FormResponse} from "@/types/types";
import {Recipe} from "@/types/recipe/type";
import {RecipeSchema} from "@/types/recipe/schema";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";

type RecipeFormProps = {
  item: Recipe | null | undefined;
  onFormSubmitted?: (response: FormResponse) => void;
};

export default function RecipeForm({ item, onFormSubmitted }: RecipeFormProps) {
  const router = useRouter();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RecipeSchema>>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: {
      name: item?.name || "",
      status: item?.status ?? true,
      stockVariants: item?.recipeStockVariants.map(variant => ({
        stockId: variant.stockVariant,
        quantity: variant.quantity,
      })) || [{ stockId: "", quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockVariants",
  });

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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{item ? "Edit Recipe" : "Create New Recipe"}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <FormError message={response?.message} />
          <form className="space-y-6" onSubmit={form.handleSubmit(submitData)}>
            <CardContent className="space-y-6">
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
                        className="flex gap-4 items-start p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1 space-y-4">
                        <FormField
                            control={form.control}
                            name={`stockVariants.${index}.id`}
                            render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stock Variant</FormLabel>
                                  <FormControl>
                                    <StockVariantSelector
                                        {...field}
                                        onChange={field.onChange}
                                        placeholder="Select stock variant"
                                        isDisabled={isPending}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={`stockVariants.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                        disabled={isPending}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>

                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-8"
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

            <CardFooter className="flex justify-between">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/recipes")}
                  disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {item ? "Update Recipe" : "Create Recipe"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
  );
}
