"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "../ui/separator";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createCategory,
  fetchAllCategories,
  updateCategory,
} from "@/lib/actions/category-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import { Category } from "@/types/category/type";
import { FormResponse } from "@/types/types";
import { CategorySchema } from "@/types/category/schema";
import { FormError } from "@/components/widgets/form-error";
import { Input } from "@/components/ui/input";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import ProductCategorySelector from "@/components/widgets/product-category-selector";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import { useRouter } from "next/navigation";
import { Switch } from "../ui/switch";

const CategoryForm = ({ item }: { item: Category | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState<string>(item?.image || "");
  const [categories, setCategories] = useState<Category[] | null>([]);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const categories = await fetchAllCategories();
      setCategories(categories);
    };
    getData();
  }, []);

  const form = useForm<z.infer<typeof CategorySchema>>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      ...item,
      image: imageUrl || item?.image || "",
      parentCategory: item?.parentCategory || "",
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

  const submitData = (values: z.infer<typeof CategorySchema>) => {
    setResponse(undefined);
    if (imageUrl) values.image = imageUrl;

    startTransition(() => {
      if (item) {
        const updatedValues = {
          ...values,
          parentCategory:
            values.parentCategory || item.parentCategory || "",
        };

        updateCategory(item.id, updatedValues, "category").then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
          }
        });
      } else {
        createCategory(values, "category").then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/categories");
          }
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
                    imagePath="categories"
                    displayStyle="default"
                    displayImage={true}
                    showLabel={true}
                    label="Category image"
                    setImage={setImageUrl}
                    image={imageUrl}
                  />
                </div>

                {/* Name & Parent */}
                <div className="lg:col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category Name{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter category name"
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
                    name="parentCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <FormControl>
                          <ProductCategorySelector
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isRequired
                            isDisabled={isPending}
                            label="Category"
                            placeholder="Select parent category"
                            categories={categories}
                            value={field.value || ""}
                          />
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
                            Category Status
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "This category is currently active and visible"
                              : "This category is currently inactive and hidden"}
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
            label={item ? "Update category" : "Create category"}
          />
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
