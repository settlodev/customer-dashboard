"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import * as z from "zod";
import { Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { StockCategorySchema } from "@/types/stock-category/schema";
import type { StockCategory } from "@/types/stock-category/type";
import {
  createStockCategory,
  updateStockCategory,
} from "@/lib/actions/stock-category-actions";
import { invalidateStockCategoriesCache } from "@/lib/cache/reference-data";

/**
 * Create/edit form for the inventory-side stock taxonomy. Deliberately
 * simpler than the product category form — stock categories are flat, so
 * there is no department, parent, image, or sort order.
 */
export default function StockCategoryForm({ item }: { item?: StockCategory }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");

  const form = useForm<z.infer<typeof StockCategorySchema>>({
    resolver: zodResolver(StockCategorySchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      active: item?.active ?? true,
    },
  });

  const onSubmit = (values: z.infer<typeof StockCategorySchema>) => {
    setError("");
    startTransition(async () => {
      try {
        if (item) {
          const result = await updateStockCategory(item.id, values);
          // updateStockCategory redirects on success, so a returned value
          // means it failed.
          if (result && result.responseType === "error") {
            setError(result.message);
            return;
          }
          invalidateStockCategoriesCache();
        } else {
          const result = await createStockCategory(values, pathname);
          if (result.responseType === "error") {
            // The backend's duplicate-name message is merchant-readable.
            setError(result.message);
            return;
          }
          invalidateStockCategoriesCache();
          toast({
            variant: "default",
            title: "Stock category created",
            description: `${values.name} is ready to use.`,
          });
          router.push("/stock-categories");
        }
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormError message={error} />

        <Card>
          <CardContent className="pt-6 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="e.g. Beverages"
                        className="pl-10"
                        disabled={isPending}
                        {...field}
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional — what belongs in this category"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-line p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Inactive categories stay on the stock items already using
                      them and keep working as a filter — they just stop being
                      offered when categorising new stock.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/stock-categories")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : item
                ? "Save changes"
                : "Create stock category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
