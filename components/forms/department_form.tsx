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
import { DepartmentSchema } from "@/types/department/schema";
import {
  createDepartment,
  updateDepartment,
} from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "../ui/card";
import UploadImageWidget from "../widgets/UploadImageWidget";

function DepartmentForm({ item }: { item: Department | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState<string>(item?.image || "");

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof DepartmentSchema>>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: {
      ...item,
      image: imageUrl || item?.image || "",
      status: item ? item.status : false,
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

  const submitData = (values: z.infer<typeof DepartmentSchema>) => {
    if (imageUrl) values.image = imageUrl;
    startTransition(() => {
      if (item) {
        updateDepartment(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/departments");
          }
        });
      } else {
        createDepartment(values, "department")
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/departments");
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
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image */}
                <div className="flex flex-col items-center">
                  <UploadImageWidget
                    imagePath="departments"
                    displayStyle="default"
                    displayImage={true}
                    showLabel={true}
                    label="Department image"
                    setImage={setImageUrl}
                    image={imageUrl}
                  />
                </div>

                {/* Name & Color */}
                <div className="lg:col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Department Name{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter department name"
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
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={field.value || "#6b7280"}
                              onChange={field.onChange}
                              disabled={isPending}
                              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 p-0.5 shrink-0"
                            />
                            <Input
                              placeholder="#000000"
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                            Department Status
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "This department is currently active and visible"
                              : "This department is currently inactive and hidden"}
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
            label={item ? "Update department" : "Create department"}
          />
        </div>
      </form>
    </Form>
  );
}

export default DepartmentForm;
