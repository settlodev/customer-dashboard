"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createStaff, updateStaff } from "@/lib/actions/staff-actions";
import { Staff, StaffSchema } from "@/types/staff";
import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import { Switch } from "../ui/switch";
import { DefaultCountry } from "@/types/constants";
import DepartmentSelector from "@/components/widgets/department-selector";
import RoleSelector from "@/components/widgets/role-selector";
import CountrySelector from "@/components/widgets/country-selector";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "../ui/card";
import { FormError } from "../widgets/form-error";

interface StaffFormProps {
  item: Staff | null | undefined;
  onFormSubmitted?: (response: FormResponse) => void;
}

const StaffForm: React.FC<StaffFormProps> = ({ item, onFormSubmitted }) => {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [isDashboardEnabled, setIsDashboardEnabled] = useState(
    item?.dashboardAccess ?? false,
  );
  const router = useRouter();

  const form = useForm<z.infer<typeof StaffSchema>>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      ...item,
      nationality: item?.nationality || DefaultCountry,
      status: item ? item.status : true,
    },
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

  const submitData = async (values: z.infer<typeof StaffSchema>) => {
    setResponse(undefined);

    startTransition(async () => {
      try {
        let result: FormResponse | void;

        if (item) {
          result = await updateStaff(item.id, values);
        } else {
          result = await createStaff(values);
        }

        if (result) {
          setResponse(result);

          if (result.responseType === "success") {
            toast({ title: "Success", description: result.message });
            onFormSubmitted?.(result);
            router.push("/staff");
          } else if (result.responseType === "error") {
            toast({
              variant: "destructive",
              title: "Error",
              description:
                result.message || "An error occurred while processing your request.",
            });
          }
        }
      } catch (error: any) {
        const errorMessage =
          error?.message || "There was an issue with your request, please try again later";

        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: errorMessage,
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
        {/* Basic Information */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isSubmitting}
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
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter phone number"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <GenderSelector
                          {...field}
                          isDisabled={isSubmitting}
                          label="Select staff gender"
                          placeholder="Select gender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <CountrySelector
                          {...field}
                          isDisabled={isSubmitting}
                          label="Select staff nationality"
                          placeholder="Select nationality"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Work Details */}
            <div>
              <h3 className="text-lg font-medium mb-4">Work Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter job title"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <DepartmentSelector
                          {...field}
                          isDisabled={isSubmitting}
                          placeholder="Select department"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <RoleSelector
                          {...field}
                          isDisabled={isSubmitting}
                          placeholder="Select role"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* System Access */}
            <div>
              <h3 className="text-lg font-medium mb-4">System Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dashboardAccess"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Dashboard Access
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow access to admin dashboard
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setIsDashboardEnabled(checked);
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="posAccess"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          POS Access
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow access to POS system
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {isDashboardEnabled && (
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email Address{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                            disabled={isSubmitting}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Required for dashboard login
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter contact name"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter contact number"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter relationship"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isSubmitting}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isSubmitting}
            label={item ? "Update staff" : "Create staff"}
          />
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;
