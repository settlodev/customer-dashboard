"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { CustomerSchema } from "@/types/customer/schema";
import {
  createCustomer,
  updateCustomer,
  fetchCustomerGroups,
} from "@/lib/actions/customer-actions";
import {
  Customer,
  CustomerGroup,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_CREATED_FROM_LABELS,
} from "@/types/customer/type";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import GenderSelector from "@/components/widgets/gender-selector";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "../ui/switch";
import { PhoneInput } from "../ui/phone-input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Info, Building2 } from "lucide-react";
import { CustomerPreference } from "@/types/customer/type";

function getPreferenceValue(
  preferences: CustomerPreference[],
  key: string,
): string | undefined {
  const pref = preferences.find((p) => p.preferenceKey === key);
  return pref?.preferenceValue ?? undefined;
}

function CustomerForm({
  item,
  preferences = [],
}: {
  item: Customer | null | undefined;
  preferences?: CustomerPreference[];
}) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [showCreditLimitHelp, setShowCreditLimitHelp] = useState(false);
  const [creditLimitDisplay, setCreditLimitDisplay] = useState<string>(
    item?.creditLimit?.toLocaleString() ?? "",
  );

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchCustomerGroups();
        setGroups(data);
      } catch (error) {
        console.error("Failed to load customer groups:", error);
      }
    };
    loadGroups();
  }, []);

  const form = useForm<z.infer<typeof CustomerSchema>>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      // Personal
      firstName: item?.firstName ?? "",
      lastName: item?.lastName ?? "",
      gender: item?.gender ?? undefined,
      email: item?.email ?? "",
      phoneNumber: item?.phoneNumber ?? "",
      dateOfBirth: item?.dateOfBirth ?? undefined,
      // Identification
      idType: item?.idType ?? undefined,
      idNumber: item?.idNumber ?? undefined,
      tinNumber: item?.tinNumber ?? undefined,
      vrn: item?.vrn ?? undefined,
      // Financial
      creditLimit: item?.creditLimit ?? undefined,
      loyaltyPoints: item?.loyaltyPoints ?? undefined,
      noShowCount: item?.noShowCount ?? 0,
      // Preferences
      seatingPreference:
        item?.seatingPreference ??
        getPreferenceValue(preferences, "seatingPreference"),
      source:
        (item?.source as any) ??
        getPreferenceValue(preferences, "source") ??
        undefined,
      createdFrom:
        (item?.createdFrom as any) ??
        getPreferenceValue(preferences, "createdFrom") ??
        undefined,
      customerGroup: (item?.customerGroup as string) ?? undefined,
      // Misc
      notes: item?.notes ?? undefined,
      allowNotifications: item?.allowNotifications ?? true,
      status: item?.status ?? true,
      // Company
      isCompanyAssociated: item?.isCompanyAssociated ?? false,
      companyName: item?.companyName ?? "",
      companyRegistrationNumber: item?.companyRegistrationNumber ?? "",
      companyEmailAddress: item?.companyEmailAddress ?? "",
      companyPhysicalAddress: item?.companyPhysicalAddress ?? "",
    },
  });

  const isCompanyAssociated = form.watch("isCompanyAssociated");

  const formatCreditLimit = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return "";
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) return "";
    return number.toLocaleString("en-US");
  };

  const parseCreditLimitToNumber = (value: string): number | undefined => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return undefined;
    const number = parseFloat(numericValue);
    return isNaN(number) ? undefined : number;
  };

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCreditLimit(rawValue);
    const parsedNumber = parseCreditLimitToNumber(rawValue);
    setCreditLimitDisplay(formattedValue);
    form.setValue("creditLimit", parsedNumber, {
      shouldValidate: true,
      shouldDirty: true,
    });
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
      const handleResponse = (data: FormResponse | void) => {
        if (!data) return;
        setResponse(data);
        if (data.responseType === "success") {
          toast({ title: "Success", description: data.message });
          router.push("/customers");
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.message,
          });
        }
      };

      if (item) {
        updateCustomer(item.id, values).then(handleResponse);
      } else {
        createCustomer(values).then(handleResponse);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* ── Personal Information ─────────────────────────────── */}
        <div>
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter first name"
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
                      placeholder="Enter last name"
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
                        placeholder="Select gender"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Enter email address"
                      disabled={isPending}
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Company Association ──────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Company Association</h3>
            </div>
            <FormField
              control={form.control}
              name="isCompanyAssociated"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue("companyName", "");
                          form.setValue("companyRegistrationNumber", "");
                          form.setValue("companyEmailAddress", "");
                          form.setValue("companyPhysicalAddress", "");
                        }
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {isCompanyAssociated
              ? "Fill in the company details this customer is associated with."
              : "Toggle on if this customer belongs to or represents a company."}
          </p>

          {isCompanyAssociated && (
            <div className="p-4  space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company name"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., RC123456"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyEmailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="e.g., tech@settlo.co.tz"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="company phone number"
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
                  name="companyPhysicalAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Company phyiscal address"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* ── Identification ───────────────────────────────────── */}
        <div>
          <h3 className="text-lg font-medium mb-4">Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Passport, National ID"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter ID number"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tinNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tax ID number"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vrn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VRN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VAT registration number"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Financial & Loyalty ──────────────────────────────── */}
        <div>
          <h3 className="text-lg font-medium mb-4">Financial & Loyalty</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <FormField
                control={form.control}
                name="creditLimit"
                render={() => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Credit Limit</FormLabel>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() =>
                          setShowCreditLimitHelp(!showCreditLimitHelp)
                        }
                      >
                        <Info size={14} />
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="e.g., 500,000"
                        value={creditLimitDisplay}
                        onChange={handleCreditLimitChange}
                        disabled={isPending}
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showCreditLimitHelp && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                  <p className="text-xs leading-relaxed">
                    Maximum amount available for customer orders across all
                    transactions.
                  </p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="loyaltyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loyalty Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {item && (
              <FormField
                control={form.control}
                name="noShowCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No-Show Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? 0}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* ── Preferences & Group ──────────────────────────────── */}
        <div>
          <h3 className="text-lg font-medium mb-4">Preferences & Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="seatingPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seating Preference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Window, Outdoor, Bar"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Group</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id as string}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How acquired" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CUSTOMER_SOURCE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="createdFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Created From</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Origin system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CUSTOMER_CREATED_FROM_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Notes ────────────────────────────────────────────── */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal notes about this customer..."
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                  rows={3}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Only visible to staff, not the customer
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ── Toggles ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="allowNotifications"
            render={({ field }) => (
              <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="cursor-pointer">
                    Allow Notifications
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Opt-in for marketing & reminders
                  </FormDescription>
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

          {item && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">
                      Customer Status
                    </FormLabel>
                    <FormDescription className="text-xs">
                      <span
                        className={cn(
                          "font-medium",
                          field.value ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {field.value ? "Active" : "Inactive"}
                      </span>
                    </FormDescription>
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
        </div>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex h-5 items-center space-x-4 mt-10">
          <CancelButton />
          <Separator orientation="vertical" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update Customer" : "Add Customer"}
          />
        </div>
      </form>
    </Form>
  );
}

export default CustomerForm;
