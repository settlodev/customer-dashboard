"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Warehouse } from "lucide-react";
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
import { createWarehouse, updateWarehouse } from "@/lib/actions/warehouse/list-warehouse";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";

const WarehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  code: z.string().max(50).optional(),
  primary: z.boolean().default(false),
  capacity: z.number().positive().optional(),
});

interface WarehouseFormProps {
  item: Warehouses | null | undefined;
}

export default function WarehouseForm({ item }: WarehouseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof WarehouseSchema>>({
    resolver: zodResolver(WarehouseSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      code: item?.code ?? "",
      primary: item?.primary ?? false,
      capacity: item?.capacity ?? undefined,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({ variant: "destructive", title: "Validation failed", description: "Check your inputs." });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof WarehouseSchema>) => {
    setResponse(undefined);
    startTransition(async () => {
      const data = item
        ? await updateWarehouse(item.id, values)
        : await createWarehouse(values);

      if (data) setResponse(data);
      if (data?.responseType === "success") {
        toast({ variant: "success", title: "Success", description: data.message });
        router.push("/warehouse-profile");
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData as any, onInvalid)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Warehouse className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input className="pl-10" placeholder="e.g. Central Warehouse" {...field} disabled={isPending} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WH-001" {...field} value={field.value ?? ""} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (units)</FormLabel>
                    <FormControl>
                      <NumericFormat
                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.value ? Number(v.value) : null)}
                        thousandSeparator
                        placeholder="Optional"
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="primary"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center rounded-lg border p-3 space-y-0 mt-auto">
                    <FormLabel className="text-sm cursor-pointer">Primary Warehouse</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" rows={2} {...field} value={field.value ?? ""} disabled={isPending} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label={item ? "Update warehouse" : "Create warehouse"} />
        </div>
      </form>
    </Form>
  );
}
