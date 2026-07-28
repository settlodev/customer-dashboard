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
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { useRouter } from "next/navigation";
import { DeviceSchema } from "@/types/device/schema";
import DepartmentSelector from "@/components/widgets/department-selector";
import { updateDevice } from "@/lib/actions/devices-actions";
import { Device } from "@/types/device/type";

function DeviceForm({ item, onSuccess, compact = false }: { item: Device | null | undefined; onSuccess?: () => void; compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof DeviceSchema>>({
    resolver: zodResolver(DeviceSchema),
    defaultValues: {
      customName: item?.customName ?? "",
      departmentId: item?.departmentId ?? "",
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      const errorEntries = Object.entries(errors);
      const firstError = errorEntries[0]?.[1]?.message;
      const errorMessage =
        typeof firstError === "string"
          ? firstError
          : "Please check all fields and try again";

      console.log("Validation error:", errorMessage);

      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof DeviceSchema>) => {
    setError("");
    setSuccess("");

    if (!item) return;

    startTransition(() => {
      updateDevice(item.id, values)
        .then((result) => {
          if (result.success) {
            setSuccess("Device updated successfully");
            toast({
              variant: "success",
              title: "Success",
              description: "Device updated successfully",
            });
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/settings?tab=devices");
            }
          } else {
            setError(result.error ?? "Failed to update device");
            toast({
              variant: "destructive",
              title: "Error",
              description: result.error ?? "Failed to update device",
            });
          }
        })
        .catch((err) => {
          console.error("Error updating device:", err);
          setError("Failed to update device");
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update device",
          });
        });
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(submitData, onInvalid)(e);
  };

  if (compact) {
    return (
      <Form {...form}>
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <FormError message={error} />
            <FormSuccess message={success} />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Device Name
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter device name"
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
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Department
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <DepartmentSelector
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <SubmitButton
                isPending={isPending}
                label={item ? "Update Device" : "Add Device"}
              />
            </div>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Form Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {item ? "Edit Device" : "Add New Device"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {item
              ? "Update the device information below"
              : "Fill in the details to add a new device"}
          </p>
        </div>

        {/* Form Body */}
        <Form {...form}>
          <form onSubmit={handleFormSubmit}>
            <div className="px-6 py-6">
              <FormError message={error} />
              <FormSuccess message={success} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Device Name
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter device name"
                          {...field}
                          disabled={isPending}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Department
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <DepartmentSelector
                        {...field}
                        value={field.value ?? ""}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 rounded-b-lg flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex items-center gap-3">
                <CancelButton />
                <SubmitButton
                  isPending={isPending}
                  label={item ? "Update Device" : "Add Device"}
                />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default DeviceForm;
