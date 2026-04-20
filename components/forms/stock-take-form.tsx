"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { createStockTake } from "@/lib/actions/stock-take-actions";
import { CreateStockTakeSchema } from "@/types/stock-take/schema";
import { CYCLE_COUNT_TYPE_OPTIONS } from "@/types/stock-take/type";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateStockTakeSchema>;

export default function StockTakeForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateStockTakeSchema),
    defaultValues: {
      notes: "",
      cycleCountType: "FULL",
      filterCriteria: "",
      blindCount: false,
    },
  });

  const cycleType = form.watch("cycleCountType");

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation failed",
      description: "Please review the highlighted fields.",
    });
  }, [toast]);

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    startTransition(() => {
      createStockTake(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't create stock take",
            description: data.message,
          });
        }
      });
    });
  };

  const criteriaHelp =
    cycleType === "CATEGORY"
      ? "Enter the category ID to count."
      : cycleType === "ABC_CLASS"
        ? "Enter the ABC class (A, B or C)."
        : cycleType === "ZONE"
          ? "Enter the warehouse zone ID."
          : cycleType === "RANDOM"
            ? "Optional — sample size or fraction."
            : "";

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">New stock take</h3>
              <p className="text-xs text-muted-foreground">
                Items are populated from current inventory when you start the
                take. Blind count hides expected quantities from counters.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cycleCountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Count type</FormLabel>
                    <Select
                      value={field.value ?? "FULL"}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CYCLE_COUNT_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {cycleType !== "FULL" && (
                <FormField
                  control={form.control}
                  name="filterCriteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filter criteria</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={criteriaHelp}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        {criteriaHelp || "Scopes the variants populated when the take starts."}
                      </p>
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="blindCount"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-md bg-amber-50/50 border border-amber-100 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isPending}
                    className="h-4 w-4 accent-amber-600"
                    id="blindCount"
                  />
                  <label htmlFor="blindCount" className="text-sm font-medium cursor-pointer">
                    Blind count (counters can&apos;t see expected quantity)
                  </label>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional — e.g. month-end count, incident trigger, auditor present…"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create Stock Take" />
        </div>
      </form>
    </Form>
  );
}
