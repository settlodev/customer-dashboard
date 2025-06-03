"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";
import { Invoice } from "@/types/invoice/type";
import { InvoiceSchema } from "@/types/invoice/schema";
import { createInvoice, updateInvoice } from "@/lib/actions/invoice-actions";
import SubscriptionPackageSelector from "../widgets/subscriptionPackageSelector";
import { Plus, Trash2 } from "lucide-react";
import { NumericFormat } from "react-number-format";

function InvoiceForm({ item }: { item: Invoice | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
 
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof InvoiceSchema>>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: item || {
      subscriptions: [{ subscription: "", quantity: 1 }],
      subscriptionDiscount: 0
    },
  });

  // Get the subscriptions fields array for rendering
  const { fields: subscriptionFields, append: appendSubscription, remove: removeSubscription } = useFieldArray({
    control: form.control,
    name: "subscriptions"
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof InvoiceSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      const action = item ? updateInvoice : createInvoice;
      const actionData = item ? { ...values, id: item.id } : values;
      
      action(actionData)
        .then((data) => {
          if (data) {
            setResponse(data);
            if (data.responseType === "success") {
              setSuccess(data.message);
              toast({
                title: "Success",
                description: data.message,
              });
              router.push("/invoices");
            } else if (data.responseType === "error") {
              setError(data.message);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          setError("An unexpected error occurred");
        });
    });
  };

  const handleAddSubscription = () => {
    appendSubscription({ subscription: "", quantity: 1 });
  };

  const handleRemoveSubscription = (index: number) => {
    if (subscriptionFields.length > 1) {
      removeSubscription(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        <FormError message={error} />
        <FormSuccess message={success} />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Subscriptions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubscription}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Subscription
            </Button>
          </div>

          {subscriptionFields.map((field, index) => (
            <div key={field.id} className="space-y-4 p-4 border rounded-md relative">
              {subscriptionFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSubscription(index)}
                  className="absolute top-2 right-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`subscriptions.${index}.subscription`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Package</FormLabel>
                      <FormControl>
                        <SubscriptionPackageSelector
                          {...field}
                          placeholder="Select subscription package"
                          label="Subscription Package"
                          value={field.value as string | undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`subscriptions.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="How many month(s) would you like?"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? '' : parseInt(value) || 1);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <div>
        <FormField
                                                    control={form.control}
                                                    name="subscriptionDiscount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Subscription Discount</FormLabel>
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
        </div>

        <div className="flex h-5 items-center space-x-4">
          <CancelButton />
          <Separator orientation="vertical" />
          <SubmitButton 
            label={item ? "Update Invoice" : "Create Invoice"} 
            isPending={isPending} 
          />
        </div>
      </form>
    </Form>
  );
}

export default InvoiceForm;