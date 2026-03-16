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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { Supplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import {
  createSupplier,
  updateSupplier,
} from "@/lib/actions/supplier-actions";
import { PhoneInput } from "../ui/phone-input";
import { Switch } from "../ui/switch";
import { Card, CardContent } from "../ui/card";
import { useRouter } from "next/navigation";

function SupplierForm({ item }: { item: Supplier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof SupplierSchema>>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof SupplierSchema>) => {
    startTransition(() => {
      if (item) {
        updateSupplier(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ title: "Success", description: data.message });
            router.push("/suppliers");
          }
        });
      } else {
        createSupplier(values)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ title: "Success", description: data.message });
              router.push("/suppliers");
            }
          })
          .catch(() => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "An unexpected error occurred.",
            });
          });
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            {/* Supplier Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Supplier Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supplier Name{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter supplier name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="supplier@example.com"
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter phone number"
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
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter physical address"
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Contact Person */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Contact Person
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter contact person name"
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
                  name="contactPersonTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter job title"
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
                  name="contactPersonPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter contact phone number"
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
                  name="contactPersonEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contact@example.com"
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status (edit only) */}
            {item && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Settings</h3>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            Supplier Status
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "This supplier is currently active"
                              : "This supplier is currently inactive"}
                          </p>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update supplier" : "Create supplier"}
          />
        </div>
      </form>
    </Form>
  );
}

export default SupplierForm;
