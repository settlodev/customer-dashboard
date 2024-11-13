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
import { FormSuccess } from "../widgets/form-success";
import { Supplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import { createSupplier, updateSupplier } from "@/lib/actions/supplier-actions";
import { PhoneInput } from "../ui/phone-input";
import { Loader2Icon } from "lucide-react";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

function SupplierForm({ item }: { item: Supplier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SupplierSchema>>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
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

  const submitData = (values: z.infer<typeof SupplierSchema>) => {
    startTransition(() => {
      if (item) {
        updateSupplier(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createSupplier(values)
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
        <div className="space-y-6">
          <>
            <FormError message={error} />
            <FormSuccess message={success} />
            <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter supplier full name "
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
                      <Input placeholder="johndoe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start">
                    <FormLabel>Supplier Phone Number</FormLabel>
                    <FormControl className="w-full border-1 rounded-sm">
                      <PhoneInput
                        placeholder="Enter supplier phone number"
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
                  <FormItem className="flex flex-col items-start">
                    <FormLabel>Supplier Physical Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier physical address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {item && (
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="status"

                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <FormLabel>

                          Supplier Status
                          <span className={item.status ? "text-green-500" : "text-red-500"}>
                            ({item.status ? "Active" : "Inactive"})
                          </span>

                        </FormLabel>
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
            <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Contact Person</CardTitle>
                  <CardDescription>
                    Add contact person details of supplier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder="Enter contact person name"
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
                          <FormLabel>Contact Person Title <span className="text-gray-400 text-sm">optional</span></FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder="Enter contact person title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPersonPhoneNumber"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-start mt-1">
                          <FormLabel>Contact Person Phone Number</FormLabel>
                          <FormControl className="w-full border-1 rounded-sm">
                            <PhoneInput
                              {...field}
                              disabled={isPending}
                              placeholder="Enter contact person phone number"
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
                          <FormLabel>Contact Person Email <span className="text-gray-400 text-sm">optional</span></FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder="supplier@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </CardContent>
              </Card>
          </>

          <div className="flex h-5 items-center space-x-4 mt-10">
            <CancelButton />
            <Separator orientation="vertical" />
            {
              isPending ? (
                <div className="flex justify-center items-center bg-black rounded p-2 text-white">
                  <Loader2Icon className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <SubmitButton
                  isPending={isPending}
                  label={item ? "Update supplier details" : "Add supplier "}
                />
              )
            }
          </div>
        </div>

      </form>
    </Form>
  );
}

export default SupplierForm;
