"use client";

import React, { useCallback, useState, useTransition, useEffect } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store as StoreIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { createStore, updateStore } from "@/lib/actions/store-actions";
import { Store } from "@/types/store/type";
import { StoreSchema } from "@/types/store/schema";
import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";
import { getCurrentBusiness, getCurrentLocation } from "@/lib/actions/business/get-current-business";

interface StoreFormProps {
  item: Store | null | undefined;
}

/**
 * Store form — handles create and edit.
 *
 * On create: store is created in Accounts Service immediately, then the
 * subscription item is added via the billing service. If a prorated invoice
 * is generated, the user is redirected to the store detail page where the
 * pending invoice is displayed with a payment prompt.
 */
export default function StoreForm({ item }: StoreFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [businessId, setBusinessId] = useState("");
  const [locationId, setLocationId] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadContext() {
      const [biz, loc] = await Promise.all([getCurrentBusiness(), getCurrentLocation()]);
      if (biz?.id) setBusinessId(biz.id);
      if (loc?.id) setLocationId(loc.id);
    }
    loadContext();
  }, []);

  const form = useForm<z.infer<typeof StoreSchema>>({
    resolver: zodResolver(StoreSchema),
    defaultValues: {
      name: item?.name ?? "",
      businessId: item?.businessId ?? "",
      locationId: item?.locationId ?? "",
      code: item?.code ?? "",
    },
  });

  useEffect(() => {
    if (businessId && !form.getValues("businessId")) form.setValue("businessId", businessId);
    if (locationId && !form.getValues("locationId")) form.setValue("locationId", locationId);
  }, [businessId, locationId, form]);

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({ variant: "destructive", title: "Validation failed", description: "Check your inputs." });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof StoreSchema>) => {
    setResponse(undefined);
    startTransition(async () => {
      if (item) {
        const data = await updateStore(item.id, values);
        if (data) setResponse(data);
        if (data?.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
          router.push("/stores");
        }
      } else {
        const data = await createStore(values);
        if (data) setResponse(data);
        if (data?.responseType === "success") {
          toast({
            variant: "success",
            title: "Store created",
            description: "Complete the subscription setup on the store page.",
          });
          // Redirect to stores list — the store detail page will show
          // any pending invoice and prompt payment.
          router.push("/stores");
        }
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <StoreIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input className="pl-10" placeholder="e.g. Main Street Store" {...field} disabled={isPending} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. STORE-001" {...field} value={field.value ?? ""} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <input type="hidden" {...form.register("businessId")} />
            <input type="hidden" {...form.register("locationId")} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label={item ? "Update store" : "Create store"} />
        </div>
      </form>
    </Form>
  );
}
