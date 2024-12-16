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
import { CustomerSchema } from "@/types/customer/schema";
import { createCustomer, updateCustomer } from "@/lib/actions/customer-actions";
import { Customer } from "@/types/customer/type";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import GenderSelector from "@/components/widgets/gender-selector";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "../ui/switch";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { PhoneInput } from "../ui/phone-input";
import { useRouter } from "next/navigation";

function CustomerForm({ item }: { item: Customer | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof CustomerSchema>>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      ...item,
      allowNotifications: true,
      status: true
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Form Errors:", errors);
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

  const submitData = (values: z.infer<typeof CustomerSchema>) => {
    startTransition(() => {
      if (item) {
        updateCustomer(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
            });
            router.push("/customers");
          }
        });
      } else {
        createCustomer(values)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({
                title: "Success",
                description: data.message,
              });
              router.push("/customers");
            }
          })
          .catch((err) => {
            console.error(err);
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
          <>
            <>
              <FormError message={error} />
              <FormSuccess message={success} />
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer first name "
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer last name"
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
                  name="gender"
                  render={({ field }) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { ref: _ref, ...customSelectRef } = field;

                    return (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <GenderSelector
                            {...customSelectRef}
                            isRequired
                            isDisabled={isPending}
                            label="Gender"
                            placeholder="Select customer gender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Enter customer email address"
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
                    <FormItem className="flex flex-col items-start">
                      <FormLabel>Customer Phone Number</FormLabel>
                      <FormControl className="w-full border-1 rounded-sm">
                        <PhoneInput
                          placeholder="Enter customer phone number"
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
                  name="allowNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-col lg:mt-4">
                      <FormLabel>Allow Notifications</FormLabel>
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
                {item && (
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="status"

                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <FormLabel>

                            Customer Status
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
            </>
          </>
          <div className="flex h-5 items-center space-x-4 mt-10">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update customer details" : "Add customer "}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}

export default CustomerForm;
