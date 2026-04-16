"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Brand } from "@/types/brand/type";
import { BrandSchema } from "@/types/brand/schema";
import { createBrand, updateBrand } from "@/lib/actions/brand-actions";
import { useRouter } from "next/navigation";
import { Switch } from "../ui/switch";
import { Card, CardContent } from "../ui/card";
import UploadImageWidget from "../widgets/UploadImageWidget";

function BrandForm({ item }: { item: Brand | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState<string>(item?.imageUrl || "");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof BrandSchema>>({
    resolver: zodResolver(BrandSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      imageUrl: item?.imageUrl ?? "",
      active: item?.active ?? true,
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

  const submitData = (values: z.infer<typeof BrandSchema>) => {
    if (imageUrl) values.imageUrl = imageUrl;

    startTransition(() => {
      if (item) {
        updateBrand(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/brands");
          }
        });
      } else {
        createBrand(values)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/brands");
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <UploadImageWidget
                  imagePath="brands"
                  displayStyle="default"
                  displayImage={true}
                  showLabel={true}
                  label="Brand image"
                  setImage={setImageUrl}
                  image={imageUrl}
                />
              </div>

              <div className="lg:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Brand Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter brand name"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the brand"
                          rows={3}
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {item && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Settings</h3>
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            Brand Status
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "This brand is currently active and visible"
                              : "This brand is currently inactive and hidden"}
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

        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update brand" : "Create brand"}
          />
        </div>
      </form>
    </Form>
  );
}

export default BrandForm;
