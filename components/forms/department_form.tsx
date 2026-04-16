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
import { createDepartment, updateDepartment } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import UploadImageWidget from "../widgets/UploadImageWidget";
import { LayoutGrid, List } from "lucide-react";

function DepartmentForm({ item }: { item: Department | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState<string>(item?.image || "");

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof DepartmentSchema>>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      color: item?.color ?? "",
      image: item?.image ?? "",
      order: item?.order ?? undefined,
      defaultPosView: item?.defaultPosView ?? "GRID",
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

    startTransition(async () => {
      try {
        let result: FormResponse | void;
        if (item) {
          result = await updateDepartment(item.id, values);
        } else {
          result = await createDepartment(values);
        }
        if (result) {
          if (result.responseType === "success") {
            toast({ variant: "success", title: "Success", description: result.message });
            router.push("/departments");
          } else {
            setResponse(result);
          }
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Image */}
              <div className="flex-shrink-0 self-start">
                <div className="w-[200px] h-[200px]">
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
              </div>

              {/* Name, Color, Order, Description */}
              <div className="flex-1 min-w-0 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter department name" {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={field.value || "#6b7280"}
                              onChange={field.onChange}
                              disabled={isPending}
                              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 p-0.5 shrink-0"
                            />
                            <Input placeholder="#000000" value={field.value || ""} onChange={field.onChange} disabled={isPending} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display order</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 1" {...field} value={field.value ?? ""} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultPosView"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default POS view</FormLabel>
                        <FormControl>
                          <div className="flex h-10 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => field.onChange("GRID")}
                              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                                field.value === "GRID"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <LayoutGrid className="h-4 w-4" />
                              Grid
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => field.onChange("LIST")}
                              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                                field.value === "LIST"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <List className="h-4 w-4" />
                              List
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this department" {...field} value={field.value ?? ""} disabled={isPending} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label={item ? "Update department" : "Create department"} />
        </div>
      </form>
    </Form>
  );
}

export default DepartmentForm;
