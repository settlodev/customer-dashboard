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
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

function CustomerForm({ item }: { item: Customer | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error] = useState<string | undefined>("");
  const [success] = useState<string | undefined>("");
  const [showCreditLimitHelp, setShowCreditLimitHelp] = useState(false);
  const [creditLimitDisplay, setCreditLimitDisplay] = useState<string>(
    item?.creditLimit?.toLocaleString() ?? "",
  );

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof CustomerSchema>>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      firstName: item?.firstName ?? "",
      lastName: item?.lastName ?? "",
      gender: item?.gender ?? undefined,
      email: item?.email ?? "",
      phoneNumber: item?.phoneNumber ?? "",
      creditLimit: item?.creditLimit ?? undefined,
      allowNotifications: item?.allowNotifications ?? true,
      status: item?.status ?? true,
    },
  });

  // Format credit limit for display with commas
  const formatCreditLimit = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return "";
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) return "";
    return number.toLocaleString("en-US");
  };

  // Parse credit limit string to number
  const parseCreditLimitToNumber = (value: string): number | undefined => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return undefined;
    const number = parseFloat(numericValue);
    return isNaN(number) ? undefined : number;
  };

  // Handle credit limit input changes
  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCreditLimit(rawValue);
    const parsedNumber = parseCreditLimitToNumber(rawValue);

    setCreditLimitDisplay(formattedValue);

    form.setValue("creditLimit", parsedNumber, {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.trigger("creditLimit");
  };

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Form Errors:", errors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Please check the form for errors and try again",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof CustomerSchema>) => {
    startTransition(() => {
      const submitValues = {
        ...values,
        creditLimit: values.creditLimit ?? undefined,
      };

      if (item) {
        updateCustomer(item.id, submitValues).then((data) => {
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
        createCustomer(submitValues)
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
            console.error("Create customer error:", err);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create customer. Please try again.",
            });
          });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        <FormError message={error} />
        <FormSuccess message={success} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  First Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter customer first name"
                    {...field}
                    disabled={isPending}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter customer last name"
                    {...field}
                    disabled={isPending}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => {
              const { ref: _ref, ...customSelectRef } = field;

              return (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Gender</FormLabel>
                  <FormControl>
                    <GenderSelector
                      {...customSelectRef}
                      isRequired
                      isDisabled={isPending}
                      label="Gender"
                      placeholder="Select customer gender"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              );
            }}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Enter customer email address"
                    disabled={isPending}
                    type="email"
                    className="h-11"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    placeholder="Enter customer phone number"
                    {...field}
                    disabled={isPending}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Credit Limit - Using separate state for display */}
          <div className="relative">
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <FormLabel className="text-sm font-medium">
                      Credit Limit{" "}
                      <span className="text-muted-foreground">(Optional)</span>
                    </FormLabel>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() =>
                        setShowCreditLimitHelp(!showCreditLimitHelp)
                      }
                      aria-label="Show credit limit explanation"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="e.g., 500,000"
                      value={creditLimitDisplay}
                      onChange={handleCreditLimitChange}
                      onFocus={() => setShowCreditLimitHelp(true)}
                      disabled={isPending}
                      className="h-11"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {showCreditLimitHelp && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 animate-in fade-in duration-200">
                <p className="font-medium mb-1">Credit Limit Information</p>
                <p className="text-xs leading-relaxed">
                  This is the maximum amount available for customer orders. It
                  applies to both individual orders and the total across all
                  orders. Transactions exceeding this limit may be declined or
                  incur fees.
                </p>
              </div>
            )}
          </div>

          {/* Allow Notifications */}
          <div className="md:col-span-2 lg:col-span-1">
            <FormField
              control={form.control}
              name="allowNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">
                    Allow Notifications
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Status (only for existing customers) */}
          {item && (
            <div className="md:col-span-2 lg:col-span-1">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">
                      Customer Status
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            field.value ? "text-green-600" : "text-red-600",
                          )}
                        >
                          {field.value ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        {/* Form Actions */}
        <div className="flex h-5 items-center space-x-4 mt-10">
          <CancelButton />
          <Separator orientation="vertical" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update customer details" : "Add customer "}
          />
        </div>{" "}
      </form>
    </Form>
  );
}

export default CustomerForm;
